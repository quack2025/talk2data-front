import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { Conversation, QueryResponse } from '@/types/database';

// Hook para manejar sesiones/conversaciones
export function useChat(projectId: string) {
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
  });

  // Eliminar conversación
  const deleteConversation = useMutation({
    mutationFn: (conversationId: string) =>
      api.delete(`/conversations/${conversationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', projectId] });
    },
  });

  return {
    conversations: conversationsQuery.data ?? [],
    isLoading: conversationsQuery.isLoading,
    createConversation,
    deleteConversation,
  };
}

// Hook para manejar mensajes y queries
export function useChatMessages(projectId: string, conversationId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isThinking, setIsThinking] = useState(false);

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
        // Usar el endpoint de query del proyecto
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
      // Invalidar queries para refrescar mensajes
      queryClient.invalidateQueries({ queryKey: ['conversation', data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['conversations', projectId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    conversation: conversationQuery.data,
    messages: conversationQuery.data?.messages ?? [],
    isLoading: conversationQuery.isLoading,
    isThinking,
    sendMessage,
  };
}
