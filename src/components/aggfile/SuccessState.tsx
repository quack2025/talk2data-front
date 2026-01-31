import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type {
  AggfileResponse,
  GenerateTablesResponse,
  ValueFormat,
} from '@/types/aggfile';

interface SuccessStateProps {
  result: AggfileResponse | null;
  generateTablesResult: GenerateTablesResponse | null;
  format: {
    valueType: ValueFormat;
    decimalPlaces: number;
    includeBases: boolean;
    includeSignificance: boolean;
    significanceLevel: number;
  };
  onDownload: () => void;
  onExportExcel: () => void;
  onClose: () => void;
}

export function SuccessState({
  result,
  generateTablesResult,
  format,
  onDownload,
  onExportExcel,
  onClose,
}: SuccessStateProps) {
  const { t } = useLanguage();

  const formatLabels: Record<ValueFormat, string> = {
    percentage: t.aggfile?.percentages || 'Porcentajes',
    decimal: t.aggfile?.decimals || 'Decimales',
    count: t.aggfile?.frequencies || 'Frecuencias',
  };

  const isGenerateTables = !!generateTablesResult;
  const totalAnalyses = generateTablesResult?.total_analyses ?? 0;
  const executionTime = generateTablesResult?.execution_time_ms ?? 0;
  const warnings = generateTablesResult?.warnings ?? [];

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-6">
      <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-500" />
      </div>

      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">
          {t.aggfile?.successTitle || '¡Tablas generadas!'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isGenerateTables
            ? `${totalAnalyses} análisis completados en ${(executionTime / 1000).toFixed(1)}s`
            : t.aggfile?.successDescription ||
              'Tu archivo Excel está listo para descargar'}
        </p>
      </div>

      {/* Summary */}
      <div className="bg-muted/50 rounded-lg p-4 w-full max-w-sm space-y-3">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-10 w-10 text-green-600" />
          <div>
            {isGenerateTables ? (
              <>
                <p className="font-medium">
                  {generateTablesResult.title || 'Tablas generadas'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {totalAnalyses} análisis ·{' '}
                  {generateTablesResult.results?.length ?? 0} resultados
                </p>
              </>
            ) : result ? (
              <>
                <p className="font-medium">Aggfile.xlsx</p>
                <p className="text-xs text-muted-foreground">
                  {result.n_questions} {t.aggfile?.questions || 'preguntas'} ×{' '}
                  {result.n_banners} banners
                </p>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{formatLabels[format.valueType]}</Badge>
          {format.valueType !== 'count' && (
            <Badge variant="outline">
              {format.decimalPlaces} {t.aggfile?.decimalPlaces || 'decimales'}
            </Badge>
          )}
          {format.includeBases && (
            <Badge variant="outline">
              {t.aggfile?.withBases || 'Con bases'}
            </Badge>
          )}
          {format.includeSignificance && (
            <Badge variant="outline">Significancia</Badge>
          )}
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-1">
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-600">
                {w}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 w-full max-w-sm">
        {isGenerateTables ? (
          <Button onClick={onExportExcel} className="w-full gap-2">
            <Download className="h-4 w-4" />
            Descargar Excel
          </Button>
        ) : (
          <Button onClick={onDownload} className="w-full gap-2">
            <Download className="h-4 w-4" />
            {t.aggfile?.downloadExcel || 'Descargar Excel'}
          </Button>
        )}
        <Button variant="ghost" onClick={onClose}>
          {t.common.close}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {t.aggfile?.alsoInExports ||
          'También disponible en la sección de Exportaciones'}
      </p>
    </div>
  );
}
