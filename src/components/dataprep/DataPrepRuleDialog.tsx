import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, ArrowRight, Info, Loader2, Eye } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { DataPrepRule, DataPrepRuleCreate, DataPrepRuleType, DataPrepPreviewResponse } from '@/types/dataPrep';
import type { VariableLabelMap } from '@/hooks/useProjectVariables';
import { DataPrepPreview } from './DataPrepPreview';

interface DataPrepRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRule: DataPrepRule | null;
  onSave: (data: DataPrepRuleCreate) => Promise<void>;
  onPreview?: (data: DataPrepRuleCreate) => Promise<DataPrepPreviewResponse>;
  availableVariables?: string[];
  variableLabels?: VariableLabelMap;
}

const RULE_TYPES: DataPrepRuleType[] = ['cleaning', 'weight', 'net', 'recode', 'computed'];

const CLEANING_OPERATORS = [
  'equals', 'not_equals', 'less_than', 'greater_than',
  'less_equal', 'greater_equal', 'in', 'not_in',
  'is_null', 'is_not_null', 'is_duplicate',
];

const NO_VALUE_OPERATORS = ['is_null', 'is_not_null', 'is_duplicate'];
const LIST_OPERATORS = ['in', 'not_in'];

const COMPUTED_OPERATORS = ['equals', 'not_equals', 'in', 'less_than', 'greater_than'];

interface RecodeMapping {
  from_codes: string;
  to_value: string;
  label: string;
}

interface ComputedCondition {
  variable: string;
  operator: string;
  value: string;
}

interface WeightTarget {
  variable: string;
  values: string;
}

