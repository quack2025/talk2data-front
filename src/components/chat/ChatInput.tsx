import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { RetryState } from '@/hooks/useChat';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isThinking?: boolean;
  retryState?: RetryState;
}

export function ChatInput({ onSend, disabled, isThinking, retryState }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useLanguage();

  const handleSubmit = () => {
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  return (
    <div className="border-t bg-card p-4">
      <div className="flex gap-3 items-end max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.chat.placeholder}
            className="resize-none min-h-[48px] max-h-[200px] pr-12"
            rows={1}
            disabled={disabled || isThinking}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || disabled || isThinking}
          size="icon"
          className="h-12 w-12 shrink-0"
        >
          {isThinking ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
      {isThinking && (
        <div className="flex flex-col items-center gap-1 mt-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">
              {retryState?.isRetrying
                ? `${t.chat.retrying} (${t.chat.retryAttempt} ${retryState.attempt + 1} ${t.chat.of} ${retryState.maxAttempts + 1})...`
                : t.chat.analyzingData}
            </p>
          </div>
          {!retryState?.isRetrying && (
            <p className="text-[11px] text-muted-foreground/60">
              {t.chat.complexQueryHint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
