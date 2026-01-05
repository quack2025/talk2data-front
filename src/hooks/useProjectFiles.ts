import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { ProjectFile, FileType } from '@/types/database';

export function useProjectFiles(projectId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Listar archivos del proyecto
  const filesQuery = useQuery({
    queryKey: ['project-files', projectId],
    queryFn: () => api.get<ProjectFile[]>(`/projects/${projectId}/files`),
    enabled: !!projectId,
  });

  // Subir archivo
  const uploadFile = useMutation({
    mutationFn: async ({ file, fileType }: {
      file: File;
      fileType: 'spss' | 'questionnaire'
    }) => {
      const formData = new FormData();
      formData.append('file', file);

      // Mapear tipo de archivo al enum del backend
      const backendFileType: FileType = fileType === 'spss'
        ? 'spss_data'
        : 'questionnaire_pdf';

      // El file_type va como query parameter
      const response = await api.uploadFile<ProjectFile>(
        `/projects/${projectId}/files/upload?file_type=${backendFileType}`,
        formData
      );

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Archivo subido',
        description: 'El archivo se ha subido y procesado correctamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al subir archivo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Eliminar archivo
  const deleteFile = useMutation({
    mutationFn: (fileId: string) =>
      api.delete(`/projects/${projectId}/files/${fileId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
      toast({
        title: 'Archivo eliminado',
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
