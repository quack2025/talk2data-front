import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowDown, ArrowRight, Columns3 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { DataPrepPreviewResponse } from '@/types/dataPrep';

interface DataPrepPreviewProps {
  preview: DataPrepPreviewResponse;
}

export function DataPrepPreview({ preview }: DataPrepPreviewProps) {
  const { t } = useLanguage();
  const dp = t.dataPrep;

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold">{preview.original_rows.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{dp?.originalRows || 'Filas originales'}</p>
          </div>
          <div className="space-y-1 flex flex-col items-center">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <Badge variant={preview.rows_affected > 0 ? 'secondary' : 'outline'} className="text-xs">
              {preview.rows_affected.toLocaleString()} {dp?.rowsAffected || 'afectadas'}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{preview.final_rows.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{dp?.finalRows || 'Filas finales'}</p>
          </div>
        </div>

        {/* Columns added */}
        {preview.columns_added.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Columns3 className="h-3.5 w-3.5" />
              {dp?.columnsAdded || 'Columnas agregadas'}
            </div>
            <div className="flex flex-wrap gap-1">
              {preview.columns_added.map((col) => (
                <Badge key={col} variant="outline" className="text-xs font-mono">
                  {col}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {preview.warnings.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              {dp?.warnings || 'Advertencias'} ({preview.warnings.length})
            </div>
            <ul className="space-y-1">
              {preview.warnings.map((w, i) => (
                <li key={i} className="text-xs text-muted-foreground bg-destructive/10 rounded px-2 py-1">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weight summary */}
        {preview.weight_summary && Object.keys(preview.weight_summary).length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ArrowDown className="h-3.5 w-3.5" />
              {dp?.weightSummary || 'Resumen de ponderación'}
            </div>
            <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-32">
              {JSON.stringify(preview.weight_summary, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
