import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ConversationSummary } from '@/types/reports';

export function useConversationList(projectId: string) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ConversationSummary[]>(
        `/projects/${projectId}/conversations`
      );
      setConversations(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading conversations');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  return {
    conversations,
    isLoading,
    error,
    fetchConversations,
  };
}
