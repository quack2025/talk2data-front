import { useCallback } from 'react';

const LAST_PROJECT_KEY = 'survey-genius-last-project';

export function useLastProject() {
  const getLastProjectId = useCallback((): string | null => {
    return localStorage.getItem(LAST_PROJECT_KEY);
  }, []);

  const setLastProjectId = useCallback((projectId: string) => {
    localStorage.setItem(LAST_PROJECT_KEY, projectId);
  }, []);

  const clearLastProjectId = useCallback(() => {
    localStorage.removeItem(LAST_PROJECT_KEY);
  }, []);

  return {
    getLastProjectId,
    setLastProjectId,
    clearLastProjectId,
  };
}
