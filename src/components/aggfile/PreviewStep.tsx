import { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChevronLeft,
  AlertTriangle,
  FileSpreadsheet,
  BarChart3,
  Download,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { GenerateTablesPreviewResponse } from '@/types/aggfile';

interface PreviewStepProps {
  preview: GenerateTablesPreviewResponse | null;
  isLoading: boolean;
  error: string | null;
  selectedBannersCount: number;
  selectedAnalysisCount: number;
  onFetchPreview: () => void;
  onBack: () => void;
  onGenerate: () => void;
  onExportExcel: () => void;
  canGenerate: boolean;
}

export function PreviewStep({
  preview,
  isLoading,
  error,
  selectedBannersCount,
  selectedAnalysisCount,
  onFetchPreview,
  onBack,
  onGenerate,
  onExportExcel,
  canGenerate,
}: PreviewStepProps) {
  const { t } = useLanguage();

  useEffect(() => {
    onFetchPreview();
  }, [onFetchPreview]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-2">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
        <div className="p-4 border-t flex gap-2">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            {t.common.back}
          </Button>
          <Button onClick={onFetchPreview} className="flex-1">
            {t.aggfile?.retry || 'Retry'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 space-y-1">
        <h3 className="font-semibold">
          {t.aggfile?.step4Title || 'Preview'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t.aggfile?.step4Description ||
            'Review the analysis plan before generating'}
        </p>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 pb-4">
          {/* Estimation highlight */}
          {preview && preview.total_analyses > 0 && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                {t.aggfile?.tablesWillGenerate} {preview.total_analyses} {t.aggfile?.tablesAutomatic}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {t.aggfile?.estimatedWork} {Math.max(1, Math.round(preview.total_analyses * 0.1))} {t.aggfile?.hoursManual}
              </p>
            </div>
          )}

          {/* Summary card */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t.aggfile?.bannerVariables || 'Banner variables'}
                </span>
                <Badge variant="secondary">{selectedBannersCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t.aggfile?.analysisVariables || 'Analysis variables'}
                </span>
                <Badge variant="secondary">{selectedAnalysisCount}</Badge>
              </div>
              {preview && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t.aggfile?.totalAnalyses || 'Total analyses'}
                    </span>
                    <Badge variant="default">
                      {preview.total_analyses}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t.aggfile?.estimatedVariables || 'Estimated variables'}
                    </span>
                    <Badge variant="secondary">
                      {preview.estimated_variables}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Analysis plan */}
          {preview && preview.analyses_plan.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t.aggfile?.analysisPlan || 'Analysis plan'}</h4>
              <div className="space-y-1">
                {preview.analyses_plan.map((plan, idx) => (
                  <div
                    key={idx}
                    className="text-xs p-2 bg-muted rounded flex items-center gap-2"
                  >
                    <BarChart3 className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {String(plan.analysis_type || plan.type || '')} —{' '}
                      {String(plan.variable || plan.variables || '')}
                      {plan.cross_variable
                        ? ` × ${String(plan.cross_variable)}`
                        : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {preview && preview.warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-amber-600">
                {t.aggfile?.warnings || 'Warnings'}
              </h4>
              {preview.warnings.map((warning, idx) => (
                <div
                  key={idx}
                  className="text-xs p-2 bg-amber-50 text-amber-700 rounded flex items-start gap-2"
                >
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          {/* Filters summary */}
          {preview?.filters_summary && preview.filters_summary.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t.aggfile?.appliedFilters || 'Applied filters'}</h4>
              <div className="flex flex-wrap gap-1">
                {preview.filters_summary.map((filter, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {filter}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t space-y-2">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            {t.common.back}
          </Button>
          <Button
            onClick={onGenerate}
            disabled={!canGenerate}
            className="flex-1 gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {t.aggfile?.generateTables || 'Generate tables'}
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={onExportExcel}
          disabled={!canGenerate}
          className="w-full gap-2"
        >
          <Download className="h-4 w-4" />
          {t.aggfile?.exportDirectExcel || 'Export directly to Excel'}
        </Button>
      </div>
    </div>
  );
}
