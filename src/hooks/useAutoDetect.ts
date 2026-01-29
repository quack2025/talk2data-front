import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ProcessingSpec } from "@/types/autodetect";

export function useAutoDetect(projectId: string | undefined) {
  return useQuery<ProcessingSpec>({
    queryKey: ["auto-detect", projectId],
    queryFn: () =>
      api.post<ProcessingSpec>(
        `/api/v1/analysis/projects/${projectId}/auto-detect`
      ),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
}
