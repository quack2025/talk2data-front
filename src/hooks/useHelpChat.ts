import { useState, useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { api } from '@/lib/api';
import type { HelpChatMessage, HelpChatResponse, HelpChatContext } from '@/types/helpChat';

function deriveSection(pathname: string): string | null {
  if (pathname.includes('/chat')) return 'chat';
  if (pathname.includes('/explore')) return 'explore';
  if (pathname.includes('/upload')) return 'upload';
  if (pathname.includes('/summary')) return 'summary';
  if (pathname.includes('/data-prep')) return 'data-prep';
  if (pathname.includes('/settings')) return 'settings';
  if (pathname.includes('/exports')) return 'exports';
  if (pathname.includes('/teams')) return 'teams';
  if (pathname.includes('/api-keys')) return 'api-keys';
  if (pathname.match(/\/projects\/[^/]+/)) return 'project-detail';
  if (pathname === '/projects' || pathname === '/') return 'projects';
  return null;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useHelpChat() {
  const [messages, setMessages] = useState<HelpChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  const location = useLocation();
  const params = useParams<{ projectId?: string }>();
  const { language } = useLanguage();

  const buildContext = useCallback((): HelpChatContext => {
    return {
      current_page: location.pathname,
      current_section: deriveSection(location.pathname),
      project_id: params.projectId ?? null,
      project_name: null, // Could be enriched from project context if needed
    };
  }, [location.pathname, params.projectId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || limitReached) return;

    const userMsg: HelpChatMessage = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      const response = await api.post<HelpChatResponse>('/help-chat', {
        message: text.trim(),
        history: history.slice(-20),
        context: buildContext(),
        language,
      });

      const assistantMsg: HelpChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setRemainingToday(response.remaining_today);

      if (response.remaining_today <= 0) {
        setLimitReached(true);
      }
    } catch (err: any) {
      if (err?.status === 429) {
        setLimitReached(true);
        setRemainingToday(0);
      } else {
        const errorMsg: HelpChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: language === 'es'
            ? 'Hubo un error al procesar tu pregunta. Intenta de nuevo.'
            : 'There was an error processing your question. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, limitReached, buildContext, language]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const currentSection = deriveSection(location.pathname);

  return {
    messages,
    isLoading,
    remainingToday,
    limitReached,
    currentSection,
    sendMessage,
    clearMessages,
  };
}
