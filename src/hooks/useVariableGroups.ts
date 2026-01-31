import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  VariableGroup,
  VariableGroupCreate,
  VariableGroupUpdate,
  AutoDetectResponse,
} from '@/types/variableGroups';

export function useVariableGroups(projectId: string) {
  const [groups, setGroups] = useState<VariableGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [autoDetectResult, setAutoDetectResult] =
    useState<AutoDetectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<VariableGroup[]>(
        `/variable-groups/projects/${projectId}/variable-groups`
      );
      setGroups(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading groups');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const createGroup = useCallback(
    async (data: VariableGroupCreate) => {
      try {
        const response = await api.post<VariableGroup>(
          `/variable-groups/projects/${projectId}/variable-groups`,
          data
        );
        setGroups((prev) => [response, ...prev]);
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error creating group');
        throw e;
      }
    },
    [projectId]
  );

  const updateGroup = useCallback(
    async (groupId: string, data: VariableGroupUpdate) => {
      try {
        const response = await api.put<VariableGroup>(
          `/variable-groups/projects/${projectId}/variable-groups/${groupId}`,
          data
        );
        setGroups((prev) =>
          prev.map((g) => (g.id === groupId ? response : g))
        );
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating group');
        throw e;
      }
    },
    [projectId]
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      try {
        await api.delete(
          `/variable-groups/projects/${projectId}/variable-groups/${groupId}`
        );
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting group');
        throw e;
      }
    },
    [projectId]
  );

  const autoDetect = useCallback(async () => {
    setIsDetecting(true);
    setError(null);
    try {
      const response = await api.post<AutoDetectResponse>(
        `/variable-groups/projects/${projectId}/variable-groups/auto-detect`
      );
      setAutoDetectResult(response);
      return response;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error in auto-detection');
      throw e;
    } finally {
      setIsDetecting(false);
    }
  }, [projectId]);

  const clearAutoDetect = useCallback(() => {
    setAutoDetectResult(null);
  }, []);

  return {
    groups,
    isLoading,
    isDetecting,
    autoDetectResult,
    error,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    autoDetect,
    clearAutoDetect,
  };
}
