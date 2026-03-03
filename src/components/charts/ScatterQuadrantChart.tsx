import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

interface ScatterQuadrantChartProps {
  data: {
    points: Array<{
      label: string;
      x: number;
      y: number;
      quadrant: string;
      gap: number;
    }>;
    x_label: string;
    y_label: string;
    x_threshold: number;
    y_threshold: number;
  };
  title?: string;
}

export function ScatterQuadrantChart({ data, title }: ScatterQuadrantChartProps) {
  if (!data?.points?.length) return null;

  const QUADRANT_COLORS: Record<string, string> = {
    'High - Concentrate Here': '#EF4444',
    'Maintain - Keep Up Good Work': '#10B981',
    'Low Priority': '#94A3B8',
    'Review - Possible Overkill': '#F59E0B',
  };

  const getPointColor = (quadrant: string) =>
    QUADRANT_COLORS[quadrant] || '#6366F1';

  // Calculate domain with padding
  const xVals = data.points.map(p => p.x);
  const yVals = data.points.map(p => p.y);
  const xPad = (Math.max(...xVals) - Math.min(...xVals)) * 0.15 || 0.5;
  const yPad = (Math.max(...yVals) - Math.min(...yVals)) * 0.15 || 0.5;

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            type="number"
            dataKey="x"
            name={data.x_label}
            tick={{ fontSize: 11 }}
            domain={[Math.min(...xVals) - xPad, Math.max(...xVals) + xPad]}
            label={{ value: data.x_label, position: 'insideBottom', offset: -10, fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={data.y_label}
            tick={{ fontSize: 11 }}
            domain={[Math.min(...yVals) - yPad, Math.max(...yVals) + yPad]}
            label={{ value: data.y_label, angle: -90, position: 'insideLeft', offset: 0, fontSize: 12 }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload;
              return (
                <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
                  <p className="font-semibold">{point.label}</p>
                  <p>{data.y_label}: {point.y}</p>
                  <p>{data.x_label}: {point.x}</p>
                  <p>Gap: {point.gap > 0 ? '+' : ''}{point.gap}</p>
                  <p className="text-xs text-muted-foreground mt-1">{point.quadrant}</p>
                </div>
              );
            }}
          />
          {/* Quadrant reference lines */}
          <ReferenceLine
            x={data.x_threshold}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="5 5"
            strokeWidth={1.5}
          />
          <ReferenceLine
            y={data.y_threshold}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="5 5"
            strokeWidth={1.5}
          />
          <Scatter data={data.points} fill="#6366F1">
            {data.points.map((point, index) => (
              <Cell key={index} fill={getPointColor(point.quadrant)} />
            ))}
            <LabelList
              dataKey="label"
              position="top"
              offset={10}
              style={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
            />
          </Scatter>
        </RechartsScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
