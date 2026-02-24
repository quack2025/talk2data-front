import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { TemplatesPanel } from './TemplatesPanel';
import type { ValueFormat, AnalysisTypeOption, GenerateTablesConfig } from '@/types/aggfile';
import { ANALYSIS_TYPE_LABELS } from '@/types/aggfile';

const FALLBACK_LABELS = ANALYSIS_TYPE_LABELS;

const AVAILABLE_ANALYSIS_TYPES: AnalysisTypeOption[] = [
  'crosstab',
  'frequency',
  'compare_means',
  'nps',
];

interface ConfigureStepProps {
  projectId?: string;
  analysisTypes: AnalysisTypeOption[];
  format: {
    valueType: ValueFormat;
    decimalPlaces: number;
    includeBases: boolean;
    includeSignificance: boolean;
    significanceLevel: number;
  };
  title: string;
  currentConfig?: GenerateTablesConfig;
  onToggleAnalysisType: (type: AnalysisTypeOption) => void;
  onSetValueType: (type: ValueFormat) => void;
  onSetDecimalPlaces: (places: number) => void;
  onSetIncludeBases: (include: boolean) => void;
  onSetIncludeSignificance: (include: boolean) => void;
  onSetSignificanceLevel: (level: number) => void;
  onSetTitle: (title: string) => void;
  onLoadTemplate?: (config: GenerateTablesConfig) => void;
  onBack: () => void;
  onNext: () => void;
  canProceed: boolean;
}

export function ConfigureStep({
  projectId,
  analysisTypes,
  format,
  title,
  currentConfig,
  onToggleAnalysisType,
  onSetValueType,
  onSetDecimalPlaces,
  onSetIncludeBases,
  onSetIncludeSignificance,
  onSetSignificanceLevel,
  onSetTitle,
  onLoadTemplate,
  onBack,
  onNext,
  canProceed,
}: ConfigureStepProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 space-y-1">
        <h3 className="font-semibold">
          {t.aggfile?.step3Title || 'Configure analysis'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t.aggfile?.step3Description ||
            'Choose analysis type and format options'}
        </p>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6 pb-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="table-title">
              {t.aggfile?.titleLabel || 'Title (optional)'}
            </Label>
            <Input
              id="table-title"
              value={title}
              onChange={(e) => onSetTitle(e.target.value)}
              placeholder={t.aggfile?.titlePlaceholder || 'E.g.: Satisfaction tables by segment'}
              maxLength={255}
            />
          </div>

          <Separator />

          {/* Analysis types */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t.aggfile?.analysisTypeLabel || 'Analysis type'}</h4>
            <div className="space-y-2">
              {AVAILABLE_ANALYSIS_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`analysis-${type}`}
                    checked={analysisTypes.includes(type)}
                    onCheckedChange={() => onToggleAnalysisType(type)}
                  />
                  <Label
                    htmlFor={`analysis-${type}`}
                    className="cursor-pointer"
                  >
                    {t.aggfile?.analysisTypes?.[type] ?? FALLBACK_LABELS[type]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Format options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              {t.aggfile?.formatLabel || 'Value format'}
            </h4>
            <RadioGroup
              value={format.valueType}
              onValueChange={(v) => onSetValueType(v as ValueFormat)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="cursor-pointer">
                  {t.aggfile?.percentages || 'Percentages'} (%)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="decimal" id="decimal" />
                <Label htmlFor="decimal" className="cursor-pointer">
                  {t.aggfile?.decimals || 'Decimals'} (0.XX)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="count" id="count" />
                <Label htmlFor="count" className="cursor-pointer">
                  {t.aggfile?.frequencies || 'Frequencies'} (n)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Decimal places */}
          {format.valueType !== 'count' && (
            <div className="space-y-2">
              <Label>{t.aggfile?.decimalPlaces || 'Decimal places'}</Label>
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

          <Separator />

          {/* Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t.aggfile?.optionsLabel || 'Options'}</h4>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-bases"
                checked={format.includeBases}
                onCheckedChange={(checked) =>
                  onSetIncludeBases(checked === true)
                }
              />
              <Label htmlFor="include-bases" className="cursor-pointer">
                {t.aggfile?.includeBases || 'Include base row (n)'}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-significance"
                checked={format.includeSignificance}
                onCheckedChange={(checked) =>
                  onSetIncludeSignificance(checked === true)
                }
              />
              <Label htmlFor="include-significance" className="cursor-pointer">
                {t.aggfile?.includeSignificance || 'Include significance letters (A, B, C)'}
              </Label>
            </div>

            {/* Significance level */}
            {format.includeSignificance && (
              <div className="pl-6 space-y-2">
                <Label>{t.aggfile?.confidenceLevel || 'Confidence level'}</Label>
                <RadioGroup
                  value={String(format.significanceLevel)}
                  onValueChange={(v) =>
                    onSetSignificanceLevel(Number(v))
                  }
                  className="flex gap-4"
                >
                  {[
                    { value: '0.90', label: '90%' },
                    { value: '0.95', label: '95%' },
                    { value: '0.99', label: '99%' },
                  ].map((opt) => (
                    <div
                      key={opt.value}
                      className="flex items-center space-x-1"
                    >
                      <RadioGroupItem
                        value={opt.value}
                        id={`sig-${opt.value}`}
                      />
                      <Label
                        htmlFor={`sig-${opt.value}`}
                        className="cursor-pointer"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </div>

          {/* Templates */}
          {projectId && currentConfig && onLoadTemplate && (
            <>
              <Separator />
              <TemplatesPanel
                projectId={projectId}
                currentConfig={currentConfig}
                onLoadTemplate={onLoadTemplate}
              />
            </>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex gap-2">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          {t.common.back}
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="flex-1">
          {t.aggfile?.preview || 'Preview'}
        </Button>
      </div>
    </div>
  );
}
