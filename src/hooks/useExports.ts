import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { Export, ExportType } from '@/types/database';

interface ToastMessages {
  exportCreated: string;
  exportCreatedDesc: string;
  exportDeleted: string;
  error: string;
}

export function useExports(projectId: string, toastMessages?: ToastMessages) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Listar exportaciones del proyecto
  const exportsQuery = useQuery({
    queryKey: ['exports', projectId],
    queryFn: () => api.get<Export[]>(`/projects/${projectId}/exports`),
    enabled: !!projectId,
  });

  // Crear exportación
  const createExport = useMutation({
    mutationFn: async ({
      format,
      conversationId,
    }: {
      format: 'pdf' | 'excel' | 'pptx';
      conversationId?: string;
    }) => {
      // Mapear formato al enum del backend
      const exportType: ExportType = format;

      const response = await api.post<Export>(
        `/projects/${projectId}/exports`,
        {
          export_type: exportType,
          conversation_id: conversationId ?? undefined,
        }
      );

      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exports', projectId] });
      toast({
        title: toastMessages?.exportCreated ?? 'Export created',
        description: toastMessages?.exportCreatedDesc ?? 'The report has been generated successfully.',
      });

      // Abrir URL de descarga en nueva pestaña
      if (data.download_url) {
        window.open(data.download_url, '_blank');
      }
    },
    onError: (error: Error) => {
      toast({
        title: toastMessages?.error ?? 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Eliminar exportación
  const deleteExport = useMutation({
    mutationFn: (exportId: string) =>
      api.delete(`/projects/${projectId}/exports/${exportId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exports', projectId] });
      toast({
        title: toastMessages?.exportDeleted ?? 'Export deleted',
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
