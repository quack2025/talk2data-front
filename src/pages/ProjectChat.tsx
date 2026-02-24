import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatSuggestions } from '@/components/chat/ChatSuggestions';
import { ResultsPanel } from '@/components/chat/ResultsPanel';
import { useChat, useChatMessages } from '@/hooks/useChat';
import { Loader2, MessageSquare, AlertTriangle, WifiOff, RefreshCw, Presentation, CheckCircle2 } from 'lucide-react';
import type { RefinementAction } from '@/types/database';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { useDataPrep } from '@/hooks/useDataPrep';
import { useProject } from '@/hooks/useProjects';
import { ReportGeneratorDialog } from '@/components/reports';
import { toast } from 'sonner';

export default function ProjectChat() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const { dataPrepStatus, skipDataPrep } = useDataPrep(projectId!);
  const { data: project } = useProject(projectId!);

  // Guard: auto-skip data prep gate if project is ready
  useEffect(() => {
    if (dataPrepStatus === 'pending') {
      // If project has data and is ready, auto-skip the gate
      if (project?.status === 'ready') {
        skipDataPrep();
        return;
      }
      // Only redirect if project is loaded and NOT ready
      if (project && project.status !== 'ready') {
        toast.info(t.dataPrep?.gateTooltip || 'Confirm data preparation first');
        navigate(`/projects/${projectId}`, { replace: true });
      }
    }
  }, [dataPrepStatus, project, projectId, navigate, t, skipDataPrep]);

  const toastMessages = {
    conversationError: t.toasts.conversationError,
    conversationDeleteError: t.toasts.conversationDeleteError,
    queryError: t.toasts.queryError,
    error: t.toasts.error,
  };

  const { conversations, isLoading: conversationsLoading, createConversation, error: conversationsError } = useChat(projectId!, toastMessages);
  const { messages, isLoading: messagesLoading, isThinking, sendMessage, refineMessage, lastAnalysis, queryError, retryState, retryLastQuery, clearError } = useChatMessages(projectId!, activeConversationId, toastMessages);

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

  const handleRefine = (messageId: string, action: RefinementAction, params: Record<string, unknown>) => {
    refineMessage.mutate({ messageId, action, params });
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
          {/* Chat toolbar */}
          <div className="flex items-center justify-end px-3 py-2 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReportDialogOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Presentation className="h-3.5 w-3.5" />
              {t.reports?.generateReport ?? 'Generate Report'}
            </Button>
          </div>
          {/* Transparency banner */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 px-4 py-2 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-blue-600 dark:text-blue-400 text-xs">
              {t.chat.transparencyBanner}
            </span>
          </div>
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
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onRefine={handleRefine}
                    isRefining={isThinking}
                  />
                ))}
                {isThinking && (
                  <div className="flex gap-3 p-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-xs text-muted-foreground ml-1">
                            {retryState.isRetrying
                              ? `${t.chat.retrying} (${retryState.attempt + 1}/${retryState.maxAttempts + 1})... ${t.chat.retryWait}`
                              : t.chat.analyzingData}
                          </span>
                        </div>
                      </div>
                      {!retryState.isRetrying && (
                        <span className="text-[11px] text-muted-foreground/60 ml-1">
                          {t.chat.complexQueryHint}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {queryError && !isThinking && (
                  <div className="flex gap-3 p-4">
                    <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      {queryError.isServiceUnavailable ? (
                        <WifiOff className="h-4 w-4 text-destructive" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2 max-w-[85%]">
                      <div className="bg-destructive/10 border border-destructive/20 rounded-2xl rounded-bl-md px-4 py-3">
                        <p className="text-sm text-destructive font-medium">
                          {queryError.isServiceUnavailable
                            ? t.chat.serviceUnavailable
                            : queryError.message?.includes('timed out') || queryError.message?.includes('timeout')
                              ? t.chat.timeoutError
                              : t.chat.serverError}
                        </p>
                        {queryError.message && !queryError.isServiceUnavailable && (
                          <p className="text-xs text-destructive/70 mt-1.5">
                            {queryError.message}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-fit gap-2 text-xs"
                        onClick={() => { clearError(); retryLastQuery(); }}
                      >
                        <RefreshCw className="h-3 w-3" />
                        {t.chat.tryAgain}
                      </Button>
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
            retryState={retryState}
          />
        </div>

        {/* Results Panel */}
        <ResultsPanel
          hasResults={hasMessages}
          charts={lastAnalysis?.charts ?? []}
          tables={lastAnalysis?.tables ?? []}
          variablesAnalyzed={lastAnalysis?.variables_analyzed ?? []}
          analysisPerformed={Array.isArray(lastAnalysis?.analysis_performed) ? lastAnalysis.analysis_performed : []}
        />
      </div>

      {/* Report Generator Dialog */}
      <ReportGeneratorDialog
        projectId={projectId!}
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        conversationIds={activeConversationId ? [activeConversationId] : undefined}
        conversationCount={conversations.length}
      />
    </AppLayout>
  );
}
