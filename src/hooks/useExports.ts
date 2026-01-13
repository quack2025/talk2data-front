import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { downloadFile } from '@/lib/downloadFile';
import type { Export, ExportType } from '@/types/database';

interface ToastMessages {
  exportCreated: string;
  exportCreatedDesc: string;
  exportDeleted: string;
  downloadStarted: string;
  downloadError: string;
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
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['exports', projectId] });
      toast({
        title: toastMessages?.exportCreated ?? 'Export created',
        description: toastMessages?.exportCreatedDesc ?? 'The report has been generated successfully.',
      });

      // Descargar usando fetch + blob para evitar bloqueos de ad blockers
      if (data.download_url) {
        try {
          const filename = `export_${data.export_type}_${data.id}.${getFileExtension(data.export_type)}`;
          await downloadFile(data.download_url, filename);
        } catch (error) {
          console.error('Download failed:', error);
          toast({
            title: toastMessages?.downloadError ?? 'Download failed',
            description: 'Please try downloading again from the exports list.',
            variant: 'destructive',
          });
        }
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

  // Descargar exportación existente
  const handleDownload = async (export_: Export) => {
    if (!export_.download_url) {
      toast({
        title: toastMessages?.error ?? 'Error',
        description: 'Download URL not available',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: toastMessages?.downloadStarted ?? 'Download started',
      description: 'Your file is being downloaded...',
    });

    try {
      const filename = `export_${export_.export_type}_${export_.id}.${getFileExtension(export_.export_type)}`;
      await downloadFile(export_.download_url, filename);
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: toastMessages?.downloadError ?? 'Download failed',
        description: 'There was an error downloading the file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return {
    exports: exportsQuery.data ?? [],
    isLoading: exportsQuery.isLoading,
    error: exportsQuery.error,
    createExport,
    deleteExport,
    handleDownload,
  };
}

function getFileExtension(exportType: ExportType): string {
  switch (exportType) {
    case 'pdf':
      return 'pdf';
    case 'excel':
      return 'xlsx';
    case 'pptx':
      return 'pptx';
    default:
      return 'file';
  }
}
