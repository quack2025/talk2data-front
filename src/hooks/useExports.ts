import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Export } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export function useExports(projectId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const exportsQuery = useQuery({
    queryKey: ['exports', projectId],
    queryFn: async () => {
      let query = supabase
        .from('exports')
        .select('*, projects(name)')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (Export & { projects: { name: string } })[];
    },
  });

  const createExport = useMutation({
    mutationFn: async ({
      projectId,
      title,
      format,
      options,
    }: {
      projectId: string;
      title: string;
      format: 'pdf' | 'docx' | 'pptx';
      options?: Record<string, unknown>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // Create export record
      const { data: exportRecord, error: insertError } = await supabase
        .from('exports')
        .insert({
          project_id: projectId,
          user_id: user.id,
          title,
          format,
          options: options || {},
          status: 'generating',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger export generation on backend
      try {
        const response = await api.post(`/exports/${projectId}`, {
          export_id: exportRecord.id,
          format,
          options
        });

        // Update with S3 key
        await supabase
          .from('exports')
          .update({
            s3_key: response.s3_key,
            status: 'ready',
          })
          .eq('id', exportRecord.id);

        return response;
      } catch (error) {
        await supabase
          .from('exports')
          .update({ status: 'error' })
          .eq('id', exportRecord.id);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exports'] });
      toast({
        title: 'Exportación creada',
        description: 'El reporte se está generando.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteExport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exports')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exports'] });
      toast({
        title: 'Exportación eliminada',
      });
    },
  });

  return {
    exports: exportsQuery.data ?? [],
    isLoading: exportsQuery.isLoading,
    error: exportsQuery.error,
    createExport,
    deleteExport,
  };
}
