import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface NpsGaugeProps {
  data: {
    labels: string[];
    values: number[];
    percentages?: number[];
    colors?: string[];
    nps_score?: number;
    interpretation?: string;
  };
  title?: string;
}

export function NpsGauge({ data, title }: NpsGaugeProps) {
  // NPS is typically calculated as: % Promoters - % Detractors
  // Data should come as: [Detractors, Passives, Promoters] or just NPS score in values[0]
  
  let npsScore: number;
  let detractors = 0;
  let passives = 0;
  let promoters = 0;
  
  if (data.percentages && data.percentages.length >= 3) {
    // Use pre-computed percentages from backend
    detractors = data.percentages[0] ?? 0;
    passives = data.percentages[1] ?? 0;
    promoters = data.percentages[2] ?? 0;
    npsScore = data.nps_score != null ? Math.round(data.nps_score) : Math.round(promoters - detractors);
  } else if (data.labels.length >= 3) {
    // Fallback: calculate NPS from count values
    const total = data.values.reduce((a, b) => a + b, 0);
    if (total > 0) {
      detractors = (data.values[0] / total) * 100;
      passives = (data.values[1] / total) * 100;
      promoters = (data.values[2] / total) * 100;
    }
    npsScore = data.nps_score != null ? Math.round(data.nps_score) : Math.round(promoters - detractors);
  } else {
    // NPS score provided directly
    npsScore = data.values[0];
    // Estimate segments for visualization (simplified)
    promoters = Math.max(0, (npsScore + 100) / 2);
    detractors = Math.max(0, 100 - promoters);
    passives = 0;
  }

  // Create gauge data (semi-circle)
  const gaugeData = [
    { name: 'Score', value: npsScore + 100 }, // Normalize to 0-200 range
    { name: 'Remaining', value: 200 - (npsScore + 100) },
  ];

  // NPS color based on score
  const getNpsColor = (score: number) => {
    if (score >= 50) return '#10B981'; // Excellent - Green
    if (score >= 30) return '#3B82F6'; // Great - Blue  
    if (score >= 0) return '#F59E0B';  // Good - Amber
    return '#EF4444';                   // Needs work - Red
  };

  const getNpsLabel = (score: number) => {
    if (score >= 50) return 'Excelente';
    if (score >= 30) return 'Muy bueno';
    if (score >= 0) return 'Bueno';
    return 'Mejorable';
  };

  const npsColor = getNpsColor(npsScore);

  // Segment breakdown data
  const segmentData = [
    { name: 'Detractores', value: detractors, color: '#EF4444' },
    { name: 'Pasivos', value: passives, color: '#F59E0B' },
    { name: 'Promotores', value: promoters, color: '#10B981' },
  ];

  return (
    <div className="w-full">
      <div className="relative h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Background arc */}
            <Pie
              data={[{ value: 200 }]}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius={80}
              outerRadius={100}
              dataKey="value"
              stroke="none"
            >
              <Cell fill="hsl(var(--muted))" />
            </Pie>
            {/* Score arc */}
            <Pie
              data={gaugeData}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius={80}
              outerRadius={100}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              <Cell fill={npsColor} />
              <Cell fill="transparent" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
          <span 
            className="text-5xl font-bold"
            style={{ color: npsColor }}
          >
            {npsScore > 0 ? '+' : ''}{npsScore}
          </span>
          <span className="text-sm text-muted-foreground mt-1">
            {getNpsLabel(npsScore)}
          </span>
        </div>

        {/* Scale labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-8 text-xs text-muted-foreground">
          <span>-100</span>
          <span>0</span>
          <span>+100</span>
        </div>
      </div>

      {/* Segment breakdown */}
      {data.labels.length >= 3 && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          {segmentData.map((segment, index) => (
            <div 
              key={segment.name}
              className="text-center p-3 rounded-lg bg-muted/50"
            >
              <div 
                className="text-2xl font-bold"
                style={{ color: segment.color }}
              >
                {(isNaN(segment.value) ? 0 : segment.value).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {segment.name}
              </div>
              <div className="text-sm font-medium">
                {data.values[index]?.toLocaleString() ?? 0}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
