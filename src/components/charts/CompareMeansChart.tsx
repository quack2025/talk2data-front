import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ErrorBar,
  ReferenceLine,
} from 'recharts';
import { getChartColor } from '@/lib/chartColors';

interface CompareMeansChartProps {
  data: {
    labels: string[];
    values: number[];
    colors?: string[];
    error_bars?: number[];
  };
  title?: string;
}

export function CompareMeansChart({ data, title }: CompareMeansChartProps) {
  const chartData = data.labels.map((label, index) => ({
    name: label,
    mean: data.values[index],
    errorBar: data.error_bars?.[index] ?? 0,
    color: data.colors?.[index] ?? getChartColor(index),
  }));

  // Calculate overall mean for reference line
  const overallMean =
    data.values.length > 0
      ? data.values.reduce((sum, v) => sum + v, 0) / data.values.length
      : 0;

  // Calculate left margin based on longest label
  const maxLabelLength = Math.max(...data.labels.map((l) => l.length));
  const leftMargin = Math.min(Math.max(maxLabelLength * 6, 80), 180);

  // Determine Y axis domain from data range
  const allMin = Math.min(
    ...data.values.map((v, i) => v - (data.error_bars?.[i] ?? 0))
  );
  const allMax = Math.max(
    ...data.values.map((v, i) => v + (data.error_bars?.[i] ?? 0))
  );
  const padding = (allMax - allMin) * 0.15 || 1;
  const domainMin = Math.max(0, Math.floor(allMin - padding));
  const domainMax = Math.ceil(allMax + padding);

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 50, left: leftMargin, bottom: 10 }}
        >
          <XAxis
            type="number"
            domain={[domainMin, domainMax]}
            tickFormatter={(value) => value.toFixed(1)}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={leftMargin - 10}
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number, _name: string, props: { payload: { errorBar: number } }) => {
              const stdDev = props.payload.errorBar;
              return [
                `${value.toFixed(2)} ± ${stdDev.toFixed(2)}`,
                'Mean ± SD',
              ];
            }}
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
          <ReferenceLine
            x={overallMean}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="3 3"
            label={{
              value: `Avg: ${overallMean.toFixed(2)}`,
              position: 'top',
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 11,
            }}
          />
          <Bar dataKey="mean" barSize={24} radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
            <ErrorBar
              dataKey="errorBar"
              width={6}
              stroke="hsl(var(--foreground))"
              strokeWidth={1.5}
              direction="x"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
