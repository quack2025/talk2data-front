import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface VariableOverride {
  name: string;
  auto_label: string;
  label: string;
  is_overridden: boolean;
  type: string;
  auto_value_labels: Record<string, string>;
  value_labels: Record<string, string>;
  has_value_label_overrides: boolean;
  missing_values: number[];
  n_unique?: number;
}

interface OverridesResponse {
  variables: VariableOverride[];
  total: number;
  overridden_count: number;
}

interface SingleOverrideBody {
  label?: string;
  value_labels?: Record<string, string>;
  missing_values?: number[];
}

interface ImportResult {
  status: string;
  imported_count: number;
  format: string;
}

export function useVariableMetadata(projectId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['variable-metadata', projectId];

  const query = useQuery({
    queryKey,
    queryFn: () => api.get<OverridesResponse>(`/projects/${projectId}/metadata/overrides`),
    enabled: !!projectId,
  });

  const updateAll = useMutation({
    mutationFn: (overrides: Record<string, SingleOverrideBody>) =>
      api.put<{ status: string; overridden_count: number }>(
        `/projects/${projectId}/metadata/overrides`,
        { overrides }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['analysis-variables', projectId] });
    },
  });

  const updateVariable = useMutation({
    mutationFn: ({ varName, override }: { varName: string; override: SingleOverrideBody }) =>
      api.put<{ status: string }>(
        `/projects/${projectId}/metadata/overrides/${encodeURIComponent(varName)}`,
        override
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['analysis-variables', projectId] });
    },
  });

  const importCodebook = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.uploadFile<ImportResult>(
        `/projects/${projectId}/metadata/import-codebook`,
        formData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['analysis-variables', projectId] });
    },
  });

  return {
    variables: query.data?.variables ?? [],
    total: query.data?.total ?? 0,
    overriddenCount: query.data?.overridden_count ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    updateAll,
    updateVariable,
    importCodebook,
    refetch: query.refetch,
  };
}
