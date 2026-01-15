import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface VariableCheckboxProps {
  name: string;
  label: string;
  nValues: number;
  suggested?: boolean;
  checked: boolean;
  disabled?: boolean;
  onChange: (name: string) => void;
}

export function VariableCheckbox({
  name,
  label,
  nValues,
  suggested,
  checked,
  disabled,
  onChange,
}: VariableCheckboxProps) {
  const { t } = useLanguage();

  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
        checked
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      } ${disabled && !checked ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Checkbox
        checked={checked}
        disabled={disabled && !checked}
        onCheckedChange={() => onChange(name)}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{label || name}</span>
          {suggested && (
            <Badge variant="secondary" className="gap-1 shrink-0">
              <Star className="h-3 w-3" />
              {t.aggfile?.suggested || 'Sugerida'}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {name} • {nValues} {t.aggfile?.values || 'valores'}
        </p>
      </div>
    </label>
  );
}
