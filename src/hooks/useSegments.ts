import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  Segment,
  SegmentCreate,
  SegmentUpdate,
  SegmentConditionGroup,
  SegmentPreviewResponse,
} from '@/types/segments';

export function useSegments(projectId: string) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSegments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Segment[]>(
        `/projects/${projectId}/segments`
      );
      setSegments(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading segments');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const createSegment = useCallback(
    async (data: SegmentCreate) => {
      try {
        const response = await api.post<Segment>(
          `/projects/${projectId}/segments`,
          data
        );
        setSegments((prev) => [response, ...prev]);
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error creating segment');
        throw e;
      }
    },
    [projectId]
  );

  const updateSegment = useCallback(
    async (segmentId: string, data: SegmentUpdate) => {
      try {
        const response = await api.put<Segment>(
          `/projects/${projectId}/segments/${segmentId}`,
          data
        );
        setSegments((prev) =>
          prev.map((s) => (s.id === segmentId ? response : s))
        );
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating segment');
        throw e;
      }
    },
    [projectId]
  );

  const deleteSegment = useCallback(
    async (segmentId: string) => {
      try {
        await api.delete(`/projects/${projectId}/segments/${segmentId}`);
        setSegments((prev) => prev.filter((s) => s.id !== segmentId));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting segment');
        throw e;
      }
    },
    [projectId]
  );

  const previewSegment = useCallback(
    async (conditions: SegmentConditionGroup): Promise<SegmentPreviewResponse> => {
      const response = await api.post<SegmentPreviewResponse>(
        `/projects/${projectId}/segments/preview`,
        { conditions }
      );
      return response;
    },
    [projectId]
  );

  return {
    segments,
    isLoading,
    error,
    fetchSegments,
    createSegment,
    updateSegment,
    deleteSegment,
    previewSegment,
  };
}
