import { useState, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api, ApiError } from '@/lib/api';
import type { Conversation, QueryResponse, Message, ChartData } from '@/types/database';

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
export function useChatMessages(projectId: string, conversationId: string | null, toastMessages?: ToastMessages) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isThinking, setIsThinking] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<QueryResponse | null>(null);
  const [queryError, setQueryError] = useState<QueryErrorState | null>(null);
  const [retryState, setRetryState] = useState<RetryState>({ attempt: 0, maxAttempts: MAX_AUTO_RETRIES, isRetrying: false });

  // Cache de charts por message_id (persistente entre renders)
  const chartsCache = useRef<Record<string, ChartData[]>>({});

  // Obtener conversación con mensajes
  const conversationQuery = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => api.get<Conversation>(`/conversations/${conversationId}`),
    enabled: !!conversationId,
  });

  const executeQuery = useCallback(async (question: string, attempt: number): Promise<QueryResponse> => {
    setIsThinking(true);
    setQueryError(null);

    if (attempt > 0) {
      setRetryState({ attempt, maxAttempts: MAX_AUTO_RETRIES, isRetrying: true });
    }

    try {
      const response = await api.post<QueryResponse>(
        `/conversations/projects/${projectId}/query`,
        {
          question,
          conversation_id: conversationId ?? undefined,
        },
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
  }, [projectId, conversationId]);

  // Enviar mensaje/pregunta
  const sendMessage = useMutation({
    mutationFn: (question: string) => executeQuery(question, 0),
    onSuccess: (data) => {
      setLastAnalysis(data);

      if (data.charts && data.charts.length > 0 && data.message_id) {
        chartsCache.current[data.message_id] = data.charts;
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

  // Manual retry for failed queries
  const retryLastQuery = useCallback(() => {
    if (queryError?.failedQuestion) {
      sendMessage.mutate(queryError.failedQuestion);
    }
  }, [queryError, sendMessage]);

  // Obtener mensajes base del backend
  const baseMessages: Message[] = conversationQuery.data?.messages ?? [];

  // Enriquecer mensajes con charts del cache
  const messages = useMemo(() => {
    return baseMessages.map(msg => ({
      ...msg,
      charts: msg.charts || chartsCache.current[msg.id] || undefined,
    }));
  }, [baseMessages]);

  return {
    conversation: conversationQuery.data,
    messages,
    isLoading: conversationQuery.isLoading,
    isThinking,
    sendMessage,
    lastAnalysis,
    queryError,
    retryState,
    retryLastQuery,
    clearError: () => setQueryError(null),
    refetch: conversationQuery.refetch,
  };
}
