import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import type { Conversation } from '@/types/database';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  collapsed,
  onToggleCollapse,
}: ChatSidebarProps) {
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
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span>Nueva conversación</span>}
        </Button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.map((conversation) => (
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
                <p className="text-sm font-medium truncate">{conversation.title}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {format(new Date(conversation.last_activity), "d MMM", { locale: es })}
                  </span>
                  {conversation.message_count !== undefined && (
                    <span className="ml-2">({conversation.message_count} msgs)</span>
                  )}
                </div>
              </div>
            )}
          </button>
        ))}

        {conversations.length === 0 && !collapsed && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay conversaciones
          </p>
        )}
      </div>
    </div>
  );
}
