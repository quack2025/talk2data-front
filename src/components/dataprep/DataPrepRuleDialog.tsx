import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { useLanguage } from '@/i18n/LanguageContext';
import type { DataPrepRule, DataPrepRuleCreate, DataPrepRuleType } from '@/types/dataPrep';

interface DataPrepRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRule: DataPrepRule | null;
  onSave: (data: DataPrepRuleCreate) => Promise<void>;
}

const RULE_TYPES: DataPrepRuleType[] = ['cleaning', 'weight', 'net', 'recode', 'computed'];

export function DataPrepRuleDialog({
  open,
  onOpenChange,
  editingRule,
  onSave,
}: DataPrepRuleDialogProps) {
  const { t } = useLanguage();
  const dp = t.dataPrep;

  const [name, setName] = useState('');
  const [ruleType, setRuleType] = useState<DataPrepRuleType>('cleaning');
  const [configStr, setConfigStr] = useState('{}');
  const [isActive, setIsActive] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingRule) {
        setName(editingRule.name);
        setRuleType(editingRule.rule_type);
        setConfigStr(JSON.stringify(editingRule.config, null, 2));
        setIsActive(editingRule.is_active);
      } else {
        setName('');
        setRuleType('cleaning');
        setConfigStr('{}');
        setIsActive(true);
      }
      setConfigError(null);
    }
  }, [open, editingRule]);

  const ruleTypeLabel = (type: DataPrepRuleType) => {
    const labels: Record<DataPrepRuleType, string> = {
      cleaning: dp?.typeCleaning || 'Cleaning',
      weight: dp?.typeWeight || 'Weight',
      net: dp?.typeNet || 'Net',
      recode: dp?.typeRecode || 'Recode',
      computed: dp?.typeComputed || 'Computed',
    };
    return labels[type];
  };

  const handleSave = async () => {
    let config: Record<string, unknown>;
    try {
      config = JSON.parse(configStr);
    } catch {
      setConfigError(dp?.invalidJson || 'JSON inválido');
      return;
    }
    setConfigError(null);
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        rule_type: ruleType,
        config,
        is_active: isActive,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingRule
              ? dp?.editRule || 'Editar regla'
              : dp?.createRule || 'Crear regla'}
          </DialogTitle>
          <DialogDescription>
            {dp?.ruleDialogDescription || 'Configura los parámetros de la regla de preparación'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="rule-name" className="text-xs">
              {dp?.ruleName || 'Nombre'}
            </Label>
            <Input
              id="rule-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={dp?.ruleNamePlaceholder || 'Ej: Eliminar casos sin respuesta'}
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">{dp?.ruleType || 'Tipo de regla'}</Label>
            <Select value={ruleType} onValueChange={(v) => setRuleType(v as DataPrepRuleType)}>
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

          <div className="space-y-1">
            <Label className="text-xs">{dp?.configuration || 'Configuración (JSON)'}</Label>
            <Textarea
              value={configStr}
              onChange={(e) => {
                setConfigStr(e.target.value);
                setConfigError(null);
              }}
              className="font-mono text-xs min-h-[120px]"
              placeholder='{ "variable": "Q1", "condition": "..." }'
            />
            {configError && (
              <p className="text-xs text-destructive">{configError}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">{dp?.active || 'Activa'}</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
            {t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
