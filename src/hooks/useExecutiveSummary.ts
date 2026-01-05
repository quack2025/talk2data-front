import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ExecutiveSummary } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface UseSummaryOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export function useExecutiveSummary(projectId: string, options: UseSummaryOptions = {}) {
  const { enabled = true, refetchInterval = false } = options;

  return useQuery({
    queryKey: ['executive-summary', projectId],
    queryFn: async () => {
      try {
        return await api.get<ExecutiveSummary>(`/analysis/projects/${projectId}/summary`);
      } catch (error) {
        // 404 means summary doesn't exist yet - return null instead of throwing
        if (error instanceof Error && error.message.includes('404')) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!projectId && enabled,
    refetchInterval,
    retry: (failureCount, error) => {
      // Don't retry on 404 (summary not found)
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useRegenerateSummary(projectId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      return api.post<ExecutiveSummary>(`/analysis/projects/${projectId}/summary`);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['executive-summary', projectId], data);
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al regenerar el resumen',
      });
    },
  });
}

// Hook for polling summary generation status
export function usePollSummary(projectId: string, shouldPoll: boolean) {
  return useExecutiveSummary(projectId, {
    enabled: shouldPoll,
    refetchInterval: shouldPoll ? 2000 : false,
  });
}
