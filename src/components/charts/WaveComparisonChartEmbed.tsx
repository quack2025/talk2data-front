import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
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

interface WaveComparisonChartEmbedProps {
  data: any;
}

export function WaveComparisonChartEmbed({ data }: WaveComparisonChartEmbedProps) {
  const { t } = useLanguage();
  const wavesT = (t as any).waves;

  if (!data || !data.waves) return null;

  const waveNames = data.waves.map((w: any) => w.wave_name);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm">
          {data.variable_label || data.variable}
        </span>
        <Badge variant="outline" className="text-xs font-normal">
          {data.analysis_type}
        </Badge>
      </div>

      {/* Warnings */}
      {data.warnings?.length > 0 && (
        <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded px-3 py-2 space-y-1">
          {data.warnings.map((w: string, i: number) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      )}

      {/* Line chart */}
      {data.trend_data?.length > 0 && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
              data={data.trend_data}
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
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {waveNames.map((name: string, i: number) => (
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
      {data.categories?.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                  {wavesT?.category || 'Categoría'}
                </th>
                {data.waves.map((w: any) => (
                  <th key={w.wave_id} className="text-right py-2 px-2 font-medium">
                    {w.wave_name}
                    <div className="text-[10px] text-muted-foreground font-normal">
                      n={w.sample_size}
                    </div>
                  </th>
                ))}
                {data.deltas?.length > 0 && (
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                    {wavesT?.delta || 'Δ'}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.categories.map((cat: string) => (
                <tr key={cat} className="border-b border-muted/50">
                  <td className="py-1.5 px-2 font-mono">{cat}</td>
                  {data.waves.map((w: any) => (
                    <td key={w.wave_id} className="text-right py-1.5 px-2">
                      {w.values[cat] !== undefined
                        ? data.analysis_type === 'frequency'
                          ? `${w.values[cat]}%`
                          : w.values[cat]
                        : '-'}
                    </td>
                  ))}
                  {data.deltas?.length > 0 && (
                    <td className="text-right py-1.5 px-2">
                      <DeltaIndicator
                        delta={data.deltas[data.deltas.length - 1]?.changes[cat]}
                        isPercentage={data.analysis_type === 'frequency'}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DeltaIndicator({
  delta,
  isPercentage,
}: {
  delta?: {
    value: number;
    direction: 'up' | 'down' | 'flat';
    p_value?: number | null;
    is_significant?: boolean;
    test_type?: string | null;
  };
  isPercentage?: boolean;
}) {
  if (!delta) return <span className="text-muted-foreground">-</span>;

  const Icon =
    delta.direction === 'up'
      ? TrendingUp
      : delta.direction === 'down'
      ? TrendingDown
      : Minus;

  const colorClass = delta.is_significant
    ? delta.direction === 'up'
      ? 'text-green-600 font-semibold'
      : delta.direction === 'down'
      ? 'text-red-600 font-semibold'
      : 'text-muted-foreground'
    : 'text-muted-foreground';

  const title = delta.p_value != null
    ? `p=${delta.p_value.toFixed(4)}${delta.test_type ? ` (${delta.test_type})` : ''}`
    : undefined;

  return (
    <span className={`inline-flex items-center gap-0.5 ${colorClass}`} title={title}>
      <Icon className="h-3 w-3" />
      {delta.value > 0 ? '+' : ''}
      {delta.value}
      {isPercentage ? 'pp' : ''}
      {delta.is_significant && <span className="text-[10px] ml-0.5">*</span>}
    </span>
  );
}
