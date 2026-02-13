import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  DataPrepRule,
  DataPrepRuleCreate,
  DataPrepRuleUpdate,
  DataPrepPreviewResponse,
  DataPrepSummary,
  DataPrepSummaryResponse,
  VariableProfilesResponse,
  PrepSuggestionsResponse,
  ApplySuggestionsResponse,
  QCReportResponse,
  TemplatesListResponse,
  ApplyTemplateResponse,
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
    async (ruleId: string, data: DataPrepRuleUpdate) => {
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
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error reordering rules');
        throw e;
      }
    },
    [projectId]
  );

  // Lovable's preview (no body — previews all active rules)
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

  // Sprint 9 preview (single rule with body)
  const previewRule = useCallback(
    async (data: DataPrepRuleCreate): Promise<DataPrepPreviewResponse> => {
      try {
        return await api.post<DataPrepPreviewResponse>(
          `/projects/${projectId}/data-prep/preview`,
          data
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error previewing rule');
        throw e;
      }
    },
    [projectId]
  );

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

  const getSummary = useCallback(async (): Promise<DataPrepSummaryResponse> => {
    try {
      return await api.get<DataPrepSummaryResponse>(
        `/projects/${projectId}/data-prep/summary`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading summary');
      throw e;
    }
  }, [projectId]);

  const toggleRule = useCallback(
    async (ruleId: string, isActive: boolean) => {
      return updateRule(ruleId, { is_active: isActive });
    },
    [updateRule]
  );

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  // Data readiness gate (Lovable)
  const confirmDataReady = useCallback(() => {
    setStoredStatus(projectId, 'confirmed');
    setDataPrepStatus('confirmed');
  }, [projectId]);

  const skipDataPrep = useCallback(() => {
    setStoredStatus(projectId, 'skipped');
    setDataPrepStatus('skipped');
  }, [projectId]);

  const reopenDataPrep = useCallback(() => {
    setStoredStatus(projectId, 'pending');
    setDataPrepStatus('pending');
  }, [projectId]);

  // Sprint 11: Variable Profiles
  const getVariableProfiles = useCallback(async (): Promise<VariableProfilesResponse> => {
    return api.get<VariableProfilesResponse>(
      `/projects/${projectId}/data-prep/variable-profiles`
    );
  }, [projectId]);

  // Sprint 11: Suggestions
  const getSuggestions = useCallback(async (studyType?: string): Promise<PrepSuggestionsResponse> => {
    const qs = studyType ? `?study_type=${studyType}` : '';
    return api.get<PrepSuggestionsResponse>(
      `/projects/${projectId}/data-prep/suggestions${qs}`
    );
  }, [projectId]);

  const applySuggestions = useCallback(async (
    suggestionIds: string[],
    modifications?: Record<string, Record<string, any>>,
  ): Promise<ApplySuggestionsResponse> => {
    const res = await api.post<ApplySuggestionsResponse>(
      `/projects/${projectId}/data-prep/apply-suggestions`,
      { suggestion_ids: suggestionIds, modifications }
    );
    await fetchRules();
    return res;
  }, [projectId, fetchRules]);

  // Sprint 11: QC Report
  const getQCReport = useCallback(async (): Promise<QCReportResponse> => {
    return api.get<QCReportResponse>(
      `/projects/${projectId}/data-prep/qc-report`
    );
  }, [projectId]);

  // Sprint 11: Templates
  const getTemplates = useCallback(async (): Promise<TemplatesListResponse> => {
    return api.get<TemplatesListResponse>(`/data-prep/templates`);
  }, []);

  const applyTemplate = useCallback(async (
    templateId: string,
    variableMapping?: Record<string, string>,
  ): Promise<ApplyTemplateResponse> => {
    const res = await api.post<ApplyTemplateResponse>(
      `/projects/${projectId}/data-prep/apply-template`,
      { template_id: templateId, variable_mapping: variableMapping || {} }
    );
    await fetchRules();
    return res;
  }, [projectId, fetchRules]);

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
    previewRule,
    fetchSummary,
    getSummary,
    toggleRule,
    clearPreview,
    confirmDataReady,
    skipDataPrep,
    reopenDataPrep,
    getVariableProfiles,
    getSuggestions,
    applySuggestions,
    getQCReport,
    getTemplates,
    applyTemplate,
  };
}
