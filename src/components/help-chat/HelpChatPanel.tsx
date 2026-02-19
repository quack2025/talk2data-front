import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '@/i18n/LanguageContext';
import type { HelpChatMessage } from '@/types/helpChat';
import { cn } from '@/lib/utils';

interface HelpChatPanelProps {
  messages: HelpChatMessage[];
  isLoading: boolean;
  remainingToday: number | null;
  limitReached: boolean;
  currentSection: string | null;
  onSend: (message: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function HelpChatPanel({
  messages,
  isLoading,
  remainingToday,
  limitReached,
  currentSection,
  onSend,
  onClear,
  onClose,
}: HelpChatPanelProps) {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim() || isLoading || limitReached) return;
    onSend(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Section-aware suggestions
  const getSuggestions = (): string[] => {
    const hc = t.helpChat;
    if (!hc) return [];
    switch (currentSection) {
      case 'chat': return hc.suggestionsChat as unknown as string[] ?? [];
      case 'data-prep': return hc.suggestionsDataPrep as unknown as string[] ?? [];
      case 'explore': return hc.suggestionsExplore as unknown as string[] ?? [];
      case 'upload': return hc.suggestionsUpload as unknown as string[] ?? [];
      default: return hc.suggestionsGeneral as unknown as string[] ?? [];
    }
  };

  const suggestions = getSuggestions();
  const showSuggestions = messages.length === 0 && !limitReached;

  return (
    <div className="absolute bottom-16 right-0 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[70vh] bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground rounded-t-xl">
        <div className="flex items-center gap-2">
          <div>
            <h3 className="font-semibold text-sm leading-none">
              {t.helpChat?.title ?? 'Help'}
            </h3>
            <p className="text-[11px] opacity-80 mt-0.5">
              {t.helpChat?.subtitle ?? 'Survey Genius Assistant'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {remainingToday != null && (
            <Badge variant="secondary" className="text-[10px] h-5 bg-primary-foreground/20 text-primary-foreground border-0">
              {remainingToday} {t.helpChat?.remaining ?? 'left'}
            </Badge>
          )}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              onClick={onClear}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Welcome message */}
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-lg px-3 py-2 bg-muted text-sm">
            {t.helpChat?.welcome ?? 'How can I help you?'}
          </div>
        </div>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSend(s)}
                className="text-xs px-2.5 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg px-3 py-2 bg-muted text-sm flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t.helpChat?.thinking ?? 'Thinking...'}
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t p-3">
        {limitReached ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            {t.helpChat?.limitReached ?? 'Daily limit reached.'}
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.helpChat?.placeholder ?? 'Type your question...'}
              rows={1}
              className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary max-h-20"
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
