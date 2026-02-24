import { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { VariableCheckbox } from './VariableCheckbox';
import { useLanguage } from '@/i18n/LanguageContext';
import type { BannerVariable } from '@/types/aggfile';

interface BannerVariablesStepProps {
  variables: BannerVariable[];
  selectedBanners: string[];
  isLoading: boolean;
  maxBanners: number;
  onToggle: (name: string) => void;
  onNext: () => void;
  onFetch: () => void;
  canProceed: boolean;
}

export function BannerVariablesStep({
  variables,
  selectedBanners,
  isLoading,
  maxBanners,
  onToggle,
  onNext,
  onFetch,
  canProceed,
}: BannerVariablesStepProps) {
  const { t } = useLanguage();

  useEffect(() => {
    onFetch();
  }, [onFetch]);

  const suggested = variables.filter((v) => v.suggested);
  const others = variables.filter((v) => !v.suggested);
  const isAtMax = selectedBanners.length >= maxBanners;

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
