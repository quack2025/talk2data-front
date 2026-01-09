import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, BarChart3 } from 'lucide-react';
import type { Message } from '@/types/database';
import { format } from 'date-fns';
import { useLanguage } from '@/i18n/LanguageContext';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const { t } = useLanguage();

  return (
    <div
      className={cn(
        'flex gap-3 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar className={cn('h-8 w-8 flex-shrink-0', isUser && 'bg-primary')}>
        <AvatarFallback className={cn(isUser && 'bg-primary text-primary-foreground')}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'flex flex-col max-w-[85%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Charts visualization for assistant messages */}
        {!isUser && message.charts && message.charts.length > 0 && (
          <div className="mt-3 w-full space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs font-medium">{t.chat.visualizations}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {message.charts.map((chart, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-3 bg-card shadow-sm overflow-hidden"
                >
                  <h4 className="text-xs font-medium text-foreground mb-2 truncate">
                    {chart.title}
                  </h4>
                  <img 
                    src={`data:image/png;base64,${chart.chart_base64}`}
                    alt={chart.title}
                    className="w-full h-auto rounded"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata badges for assistant messages */}
        {!isUser && message.analysis_executed && Object.keys(message.analysis_executed).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              {t.chat.analysisExecuted}
            </span>
          </div>
        )}

        <span className="text-xs text-muted-foreground mt-1">
          {format(new Date(message.created_at), 'HH:mm')}
        </span>
      </div>
    </div>
  );
}
