import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface ChatSuggestionsProps {
  onSelect: (suggestion: string) => void;
}

const suggestions = [
  '¿Cuál es el perfil demográfico de los encuestados?',
  '¿Hay diferencias significativas por género?',
  '¿Cuáles son las variables con mayor correlación?',
  'Muéstrame un resumen de las respuestas principales',
  '¿Cuál es el NPS de la encuesta?',
  'Haz un análisis de sentimiento de las respuestas abiertas',
];

export function ChatSuggestions({ onSelect }: ChatSuggestionsProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">¿Qué quieres saber?</h2>
        <p className="text-muted-foreground mb-8">
          Pregunta lo que quieras sobre tus datos. Puedo ayudarte a analizar,
          comparar y visualizar la información.
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
