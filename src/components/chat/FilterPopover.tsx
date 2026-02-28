import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Filter, Check } from 'lucide-react';
import { useVariableMetadata } from '@/hooks/useVariableMetadata';
import { useLanguage } from '@/i18n/LanguageContext';
import type { RefinementAction } from '@/types/database';

interface FilterPopoverProps {
  onRefine: (action: RefinementAction, params: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function FilterPopover({ onRefine, disabled }: FilterPopoverProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const { variables } = useVariableMetadata(projectId!);
  const { t } = useLanguage();
  const refineT = t.refine;

  const [open, setOpen] = useState(false);
  const [selectedVar, setSelectedVar] = useState<string | null>(null);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  // Only show categorical variables (those with value_labels)
  const categoricalVars = variables.filter(
    (v) => Object.keys(v.value_labels || v.auto_value_labels || {}).length > 0
  );

  const currentVar = categoricalVars.find((v) => v.name === selectedVar);
  const valueLabels = currentVar
    ? { ...currentVar.auto_value_labels, ...currentVar.value_labels }
    : {};

  const handleApply = () => {
    if (selectedVar && selectedValues.length > 0) {
      onRefine('add_filter', {
        filter_variable: selectedVar,
        filter_values: selectedValues,
      });
      setOpen(false);
      setSelectedVar(null);
      setSelectedValues([]);
    }
  };

  const handleReset = () => {
    setSelectedVar(null);
    setSelectedValues([]);
  };

  const toggleValue = (val: string) => {
    setSelectedValues((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 text-[11px] px-2 text-muted-foreground hover:text-foreground"
          disabled={disabled}
        >
          <Filter className="h-3 w-3" />
          {refineT?.addFilter || 'Filtrar datos'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        {!selectedVar ? (
          /* Step 1: Pick a variable */
          <Command>
            <CommandInput placeholder={t.common?.search ?? 'Search variable...'} />
            <CommandList className="max-h-56">
              <CommandEmpty>{t.common?.noResults ?? 'No variables found'}</CommandEmpty>
              <CommandGroup>
                {categoricalVars.map((v) => (
                  <CommandItem
                    key={v.name}
                    value={`${v.name} ${v.label || v.auto_label || ''}`}
                    onSelect={() => {
                      setSelectedVar(v.name);
                      setSelectedValues([]);
                    }}
                  >
                    <span className="truncate text-xs">
                      {v.label || v.auto_label || v.name}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        ) : (
          /* Step 2: Pick values */
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={handleReset}
              >
                ← {currentVar?.label || currentVar?.auto_label || selectedVar}
              </button>
              <span className="text-[10px] text-muted-foreground">
                {selectedValues.length} selected
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto p-2 space-y-1">
              {Object.entries(valueLabels).map(([code, label]) => (
                <label
                  key={code}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted cursor-pointer text-xs"
                >
                  <Checkbox
                    checked={selectedValues.includes(code)}
                    onCheckedChange={() => toggleValue(code)}
                  />
                  <span className="truncate">{label || code}</span>
                </label>
              ))}
            </div>
            <div className="border-t p-2">
              <Button
                size="sm"
                className="w-full h-7 text-xs"
                disabled={selectedValues.length === 0}
                onClick={handleApply}
              >
                <Check className="h-3 w-3 mr-1" />
                {t.common?.apply ?? 'Apply'} ({selectedValues.length})
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
