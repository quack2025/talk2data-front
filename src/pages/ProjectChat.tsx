import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatSuggestions } from '@/components/chat/ChatSuggestions';
import { ResultsPanel } from '@/components/chat/ResultsPanel';
import { useChat, useChatMessages } from '@/hooks/useChat';
import { Loader2 } from 'lucide-react';

export default function ProjectChat() {
  const { projectId } = useParams<{ projectId: string }>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sessions, isLoading: sessionsLoading, createSession } = useChat(projectId!);
  const { messages, isLoading: messagesLoading, isThinking, sendMessage } = useChatMessages(activeSessionId);

  // Auto-select first session or create new one
  useEffect(() => {
    if (!sessionsLoading && sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, sessionsLoading, activeSessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewSession = async () => {
    const session = await createSession.mutateAsync();
    setActiveSessionId(session.id);
  };

  const handleSendMessage = (content: string) => {
    if (!projectId) return;
    sendMessage.mutate({ content, projectId });
  };

  const hasMessages = messages.length > 0;

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Chat Sidebar */}
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onNewSession={handleNewSession}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Chat Panel */}
        <div className="w-[400px] flex flex-col border-r bg-background">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messagesLoading ? (
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
            disabled={!activeSessionId}
            isThinking={isThinking}
          />
        </div>

        {/* Results Panel */}
        <ResultsPanel hasResults={hasMessages} />
      </div>
    </AppLayout>
  );
}
