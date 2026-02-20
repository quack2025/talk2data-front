import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ReportHistoryItem } from '@/types/reports';

export function useReportHistory(projectId: string) {
  const [reports, setReports] = useState<ReportHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<{ reports: ReportHistoryItem[]; total: number }>(
        `/projects/${projectId}/reports/history`
      );
      setReports(response.reports);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading report history');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  return {
    reports,
    isLoading,
    error,
    refresh: fetchReports,
  };
}
