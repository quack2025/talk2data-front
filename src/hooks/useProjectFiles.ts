import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { ProjectFile, FileType } from '@/types/database';

interface ToastMessages {
  fileUploaded: string;
  fileUploadedDesc: string;
  fileUploadError: string;
  fileDeleted: string;
}

export function useProjectFiles(projectId: string, toastMessages?: ToastMessages) {
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
      fileType: 'spss' | 'csv' | 'excel' | 'questionnaire'
    }) => {
      const formData = new FormData();
      formData.append('file', file);

      // Mapear tipo de archivo al enum del backend
      const fileTypeMap: Record<string, FileType> = {
        spss: 'spss_data',
        csv: 'csv_data',
        excel: 'excel_data',
        questionnaire: 'questionnaire_pdf',
      };
      const backendFileType: FileType = fileTypeMap[fileType] ?? 'spss_data';

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
        title: toastMessages?.fileUploaded ?? 'File uploaded',
        description: toastMessages?.fileUploadedDesc ?? 'The file has been uploaded and processed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: toastMessages?.fileUploadError ?? 'Error uploading file',
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
        title: toastMessages?.fileDeleted ?? 'File deleted',
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
