import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatSuggestions } from '@/components/chat/ChatSuggestions';
import { ResultsPanel } from '@/components/chat/ResultsPanel';
import { useChat, useChatMessages } from '@/hooks/useChat';
import { Loader2, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';

export default function ProjectChat() {
  const { projectId } = useParams<{ projectId: string }>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const toastMessages = {
    conversationError: t.toasts.conversationError,
    conversationDeleteError: t.toasts.conversationDeleteError,
    queryError: t.toasts.queryError,
    error: t.toasts.error,
  };

  const { conversations, isLoading: conversationsLoading, createConversation, error: conversationsError } = useChat(projectId!, toastMessages);
  const { messages, isLoading: messagesLoading, isThinking, sendMessage, lastAnalysis } = useChatMessages(projectId!, activeConversationId, toastMessages);

  // Auto-select first conversation or create new one
  useEffect(() => {
    if (!conversationsLoading && conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, conversationsLoading, activeConversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewConversation = async () => {
    try {
      const conversation = await createConversation.mutateAsync(t.chat.newConversation);
      setActiveConversationId(conversation.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!projectId) return;

    // Si no hay conversación activa, crear una primero
    if (!activeConversationId && conversations.length === 0) {
      try {
        const conversation = await createConversation.mutateAsync(t.chat.newConversation);
        setActiveConversationId(conversation.id);
        // Esperar un momento para que el estado se actualice
        setTimeout(() => {
          sendMessage.mutate(content);
        }, 100);
      } catch (error) {
        console.error('Error creating conversation:', error);
      }
    } else {
      sendMessage.mutate(content);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Chat Sidebar */}
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onNewConversation={handleNewConversation}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isLoading={conversationsLoading}
        />

        {/* Chat Panel */}
        <div className="w-[400px] flex flex-col border-r bg-background">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : conversationsError ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground text-center">
                  {t.chat.errorLoadingConversations}
                </p>
                <Button variant="outline" onClick={handleNewConversation}>
                  {t.chat.startNewConversation}
                </Button>
              </div>
            ) : messagesLoading && activeConversationId ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : hasMessages ? (
              <div className="py-4">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isThinking && (
                  <div className="flex gap-3 p-4">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <ChatSuggestions onSelect={handleSendMessage} />
            )}
          </div>

          {/* Input */}
          <ChatInput
            onSend={handleSendMessage}
            disabled={false}
            isThinking={isThinking}
          />
        </div>

        {/* Results Panel */}
        <ResultsPanel 
          hasResults={hasMessages} 
          lastAnalysis={lastAnalysis}
        />
      </div>
    </AppLayout>
  );
}
