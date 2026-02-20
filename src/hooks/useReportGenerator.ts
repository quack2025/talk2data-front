import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import type { ReportOptions, ReportGenerateResponse, ReportStatus } from '@/types/reports';

export interface ReportProgress {
  step: number;
  total: number;
  label: string;
}

export function useReportGenerator(projectId: string) {
  const [exportId, setExportId] = useState<string | null>(null);
  const [status, setStatus] = useState<ReportStatus>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ReportProgress>({ step: 0, total: 5, label: 'starting' });

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const generate = useCallback(async (options: ReportOptions) => {
    setStatus('processing');
    setError(null);
    setDownloadUrl(null);
    setProgress({ step: 0, total: 5, label: 'starting' });

    try {
      const response = await api.post<ReportGenerateResponse>(
        `/projects/${projectId}/reports/generate`,
        options
      );
      setExportId(response.export_id);

      // Start polling every 3 seconds
      pollIntervalRef.current = setInterval(async () => {
        try {
          const exportData = await api.get<{
            status: string;
            download_url?: string;
            error_message?: string;
            progress_step?: number;
            progress_total?: number;
            progress_label?: string;
          }>(`/projects/${projectId}/reports/status/${response.export_id}`);

          if (exportData.status === 'completed') {
            setProgress({ step: 5, total: 5, label: 'done' });
            setStatus('completed');
            setDownloadUrl(exportData.download_url || null);
            stopPolling();
          } else if (exportData.status === 'error') {
            setStatus('error');
            setError(exportData.error_message || 'Unknown error occurred');
            stopPolling();
          } else if (exportData.status === 'processing') {
            setProgress({
              step: exportData.progress_step ?? 0,
              total: exportData.progress_total ?? 5,
              label: exportData.progress_label ?? 'starting',
            });
          }
        } catch (e) {
          setStatus('error');
          setError(e instanceof Error ? e.message : 'Error checking report status');
          stopPolling();
        }
      }, 3000);
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Error generating report');
    }
  }, [projectId, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setExportId(null);
    setStatus('idle');
    setDownloadUrl(null);
    setError(null);
    setProgress({ step: 0, total: 5, label: 'starting' });
  }, [stopPolling]);

  return {
    generate,
    status,
    downloadUrl,
    error,
    progress,
    exportId,
    reset,
  };
}
