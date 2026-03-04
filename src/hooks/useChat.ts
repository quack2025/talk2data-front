import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api, ApiError } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import type { Conversation, QueryResponse, Message, ChartData, TableData, VariableInfo, RefinementAction } from '@/types/database';

interface ToastMessages {
  conversationError: string;
  conversationDeleteError: string;
  queryError: string;
  error: string;
}

// Hook para manejar sesiones/conversaciones
export function useChat(projectId: string, toastMessages?: ToastMessages) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Listar conversaciones del proyecto
  const conversationsQuery = useQuery({
    queryKey: ['conversations', projectId],
    queryFn: () => api.get<Conversation[]>(`/conversations?project_id=${projectId}`),
    enabled: !!projectId,
  });

  // Crear nueva conversación
  const createConversation = useMutation({
    mutationFn: (title?: string) =>
      api.post<Conversation>('/conversations', {
        project_id: projectId,
        title: title ?? 'Nueva conversación',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', projectId] });
    },
    onError: (error: Error) => {
      toast({
        title: toastMessages?.conversationError ?? 'Error creating conversation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Eliminar conversación
  const deleteConversation = useMutation({
    mutationFn: (conversationId: string) =>
      api.delete(`/conversations/${conversationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', projectId] });
    },
    onError: (error: Error) => {
      toast({
        title: toastMessages?.conversationDeleteError ?? 'Error deleting conversation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    conversations: conversationsQuery.data ?? [],
    isLoading: conversationsQuery.isLoading,
    error: conversationsQuery.error,
    createConversation,
    deleteConversation,
    refetch: conversationsQuery.refetch,
  };
}

export interface QueryErrorState {
  message: string;
  isServerError: boolean;
  isServiceUnavailable: boolean;
  failedQuestion: string;
}

export interface RetryState {
  attempt: number;
  maxAttempts: number;
  isRetrying: boolean;
}

const MAX_AUTO_RETRIES = 2;

// Hook para manejar mensajes y queries
export function useChatMessages(projectId: string, conversationId: string | null, toastMessages?: ToastMessages, segmentId?: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isThinking, setIsThinking] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<QueryResponse | null>(null);
  const [queryError, setQueryError] = useState<QueryErrorState | null>(null);
  const [retryState, setRetryState] = useState<RetryState>({ attempt: 0, maxAttempts: MAX_AUTO_RETRIES, isRetrying: false });

  // S25-2: SSE streaming thinking stage
  const [thinkingStage, setThinkingStage] = useState<string>('');

  // S25-3: Pagination state
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [prependedMessages, setPrependedMessages] = useState<Message[]>([]);

  // Cache de datos por message_id (persistente entre renders)
  const chartsCache = useRef<Record<string, ChartData[]>>({});
  const pythonCodeCache = useRef<Record<string, string>>({});
  const tablesCache = useRef<Record<string, TableData[]>>({});
  const variablesCache = useRef<Record<string, VariableInfo[]>>({});

  // Obtener conversación con mensajes
  const conversationQuery = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => api.get<Conversation>(`/conversations/${conversationId}`),
    enabled: !!conversationId,
  });

  // S25-3: Read has_more from conversation response
  useEffect(() => {
    if (conversationQuery.data?.has_more !== undefined) {
      setHasMore(conversationQuery.data.has_more);
    }
  }, [conversationQuery.data?.has_more]);

  // S25-3: Reset prepended messages on conversation change
  useEffect(() => {
    setPrependedMessages([]);
    setHasMore(false);
  }, [conversationId]);

  const executeQuery = useCallback(async (question: string, attempt: number): Promise<QueryResponse> => {
    setIsThinking(true);
    setQueryError(null);

    if (attempt > 0) {
      setRetryState({ attempt, maxAttempts: MAX_AUTO_RETRIES, isRetrying: true });
    }

    try {
      const body: Record<string, unknown> = {
          question,
          conversation_id: conversationId ?? undefined,
      };
      if (segmentId) {
        body.segment_id = segmentId;
      }
      const response = await api.post<QueryResponse>(
        `/conversations/projects/${projectId}/query`,
        body,
        undefined,
        0, // no retries at API level — we handle retries here for UI feedback
      );

      setRetryState({ attempt: 0, maxAttempts: MAX_AUTO_RETRIES, isRetrying: false });
      return response;
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      const isServer = apiErr?.isServerError ?? false;
      const isUnavailable = apiErr?.isServiceUnavailable ?? false;

      // Auto-retry on server errors
      if ((isServer || isUnavailable) && attempt < MAX_AUTO_RETRIES) {
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
        return executeQuery(question, attempt + 1);
      }

      // All retries exhausted — surface the error
      setQueryError({
        message: (err as Error).message,
        isServerError: isServer,
        isServiceUnavailable: isUnavailable,
        failedQuestion: question,
      });
      setRetryState({ attempt: 0, maxAttempts: MAX_AUTO_RETRIES, isRetrying: false });
      throw err;
    } finally {
      setIsThinking(false);
    }
  }, [projectId, conversationId, segmentId]);

  // S25-2: SSE streaming query
  const executeQueryStream = useCallback(async (question: string): Promise<QueryResponse | null> => {
    setIsThinking(true);
    setThinkingStage('');

    const params = new URLSearchParams({ question });
    if (conversationId) params.set('conversation_id', conversationId);
    if (segmentId) params.set('segment_id', segmentId);

    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setIsThinking(false);
      setThinkingStage('');
      return null;
    }

    try {
      const response = await fetch(
        `${baseUrl}/conversations/projects/${projectId}/query-stream?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
          },
        }
      );

      if (!response.ok || !response.body) {
        // Fallback to regular query
        setThinkingStage('');
        return executeQuery(question, 0);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let result: QueryResponse | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            // Event type marker — handled via data parsing
            continue;
          }
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.step) {
                setThinkingStage(data.label || data.step);
              }
              if (data.answer !== undefined) {
                // This is the final result
                result = data as QueryResponse;
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      setIsThinking(false);
      setThinkingStage('');
      return result;
    } catch (error) {
      console.error('SSE stream error, falling back:', error);
      setThinkingStage('');
      return executeQuery(question, 0);
    }
  }, [projectId, conversationId, segmentId, executeQuery]);

  // Enviar mensaje/pregunta (try SSE stream first, fallback to regular)
  const sendMessage = useMutation({
    mutationFn: async (question: string) => {
      const streamResult = await executeQueryStream(question);
      if (streamResult) return streamResult;
      // Fallback to regular query if stream returned null
      return executeQuery(question, 0);
    },
    onSuccess: (data) => {
      setLastAnalysis(data);

      if (data.message_id) {
        if (data.charts && data.charts.length > 0) {
          chartsCache.current[data.message_id] = data.charts;
        }
        if (data.python_code) {
          pythonCodeCache.current[data.message_id] = data.python_code;
        }
        if (data.tables && data.tables.length > 0) {
          tablesCache.current[data.message_id] = data.tables;
        }
        if (data.variables_analyzed && data.variables_analyzed.length > 0) {
          variablesCache.current[data.message_id] = data.variables_analyzed;
        }
      }

      if (data.conversation_id) {
        queryClient.invalidateQueries({ queryKey: ['conversation', data.conversation_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['conversations', projectId] });
    },
    onError: (error: Error) => {
      toast({
        title: toastMessages?.queryError ?? 'Error processing question',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Refine a previous query result
  const refineMessage = useMutation({
    mutationFn: async ({
      messageId,
      action,
      params,
    }: {
      messageId: string;
      action: RefinementAction;
      params: Record<string, unknown>;
    }) => {
      setIsThinking(true);
      setQueryError(null);
      try {
        const response = await api.post<QueryResponse>(
          `/conversations/${conversationId}/messages/${messageId}/refine`,
          {
            action,
            params,
            source_message_id: messageId,
          }
        );
        return response;
      } finally {
        setIsThinking(false);
      }
    },
    onSuccess: (data) => {
      setLastAnalysis(data);

      if (data.message_id) {
        if (data.charts && data.charts.length > 0) {
          chartsCache.current[data.message_id] = data.charts;
        }
        if (data.python_code) {
          pythonCodeCache.current[data.message_id] = data.python_code;
        }
        if (data.tables && data.tables.length > 0) {
          tablesCache.current[data.message_id] = data.tables;
        }
        if (data.variables_analyzed && data.variables_analyzed.length > 0) {
          variablesCache.current[data.message_id] = data.variables_analyzed;
        }
      }

      if (data.conversation_id) {
        queryClient.invalidateQueries({ queryKey: ['conversation', data.conversation_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['conversations', projectId] });
    },
    onError: (error: Error) => {
      toast({
        title: toastMessages?.queryError ?? 'Error processing refinement',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Manual retry for failed queries
  const retryLastQuery = useCallback(() => {
    if (queryError?.failedQuestion) {
      sendMessage.mutate(queryError.failedQuestion);
    }
  }, [queryError, sendMessage]);

  // Obtener mensajes base del backend
  const baseMessages: Message[] = conversationQuery.data?.messages ?? [];

  // S25-3: Load earlier messages for pagination
  const loadEarlierMessages = useCallback(async () => {
    if (!conversationId || !hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const allMsgs = [...prependedMessages, ...baseMessages];
      const oldestTimestamp = allMsgs[0]?.created_at;
      if (!oldestTimestamp) return;
      const older = await api.get<Message[]>(
        `/conversations/${conversationId}/messages?before=${oldestTimestamp}&limit=50`
      );
      if (older.length < 50) {
        setHasMore(false);
      }
      setPrependedMessages(prev => [...older, ...prev]);
    } catch (error) {
      console.error('Error loading earlier messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, hasMore, isLoadingMore, prependedMessages, baseMessages]);

  // Enriquecer mensajes con datos del cache (S25-3: merge prepended + base)
  const messages = useMemo(() => {
    const allBase = [...prependedMessages, ...baseMessages];
    return allBase.map(msg => ({
      ...msg,
      charts: msg.charts || chartsCache.current[msg.id] || undefined,
      python_code: msg.python_code || pythonCodeCache.current[msg.id] || undefined,
      tables: msg.tables || tablesCache.current[msg.id] || undefined,
      variables_analyzed: msg.variables_analyzed || variablesCache.current[msg.id] || undefined,
    }));
  }, [baseMessages, prependedMessages]);

  return {
    conversation: conversationQuery.data,
    messages,
    isLoading: conversationQuery.isLoading,
    isThinking,
    thinkingStage,
    sendMessage,
    refineMessage,
    lastAnalysis,
    queryError,
    retryState,
    retryLastQuery,
    clearError: () => setQueryError(null),
    refetch: conversationQuery.refetch,
    hasMore,
    isLoadingMore,
    loadEarlierMessages,
  };
}
