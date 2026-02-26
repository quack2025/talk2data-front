import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  CompatibilityReport,
  MergeRequest,
  MergeResponse,
  ProjectSummary,
  ValidateCompatibilityRequest,
} from '@/types/merge';

export function useMerge(projectId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableProjects, setAvailableProjects] = useState<ProjectSummary[]>([]);
  const [compatibility, setCompatibility] = useState<CompatibilityReport | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeResponse | null>(null);

  /** Fetch projects available for merging (same owner). */
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ProjectSummary[]>('/projects');
      // Filter out current project and non-ready projects
      const filtered = response.filter(
        (p) => p.id !== projectId && p.status === 'ready'
      );
      setAvailableProjects(filtered);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading projects');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  /** Pre-merge compatibility check. */
  const validateCompatibility = useCallback(
    async (data: ValidateCompatibilityRequest) => {
      setIsValidating(true);
      setError(null);
      setCompatibility(null);
      try {
        const response = await api.post<CompatibilityReport>(
          `/projects/${projectId}/merge/validate`,
          data
        );
        setCompatibility(response);
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error validating compatibility');
        throw e;
      } finally {
        setIsValidating(false);
      }
    },
    [projectId]
  );

  /** Execute the merge. */
  const executeMerge = useCallback(
    async (data: MergeRequest) => {
      setIsLoading(true);
      setError(null);
      setMergeResult(null);
      try {
        const response = await api.post<MergeResponse>(
          `/projects/${projectId}/merge`,
          data,
          undefined,
          2 // retry once on 5xx
        );
        setMergeResult(response);
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error executing merge');
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  /** Reset state (on dialog close). */
  const reset = useCallback(() => {
    setError(null);
    setCompatibility(null);
    setMergeResult(null);
  }, []);

  return {
    availableProjects,
    compatibility,
    mergeResult,
    isLoading,
    isValidating,
    error,
    fetchProjects,
    validateCompatibility,
    executeMerge,
    reset,
  };
}