export function DataPrepRuleDialog({
  open,
  onOpenChange,
  editingRule,
  onSave,
  onPreview,
  availableVariables = [],
  variableLabels = {},
}: DataPrepRuleDialogProps) {
  const { t, language } = useLanguage();
  const dp = t.dataPrep;

  // Common fields
  const [name, setName] = useState('');
  const [ruleType, setRuleType] = useState<DataPrepRuleType>('cleaning');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewResult, setPreviewResult] = useState<DataPrepPreviewResponse | null>(null);

  // Cleaning
  const [cleanVariable, setCleanVariable] = useState('');
  const [cleanOperator, setCleanOperator] = useState('equals');
  const [cleanValue, setCleanValue] = useState('');
  const [cleanAction, setCleanAction] = useState('drop');

  // Net
  const [netVariable, setNetVariable] = useState('');
  const [netName, setNetName] = useState('');
  const [netCodes, setNetCodes] = useState('');

  // Recode
  const [recodeVariable, setRecodeVariable] = useState('');
  const [recodeNewVarName, setRecodeNewVarName] = useState('');
  const [recodeMappings, setRecodeMappings] = useState<RecodeMapping[]>([
    { from_codes: '', to_value: '', label: '' },
  ]);

  // Computed
  const [computedName, setComputedName] = useState('');
  const [computedLabel, setComputedLabel] = useState('');
  const [computedCombine, setComputedCombine] = useState('OR');
  const [computedConditions, setComputedConditions] = useState<ComputedCondition[]>([
    { variable: '', operator: 'equals', value: '' },
  ]);

  // Weight
  const [weightTargets, setWeightTargets] = useState<WeightTarget[]>([
    { variable: '', values: '' },
  ]);
  const [weightMaxIter, setWeightMaxIter] = useState('50');
  const [weightMaxWeight, setWeightMaxWeight] = useState('10');
  const [weightMinWeight, setWeightMinWeight] = useState('0.1');

  const ruleTypeLabel = (type: DataPrepRuleType) => {
    const labels: Record<DataPrepRuleType, string> = {
      cleaning: dp?.typeCleaning || 'Cleaning',
      weight: dp?.typeWeight || 'Weighting',
      net: dp?.typeNet || 'Net',
      recode: dp?.typeRecode || 'Recode',
      computed: dp?.typeComputed || 'Computed',
    };
    return labels[type];
  };

  const l = (key: string, fallback: string) => (dp as any)?.[key] || fallback;

  useEffect(() => {
    if (!open) return;
    if (editingRule) {
      setName(editingRule.name);
      setRuleType(editingRule.rule_type);
      setIsActive(editingRule.is_active);
      populateFromConfig(editingRule.rule_type, editingRule.config);
    } else {
      resetAll();
    }
  }, [open, editingRule]);

  const resetAll = () => {
    setName('');
    setRuleType('cleaning');
    setIsActive(true);
    setPreviewResult(null);
    setCleanVariable(''); setCleanOperator('equals'); setCleanValue(''); setCleanAction('drop');
    setNetVariable(''); setNetName(''); setNetCodes('');
    setRecodeVariable(''); setRecodeNewVarName('');
    setRecodeMappings([{ from_codes: '', to_value: '', label: '' }]);
    setComputedName(''); setComputedLabel(''); setComputedCombine('OR');
    setComputedConditions([{ variable: '', operator: 'equals', value: '' }]);
    setWeightTargets([{ variable: '', values: '' }]);
    setWeightMaxIter('50'); setWeightMaxWeight('10'); setWeightMinWeight('0.1');
  };

  const populateFromConfig = (type: DataPrepRuleType, config: Record<string, unknown>) => {
    switch (type) {
      case 'cleaning': {
        setCleanVariable((config.variable as string) || '');
        setCleanOperator((config.operator as string) || 'equals');
        setCleanValue(
          config.values ? (config.values as string[]).join(', ') :
          config.value != null ? String(config.value) : ''
        );
        setCleanAction((config.action as string) || 'drop');
        break;
      }
      case 'net': {
        setNetVariable((config.variable as string) || '');
        setNetName((config.net_name as string) || '');
        setNetCodes((config.codes as number[])?.join(', ') || '');
        break;
      }
      case 'recode': {
        setRecodeVariable((config.variable as string) || '');
        setRecodeNewVarName((config.new_variable_name as string) || '');
        const mappings = (config.mappings as any[]) || [];
        setRecodeMappings(
          mappings.length > 0
            ? mappings.map((m) => ({
                from_codes: (m.from_codes as number[])?.join(', ') || '',
                to_value: String(m.to_value ?? ''),
                label: m.label || '',
              }))
            : [{ from_codes: '', to_value: '', label: '' }]
        );
        break;
      }
      case 'computed': {
        setComputedName((config.name as string) || '');
        setComputedLabel((config.label as string) || '');
        setComputedCombine((config.combine as string) || 'OR');
        const conds = (config.conditions as any[]) || [];
        setComputedConditions(
          conds.length > 0
            ? conds.map((c) => ({
                variable: c.variable || '',
                operator: c.operator || 'equals',
                value: c.value != null ? String(c.value) : '',
              }))
            : [{ variable: '', operator: 'equals', value: '' }]
        );
        break;
      }
      case 'weight': {
        const targets = config.targets as Record<string, Record<string, number>> | undefined;
        if (targets) {
          setWeightTargets(
            Object.entries(targets).map(([variable, vals]) => ({
              variable,
              values: Object.entries(vals).map(([k, v]) => `${k}:${v}`).join(', '),
            }))
          );
        } else {
          setWeightTargets([{ variable: '', values: '' }]);
        }
        setWeightMaxIter(String(config.max_iterations ?? 50));
        setWeightMaxWeight(String(config.max_weight ?? 10));
        setWeightMinWeight(String(config.min_weight ?? 0.1));
        break;
      }
    }
  };

  const buildConfig = (): Record<string, unknown> => {
    switch (ruleType) {
      case 'cleaning': {
        const cfg: Record<string, unknown> = {
          variable: cleanVariable,
          operator: cleanOperator,
          action: cleanAction,
        };
        if (!NO_VALUE_OPERATORS.includes(cleanOperator)) {
          if (LIST_OPERATORS.includes(cleanOperator)) {
            cfg.values = cleanValue.split(',').map((s) => s.trim()).filter(Boolean);
          } else {
            cfg.value = cleanValue;
          }
        }
        return cfg;
      }
      case 'net':
        return {
          variable: netVariable,
          net_name: netName,
          codes: netCodes.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n)),
        };
      case 'recode': {
        const cfg: Record<string, unknown> = {
          variable: recodeVariable,
          mappings: recodeMappings
            .filter((m) => m.from_codes.trim())
            .map((m) => ({
              from_codes: m.from_codes.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n)),
              to_value: Number(m.to_value),
              label: m.label,
            })),
        };
        if (recodeNewVarName.trim()) cfg.new_variable_name = recodeNewVarName.trim();
        return cfg;
      }
      case 'computed':
        return {
          name: computedName,
          label: computedLabel,
          combine: computedCombine,
          conditions: computedConditions
            .filter((c) => c.variable)
            .map((c) => {
              const cond: Record<string, unknown> = { variable: c.variable, operator: c.operator };
              if (c.value) cond.value = c.value;
              return cond;
            }),
        };
      case 'weight': {
        const targets: Record<string, Record<string, number>> = {};
        weightTargets.forEach((wt) => {
          if (!wt.variable || !wt.values.trim()) return;
          const vals: Record<string, number> = {};
          wt.values.split(',').forEach((pair) => {
            const [code, pct] = pair.split(':').map((s) => s.trim());
            if (code && !isNaN(Number(pct))) vals[code] = Number(pct);
          });
          targets[wt.variable] = vals;
        });
        return {
          targets,
          max_iterations: Number(weightMaxIter) || 50,
          max_weight: Number(weightMaxWeight) || 10,
          min_weight: Number(weightMinWeight) || 0.1,
        };
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        rule_type: ruleType,
        config: buildConfig(),
        is_active: isActive,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = name.trim().length > 0;

  const handlePreview = async () => {
    if (!onPreview || !canSave) return;
    setIsPreviewing(true);
    setPreviewResult(null);
    try {
      const result = await onPreview({
        name: name.trim(),
        rule_type: ruleType,
        config: buildConfig(),
        is_active: isActive,
      });
      setPreviewResult(result);
    } catch {
      // error handled upstream
    } finally {
      setIsPreviewing(false);
    }
  };

  const getVarDisplay = (v: string) => variableLabels[v] ? `${v} (${variableLabels[v]})` : v;

  const operatorLabel = (op: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      equals: { es: 'Igual a', en: 'Equals' },
      not_equals: { es: 'Diferente de', en: 'Not equals' },
      less_than: { es: 'Menor que', en: 'Less than' },
      greater_than: { es: 'Mayor que', en: 'Greater than' },
      less_equal: { es: 'Menor o igual', en: 'Less or equal' },
      greater_equal: { es: 'Mayor o igual', en: 'Greater or equal' },
      in: { es: 'En lista', en: 'In list' },
      not_in: { es: 'No en lista', en: 'Not in list' },
      is_null: { es: 'Es nulo', en: 'Is null' },
      is_not_null: { es: 'No es nulo', en: 'Is not null' },
      is_duplicate: { es: 'Es duplicado', en: 'Is duplicate' },
    };
    return labels[op]?.[language] || op;
  };

  const VariableSelect = ({
    value,
    onValueChange,
    placeholder,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-8 text-sm">
        <SelectValue placeholder={placeholder || l('selectVariable', language === 'es' ? 'Seleccionar variable' : 'Select variable')} />
      </SelectTrigger>
      <SelectContent>
        {availableVariables.map((v) => (
          <SelectItem key={v} value={v} className="text-sm">
            {getVarDisplay(v)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const renderCleaningFields = () => (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">{l('variable', language === 'es' ? 'Variable' : 'Variable')}</Label>
        <VariableSelect value={cleanVariable} onValueChange={setCleanVariable} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{l('operator', language === 'es' ? 'Operador' : 'Operator')}</Label>
        <Select value={cleanOperator} onValueChange={setCleanOperator}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLEANING_OPERATORS.map((op) => (
              <SelectItem key={op} value={op} className="text-sm">
                {operatorLabel(op)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!NO_VALUE_OPERATORS.includes(cleanOperator) && (
        <div className="space-y-1">
          <Label className="text-xs">
            {LIST_OPERATORS.includes(cleanOperator)
              ? l('valuesCsv', language === 'es' ? 'Valores (separados por coma)' : 'Values (comma separated)')
              : l('value', language === 'es' ? 'Valor' : 'Value')}
          </Label>
          <Input
            value={cleanValue}
            onChange={(e) => setCleanValue(e.target.value)}
            placeholder={LIST_OPERATORS.includes(cleanOperator) ? '1, 2, 3' : '18'}
            className="h-8 text-sm"
          />
        </div>
      )}
      <div className="space-y-1">
        <Label className="text-xs">{l('action', language === 'es' ? 'Acción' : 'Action')}</Label>
        <Select value={cleanAction} onValueChange={setCleanAction}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="drop" className="text-sm">
              {language === 'es' ? 'Eliminar casos' : 'Drop cases'}
            </SelectItem>
            <SelectItem value="filter" className="text-sm">
              {language === 'es' ? 'Filtrar (mantener)' : 'Filter (keep)'}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderNetFields = () => (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">{l('variable', 'Variable')}</Label>
        <VariableSelect value={netVariable} onValueChange={setNetVariable} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{language === 'es' ? 'Nombre del Net' : 'Net name'}</Label>
        <Input
          value={netName}
          onChange={(e) => setNetName(e.target.value)}
          placeholder={language === 'es' ? 'Ej: Top 2 Box' : 'E.g. Top 2 Box'}
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{language === 'es' ? 'Códigos' : 'Codes'}</Label>
        <Input
          value={netCodes}
          onChange={(e) => setNetCodes(e.target.value)}
          placeholder="4, 5"
          className="h-8 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          {language === 'es' ? 'Los códigos que componen este Net / Top Box' : 'The codes that make up this Net / Top Box'}
        </p>
      </div>
    </div>
  );

  const renderRecodeFields = () => {
    const addMapping = () => setRecodeMappings((prev) => [...prev, { from_codes: '', to_value: '', label: '' }]);
    const removeMapping = (i: number) => setRecodeMappings((prev) => prev.filter((_, idx) => idx !== i));
    const updateMapping = (i: number, field: keyof RecodeMapping, val: string) =>
      setRecodeMappings((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">{l('variable', 'Variable')}</Label>
          <VariableSelect value={recodeVariable} onValueChange={setRecodeVariable} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{language === 'es' ? 'Nuevo nombre de variable' : 'New variable name'}</Label>
          <Input
            value={recodeNewVarName}
            onChange={(e) => setRecodeNewVarName(e.target.value)}
            placeholder={language === 'es' ? 'Dejar vacío para auto' : 'Leave empty for auto'}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">{language === 'es' ? 'Mapeos' : 'Mappings'}</Label>
            <Button variant="outline" size="sm" className="h-6 text-xs" onClick={addMapping}>
              <Plus className="h-3 w-3 mr-1" /> {language === 'es' ? 'Agregar' : 'Add'}
            </Button>
          </div>
          {recodeMappings.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={m.from_codes}
                onChange={(e) => updateMapping(i, 'from_codes', e.target.value)}
                placeholder="1, 2, 3"
                className="h-7 text-xs flex-1"
              />
              <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
              <Input
                value={m.to_value}
                onChange={(e) => updateMapping(i, 'to_value', e.target.value)}
                placeholder="1"
                className="h-7 text-xs w-14"
                type="number"
              />
              <Input
                value={m.label}
                onChange={(e) => updateMapping(i, 'label', e.target.value)}
                placeholder={language === 'es' ? 'Etiqueta' : 'Label'}
                className="h-7 text-xs flex-1"
              />
              {recodeMappings.length > 1 && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeMapping(i)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderComputedFields = () => {
    const addCondition = () => setComputedConditions((prev) => [...prev, { variable: '', operator: 'equals', value: '' }]);
    const removeCondition = (i: number) => setComputedConditions((prev) => prev.filter((_, idx) => idx !== i));
    const updateCondition = (i: number, field: keyof ComputedCondition, val: string) =>
      setComputedConditions((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">{language === 'es' ? 'Nombre de variable' : 'Variable name'}</Label>
          <Input
            value={computedName}
            onChange={(e) => setComputedName(e.target.value)}
            placeholder="aware_composite"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{language === 'es' ? 'Etiqueta' : 'Label'}</Label>
          <Input
            value={computedLabel}
            onChange={(e) => setComputedLabel(e.target.value)}
            placeholder="Awareness Composite"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{language === 'es' ? 'Combinar condiciones' : 'Combine conditions'}</Label>
          <Select value={computedCombine} onValueChange={setComputedCombine}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OR">OR</SelectItem>
              <SelectItem value="AND">AND</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">{language === 'es' ? 'Condiciones' : 'Conditions'}</Label>
            <Button variant="outline" size="sm" className="h-6 text-xs" onClick={addCondition}>
              <Plus className="h-3 w-3 mr-1" /> {language === 'es' ? 'Agregar' : 'Add'}
            </Button>
          </div>
          {computedConditions.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <VariableSelect value={c.variable} onValueChange={(v) => updateCondition(i, 'variable', v)} />
              </div>
              <Select value={c.operator} onValueChange={(v) => updateCondition(i, 'operator', v)}>
                <SelectTrigger className="h-8 text-xs w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPUTED_OPERATORS.map((op) => (
                    <SelectItem key={op} value={op} className="text-xs">{operatorLabel(op)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={c.value}
                onChange={(e) => updateCondition(i, 'value', e.target.value)}
                placeholder={language === 'es' ? 'Valor' : 'Value'}
                className="h-8 text-xs w-20"
              />
              {computedConditions.length > 1 && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeCondition(i)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeightFields = () => {
    const addTarget = () => setWeightTargets((prev) => [...prev, { variable: '', values: '' }]);
    const removeTarget = (i: number) => setWeightTargets((prev) => prev.filter((_, idx) => idx !== i));
    const updateTarget = (i: number, field: keyof WeightTarget, val: string) =>
      setWeightTargets((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t));

    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            {language === 'es'
              ? 'Define objetivos de ponderación por variable. Formato: código:porcentaje. Ejemplo: 1:50, 2:50'
              : 'Define weighting targets per variable. Format: code:percentage. Example: 1:50, 2:50'}
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">{language === 'es' ? 'Objetivos' : 'Targets'}</Label>
            <Button variant="outline" size="sm" className="h-6 text-xs" onClick={addTarget}>
              <Plus className="h-3 w-3 mr-1" /> {language === 'es' ? 'Agregar variable' : 'Add variable'}
            </Button>
          </div>
          {weightTargets.map((wt, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <VariableSelect value={wt.variable} onValueChange={(v) => updateTarget(i, 'variable', v)} />
              </div>
              <Input
                value={wt.values}
                onChange={(e) => updateTarget(i, 'values', e.target.value)}
                placeholder="1:50, 2:50"
                className="h-8 text-xs flex-1"
              />
              {weightTargets.length > 1 && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeTarget(i)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">{language === 'es' ? 'Máx. iteraciones' : 'Max iterations'}</Label>
            <Input value={weightMaxIter} onChange={(e) => setWeightMaxIter(e.target.value)} type="number" className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{language === 'es' ? 'Peso máx.' : 'Max weight'}</Label>
            <Input value={weightMaxWeight} onChange={(e) => setWeightMaxWeight(e.target.value)} type="number" step="0.1" className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{language === 'es' ? 'Peso mín.' : 'Min weight'}</Label>
            <Input value={weightMinWeight} onChange={(e) => setWeightMinWeight(e.target.value)} type="number" step="0.01" className="h-8 text-sm" />
          </div>
        </div>
      </div>
    );
  };

  const renderTypeFields = () => {
    switch (ruleType) {
      case 'cleaning': return renderCleaningFields();
      case 'net': return renderNetFields();
      case 'recode': return renderRecodeFields();
      case 'computed': return renderComputedFields();
      case 'weight': return renderWeightFields();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>
            {editingRule
              ? dp?.editRule || 'Edit rule'
              : dp?.createRule || 'Create rule'}
          </DialogTitle>
          <DialogDescription>
            {dp?.ruleDialogDescription || 'Configure data preparation rule parameters'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-2">
          <div className="space-y-4">
            {/* Common fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="rule-name" className="text-xs">
                  {dp?.ruleName || 'Name'}
                </Label>
                <Input
                  id="rule-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={dp?.ruleNamePlaceholder || 'E.g: Remove cases without response'}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{dp?.ruleType || 'Rule type'}</Label>
                <Select
                  value={ruleType}
                  onValueChange={(v) => setRuleType(v as DataPrepRuleType)}
                  disabled={!!editingRule}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RULE_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="text-sm">
                        {ruleTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">{dp?.active || 'Active'}</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <Separator />

            {/* Type-specific fields */}
            {renderTypeFields()}

            {/* Preview result */}
            {previewResult && (
              <div className="mt-4">
                <DataPrepPreview preview={previewResult} />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          {onPreview && (
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={!canSave || isPreviewing}
              className="mr-auto"
            >
              {isPreviewing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              {dp?.preview || 'Preview'}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSave} disabled={!canSave || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
