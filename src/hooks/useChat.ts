import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
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

// Hook para manejar mensajes y queries
export function useChatMessages(projectId: string, conversationId: string | null, toastMessages?: ToastMessages) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isThinking, setIsThinking] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<QueryResponse | null>(null);
  
  // Cache de charts por message_id (persistente entre renders)
  const chartsCache = useRef<Record<string, ChartData[]>>({});

  // Obtener conversación con mensajes
  const conversationQuery = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => api.get<Conversation>(`/conversations/${conversationId}`),
    enabled: !!conversationId,
  });

  // Enviar mensaje/pregunta
  const sendMessage = useMutation({
    mutationFn: async (question: string): Promise<QueryResponse> => {
      setIsThinking(true);

      try {
        // Usar el endpoint correcto de query
        const response = await api.post<QueryResponse>(
          `/conversations/projects/${projectId}/query`,
          {
            question,
            conversation_id: conversationId ?? undefined,
          }
        );

        return response;
      } finally {
        setIsThinking(false);
      }
    },
    onSuccess: (data) => {
      // Guardar el análisis más reciente para mostrar en el panel
      setLastAnalysis(data);
      
      // Guardar charts en cache si vienen en la respuesta
      if (data.charts && data.charts.length > 0 && data.message_id) {
        chartsCache.current[data.message_id] = data.charts;
      }
      
      // Invalidar queries para refrescar mensajes
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
    refetch: conversationQuery.refetch,
  };
}
