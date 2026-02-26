import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Layers } from 'lucide-react';
import { VariableCheckbox } from './VariableCheckbox';
import { useLanguage } from '@/i18n/LanguageContext';
import type { BannerVariable, NestedBannerConfig } from '@/types/aggfile';

interface BannerVariablesStepProps {
  variables: BannerVariable[];
  selectedBanners: string[];
  nestedBanners: NestedBannerConfig[];
  isLoading: boolean;
  maxBanners: number;
  onToggle: (name: string) => void;
  onAddNested: (variables: string[]) => void;
  onRemoveNested: (index: number) => void;
  onNext: () => void;
  onFetch: () => void;
  canProceed: boolean;
}

export function BannerVariablesStep({
  variables,
  selectedBanners,
  nestedBanners,
  isLoading,
  maxBanners,
  onToggle,
  onAddNested,
  onRemoveNested,
  onNext,
  onFetch,
  canProceed,
}: BannerVariablesStepProps) {
  const { t } = useLanguage();
  const [nestVar1, setNestVar1] = useState('');
  const [nestVar2, setNestVar2] = useState('');

  useEffect(() => {
    onFetch();
  }, [onFetch]);

  const suggested = variables.filter((v) => v.suggested);
  const others = variables.filter((v) => !v.suggested);
  const isAtMax = selectedBanners.length >= maxBanners;

  // Variables already used in a nested pair (can't be nested again)
  const nestedVarSet = new Set(nestedBanners.flatMap((nb) => nb.variables));

  // Available for nesting: selected banners not already in a nested pair
  const availableForNesting = selectedBanners.filter((b) => !nestedVarSet.has(b));
  const canAddNested = availableForNesting.length >= 2;

  const handleAddNested = () => {
    if (nestVar1 && nestVar2 && nestVar1 !== nestVar2) {
      onAddNested([nestVar1, nestVar2]);
      setNestVar1('');
      setNestVar2('');
    }
  };

  const getLabelForVar = (name: string) => {
    const v = variables.find((vr) => vr.name === name);
    return v?.label || name;
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-4 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 space-y-1">
        <h3 className="font-semibold">
          {t.aggfile?.step1Title || 'Select banner variables'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t.aggfile?.step1Description ||
            'Banners are the columns of your cross tables (e.g.: gender, age, SES)'}
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className={isAtMax ? 'text-destructive font-medium' : 'text-muted-foreground'}>
            {t.aggfile?.selected || 'Selected'}: {selectedBanners.length}{' '}
            {t.aggfile?.ofMax || 'of'} {maxBanners} {t.aggfile?.max || 'max'}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 pb-4">
          {suggested.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {t.aggfile?.suggestedSection || 'Suggested'}
              </h4>
              <div className="space-y-2">
                {suggested.map((variable) => (
                  <VariableCheckbox
                    key={variable.name}
                    name={variable.name}
                    label={variable.label}
                    nValues={variable.n_values}
                    suggested
                    checked={selectedBanners.includes(variable.name)}
                    disabled={isAtMax}
                    onChange={onToggle}
                  />
                ))}
              </div>
            </div>
          )}

          {others.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {t.aggfile?.othersSection || 'Other available'}
              </h4>
              <div className="space-y-2">
                {others.map((variable) => (
                  <VariableCheckbox
                    key={variable.name}
                    name={variable.name}
                    label={variable.label}
                    nValues={variable.n_values}
                    checked={selectedBanners.includes(variable.name)}
                    disabled={isAtMax}
                    onChange={onToggle}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Nested banners (optional) */}
          {selectedBanners.length >= 2 && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">
                  {t.aggfile?.nestedBannersTitle || 'Nested banners (optional)'}
                </h4>
              </div>
              <p className="text-xs text-muted-foreground">
                {t.aggfile?.nestedBannersDescription ||
                  'Combine two banners into a cross-product (e.g., Gender × Age → Male 18-34, Male 35-54, ...)'}
              </p>

              {/* Existing nested pairs */}
              {nestedBanners.map((nb, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2 text-sm"
                >
                  <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-medium">
                    {getLabelForVar(nb.variables[0])} × {getLabelForVar(nb.variables[1])}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-auto shrink-0"
                    onClick={() => onRemoveNested(idx)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}

              {/* Add new nested pair */}
              {canAddNested && (
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Select value={nestVar1} onValueChange={setNestVar1}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={t.aggfile?.nestedSelectFirst || 'First variable'} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableForNesting
                          .filter((v) => v !== nestVar2)
                          .map((v) => (
                            <SelectItem key={v} value={v} className="text-xs">
                              {getLabelForVar(v)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="text-xs text-muted-foreground pb-1.5">×</span>
                  <div className="flex-1 space-y-1">
                    <Select value={nestVar2} onValueChange={setNestVar2}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={t.aggfile?.nestedSelectSecond || 'Second variable'} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableForNesting
                          .filter((v) => v !== nestVar1)
                          .map((v) => (
                            <SelectItem key={v} value={v} className="text-xs">
                              {getLabelForVar(v)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    disabled={!nestVar1 || !nestVar2 || nestVar1 === nestVar2}
                    onClick={handleAddNested}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button onClick={onNext} disabled={!canProceed} className="w-full">
          {t.common.continue}
        </Button>
      </div>
    </div>
  );
}
