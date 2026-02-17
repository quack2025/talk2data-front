import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  ExploreVariablesResponse,
  ExploreRunRequest,
  ExploreRunResponse,
  ExploreBookmark,
  ExploreBookmarkCreate,
} from '@/types/explore';

export function useExplore(projectId: string) {
  const [variables, setVariables] = useState<ExploreVariablesResponse | null>(null);
  const [result, setResult] = useState<ExploreRunResponse | null>(null);
  const [bookmarks, setBookmarks] = useState<ExploreBookmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVariables = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ExploreVariablesResponse>(
        `/projects/${projectId}/explore/variables`
      );
      setVariables(response);
      return response;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading variables');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const runAnalysis = useCallback(
    async (request: ExploreRunRequest) => {
      setIsRunning(true);
      setError(null);
      try {
        const response = await api.post<ExploreRunResponse>(
          `/projects/${projectId}/explore/run`,
          request
        );
        setResult(response);
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error running analysis');
        throw e;
      } finally {
        setIsRunning(false);
      }
    },
    [projectId]
  );

  const exportToExcel = useCallback(
    async (request: ExploreRunRequest) => {
      try {
        const blob = await api.downloadBlob(
          `/projects/${projectId}/explore/export`,
          'POST',
          request
        );
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `explore_${request.analysis_type}_${request.variable}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error exporting');
        throw e;
      }
    },
    [projectId]
  );

  const fetchBookmarks = useCallback(async () => {
    try {
      const response = await api.get<ExploreBookmark[]>(
        `/projects/${projectId}/explore/bookmarks`
      );
      setBookmarks(response);
      return response;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading bookmarks');
      throw e;
    }
  }, [projectId]);

  const createBookmark = useCallback(
    async (data: ExploreBookmarkCreate) => {
      try {
        const response = await api.post<ExploreBookmark>(
          `/projects/${projectId}/explore/bookmarks`,
          data
        );
        setBookmarks((prev) => [response, ...prev]);
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error saving bookmark');
        throw e;
      }
    },
    [projectId]
  );

  const deleteBookmark = useCallback(
    async (bookmarkId: string) => {
      try {
        await api.delete(`/projects/${projectId}/explore/bookmarks/${bookmarkId}`);
        setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting bookmark');
        throw e;
      }
    },
    [projectId]
  );

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    variables,
    result,
    bookmarks,
    isLoading,
    isRunning,
    error,
    fetchVariables,
    runAnalysis,
    exportToExcel,
    fetchBookmarks,
    createBookmark,
    deleteBookmark,
    clearResult,
  };
}
