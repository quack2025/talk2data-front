import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ShareLinkCreate, ShareLinkOut } from '@/types/share';

export function useShare(projectId: string) {
  const [links, setLinks] = useState<ShareLinkOut[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ShareLinkOut[]>(
        `/projects/${projectId}/share-links`
      );
      setLinks(response);
      return response;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading share links');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const createLink = useCallback(
    async (data: ShareLinkCreate) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.post<ShareLinkOut>(
          `/projects/${projectId}/share-links`,
          data
        );
        setLinks((prev) => [response, ...prev]);
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error creating share link');
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  const deleteLink = useCallback(
    async (linkId: string) => {
      try {
        await api.delete(`/projects/${projectId}/share-links/${linkId}`);
        setLinks((prev) => prev.filter((l) => l.id !== linkId));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting share link');
        throw e;
      }
    },
    [projectId]
  );

  return { links, isLoading, error, fetchLinks, createLink, deleteLink };
}
