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

export function useProjectVariables(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-variables', projectId],
    queryFn: async () => {
      const response = await api.get<AnalysisVariablesResponse>(
        `/projects/${projectId}/exports/analysis-variables`
      );
      return response.variables.map(v => v.name);
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
