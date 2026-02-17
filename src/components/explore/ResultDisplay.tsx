import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Download, Bookmark, Code, AlertTriangle, Clock, Users, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { ExploreRunResponse, ExploreRunRequest } from '@/types/explore';

interface ResultDisplayProps {
  result: ExploreRunResponse;
  currentRequest: ExploreRunRequest | null;
  onExport: () => void;
  onBookmark: () => void;
}

export function ResultDisplay({
  result,
  currentRequest,
  onExport,
  onBookmark,
}: ResultDisplayProps) {
  const { t, language } = useLanguage();
  const [showCode, setShowCode] = useState(false);

  if (!result.success && result.error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{result.error}</AlertDescription>
      </Alert>
    );
  }

  const data = result.result;
  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              {result.variable_label || result.variable}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {result.analysis_type}
            </Badge>
            {result.cross_variable && (
              <span className="text-xs text-muted-foreground">
                x {result.cross_variable_label || result.cross_variable}
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-3.5 w-3.5 mr-1" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={onBookmark}>
              <Bookmark className="h-3.5 w-3.5 mr-1" />
              {t.explore?.saveBookmark || 'Guardar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div className="space-y-1">
            {result.warnings.map((w, i) => (
              <Alert key={i} className="py-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                <AlertDescription className="text-xs">{w}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Result Table */}
        <div className="overflow-x-auto">
          <ResultTable analysisType={result.analysis_type} data={data} language={language} />
        </div>

        {/* Footer: metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          {result.sample_size != null && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              n={result.sample_size.toLocaleString()}
            </span>
          )}
          {result.execution_time_ms > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {result.execution_time_ms}ms
            </span>
          )}

          {result.python_code && (
            <Collapsible open={showCode} onOpenChange={setShowCode}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 px-2">
                  <Code className="h-3 w-3" />
                  Python
                  <ChevronDown className={`h-3 w-3 transition-transform ${showCode ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="absolute z-10 mt-1 w-[500px]">
                <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto border">
                  {result.python_code}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Render the result based on analysis type */
function ResultTable({
  analysisType,
  data,
  language,
}: {
  analysisType: string;
  data: Record<string, any>;
  language: string;
}) {
  // Frequency table
  if (analysisType === 'frequency' && data.frequencies) {
    const freqs = data.frequencies as Record<string, any>[];
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3 font-medium">
              {language === 'es' ? 'Valor' : 'Value'}
            </th>
            <th className="text-right py-2 px-3 font-medium">n</th>
            <th className="text-right py-2 px-3 font-medium">%</th>
          </tr>
        </thead>
        <tbody>
          {freqs.map((row, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
              <td className="py-1.5 px-3">{row.label ?? row.value ?? row.category}</td>
              <td className="text-right py-1.5 px-3 tabular-nums">{row.count ?? row.n}</td>
              <td className="text-right py-1.5 px-3 tabular-nums">
                {((row.percent ?? row.pct ?? 0) as number).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
        {data.total != null && (
          <tfoot>
            <tr className="border-t font-medium">
              <td className="py-1.5 px-3">Total</td>
              <td className="text-right py-1.5 px-3 tabular-nums">{data.total}</td>
              <td className="text-right py-1.5 px-3 tabular-nums">100.0%</td>
            </tr>
          </tfoot>
        )}
      </table>
    );
  }

  // Crosstab / crosstab_with_significance
  if (
    (analysisType === 'crosstab' || analysisType === 'crosstab_with_significance') &&
    data.table
  ) {
    const table = data.table as Record<string, Record<string, any>>;
    const rowKeys = Object.keys(table);
    const colKeys = rowKeys.length > 0 ? Object.keys(table[rowKeys[0]]) : [];

    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3 font-medium"></th>
            {colKeys.map((col) => (
              <th key={col} className="text-right py-2 px-3 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowKeys.map((row) => (
            <tr key={row} className="border-b last:border-0 hover:bg-muted/50">
              <td className="py-1.5 px-3 font-medium">{row}</td>
              {colKeys.map((col) => {
                const cell = table[row][col];
                const value = typeof cell === 'object' ? cell?.pct ?? cell?.value : cell;
                const sig = typeof cell === 'object' ? cell?.sig : null;
                return (
                  <td key={col} className="text-right py-1.5 px-3 tabular-nums">
                    {typeof value === 'number' ? value.toFixed(1) : value}
                    {sig && (
                      <span className="text-[10px] text-primary ml-0.5 font-bold">
                        {sig}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // Mean / compare_means
  if ((analysisType === 'mean' || analysisType === 'compare_means') && (data.mean != null || data.groups)) {
    if (data.groups) {
      const groups = data.groups as Record<string, any>[];
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3 font-medium">
                {language === 'es' ? 'Grupo' : 'Group'}
              </th>
              <th className="text-right py-2 px-3 font-medium">
                {language === 'es' ? 'Media' : 'Mean'}
              </th>
              <th className="text-right py-2 px-3 font-medium">Std</th>
              <th className="text-right py-2 px-3 font-medium">n</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                <td className="py-1.5 px-3">{g.group ?? g.label ?? g.category}</td>
                <td className="text-right py-1.5 px-3 tabular-nums">
                  {(g.mean as number).toFixed(2)}
                </td>
                <td className="text-right py-1.5 px-3 tabular-nums">
                  {(g.std as number).toFixed(2)}
                </td>
                <td className="text-right py-1.5 px-3 tabular-nums">{g.n ?? g.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    // Single mean
    return (
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-2xl font-bold tabular-nums">{(data.mean as number).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{language === 'es' ? 'Media' : 'Mean'}</p>
        </div>
        {data.std != null && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold tabular-nums">{(data.std as number).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Std Dev</p>
          </div>
        )}
        {data.n != null && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold tabular-nums">{data.n}</p>
            <p className="text-xs text-muted-foreground">n</p>
          </div>
        )}
      </div>
    );
  }

  // NPS
  if (analysisType === 'nps' && data.nps_score != null) {
    return (
      <div className="space-y-4">
        <div className="text-center p-6 bg-muted/50 rounded-lg">
          <p className="text-4xl font-bold tabular-nums">{(data.nps_score as number).toFixed(0)}</p>
          <p className="text-sm text-muted-foreground">NPS Score</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="font-bold text-red-700">{(data.detractors_pct as number)?.toFixed(1)}%</p>
            <p className="text-xs text-red-600">{language === 'es' ? 'Detractores' : 'Detractors'}</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="font-bold text-yellow-700">{(data.passives_pct as number)?.toFixed(1)}%</p>
            <p className="text-xs text-yellow-600">{language === 'es' ? 'Pasivos' : 'Passives'}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="font-bold text-green-700">{(data.promoters_pct as number)?.toFixed(1)}%</p>
            <p className="text-xs text-green-600">{language === 'es' ? 'Promotores' : 'Promoters'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: render as JSON
  return (
    <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto max-h-96">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
