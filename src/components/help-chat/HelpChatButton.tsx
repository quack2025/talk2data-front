import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function HelpChatButton({ isOpen, onClick }: HelpChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200',
        'hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50',
        isOpen
          ? 'bg-muted text-muted-foreground'
          : 'bg-primary text-primary-foreground animate-in fade-in'
      )}
      aria-label="Help"
    >
      <HelpCircle className="h-6 w-6" />
    </button>
  );
}
