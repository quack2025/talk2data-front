import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ChatSession, ChatMessage } from '@/types/database';
import { api } from '@/lib/api';

export function useChat(projectId: string) {
  const queryClient = useQueryClient();
  const [isThinking, setIsThinking] = useState(false);

  const sessionsQuery = useQuery({
    queryKey: ['chat-sessions', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as ChatSession[];
    },
    enabled: !!projectId,
  });

  const createSession = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          project_id: projectId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ChatSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions', projectId] });
    },
  });

  return {
    sessions: sessionsQuery.data ?? [],
    isLoading: sessionsQuery.isLoading,
    createSession,
  };
}

export function useChatMessages(sessionId: string | null) {
  const queryClient = useQueryClient();
  const [isThinking, setIsThinking] = useState(false);

  const messagesQuery = useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!sessionId,
  });

  const sendMessage = useMutation({
    mutationFn: async ({ content, projectId }: { content: string; projectId: string }) => {
      if (!sessionId) throw new Error('No hay sesión activa');

      // Save user message
      const { error: userMsgError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          content,
        });

      if (userMsgError) throw userMsgError;

      // Send to backend for AI response
      setIsThinking(true);
      try {
        const response = await api.post(`/chat/${projectId}`, { session_id: sessionId, message: content });

        // Save assistant message
        const { error: assistantMsgError } = await supabase
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            role: 'assistant',
            content: response.content,
            metadata: response.metadata || {},
          });

        if (assistantMsgError) throw assistantMsgError;

        return response;
      } finally {
        setIsThinking(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
    },
  });

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading,
    isThinking,
    sendMessage,
  };
}
