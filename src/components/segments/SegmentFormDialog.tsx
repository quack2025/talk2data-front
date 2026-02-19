import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Loader2, Eye } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type {
  Segment,
  SegmentCreate,
  SegmentCondition,
  SegmentConditionGroup,
  SegmentPreviewResponse,
} from '@/types/segments';
import { OPERATOR_LABELS } from '@/types/segments';
import type { ExploreVariable } from '@/types/explore';

interface SegmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSegment: Segment | null;
  onSave: (data: SegmentCreate) => Promise<void>;
  onPreview: (conditions: SegmentConditionGroup) => Promise<SegmentPreviewResponse>;
  availableVariables: ExploreVariable[];
}

const OPERATORS = ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'not_in'] as const;

function emptyCondition(): SegmentCondition {
  return { variable: '', operator: 'eq', value: '' };
}

export function SegmentFormDialog({
  open,
  onOpenChange,
  editingSegment,
  onSave,
  onPreview,
  availableVariables,
}: SegmentFormDialogProps) {
  const { t, language } = useLanguage();
  const seg = t.segments;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [conditions, setConditions] = useState<SegmentCondition[]>([emptyCondition()]);
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<SegmentPreviewResponse | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    if (editingSegment) {
      setName(editingSegment.name);
      setDescription(editingSegment.description || '');
      const conds = editingSegment.conditions?.conditions;
      setConditions(conds && conds.length > 0 ? [...conds] : [emptyCondition()]);
    } else {
      setName('');
      setDescription('');
      setConditions([emptyCondition()]);
    }
    setPreview(null);
  }, [editingSegment, open]);

  const updateCondition = (index: number, field: keyof SegmentCondition, val: unknown) => {
    setConditions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
    setPreview(null);
  };

  const addCondition = () => {
    setConditions((prev) => [...prev, emptyCondition()]);
  };

  const removeCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
    setPreview(null);
  };

  const validConditions = conditions.filter((c) => c.variable && c.operator);

  const buildConditionGroup = (): SegmentConditionGroup => ({
    logic: 'and',
    conditions: validConditions.map((c) => {
      if (c.operator === 'in' || c.operator === 'not_in') {
        const rawVal = String(c.value ?? '');
        const vals = rawVal.split(',').map((v) => v.trim()).filter(Boolean);
        return { variable: c.variable, operator: c.operator, values: vals };
      }
      return { variable: c.variable, operator: c.operator, value: c.value };
    }),
  });

  const handlePreview = async () => {
    if (validConditions.length === 0) return;
    setIsPreviewing(true);
    try {
      const result = await onPreview(buildConditionGroup());
      setPreview(result);
    } catch {
      // handled upstream
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || validConditions.length === 0) return;
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        conditions: buildConditionGroup(),
      });
      onOpenChange(false);
    } catch {
      // error handled upstream
    } finally {
      setIsSaving(false);
    }
  };

  const getVariableLabel = (varName: string) => {
    const v = availableVariables.find((v) => v.name === varName);
    return v?.label ? `${varName} — ${v.label}` : varName;
  };

  // Get value labels for a variable (for display hints)
  const getValueLabels = (varName: string): Record<string, string> | null => {
    const v = availableVariables.find((v) => v.name === varName);
    return v?.value_labels || null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingSegment
              ? (seg?.editSegment ?? 'Edit Segment')
              : (seg?.createSegment ?? 'Create Segment')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>{seg?.name ?? 'Name'}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={seg?.namePlaceholder ?? 'e.g., Bogota + Kids 0-5'}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>{seg?.description ?? 'Description'}</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={seg?.descriptionPlaceholder ?? 'Optional description'}
            />
          </div>

          {/* Conditions */}
          <div className="space-y-2">
            <Label>{seg?.conditions ?? 'Conditions (AND)'}</Label>
            {conditions.map((cond, i) => {
              const valueLabels = cond.variable ? getValueLabels(cond.variable) : null;
              return (
                <div key={i} className="flex items-start gap-2">
                  {/* Variable */}
                  <Select
                    value={cond.variable}
                    onValueChange={(v) => updateCondition(i, 'variable', v)}
                  >
                    <SelectTrigger className="w-[180px] text-xs">
                      <SelectValue placeholder={seg?.selectVariable ?? 'Variable'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {availableVariables.map((v) => (
                        <SelectItem key={v.name} value={v.name} className="text-xs">
                          {v.label ? `${v.name} — ${v.label}` : v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Operator */}
                  <Select
                    value={cond.operator}
                    onValueChange={(v) => updateCondition(i, 'operator', v)}
                  >
                    <SelectTrigger className="w-[130px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((op) => (
                        <SelectItem key={op} value={op} className="text-xs">
                          {OPERATOR_LABELS[op]?.[language] ?? op}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Value */}
                  <div className="flex-1 min-w-0">
                    <Input
                      value={String(cond.value ?? '')}
                      onChange={(e) => updateCondition(i, 'value', e.target.value)}
                      placeholder={
                        cond.operator === 'in' || cond.operator === 'not_in'
                          ? (seg?.valuesPlaceholder ?? '1, 2, 3')
                          : (seg?.valuePlaceholder ?? 'Value')
                      }
                      className="text-xs"
                    />
                    {valueLabels && cond.variable && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {Object.entries(valueLabels)
                          .slice(0, 5)
                          .map(([k, v]) => `${k}=${v}`)
                          .join(', ')}
                        {Object.keys(valueLabels).length > 5 ? '...' : ''}
                      </p>
                    )}
                  </div>

                  {/* Remove */}
                  {conditions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 flex-shrink-0"
                      onClick={() => removeCondition(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}

            <Button variant="outline" size="sm" onClick={addCondition} className="text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" />
              {seg?.addCondition ?? 'Add condition'}
            </Button>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePreview}
              disabled={validConditions.length === 0 || isPreviewing}
              className="text-xs"
            >
              {isPreviewing ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Eye className="h-3.5 w-3.5 mr-1" />
              )}
              {seg?.preview ?? 'Preview'}
            </Button>
            {preview && (
              <span className="text-xs text-muted-foreground">
                {preview.filtered_rows.toLocaleString()} / {preview.original_rows.toLocaleString()}{' '}
                {seg?.rows ?? 'rows'} ({preview.pct_remaining}%)
              </span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {seg?.cancel ?? 'Cancel'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || validConditions.length === 0 || isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {editingSegment ? (seg?.save ?? 'Save') : (seg?.create ?? 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
