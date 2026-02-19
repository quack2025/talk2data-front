import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Segment } from '@/types/segments';

interface SegmentSelectorProps {
  segments: Segment[];
  value: string | null;
  onChange: (segmentId: string | null) => void;
  compact?: boolean;
}

const NO_SEGMENT = '__none__';

export function SegmentSelector({
  segments,
  value,
  onChange,
  compact = false,
}: SegmentSelectorProps) {
  const { t } = useLanguage();
  const seg = t.segments;

  const activeSegments = segments.filter((s) => s.is_active);

  if (activeSegments.length === 0) return null;

  return (
    <div className={compact ? 'flex items-center gap-2' : 'flex items-center gap-2'}>
      <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <Select
        value={value || NO_SEGMENT}
        onValueChange={(v) => onChange(v === NO_SEGMENT ? null : v)}
      >
        <SelectTrigger className={compact ? 'h-8 text-xs w-[200px]' : 'h-9 text-sm w-[240px]'}>
          <SelectValue placeholder={seg?.noSegment ?? 'No segment'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_SEGMENT} className="text-xs">
            {seg?.noSegment ?? 'No segment (all data)'}
          </SelectItem>
          {activeSegments.map((s) => (
            <SelectItem key={s.id} value={s.id} className="text-xs">
              <span className="flex items-center gap-2">
                {s.name}
                <Badge variant="secondary" className="text-[10px] h-4 px-1">
                  {s.conditions?.conditions?.length ?? 0}
                </Badge>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
