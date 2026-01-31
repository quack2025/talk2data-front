import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  ProjectWave,
  WaveCreate,
  WaveUpdate,
  WaveComparisonRequest,
  WaveComparisonResult,
} from '@/types/waves';

export function useWaves(projectId: string) {
  const [waves, setWaves] = useState<ProjectWave[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] =
    useState<WaveComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWaves = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ProjectWave[]>(
        `/projects/${projectId}/waves`
      );
      setWaves(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading waves');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const createWave = useCallback(
    async (data: WaveCreate) => {
      try {
        const response = await api.post<ProjectWave>(
          `/projects/${projectId}/waves`,
          data
        );
        setWaves((prev) => [...prev, response].sort((a, b) => a.wave_order - b.wave_order));
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error creating wave');
        throw e;
      }
    },
    [projectId]
  );

  const updateWave = useCallback(
    async (waveId: string, data: WaveUpdate) => {
      try {
        const response = await api.put<ProjectWave>(
          `/projects/${projectId}/waves/${waveId}`,
          data
        );
        setWaves((prev) =>
          prev
            .map((w) => (w.id === waveId ? response : w))
            .sort((a, b) => a.wave_order - b.wave_order)
        );
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating wave');
        throw e;
      }
    },
    [projectId]
  );

  const deleteWave = useCallback(
    async (waveId: string) => {
      try {
        await api.delete(`/projects/${projectId}/waves/${waveId}`);
        setWaves((prev) => prev.filter((w) => w.id !== waveId));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting wave');
        throw e;
      }
    },
    [projectId]
  );

  const compareWaves = useCallback(
    async (request: WaveComparisonRequest) => {
      setIsComparing(true);
      setError(null);
      try {
        const response = await api.post<WaveComparisonResult>(
          `/projects/${projectId}/waves/compare`,
          request
        );
        setComparisonResult(response);
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error comparing waves');
        throw e;
      } finally {
        setIsComparing(false);
      }
    },
    [projectId]
  );

  const clearComparison = useCallback(() => {
    setComparisonResult(null);
  }, []);

  return {
    waves,
    isLoading,
    isComparing,
    comparisonResult,
    error,
    fetchWaves,
    createWave,
    updateWave,
    deleteWave,
    compareWaves,
    clearComparison,
  };
}
