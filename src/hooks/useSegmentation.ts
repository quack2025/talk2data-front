import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  AutoDetectKRequest,
  AutoDetectKResult,
  ClusterRequest,
  ClusterResult,
} from '@/types/segmentation';

export function useSegmentation(projectId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoDetectResult, setAutoDetectResult] = useState<AutoDetectKResult | null>(null);
  const [clusterResult, setClusterResult] = useState<ClusterResult | null>(null);

  /** Auto-detect optimal K. */
  const autoDetectK = useCallback(
    async (data: AutoDetectKRequest) => {
      setIsDetecting(true);
      setError(null);
      setAutoDetectResult(null);
      try {
        const response = await api.post<AutoDetectKResult>(
          `/projects/${projectId}/segmentation/auto-detect-k`,
          data
        );
        setAutoDetectResult(response);
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error detecting K');
        throw e;
      } finally {
        setIsDetecting(false);
      }
    },
    [projectId]
  );

  /** Execute clustering. */
  const executeClustering = useCallback(
    async (data: ClusterRequest) => {
      setIsLoading(true);
      setError(null);
      setClusterResult(null);
      try {
        const response = await api.post<ClusterResult>(
          `/projects/${projectId}/segmentation/cluster`,
          data
        );
        setClusterResult(response);
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error clustering');
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  /** Reset state. */
  const reset = useCallback(() => {
    setError(null);
    setAutoDetectResult(null);
    setClusterResult(null);
  }, []);

  return {
    autoDetectResult,
    clusterResult,
    isLoading,
    isDetecting,
    error,
    autoDetectK,
    executeClustering,
    reset,
  };
}
