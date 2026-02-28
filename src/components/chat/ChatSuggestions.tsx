import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Scale } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface SuggestionsResponse {
  suggestions: string[];
  detected_weight_variable?: string | null;
}

interface ChatSuggestionsProps {
  onSelect: (suggestion: string) => void;
}

export function ChatSuggestions({ onSelect }: ChatSuggestionsProps) {
  const { t } = useLanguage();
  const { projectId } = useParams<{ projectId: string }>();
  const [smartSuggestions, setSmartSuggestions] = useState<string[] | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    api
      .get<SuggestionsResponse>(
        `/conversations/projects/${projectId}/suggestions`
      )
      .then((data) => {
        if (cancelled) return;
        if (data.suggestions?.length) {
          setSmartSuggestions(data.suggestions);
        }
        if (data.detected_weight_variable) {
          toast.info(
            `Weight variable detected: ${data.detected_weight_variable}. Go to Data Prep to apply it.`,
            { icon: <Scale className="h-4 w-4" />, duration: 8000 },
          );
        }
      })
      .catch(() => {
        // Fallback to static suggestions
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const suggestions = smartSuggestions ?? t.chat.suggestions;

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
          {suggestions.map((suggestion, i) => (
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
