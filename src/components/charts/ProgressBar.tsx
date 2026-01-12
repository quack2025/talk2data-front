interface ProgressBarProps {
  value: number;
  color?: string;
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ 
  value, 
  color = 'hsl(var(--primary))', 
  showLabel = true,
  className = '' 
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(value, 0), 100);
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium w-12 text-right tabular-nums">
          {percentage.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
