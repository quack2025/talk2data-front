import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  DataPrepRule,
  DataPrepRuleCreate,
  DataPrepPreviewResponse,
  DataPrepSummary,
} from '@/types/dataPrep';

export type DataPrepStatus = 'pending' | 'confirmed' | 'skipped';

const DATA_PREP_STATUS_KEY = (projectId: string) => `data_prep_status_${projectId}`;

function getStoredStatus(projectId: string): DataPrepStatus {
  return (localStorage.getItem(DATA_PREP_STATUS_KEY(projectId)) as DataPrepStatus) || 'pending';
}

function setStoredStatus(projectId: string, status: DataPrepStatus) {
  localStorage.setItem(DATA_PREP_STATUS_KEY(projectId), status);
}

export function useDataPrep(projectId: string) {
  const [rules, setRules] = useState<DataPrepRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<DataPrepPreviewResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [summary, setSummary] = useState<DataPrepSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataPrepStatus, setDataPrepStatus] = useState<DataPrepStatus>(() => getStoredStatus(projectId));

  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<DataPrepRule[]>(
        `/projects/${projectId}/data-prep`
      );
      setRules(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading rules');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const createRule = useCallback(
    async (data: DataPrepRuleCreate) => {
      try {
        const response = await api.post<DataPrepRule>(
          `/projects/${projectId}/data-prep`,
          data
        );
        setRules((prev) => [...prev, response].sort((a, b) => a.order_index - b.order_index));
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error creating rule');
        throw e;
      }
    },
    [projectId]
  );

  const updateRule = useCallback(
    async (ruleId: string, data: Partial<DataPrepRuleCreate> & { is_active?: boolean }) => {
      try {
        const response = await api.put<DataPrepRule>(
          `/projects/${projectId}/data-prep/${ruleId}`,
          data
        );
        setRules((prev) =>
          prev
            .map((r) => (r.id === ruleId ? response : r))
            .sort((a, b) => a.order_index - b.order_index)
        );
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating rule');
        throw e;
      }
    },
    [projectId]
  );

  const deleteRule = useCallback(
    async (ruleId: string) => {
      try {
        await api.delete(`/projects/${projectId}/data-prep/${ruleId}`);
        setRules((prev) => prev.filter((r) => r.id !== ruleId));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting rule');
        throw e;
      }
    },
    [projectId]
  );

  const reorderRules = useCallback(
    async (ruleIds: string[]) => {
      try {
        const response = await api.put<DataPrepRule[]>(
          `/projects/${projectId}/data-prep/reorder`,
          { rule_ids: ruleIds }
        );
        setRules(response);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error reordering rules');
        throw e;
      }
    },
    [projectId]
  );

  const previewRules = useCallback(async () => {
    setIsPreviewLoading(true);
    setError(null);
    try {
      const response = await api.post<DataPrepPreviewResponse>(
        `/projects/${projectId}/data-prep/preview`
      );
      setPreview(response);
      return response;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error previewing rules');
      throw e;
    } finally {
      setIsPreviewLoading(false);
    }
  }, [projectId]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await api.get<DataPrepSummary>(
        `/projects/${projectId}/data-prep/summary`
      );
      setSummary(response);
      return response;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading summary');
    }
  }, [projectId]);

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  const confirmDataReady = useCallback(() => {
    setStoredStatus(projectId, 'confirmed');
    setDataPrepStatus('confirmed');
    // TODO: Replace with API call when backend is ready
    // api.patch(`/projects/${projectId}`, { data_prep_status: 'confirmed' });
  }, [projectId]);

  const skipDataPrep = useCallback(() => {
    setStoredStatus(projectId, 'skipped');
    setDataPrepStatus('skipped');
    // TODO: Replace with API call when backend is ready
    // api.patch(`/projects/${projectId}`, { data_prep_status: 'skipped' });
  }, [projectId]);

  const reopenDataPrep = useCallback(() => {
    setStoredStatus(projectId, 'pending');
    setDataPrepStatus('pending');
  }, [projectId]);

  return {
    rules,
    isLoading,
    preview,
    isPreviewLoading,
    summary,
    error,
    dataPrepStatus,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    reorderRules,
    previewRules,
    fetchSummary,
    clearPreview,
    confirmDataReady,
    skipDataPrep,
    reopenDataPrep,
  };
}
