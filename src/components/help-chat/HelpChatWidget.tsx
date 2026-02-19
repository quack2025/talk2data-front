import { useState, useEffect } from 'react';
import { HelpChatButton } from './HelpChatButton';
import { HelpChatPanel } from './HelpChatPanel';
import { useHelpChat } from '@/hooks/useHelpChat';

export function HelpChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    messages,
    isLoading,
    remainingToday,
    limitReached,
    currentSection,
    sendMessage,
    clearMessages,
  } = useHelpChat();

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <HelpChatPanel
          messages={messages}
          isLoading={isLoading}
          remainingToday={remainingToday}
          limitReached={limitReached}
          currentSection={currentSection}
          onSend={sendMessage}
          onClear={clearMessages}
          onClose={() => setIsOpen(false)}
        />
      )}
      <HelpChatButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
    </div>
  );
}
