import ReactMarkdown from 'react-markdown';
import { Sparkles, Lightbulb, FileText, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExecutiveSummary } from '@/types/database';
import { useLanguage } from '@/i18n/LanguageContext';

interface ExecutiveSummaryCardProps {
  summary: ExecutiveSummary | null | undefined;
  isLoading?: boolean;
  isRegenerating?: boolean;
  onRegenerate?: () => void;
  compact?: boolean;
}

export function ExecutiveSummaryCard({
  summary,
  isLoading,
  isRegenerating,
  onRegenerate,
  compact = false,
}: ExecutiveSummaryCardProps) {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            {t.summary?.noSummary || 'No hay resumen disponible'}
          </p>
          {onRegenerate && (
            <Button
              variant="outline"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="mt-4"
            >
              {isRegenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {t.summary?.generate || 'Generar resumen'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>{t.summary?.title || 'Resumen Ejecutivo'}</CardTitle>
            <CardDescription>
              {t.summary?.generatedByAI || 'Generado automáticamente con IA'}
            </CardDescription>
          </div>
        </div>
        {onRegenerate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main content */}
        <div className={compact ? 'line-clamp-4' : ''}>
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground prose-li:marker:text-primary">
            <ReactMarkdown>{summary.content}</ReactMarkdown>
          </div>
        </div>

        {/* Key findings */}
        {summary.key_findings && summary.key_findings.length > 0 && !compact && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              {t.summary?.keyFindings || 'Hallazgos clave'}
            </div>
            <ul className="space-y-2">
              {summary.key_findings.map((finding, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {index + 1}
                  </span>
                  {finding}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Methodology notes */}
        {summary.methodology_notes && !compact && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4" />
              {t.summary?.methodologyNotes || 'Notas metodológicas'}
            </div>
            <p className="text-sm text-muted-foreground">
              {summary.methodology_notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
