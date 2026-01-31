import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getChartColor } from '@/lib/chartColors';
import { useLanguage } from '@/i18n/LanguageContext';
import type { WaveComparisonResult } from '@/types/waves';

interface WaveComparisonChartProps {
  result: WaveComparisonResult;
  onClose: () => void;
}

export function WaveComparisonChart({
  result,
  onClose,
}: WaveComparisonChartProps) {
  const { t } = useLanguage();
  const wavesT = t.waves;

  const waveNames = result.waves.map((w) => w.wave_name);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {result.variable_label || result.variable}
            <Badge variant="outline" className="text-xs font-normal">
              {result.analysis_type}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded px-3 py-2 space-y-1">
            {result.warnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
          </div>
        )}

        {/* Line chart */}
        {result.trend_data.length > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={result.trend_data}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {waveNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={getChartColor(i)}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Data table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                  {wavesT?.category || 'Categoría'}
                </th>
                {result.waves.map((w) => (
                  <th
                    key={w.wave_id}
                    className="text-right py-2 px-2 font-medium"
                  >
                    {w.wave_name}
                    <div className="text-[10px] text-muted-foreground font-normal">
                      n={w.sample_size}
                    </div>
                  </th>
                ))}
                {result.deltas && result.deltas.length > 0 && (
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                    {wavesT?.delta || 'Δ'}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {result.categories.map((cat) => (
                <tr key={cat} className="border-b border-muted/50">
                  <td className="py-1.5 px-2 font-mono">{cat}</td>
                  {result.waves.map((w) => (
                    <td key={w.wave_id} className="text-right py-1.5 px-2">
                      {w.values[cat] !== undefined
                        ? result.analysis_type === 'frequency'
                          ? `${w.values[cat]}%`
                          : w.values[cat]
                        : '-'}
                    </td>
                  ))}
                  {result.deltas && result.deltas.length > 0 && (
                    <td className="text-right py-1.5 px-2">
                      <DeltaIndicator
                        delta={
                          result.deltas[result.deltas.length - 1]?.changes[cat]
                        }
                        isPercentage={result.analysis_type === 'frequency'}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function DeltaIndicator({
  delta,
  isPercentage,
}: {
  delta?: { value: number; direction: 'up' | 'down' | 'flat' };
  isPercentage?: boolean;
}) {
  if (!delta) return <span className="text-muted-foreground">-</span>;

  const Icon =
    delta.direction === 'up'
      ? TrendingUp
      : delta.direction === 'down'
      ? TrendingDown
      : Minus;

  const colorClass =
    delta.direction === 'up'
      ? 'text-green-600'
      : delta.direction === 'down'
      ? 'text-red-600'
      : 'text-muted-foreground';

  return (
    <span className={`inline-flex items-center gap-0.5 ${colorClass}`}>
      <Icon className="h-3 w-3" />
      {delta.value > 0 ? '+' : ''}
      {delta.value}
      {isPercentage ? 'pp' : ''}
    </span>
  );
}
