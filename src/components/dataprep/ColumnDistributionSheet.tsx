import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ColumnDistributionResponse } from '@/hooks/useDataTable';

interface ColumnDistributionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ColumnDistributionResponse | null;
  isLoading: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.8)',
  'hsl(var(--primary) / 0.6)',
  'hsl(var(--primary) / 0.4)',
];

export function ColumnDistributionSheet({ open, onOpenChange, data, isLoading }: ColumnDistributionSheetProps) {
  const { t } = useLanguage();
  const dt = (t.dataPrep as Record<string, unknown>).dataTab as Record<string, string> | undefined;

  const chartData = data?.distribution.map((d) => ({
    name: d.label || String(d.value),
    value: d.value,
    count: d.count,
    pct: d.percentage,
  })) || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {data?.column}
            {data?.label && (
              <span className="text-sm font-normal text-muted-foreground">({data.label})</span>
            )}
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="space-y-6 mt-4">
            <Badge variant="secondary">
              n = {data.total}
            </Badge>

            {/* Bar chart */}
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `${v}%`} domain={[0, 'auto']} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={75}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number, _name: string, props: { payload: { count: number } }) => [
                      `${value.toFixed(1)}% (n=${props.payload.count})`,
                      '',
                    ]}
                  />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                    {chartData.map((_entry, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Frequency table */}
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-3 py-2 font-medium">{dt?.value || 'Value'}</th>
                    <th className="px-3 py-2 font-medium">{dt?.label || 'Label'}</th>
                    <th className="px-3 py-2 font-medium text-right">{dt?.count || 'Count'}</th>
                    <th className="px-3 py-2 font-medium text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.distribution.map((d, i) => (
                    <tr key={i} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                      <td className="px-3 py-1.5 font-mono text-xs">{String(d.value)}</td>
                      <td className="px-3 py-1.5">{d.label}</td>
                      <td className="px-3 py-1.5 text-right">{d.count.toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-right">{d.percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm py-8 text-center">
            {dt?.noData || 'No data available'}
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
