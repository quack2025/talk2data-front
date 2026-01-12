import { LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { getChartColor } from '@/lib/chartColors';

interface LineChartProps {
  data: {
    labels: string[];
    values: number[];
    percentages?: number[];
    colors?: string[];
  };
  title?: string;
  showPercentages?: boolean;
}

export function LineChart({ data, title, showPercentages = false }: LineChartProps) {
  const chartData = data.labels.map((label, index) => ({
    name: label,
    value: data.values[index],
    percentage: data.percentages?.[index] ?? 0,
  }));

  const lineColor = data.colors?.[0] ?? getChartColor(0);

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart 
          data={chartData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))"
            opacity={0.5}
          />
          <XAxis 
            dataKey="name"
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            tickFormatter={(value) => showPercentages ? `${value}%` : value.toLocaleString()}
            domain={showPercentages ? [0, 100] : ['auto', 'auto']}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip 
            formatter={(value: number, name: string, props) => [
              showPercentages 
                ? `${props.payload.percentage.toFixed(1)}%`
                : value.toLocaleString(),
              title || 'Value'
            ]}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
            itemStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Line 
            type="monotone"
            dataKey={showPercentages ? "percentage" : "value"}
            stroke={lineColor}
            strokeWidth={3}
            dot={{ fill: lineColor, strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, strokeWidth: 0 }}
            animationBegin={0}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
