import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { getChartColor } from '@/lib/chartColors';

interface HorizontalBarChartProps {
  data: {
    labels: string[];
    values: number[];
    percentages?: number[];
    colors?: string[];
  };
  title?: string;
  showPercentages?: boolean;
}

export function HorizontalBarChart({ data, title, showPercentages = true }: HorizontalBarChartProps) {
  const chartData = data.labels.map((label, index) => ({
    name: label,
    value: data.values[index],
    percentage: data.percentages?.[index] ?? 0,
    color: data.colors?.[index] ?? getChartColor(index),
  }));

  // Calculate left margin based on longest label
  const maxLabelLength = Math.max(...data.labels.map(l => l.length));
  const leftMargin = Math.min(Math.max(maxLabelLength * 6, 80), 180);

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          layout="vertical"
          margin={{ top: 10, right: 60, left: leftMargin, bottom: 10 }}
        >
          <XAxis 
            type="number" 
            tickFormatter={(value) => showPercentages ? `${value}%` : value.toLocaleString()}
            domain={showPercentages ? [0, 100] : [0, 'auto']}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={leftMargin - 10}
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            formatter={(value: number | undefined, name: string, props) => {
              if (value === undefined || !props?.payload) return ['', ''];
              const payload = props.payload;
              return [
                showPercentages 
                  ? `${(payload.percentage ?? 0).toFixed(1)}% (${(payload.value ?? 0).toLocaleString()})`
                  : (value ?? 0).toLocaleString(),
                ''
              ];
            }}
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
            radius={[0, 4, 4, 0]}
            barSize={24}
            animationBegin={0}
            animationDuration={600}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList 
              dataKey={showPercentages ? "percentage" : "value"}
              position="right" 
              formatter={(value: number | undefined) => {
                if (value === undefined || value === null) return '';
                return showPercentages ? `${value.toFixed(1)}%` : value.toLocaleString();
              }}
              style={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
