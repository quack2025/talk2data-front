/**
 * FilterManager — side panel for configuring dashboard global filters.
 *
 * Lets the dashboard creator add filters by choosing variables from
 * the project's variable list.  Saves filters via updateDashboard().
 *
 * Sprint 18a (Global filters)
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Filter, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useExplore } from '@/hooks/useExplore';
import type { GlobalFilterConfig } from '@/types/dashboard';

interface FilterManagerProps {
  projectId: string;
  filters: GlobalFilterConfig[];
  onSave: (filters: GlobalFilterConfig[]) => void;
  onClose: () => void;
}

const FILTER_TYPES = [
  { value: 'dropdown', labelEn: 'Dropdown (single)', labelEs: 'Dropdown (simple)' },
  { value: 'multi_select', labelEn: 'Multi-select', labelEs: 'Multi-selección' },
] as const;

export function FilterManager({ projectId, filters, onSave, onClose }: FilterManagerProps) {
  const { language } = useLanguage();
  const lang = language as 'es' | 'en';
  const explore = useExplore(projectId);
  const [local, setLocal] = useState<GlobalFilterConfig[]>([...filters]);

  useEffect(() => {
    explore.fetchVariables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = useCallback(() => {
    setLocal((prev) => [
      ...prev,
      { variable: '', label: '', filter_type: 'dropdown' },
    ]);
  }, []);

  const handleRemove = useCallback((idx: number) => {
    setLocal((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleUpdate = useCallback(
    (idx: number, field: keyof GlobalFilterConfig, value: string) => {
      setLocal((prev) => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], [field]: value };
        // Auto-fill label from variable metadata
        if (field === 'variable' && value) {
          const varInfo = explore.variables.find((v) => v.name === value);
          if (varInfo?.label && !updated[idx].label) {
            updated[idx].label = varInfo.label;
          }
        }
        return updated;
      });
    },
    [explore.variables],
  );

  const handleSave = useCallback(() => {
    // Remove incomplete filters
    const valid = local.filter((f) => f.variable && f.label);
    onSave(valid);
  }, [local, onSave]);

  // Variables not yet used as filters
  const availableVars = explore.variables.filter(
    (v) => v.type === 'categorical' || v.type === 'numeric',
  );

  return (
    <div className="border-l bg-card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">
            {lang === 'es' ? 'Filtros globales' : 'Global Filters'}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          <p className="text-xs text-muted-foreground">
            {lang === 'es'
              ? 'Los filtros permiten a los viewers filtrar los datos del dashboard por mercado, período, etc.'
              : 'Filters let viewers filter dashboard data by market, period, etc.'}
          </p>

          {local.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">
                {lang === 'es' ? 'Sin filtros configurados' : 'No filters configured'}
              </p>
            </div>
          )}

          {local.map((filter, idx) => (
            <div key={idx} className="space-y-2 p-2 border rounded-lg bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">
                  {lang === 'es' ? `Filtro ${idx + 1}` : `Filter ${idx + 1}`}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-destructive"
                  onClick={() => handleRemove(idx)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {/* Variable selector */}
              <div className="space-y-1">
                <Label className="text-[10px]">
                  {lang === 'es' ? 'Variable' : 'Variable'}
                </Label>
                <Select
                  value={filter.variable}
                  onValueChange={(v) => handleUpdate(idx, 'variable', v)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder={lang === 'es' ? 'Seleccionar...' : 'Select...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVars.map((v) => (
                      <SelectItem key={v.name} value={v.name} className="text-xs">
                        {v.label || v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Display label */}
              <div className="space-y-1">
                <Label className="text-[10px]">
                  {lang === 'es' ? 'Etiqueta' : 'Label'}
                </Label>
                <Input
                  value={filter.label}
                  onChange={(e) => handleUpdate(idx, 'label', e.target.value)}
                  className="h-7 text-xs"
                  placeholder={lang === 'es' ? 'Ej: País' : 'E.g.: Country'}
                />
              </div>

              {/* Filter type */}
              <div className="space-y-1">
                <Label className="text-[10px]">
                  {lang === 'es' ? 'Tipo' : 'Type'}
                </Label>
                <Select
                  value={filter.filter_type}
                  onValueChange={(v) => handleUpdate(idx, 'filter_type', v)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_TYPES.map((ft) => (
                      <SelectItem key={ft.value} value={ft.value} className="text-xs">
                        {lang === 'es' ? ft.labelEs : ft.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-xs"
            onClick={handleAdd}
          >
            <Plus className="h-3 w-3" />
            {lang === 'es' ? 'Agregar filtro' : 'Add Filter'}
          </Button>
        </div>
      </ScrollArea>

      <div className="p-3 border-t">
        <Button
          size="sm"
          className="w-full text-xs"
          onClick={handleSave}
        >
          {lang === 'es' ? 'Guardar filtros' : 'Save Filters'}
        </Button>
      </div>
    </div>
  );
}
