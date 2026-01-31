import { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { VariableCheckbox } from './VariableCheckbox';
import { ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { AnalysisVariable } from '@/types/aggfile';

interface AnalysisVariablesStepProps {
  variables: AnalysisVariable[];
  selectedAnalysis: string[] | 'all';
  isLoading: boolean;
  onToggle: (name: string) => void;
  onSetMode: (mode: 'all' | 'selected') => void;
  onBack: () => void;
  onNext: () => void;
  onFetch: () => void;
  canProceed: boolean;
}

export function AnalysisVariablesStep({
  variables,
  selectedAnalysis,
  isLoading,
  onToggle,
  onSetMode,
  onBack,
  onNext,
  onFetch,
  canProceed,
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
          {t.aggfile?.step2Title || 'Selecciona las preguntas a analizar'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t.aggfile?.step2Description ||
            'Elige qué preguntas cruzar con las variables de banner'}
        </p>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 pb-4">
          {/* Analysis mode selection */}
          <div className="space-y-3">
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
            <div className="space-y-2 pl-4">
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
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex gap-2">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          {t.common.back}
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="flex-1">
          {t.common.continue}
        </Button>
      </div>
    </div>
  );
}
