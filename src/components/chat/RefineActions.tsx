import { Button } from '@/components/ui/button';
import {
  BarChart3,
  GitCompare,
  ArrowRightLeft,
  TableIcon,
  Columns,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { FilterPopover } from './FilterPopover';
import type { Message, RefinementAction } from '@/types/database';

interface RefineActionsProps {
  message: Message;
  onRefine: (action: RefinementAction, params: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function RefineActions({ message, onRefine, disabled = false }: RefineActionsProps) {
  const { t } = useLanguage();
  const refineT = t.refine;

  // Determine what kind of analysis was performed
  const analyses = message.analysis_executed;
  const analysisTypes = new Set<string>();

  if (Array.isArray(analyses)) {
    for (const a of analyses) {
      const meta = (a as Record<string, any>)?.analysis_metadata;
      if (meta?.analysis_type) {
        analysisTypes.add(meta.analysis_type);
      }
    }
  }

  const hasFrequency = analysisTypes.has('frequency');
  const hasCrosstab = analysisTypes.has('crosstab') || analysisTypes.has('crosstab_with_significance');
  const hasCompareMeans = analysisTypes.has('compare_means');
  const hasAnyAnalysis = analysisTypes.size > 0;

  if (!hasAnyAnalysis) return null;

  const buttons: {
    action: RefinementAction;
    label: string;
    icon: React.ReactNode;
    show: boolean;
    params?: Record<string, unknown>;
  }[] = [
    {
      action: 'add_significance',
      label: refineT?.addSignificance || 'Agregar significancia',
      icon: <GitCompare className="h-3 w-3" />,
      show: hasCrosstab && !analysisTypes.has('crosstab_with_significance'),
    },
    {
      action: 'add_crosstab',
      label: refineT?.addCrosstab || 'Cruzar con otra variable',
      icon: <TableIcon className="h-3 w-3" />,
      show: hasFrequency,
    },
    {
      action: 'change_analysis_type',
      label: refineT?.changeToFrequency || 'Ver frecuencias',
      icon: <BarChart3 className="h-3 w-3" />,
      show: !hasFrequency && (hasCrosstab || hasCompareMeans),
      params: { new_analysis_type: 'frequency' },
    },
    {
      action: 'change_analysis_type',
      label: refineT?.changeToCrosstab || 'Ver tabla cruzada',
      icon: <ArrowRightLeft className="h-3 w-3" />,
      show: hasFrequency && !hasCrosstab,
      params: { new_analysis_type: 'crosstab' },
    },
    {
      action: 'change_banner',
      label: refineT?.changeBanner || 'Cambiar banner',
      icon: <Columns className="h-3 w-3" />,
      show: hasCrosstab,
    },
  ];

  const visibleButtons = buttons.filter((b) => b.show);

  // Always show filter popover if there's any analysis
  const showFilter = hasAnyAnalysis;

  if (visibleButtons.length === 0 && !showFilter) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {visibleButtons.map((btn, i) => (
        <Button
          key={`${btn.action}-${i}`}
          variant="ghost"
          size="sm"
          className="h-6 gap-1 text-[11px] px-2 text-muted-foreground hover:text-foreground"
          onClick={() => onRefine(btn.action, btn.params || {})}
          disabled={disabled}
        >
          {btn.icon}
          {btn.label}
        </Button>
      ))}
      {showFilter && (
        <FilterPopover onRefine={onRefine} disabled={disabled} />
      )}
    </div>
  );
}
