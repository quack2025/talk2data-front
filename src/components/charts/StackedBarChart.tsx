import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getChartColor } from '@/lib/chartColors';

interface StackedBarChartProps {
  data: {
    categories: string[];
    series: Array<{
      name: string;
      values: number[];
    }>;
    colors?: string[];
  };
  title?: string;
}

export function StackedBarChart({ data, title }: StackedBarChartProps) {
  if (!data?.categories?.length || !data?.series?.length) return null;

  // Transform data for Recharts
  const chartData = data.categories.map((cat, i) => {
    const entry: Record<string, string | number> = { name: cat };
    data.series.forEach((s) => {
      entry[s.name] = s.values[i] ?? 0;
    });
    return entry;
  });

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 10, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(value: number) => `${value}%`}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {data.series.map((s, i) => (
            <Bar
              key={s.name}
              dataKey={s.name}
              stackId="a"
              fill={data.colors?.[i] ?? getChartColor(i)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
