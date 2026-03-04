import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from 'recharts';

interface ProfileItem {
  label: string;
  segment_pct: number;
  total_pct: number;
  index: number | null;
  is_significant: boolean;
  direction: string;
  type: string;
}

interface SegmentProfileData {
  items: ProfileItem[];
  segment_n: number;
  total_n: number;
  segment_pct: number;
}

interface Props {
  data: SegmentProfileData;
  title?: string;
}

const getIndexColor = (index: number | null): string => {
  if (!index) return '#94A3B8'; // gray
  if (index >= 120) return '#10B981'; // strong over-index (green)
  if (index >= 110) return '#6EE7B7'; // mild over-index (light green)
  if (index <= 80) return '#EF4444'; // strong under-index (red)
  if (index <= 90) return '#FCA5A5'; // mild under-index (light red)
  return '#94A3B8'; // neutral (gray)
};

export const SegmentProfileChart: React.FC<Props> = ({ data, title }) => {
  if (!data?.items?.length) {
    return <p className="text-sm text-muted-foreground">No significant differentiators found.</p>;
  }

  const chartData = data.items.map(item => ({
    name: item.label.length > 30 ? item.label.slice(0, 28) + '...' : item.label,
    fullName: item.label,
    segment: item.segment_pct,
    total: item.total_pct,
    index: item.index,
    significant: item.is_significant,
    direction: item.direction,
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[number] }> }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold mb-1">{d.fullName}</p>
        <p className="text-blue-600">Segment: {d.segment?.toFixed(1)}%</p>
        <p className="text-gray-500">Total: {d.total?.toFixed(1)}%</p>
        {d.index != null && (
          <p className={d.index >= 110 ? 'text-green-600' : d.index <= 90 ? 'text-red-600' : 'text-gray-600'}>
            Index: {d.index}
          </p>
        )}
        {d.significant && <p className="text-amber-600 font-medium mt-1">Statistically significant</p>}
      </div>
    );
  };

  return (
    <div className="w-full space-y-3">
      {title && <h3 className="text-sm font-semibold">{title}</h3>}
      <p className="text-xs text-muted-foreground">
        Segment: {data.segment_n} respondents ({data.segment_pct.toFixed(1)}% of total {data.total_n})
      </p>
      <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 'auto']} tickFormatter={(v) => `${v}%`} />
          <YAxis
            type="category"
            dataKey="name"
            width={180}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="segment" name="Segment" fill="#3B82F6" barSize={14}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={getIndexColor(entry.index)} />
            ))}
          </Bar>
          <Bar dataKey="total" name="Total" fill="#D1D5DB" barSize={14} />
        </BarChart>
      </ResponsiveContainer>

      {/* Index legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#10B981' }} /> Over-index (&ge;120)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#EF4444' }} /> Under-index (&le;80)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#94A3B8' }} /> Neutral
        </span>
      </div>
    </div>
  );
};
