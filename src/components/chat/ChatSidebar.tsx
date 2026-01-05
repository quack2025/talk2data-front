import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, ChevronLeft, ChevronRight, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Conversation } from '@/types/database';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isLoading?: boolean;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  collapsed,
  onToggleCollapse,
  isLoading,
}: ChatSidebarProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'es' ? es : enUS;

  return (
    <div
      className={cn(
        'h-full border-r bg-card flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        {!collapsed && (
          <span className="font-semibold text-sm">Conversaciones</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* New chat button */}
      <div className="p-3">
        <Button
          onClick={onNewConversation}
          className={cn('gap-2', collapsed ? 'w-10 p-0' : 'w-full')}
          size={collapsed ? 'icon' : 'default'}
          disabled={isLoading}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span>{t.chat.newChat}</span>}
        </Button>
      </div>

      {/* Conversations list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            !collapsed && (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t.chat.noSessions}</p>
              </div>
            )
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  'w-full text-left rounded-lg p-3 transition-colors',
                  activeConversationId === conversation.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                )}
              >
                {collapsed ? (
                  <MessageSquare className="h-4 w-4 mx-auto" />
                ) : (
                  <div>
                    <p className="text-sm font-medium truncate">
                      {conversation.title || 'Nueva conversación'}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(conversation.last_activity || conversation.created_at), 'd MMM', { locale: dateLocale })}
                      </span>
                      {conversation.message_count !== undefined && (
                        <span className="ml-2">({conversation.message_count} msgs)</span>
                      )}
                    </div>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
