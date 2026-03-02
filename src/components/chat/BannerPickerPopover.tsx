import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
import { Columns } from 'lucide-react';
import { useVariableMetadata } from '@/hooks/useVariableMetadata';
import { useLanguage } from '@/i18n/LanguageContext';
import type { RefinementAction } from '@/types/database';

interface BannerPickerPopoverProps {
  onRefine: (action: RefinementAction, params: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function BannerPickerPopover({ onRefine, disabled }: BannerPickerPopoverProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const { variables } = useVariableMetadata(projectId!);
  const { t } = useLanguage();
  const refineT = t.refine;

  const [open, setOpen] = useState(false);

  // Only show categorical variables (those with value_labels)
  const categoricalVars = variables.filter(
    (v) => Object.keys(v.value_labels || v.auto_value_labels || {}).length > 0
  );

  const handleSelect = (varName: string) => {
    onRefine('change_banner', { banner_variable: varName });
    setOpen(false);
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
          <Columns className="h-3 w-3" />
          {refineT?.changeBanner || 'Cambiar banner'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder={t.common?.search ?? 'Search variable...'} />
          <CommandList className="max-h-56">
            <CommandEmpty>{t.common?.noResults ?? 'No variables found'}</CommandEmpty>
            <CommandGroup>
              {categoricalVars.map((v) => (
                <CommandItem
                  key={v.name}
                  value={`${v.name} ${v.label || v.auto_label || ''}`}
                  onSelect={() => handleSelect(v.name)}
                >
                  <span className="truncate text-xs">
                    {v.label || v.auto_label || v.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
