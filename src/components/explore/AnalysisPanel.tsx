import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Play, Loader2, X } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { ExploreVariable, ExploreRunRequest, FilterCondition } from '@/types/explore';

const ALL_ANALYSIS_TYPES = [
  'frequency',
  'crosstab',
  'crosstab_with_significance',
  'mean',
  'compare_means',
  'nps',
  'net_score',
];

const ANALYSIS_LABELS: Record<string, { es: string; en: string }> = {
  frequency: { es: 'Frecuencia', en: 'Frequency' },
  crosstab: { es: 'Tabla cruzada', en: 'Crosstab' },
  crosstab_with_significance: { es: 'Cruce con significancia', en: 'Crosstab (significance)' },
  mean: { es: 'Media', en: 'Mean' },
  compare_means: { es: 'Comparar medias', en: 'Compare means' },
  nps: { es: 'NPS', en: 'NPS' },
  net_score: { es: 'Net Score', en: 'Net Score' },
};

interface AnalysisPanelProps {
  selectedVariable: ExploreVariable | null;
  allVariables: ExploreVariable[];
  banners: string[];
  isRunning: boolean;
  onRun: (request: ExploreRunRequest) => void;
}

export function AnalysisPanel({
  selectedVariable,
  allVariables,
  banners,
  isRunning,
  onRun,
}: AnalysisPanelProps) {
  const { t, language } = useLanguage();
  const [analysisType, setAnalysisType] = useState('frequency');
  const [crossVariable, setCrossVariable] = useState<string>('');
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  // Reset analysis type when variable changes
  useEffect(() => {
    if (selectedVariable) {
      const suggested = selectedVariable.suggested_analyses;
      if (suggested.length > 0 && !suggested.includes(analysisType)) {
        setAnalysisType(suggested[0]);
      }
    }
  }, [selectedVariable]);

  const needsCrossVariable = [
    'crosstab',
    'crosstab_with_significance',
    'compare_means',
  ].includes(analysisType);

  const handleRun = () => {
    if (!selectedVariable) return;

    const request: ExploreRunRequest = {
      analysis_type: analysisType,
      variable: selectedVariable.name,
    };

    if (needsCrossVariable && crossVariable) {
      request.cross_variable = crossVariable;
    }

    if (analysisType === 'crosstab_with_significance') {
      request.confidence_level = confidenceLevel;
    }

    if (filters.length > 0) {
      request.filters = filters;
    }

    onRun(request);
  };

  const addFilter = () => {
    setFilters((prev) => [...prev, { variable: '', operator: 'eq', value: '' }]);
  };

  const removeFilter = (index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, field: keyof FilterCondition, value: any) => {
    setFilters((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f))
    );
  };

  const availableTypes = selectedVariable
    ? ALL_ANALYSIS_TYPES.filter(
        (t) =>
          selectedVariable.suggested_analyses.includes(t) ||
          ALL_ANALYSIS_TYPES.includes(t)
      )
    : ALL_ANALYSIS_TYPES;

  // Sort: suggested first, then rest
  const sortedTypes = selectedVariable
    ? [
        ...availableTypes.filter((t) =>
          selectedVariable.suggested_analyses.includes(t)
        ),
        ...availableTypes.filter(
          (t) => !selectedVariable.suggested_analyses.includes(t)
        ),
      ]
    : availableTypes;

  // Remove duplicates
  const uniqueTypes = [...new Set(sortedTypes)];

  if (!selectedVariable) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center text-muted-foreground">
          <p>{t.explore?.selectVariableHint || 'Selecciona una variable para comenzar'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="font-mono text-sm">{selectedVariable.name}</span>
          {selectedVariable.label && (
            <span className="font-normal text-muted-foreground text-sm truncate">
              {selectedVariable.label}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analysis Type */}
        <div className="space-y-1.5">
          <Label className="text-xs">{t.explore?.analysisType || 'Tipo de análisis'}</Label>
          <Select value={analysisType} onValueChange={setAnalysisType}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {ANALYSIS_LABELS[type]?.[language] || type}
                  {selectedVariable.suggested_analyses.includes(type) && ' *'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cross Variable */}
        {needsCrossVariable && (
          <div className="space-y-1.5">
            <Label className="text-xs">{t.explore?.crossVariable || 'Variable de cruce (banner)'}</Label>
            <Select value={crossVariable} onValueChange={setCrossVariable}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t.explore?.selectBanner || 'Seleccionar banner...'} />
              </SelectTrigger>
              <SelectContent>
                {/* Banners first */}
                {banners.length > 0 && (
                  <>
                    {banners
                      .filter((b) => b !== selectedVariable.name)
                      .map((b) => (
                        <SelectItem key={b} value={b}>
                          {b} *
                        </SelectItem>
                      ))}
                  </>
                )}
                {/* Then all other variables */}
                {allVariables
                  .filter(
                    (v) =>
                      v.name !== selectedVariable.name && !banners.includes(v.name)
                  )
                  .map((v) => (
                    <SelectItem key={v.name} value={v.name}>
                      {v.name}
                      {v.label ? ` — ${v.label}` : ''}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Confidence Level */}
        {analysisType === 'crosstab_with_significance' && (
          <div className="space-y-1.5">
            <Label className="text-xs">
              {t.explore?.confidenceLevel || 'Nivel de confianza'}: {(confidenceLevel * 100).toFixed(0)}%
            </Label>
            <Slider
              value={[confidenceLevel]}
              onValueChange={([v]) => setConfidenceLevel(v)}
              min={0.8}
              max={0.99}
              step={0.01}
            />
          </div>
        )}

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">{t.explore?.filters || 'Filtros'}</Label>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addFilter}>
              + {t.explore?.addFilter || 'Agregar filtro'}
            </Button>
          </div>
          {filters.map((filter, index) => (
            <div key={index} className="flex gap-1.5 items-center">
              <Select
                value={filter.variable}
                onValueChange={(v) => updateFilter(index, 'variable', v)}
              >
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Variable" />
                </SelectTrigger>
                <SelectContent>
                  {allVariables.map((v) => (
                    <SelectItem key={v.name} value={v.name}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filter.operator}
                onValueChange={(v) => updateFilter(index, 'operator', v)}
              >
                <SelectTrigger className="h-8 text-xs w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eq">=</SelectItem>
                  <SelectItem value="ne">!=</SelectItem>
                  <SelectItem value="gt">&gt;</SelectItem>
                  <SelectItem value="lt">&lt;</SelectItem>
                  <SelectItem value="in">in</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="text"
                value={String(filter.value)}
                onChange={(e) => updateFilter(index, 'value', e.target.value)}
                className="h-8 w-24 rounded-md border px-2 text-xs"
                placeholder="Valor"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => removeFilter(index)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Run Button */}
        <Button
          onClick={handleRun}
          disabled={isRunning || !selectedVariable}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t.explore?.running || 'Ejecutando...'}
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              {t.explore?.runAnalysis || 'Ejecutar análisis'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
