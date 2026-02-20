import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import type { ReportOptions, ReportGenerateResponse, ReportStatus } from '@/types/reports';

export function useReportGenerator(projectId: string) {
  const [exportId, setExportId] = useState<string | null>(null);
  const [status, setStatus] = useState<ReportStatus>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressPhase, setProgressPhase] = useState(0);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (phaseIntervalRef.current) clearInterval(phaseIntervalRef.current);
    };
  }, []);

  const stopIntervals = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (phaseIntervalRef.current) {
      clearInterval(phaseIntervalRef.current);
      phaseIntervalRef.current = null;
    }
  }, []);

  const generate = useCallback(async (options: ReportOptions) => {
    setStatus('processing');
    setError(null);
    setDownloadUrl(null);
    setProgressPhase(0);

    try {
      const response = await api.post<ReportGenerateResponse>(
        `/projects/${projectId}/reports/generate`,
        options
      );
      setExportId(response.export_id);

      // Start fake progress phase rotation every 8 seconds
      let phase = 0;
      phaseIntervalRef.current = setInterval(() => {
        phase = Math.min(phase + 1, 3);
        setProgressPhase(phase);
      }, 8000);

      // Start polling every 3 seconds
      pollIntervalRef.current = setInterval(async () => {
        try {
          const exportData = await api.get<{
            status: string;
            download_url?: string;
            error_message?: string;
          }>(`/projects/${projectId}/reports/status/${response.export_id}`);

          if (exportData.status === 'completed') {
            setStatus('completed');
            setDownloadUrl(exportData.download_url || null);
            stopIntervals();
          } else if (exportData.status === 'error') {
            setStatus('error');
            setError(exportData.error_message || 'Unknown error occurred');
            stopIntervals();
          }
        } catch (e) {
          setStatus('error');
          setError(e instanceof Error ? e.message : 'Error checking report status');
          stopIntervals();
        }
      }, 3000);
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Error generating report');
    }
  }, [projectId, stopIntervals]);

  const reset = useCallback(() => {
    stopIntervals();
    setExportId(null);
    setStatus('idle');
    setDownloadUrl(null);
    setError(null);
    setProgressPhase(0);
  }, [stopIntervals]);

  return {
    generate,
    status,
    downloadUrl,
    error,
    progressPhase,
    exportId,
    reset,
  };
}
