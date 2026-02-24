import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  onClose: () => void;
}

export function ErrorState({ error, onRetry, onClose }: ErrorStateProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-6">
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>

      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">
          {t.aggfile?.errorTitle || 'Generation error'}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-sm">
        <Button onClick={onRetry} className="w-full gap-2">
          <RotateCcw className="h-4 w-4" />
          {t.aggfile?.retry || 'Retry'}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          {t.common.close}
        </Button>
      </div>
    </div>
  );
}
