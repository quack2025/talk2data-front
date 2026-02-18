import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GroupedAnalysisResult } from "@/types/autodetect";

export function useGroupedAnalysis(
  projectId: string | undefined,
  enabled: boolean = false
) {
  return useQuery<GroupedAnalysisResult>({
    queryKey: ["grouped-analysis", projectId],
    queryFn: () =>
      api.post<GroupedAnalysisResult>(
        `/analysis/projects/${projectId}/grouped-analysis`
      ),
    enabled: !!projectId && enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
