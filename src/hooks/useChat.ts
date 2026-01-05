import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { Conversation, QueryResponse, Message } from '@/types/database';

// Hook para manejar sesiones/conversaciones
export function useChat(projectId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Listar conversaciones del proyecto
  const conversationsQuery = useQuery({
    queryKey: ['conversations', projectId],
    queryFn: () => api.get<Conversation[]>(`/projects/${projectId}/conversations`),
    enabled: !!projectId,
  });

  // Crear nueva conversación
  const createConversation = useMutation({
    mutationFn: (title?: string) =>
      api.post<Conversation>(`/projects/${projectId}/conversations`, {
        title: title ?? 'Nueva conversación',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', projectId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al crear conversación',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Eliminar conversación
  const deleteConversation = useMutation({
    mutationFn: (conversationId: string) =>
      api.delete(`/projects/${projectId}/conversations/${conversationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', projectId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al eliminar conversación',
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
export function useChatMessages(projectId: string, conversationId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isThinking, setIsThinking] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<QueryResponse | null>(null);

  // Obtener conversación con mensajes
  const conversationQuery = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => api.get<Conversation>(`/projects/${projectId}/conversations/${conversationId}`),
    enabled: !!conversationId && !!projectId,
  });

  // Enviar mensaje/pregunta
  const sendMessage = useMutation({
    mutationFn: async (question: string): Promise<QueryResponse> => {
      setIsThinking(true);

      try {
        // Usar el endpoint de query del proyecto
        const response = await api.post<QueryResponse>(
          `/projects/${projectId}/query`,
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
      
      // Invalidar queries para refrescar mensajes
      if (data.conversation_id) {
        queryClient.invalidateQueries({ queryKey: ['conversation', data.conversation_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['conversations', projectId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al procesar pregunta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Obtener mensajes como array plano para facilitar el rendering
  const messages: Message[] = conversationQuery.data?.messages ?? [];

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
