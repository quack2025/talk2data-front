import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectFile } from '@/types/database';
import type { Json } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export function useProjectFiles(projectId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filesQuery = useQuery({
    queryKey: ['project-files', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProjectFile[];
    },
    enabled: !!projectId,
  });

  const uploadFile = useMutation({
    mutationFn: async ({ file, fileType }: { file: File; fileType: 'spss' | 'questionnaire' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // Create file record first
      const { data: fileRecord, error: insertError } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          user_id: user.id,
          file_name: file.name,
          file_type: fileType,
          file_size: file.size,
          status: 'uploading',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Upload to backend (which handles S3)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', projectId);
      formData.append('file_id', fileRecord.id);

      try {
        const response = await api.uploadFile<{ s3_key: string; metadata?: Record<string, unknown> }>('/files/upload', formData);
        
        // Update file record with S3 key and metadata
        await supabase
          .from('project_files')
          .update({
            s3_key: response.s3_key,
            metadata: (response.metadata || {}) as Json,
            status: 'ready' as const,
          })
          .eq('id', fileRecord.id);

        // Update project file count
        await supabase
          .from('projects')
          .update({ file_count: (await supabase.from('projects').select('file_count').eq('id', projectId).single()).data?.file_count || 0 + 1 })
          .eq('id', projectId);

        return response;
      } catch (error) {
        // Mark as error if upload fails
        await supabase
          .from('project_files')
          .update({ status: 'error' })
          .eq('id', fileRecord.id);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Archivo subido',
        description: 'El archivo se ha subido correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al subir archivo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteFile = useMutation({
    mutationFn: async (fileId: string) => {
      const { error } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
      toast({
        title: 'Archivo eliminado',
        description: 'El archivo se ha eliminado correctamente.',
      });
    },
  });

  return {
    files: filesQuery.data ?? [],
    isLoading: filesQuery.isLoading,
    error: filesQuery.error,
    uploadFile,
    deleteFile,
  };
}
