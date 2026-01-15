import { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { VariableCheckbox } from './VariableCheckbox';
import { ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { AnalysisVariable, ValueFormat } from '@/types/aggfile';

interface AnalysisVariablesStepProps {
  variables: AnalysisVariable[];
  selectedAnalysis: string[] | 'all';
  format: {
    valueType: ValueFormat;
    decimalPlaces: number;
    includeBases: boolean;
  };
  isLoading: boolean;
  onToggle: (name: string) => void;
  onSetMode: (mode: 'all' | 'selected') => void;
  onSetValueType: (type: ValueFormat) => void;
  onSetDecimalPlaces: (places: number) => void;
  onSetIncludeBases: (include: boolean) => void;
  onBack: () => void;
  onGenerate: () => void;
  onFetch: () => void;
  canGenerate: boolean;
}

export function AnalysisVariablesStep({
  variables,
  selectedAnalysis,
  format,
  isLoading,
  onToggle,
  onSetMode,
  onSetValueType,
  onSetDecimalPlaces,
  onSetIncludeBases,
  onBack,
  onGenerate,
  onFetch,
  canGenerate,
}: AnalysisVariablesStepProps) {
  const { t } = useLanguage();

  useEffect(() => {
    onFetch();
  }, [onFetch]);

  const isAllMode = selectedAnalysis === 'all';

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-4 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 space-y-1">
        <h3 className="font-semibold">
          {t.aggfile?.step2Title || 'Configura las preguntas y formato'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t.aggfile?.step2Description ||
            'Elige qué preguntas cruzar y cómo mostrar los resultados'}
        </p>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6 pb-4">
          {/* Analysis mode selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              {t.aggfile?.questionsLabel || 'Preguntas a analizar'}
            </h4>
            <RadioGroup
              value={isAllMode ? 'all' : 'selected'}
              onValueChange={(v) => onSetMode(v as 'all' | 'selected')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer">
                  {t.aggfile?.allQuestions || 'Todas las preguntas'} ({variables.length})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="selected" id="selected" />
                <Label htmlFor="selected" className="cursor-pointer">
                  {t.aggfile?.onlySelected || 'Solo las seleccionadas'}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Variable list (only when "selected" mode) */}
          {!isAllMode && (
            <div className="space-y-2 pl-6">
              {variables.map((variable) => (
                <VariableCheckbox
                  key={variable.name}
                  name={variable.name}
                  label={variable.label}
                  nValues={variable.n_values}
                  checked={
                    Array.isArray(selectedAnalysis) &&
                    selectedAnalysis.includes(variable.name)
                  }
                  onChange={onToggle}
                />
              ))}
            </div>
          )}

          <Separator />

          {/* Format options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              {t.aggfile?.formatLabel || 'Formato de valores'}
            </h4>
            <RadioGroup
              value={format.valueType}
              onValueChange={(v) => onSetValueType(v as ValueFormat)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="cursor-pointer">
                  {t.aggfile?.percentages || 'Porcentajes'} (%)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="decimal" id="decimal" />
                <Label htmlFor="decimal" className="cursor-pointer">
                  {t.aggfile?.decimals || 'Decimales'} (0.XX)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="count" id="count" />
                <Label htmlFor="count" className="cursor-pointer">
                  {t.aggfile?.frequencies || 'Frecuencias'} (n)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Decimal places */}
          {format.valueType !== 'count' && (
            <div className="space-y-2">
              <Label>{t.aggfile?.decimalPlaces || 'Decimales'}</Label>
              <RadioGroup
                value={String(format.decimalPlaces)}
                onValueChange={(v) => onSetDecimalPlaces(Number(v))}
                className="flex gap-4"
              >
                {[0, 1, 2].map((n) => (
                  <div key={n} className="flex items-center space-x-1">
                    <RadioGroupItem value={String(n)} id={`dec-${n}`} />
                    <Label htmlFor={`dec-${n}`} className="cursor-pointer">
                      {n}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Include bases */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-bases"
              checked={format.includeBases}
              onCheckedChange={(checked) => onSetIncludeBases(checked === true)}
            />
            <Label htmlFor="include-bases" className="cursor-pointer">
              {t.aggfile?.includeBases || 'Incluir fila de bases (n)'}
            </Label>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex gap-2">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          {t.common.back}
        </Button>
        <Button onClick={onGenerate} disabled={!canGenerate} className="flex-1">
          {t.aggfile?.generate || 'Generar Excel'}
        </Button>
      </div>
    </div>
  );
}
