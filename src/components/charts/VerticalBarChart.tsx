import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, CartesianGrid } from 'recharts';
import { getChartColor } from '@/lib/chartColors';

interface VerticalBarChartProps {
  data: {
    labels: string[];
    values: number[];
    percentages?: number[];
    colors?: string[];
  };
  title?: string;
  showPercentages?: boolean;
}

export function VerticalBarChart({ data, title, showPercentages = true }: VerticalBarChartProps) {
  const chartData = data.labels.map((label, index) => ({
    name: label.length > 15 ? label.substring(0, 12) + '...' : label,
    fullName: label,
    value: data.values[index],
    percentage: data.percentages?.[index] ?? 0,
    color: data.colors?.[index] ?? getChartColor(index),
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          margin={{ top: 30, right: 20, left: 20, bottom: 20 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false}
            stroke="hsl(var(--border))"
            opacity={0.5}
          />
          <XAxis 
            type="category" 
            dataKey="name"
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            type="number"
            tickFormatter={(value) => showPercentages ? `${value}%` : value.toLocaleString()}
            domain={showPercentages ? [0, 100] : [0, 'auto']}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip 
            formatter={(value: number, name: string, props) => [
              showPercentages 
                ? `${props.payload.percentage.toFixed(1)}% (${props.payload.value.toLocaleString()})`
                : value.toLocaleString(),
              props.payload.fullName
            ]}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
            itemStyle={{ color: 'hsl(var(--foreground))' }}
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
          />
          <Bar 
            dataKey={showPercentages ? "percentage" : "value"} 
            radius={[4, 4, 0, 0]}
            barSize={40}
            animationBegin={0}
            animationDuration={600}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList 
              dataKey={showPercentages ? "percentage" : "value"}
              position="top" 
              formatter={(value: number) => showPercentages ? `${value.toFixed(1)}%` : value.toLocaleString()}
              style={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
