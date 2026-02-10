import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface AnalysisVariable {
  name: string;
  label: string;
  type: string;
}

interface AnalysisVariablesResponse {
  variables: AnalysisVariable[];
}

export type VariableLabelMap = Record<string, string>;

export function useProjectVariables(projectId: string | undefined) {
  const query = useQuery({
    queryKey: ['project-variables', projectId],
    queryFn: async () => {
      const response = await api.get<AnalysisVariablesResponse>(
        `/projects/${projectId}/exports/analysis-variables`
      );
      return response.variables;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const variableNames = query.data?.map(v => v.name) ?? [];
  const variableLabels: VariableLabelMap = {};
  query.data?.forEach(v => {
    if (v.label) variableLabels[v.name] = v.label;
  });

  return {
    ...query,
    data: variableNames,
    variableLabels,
  };
}
