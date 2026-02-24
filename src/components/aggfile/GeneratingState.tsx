import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface GeneratingStateProps {
  progress: number;
  nQuestions: number;
  nBanners: number;
}

export function GeneratingState({ progress, nQuestions, nBanners }: GeneratingStateProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-6">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>

      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">
          {t.aggfile?.generatingTitle || 'Generating cross tables'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t.aggfile?.generatingDescription ||
            `Calculating cross tables for ${nQuestions} questions with ${nBanners} banners...`}
        </p>
      </div>

      <div className="w-full max-w-xs space-y-2">
        <Progress value={Math.min(progress, 100)} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">
          {Math.round(progress)}%
        </p>
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-sm">
        {t.aggfile?.generatingHint ||
          'This process may take a few seconds depending on data volume'}
      </p>
    </div>
  );
}
