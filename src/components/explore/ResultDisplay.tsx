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
                {((row.percent ?? row.pct ?? row.percentage ?? 0) as number).toFixed(1)}%
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

  // Crosstab / crosstab_with_significance — backend returns array of rows
  if (
    (analysisType === 'crosstab' || analysisType === 'crosstab_with_significance') &&
    data.table
  ) {
    const rows = data.table as Record<string, any>[];
    if (!rows.length) return <p className="text-sm text-muted-foreground">No data</p>;

    // Separate Total row from data rows
    const dataRows = rows.filter(r => r.row_value !== 'Total');
    const totalRow = rows.find(r => r.row_value === 'Total');

    // Column keys: everything except row_value and row_label
    const colKeys = Object.keys(rows[0]).filter(k => k !== 'row_value' && k !== 'row_label');

    // Map numeric codes to human-readable labels
    const colLabels: Record<string, string> = data.col_value_labels ?? {};

    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3 font-medium w-[40%]"></th>
            {colKeys.map(col => (
              <th key={col} className="text-right py-2 px-3 font-medium text-xs">
                {colLabels[col] ?? col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
              <td className="py-1.5 px-3 text-xs">{row.row_label}</td>
              {colKeys.map(col => {
                const cell = row[col];
                const pct = cell?.percentage ?? cell?.pct ?? (typeof cell === 'number' ? cell : null);
                const sig = cell?.sig ?? null;
                return (
                  <td key={col} className="text-right py-1.5 px-3 tabular-nums text-xs">
                    {typeof pct === 'number' ? pct.toFixed(1) + '%' : '-'}
                    {sig && (
                      <span className="text-[10px] text-primary ml-0.5 font-bold">{sig}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        {totalRow && (
          <tfoot>
            <tr className="border-t font-medium bg-muted/30">
              <td className="py-1.5 px-3 text-xs">Total (n)</td>
              {colKeys.map(col => {
                const cell = totalRow[col];
                return (
                  <td key={col} className="text-right py-1.5 px-3 tabular-nums text-xs">
                    {cell?.count ?? '-'}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        )}
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

  // Multiple Response Sets
  if (analysisType === 'multiple_response' && data.items) {
    const items = data.items as Record<string, any>[];
    return (
      <div className="space-y-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3 font-medium">
                {language === 'es' ? 'Item' : 'Item'}
              </th>
              <th className="text-right py-2 px-3 font-medium">n</th>
              <th className="text-right py-2 px-3 font-medium">% Resp.</th>
              <th className="text-right py-2 px-3 font-medium">% Ment.</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                <td className="py-1.5 px-3 text-xs">{item.label}</td>
                <td className="text-right py-1.5 px-3 tabular-nums">{item.count}</td>
                <td className="text-right py-1.5 px-3 tabular-nums">{item.pct_respondents?.toFixed(1)}%</td>
                <td className="text-right py-1.5 px-3 tabular-nums">{item.pct_mentions?.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-medium">
              <td className="py-1.5 px-3">{language === 'es' ? 'Total respondentes' : 'Total respondents'}</td>
              <td className="text-right py-1.5 px-3 tabular-nums">{data.total_respondents}</td>
              <td></td>
              <td></td>
            </tr>
            <tr className="font-medium text-muted-foreground">
              <td className="py-1.5 px-3">{language === 'es' ? 'Total menciones' : 'Total mentions'}</td>
              <td className="text-right py-1.5 px-3 tabular-nums">{data.total_mentions}</td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  // Regression
  if (analysisType === 'regression' && data.coefficients) {
    const coefficients = data.coefficients as Record<string, any>[];
    return (
      <div className="space-y-4">
        {/* Model summary */}
        <div className="grid grid-cols-4 gap-3 text-center text-sm">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-bold text-xs">{data.model_type === 'linear' ? 'R\u00B2' : 'Pseudo R\u00B2'}</p>
            <p className="text-lg tabular-nums">{(data.r_squared ?? data.pseudo_r_squared ?? 0).toFixed(4)}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-bold text-xs">AIC</p>
            <p className="text-lg tabular-nums">{data.aic?.toFixed(1)}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-bold text-xs">n</p>
            <p className="text-lg tabular-nums">{data.n_observations}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-bold text-xs">{data.model_type === 'linear' ? 'F' : 'LL'}</p>
            <p className="text-lg tabular-nums">{(data.f_statistic ?? data.log_likelihood ?? 0).toFixed(2)}</p>
          </div>
        </div>
        {/* Coefficients table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3 font-medium">{language === 'es' ? 'Variable' : 'Variable'}</th>
              <th className="text-right py-2 px-3 font-medium">Coef</th>
              <th className="text-right py-2 px-3 font-medium">SE</th>
              <th className="text-right py-2 px-3 font-medium">p</th>
              {data.model_type === 'linear' && <th className="text-right py-2 px-3 font-medium">VIF</th>}
              <th className="text-right py-2 px-3 font-medium">Sig</th>
            </tr>
          </thead>
          <tbody>
            {coefficients.map((c, i) => (
              <tr key={i} className={`border-b last:border-0 ${c.is_significant ? 'bg-green-50/50' : ''}`}>
                <td className="py-1.5 px-3 text-xs">{c.label}</td>
                <td className="text-right py-1.5 px-3 tabular-nums text-xs">{c.coefficient.toFixed(4)}</td>
                <td className="text-right py-1.5 px-3 tabular-nums text-xs">{c.std_error.toFixed(4)}</td>
                <td className="text-right py-1.5 px-3 tabular-nums text-xs">
                  {c.p_value < 0.001 ? '<.001' : c.p_value.toFixed(3)}
                </td>
                {data.model_type === 'linear' && (
                  <td className={`text-right py-1.5 px-3 tabular-nums text-xs ${c.vif > 10 ? 'text-red-600 font-bold' : ''}`}>
                    {c.vif?.toFixed(1) ?? '-'}
                  </td>
                )}
                <td className="text-right py-1.5 px-3 text-xs">
                  {c.p_value < 0.001 ? '***' : c.p_value < 0.01 ? '**' : c.p_value < 0.05 ? '*' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.warnings && data.warnings.length > 0 && (
          <div className="space-y-1">
            {data.warnings.map((w: string, i: number) => (
              <p key={i} className="text-xs text-amber-600">{w}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Factor Analysis
  if (analysisType === 'factor_analysis' && data.loadings) {
    const loadings = data.loadings as Record<string, any>[];
    const explained = data.explained_variance as Record<string, any>[];
    const factorKeys = Object.keys(loadings[0] || {}).filter((k) => k.startsWith('factor_'));
    return (
      <div className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          {data.kmo != null && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-bold text-xs">KMO</p>
              <p className={`text-lg tabular-nums ${data.kmo < 0.6 ? 'text-red-500' : 'text-green-600'}`}>
                {data.kmo.toFixed(3)}
              </p>
            </div>
          )}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-bold text-xs">{language === 'es' ? 'Factores' : 'Factors'}</p>
            <p className="text-lg tabular-nums">{data.n_factors}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-bold text-xs">{language === 'es' ? 'Var. Expl.' : 'Var. Expl.'}</p>
            <p className="text-lg tabular-nums">{data.total_variance_explained?.toFixed(1)}%</p>
          </div>
        </div>
        {/* Variance explained */}
        {explained && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1 px-3 text-xs font-medium">Factor</th>
                <th className="text-right py-1 px-3 text-xs font-medium">Eigenvalue</th>
                <th className="text-right py-1 px-3 text-xs font-medium">% Var</th>
                <th className="text-right py-1 px-3 text-xs font-medium">% Cum</th>
              </tr>
            </thead>
            <tbody>
              {explained.map((e, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-1 px-3 text-xs">{e.factor}</td>
                  <td className="text-right py-1 px-3 tabular-nums text-xs">{e.eigenvalue?.toFixed(3)}</td>
                  <td className="text-right py-1 px-3 tabular-nums text-xs">{e.variance_pct?.toFixed(1)}%</td>
                  <td className="text-right py-1 px-3 tabular-nums text-xs">{e.cumulative_pct?.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* Loadings matrix */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3 font-medium text-xs">{language === 'es' ? 'Variable' : 'Variable'}</th>
              {factorKeys.map((k) => (
                <th key={k} className="text-right py-2 px-3 font-medium text-xs">
                  {k.replace('factor_', 'F')}
                </th>
              ))}
              <th className="text-right py-2 px-3 font-medium text-xs">h2</th>
            </tr>
          </thead>
          <tbody>
            {loadings.map((row, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-1 px-3 text-xs truncate max-w-[200px]" title={row.label}>{row.label}</td>
                {factorKeys.map((k) => {
                  const val = row[k] as number;
                  const abs = Math.abs(val);
                  return (
                    <td
                      key={k}
                      className={`text-right py-1 px-3 tabular-nums text-xs ${
                        abs >= 0.5 ? 'font-bold text-primary' :
                        abs >= 0.3 ? 'font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      {val.toFixed(3)}
                    </td>
                  );
                })}
                <td className="text-right py-1 px-3 tabular-nums text-xs">{row.communality?.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.warnings && data.warnings.length > 0 && (
          <div className="space-y-1">
            {data.warnings.map((w: string, i: number) => (
              <p key={i} className="text-xs text-amber-600">{w}</p>
            ))}
          </div>
        )}
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
