import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface ChatSuggestionsProps {
  onSelect: (suggestion: string) => void;
}

export function ChatSuggestions({ onSelect }: ChatSuggestionsProps) {
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">{t.chat.whatToKnow}</h2>
        <p className="text-muted-foreground mb-8">
          {t.chat.askAnything}
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          {t.chat.suggestions.map((suggestion, i) => (
            <Button
              key={i}
              variant="outline"
              className="h-auto py-3 px-4 text-left text-sm font-normal justify-start whitespace-normal"
              onClick={() => onSelect(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
