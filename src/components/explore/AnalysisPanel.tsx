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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play,
  Loader2,
  X,
  BarChart2,
  Table2,
  GitCompare,
  TrendingUp,
  Star,
  MinusCircle,
  CheckSquare,
  Sigma,
  Layers,
  Search,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useLanguage } from '@/i18n/LanguageContext';
import type { ExploreVariable, ExploreRunRequest, FilterCondition } from '@/types/explore';
import { cn } from '@/lib/utils';

// ─── Analysis type definitions ─────────────────────────────────────────────

interface AnalysisTypeDef {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: { es: string; en: string };
  description: { es: string; en: string };
  needsCross?: boolean;
  needsSignificance?: boolean;
  needsMultipleVars?: boolean;
}

const ANALYSIS_TYPES: AnalysisTypeDef[] = [
  {
    id: 'frequency',
    icon: BarChart2,
    label: { es: 'Frecuencia', en: 'Frequency' },
    description: { es: 'Distribución de respuestas', en: 'Response distribution' },
  },
  {
    id: 'crosstab',
    icon: Table2,
    label: { es: 'Tabla cruzada', en: 'Crosstab' },
    description: { es: 'Cruce entre dos variables', en: 'Cross two variables' },
    needsCross: true,
  },
  {
    id: 'crosstab_with_significance',
    icon: GitCompare,
    label: { es: 'Cruce + significancia', en: 'Crosstab + sig.' },
    description: { es: 'Cruce con prueba estadística', en: 'Cross with significance test' },
    needsCross: true,
    needsSignificance: true,
  },
  {
    id: 'mean',
    icon: TrendingUp,
    label: { es: 'Media', en: 'Mean' },
    description: { es: 'Valor promedio', en: 'Average value' },
  },
  {
    id: 'compare_means',
    icon: GitCompare,
    label: { es: 'Comparar medias', en: 'Compare means' },
    description: { es: 'Media por grupos', en: 'Mean by groups' },
    needsCross: true,
  },
  {
    id: 'nps',
    icon: Star,
    label: { es: 'NPS', en: 'NPS' },
    description: { es: 'Net Promoter Score', en: 'Net Promoter Score' },
  },
  {
    id: 'net_score',
    icon: MinusCircle,
    label: { es: 'Net Score', en: 'Net Score' },
    description: { es: 'Top-2 menos Bottom-2', en: 'Top-2 minus Bottom-2' },
  },
  {
    id: 'multiple_response',
    icon: CheckSquare,
    label: { es: 'Resp. Multiple', en: 'Multiple Response' },
    description: { es: 'Frecuencia de menciones', en: 'Mention frequency' },
  },
  {
    id: 'regression',
    icon: Sigma,
    label: { es: 'Regresion', en: 'Regression' },
    description: { es: 'Predecir variable dependiente', en: 'Predict dependent variable' },
    needsMultipleVars: true,
  },
  {
    id: 'factor_analysis',
    icon: Layers,
    label: { es: 'Anal. Factorial', en: 'Factor Analysis' },
    description: { es: 'Reducir dimensiones (PCA/EFA)', en: 'Reduce dimensions (PCA/EFA)' },
    needsMultipleVars: true,
  },
];

// ─── Props ──────────────────────────────────────────────────────────────────

interface AnalysisPanelProps {
  selectedVariable: ExploreVariable | null;
  allVariables: ExploreVariable[];
  banners: string[];
  isRunning: boolean;
  onRun: (request: ExploreRunRequest) => void;
  segmentId?: string | null;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AnalysisPanel({
  selectedVariable,
  allVariables,
  banners,
  isRunning,
  onRun,
  segmentId,
}: AnalysisPanelProps) {
  const { t, language } = useLanguage();
  const [analysisType, setAnalysisType] = useState('frequency');
  const [crossVariable, setCrossVariable] = useState<string>('');
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  // Multi-variable selection (regression + factor analysis)
  const [selectedVars, setSelectedVars] = useState<string[]>([]);
  const [varSearch, setVarSearch] = useState('');
  // Factor analysis options
  const [faMethod, setFaMethod] = useState('pca');
  const [faRotation, setFaRotation] = useState('varimax');

  // When variable changes, reset to first suggested type
  useEffect(() => {
    if (selectedVariable) {
      const suggested = selectedVariable.suggested_analyses;
      if (suggested.length > 0 && !suggested.includes(analysisType)) {
        setAnalysisType(suggested[0]);
      }
    }
  }, [selectedVariable]);

  const currentTypeDef = ANALYSIS_TYPES.find((a) => a.id === analysisType);
  const needsCross = currentTypeDef?.needsCross ?? false;
  const needsSignificance = currentTypeDef?.needsSignificance ?? false;
  const needsMultipleVars = currentTypeDef?.needsMultipleVars ?? false;

  const toggleVar = (varName: string) => {
    setSelectedVars((prev) =>
      prev.includes(varName) ? prev.filter((v) => v !== varName) : [...prev, varName]
    );
  };

  const handleRun = () => {
    if (!selectedVariable) return;
    const request: ExploreRunRequest = {
      analysis_type: analysisType,
      variable: selectedVariable.name,
    };
    if (needsCross && crossVariable) {
      request.cross_variable = crossVariable;
    }
    if (needsSignificance) {
      request.confidence_level = confidenceLevel;
    }
    if (filters.length > 0) {
      request.filters = filters;
    }
    // MRS: auto-populate from group_key
    if (analysisType === 'multiple_response' && selectedVariable.group_key) {
      const groupVars = allVariables
        .filter((v) => v.group_key === selectedVariable.group_key)
        .map((v) => v.name);
      request.mrs_variables = groupVars;
      request.group_key = selectedVariable.group_key;
    }
    // Multi-variable analyses
    if (needsMultipleVars && selectedVars.length > 0) {
      request.variables = selectedVars;
    }
    // Factor analysis options
    if (analysisType === 'factor_analysis') {
      request.method = faMethod;
      request.rotation = faRotation === 'none' ? null : faRotation;
    }
    if (segmentId) {
      request.segment_id = segmentId;
    }
    onRun(request);
  };

  const addFilter = () =>
    setFilters((prev) => [...prev, { variable: '', operator: 'eq', value: '' }]);
  const removeFilter = (i: number) =>
    setFilters((prev) => prev.filter((_, idx) => idx !== i));
  const updateFilter = (i: number, field: keyof FilterCondition, value: any) =>
    setFilters((prev) => prev.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));

  // Sort suggested types first
  const suggested = selectedVariable?.suggested_analyses ?? [];
  const sortedTypes = [
    ...ANALYSIS_TYPES.filter((a) => suggested.includes(a.id)),
    ...ANALYSIS_TYPES.filter((a) => !suggested.includes(a.id)),
  ];

  if (!selectedVariable) {
    return (
      <Card className="flex items-center justify-center min-h-[120px]">
        <CardContent className="text-center text-muted-foreground pt-6">
          <p className="text-sm">{t.explore?.selectVariableHint || 'Selecciona una variable para comenzar'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded">
            {selectedVariable.name}
          </span>
          {selectedVariable.label && (
            <span className="font-normal text-muted-foreground text-sm truncate max-w-xs">
              {selectedVariable.label}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Analysis type selector (visual buttons) ── */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            {t.explore?.analysisType || 'Tipo de análisis'}
          </Label>
          <div className="grid grid-cols-3 gap-1.5">
            {sortedTypes.map((typeDef) => {
              const Icon = typeDef.icon;
              const isSuggested = suggested.includes(typeDef.id);
              const isSelected = analysisType === typeDef.id;
              return (
                <TooltipProvider key={typeDef.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          setAnalysisType(typeDef.id);
                          if (!typeDef.needsCross) setCrossVariable('');
                        }}
                        className={cn(
                          'flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-left transition-all w-full',
                          isSelected
                            ? 'border-primary bg-primary/5 text-foreground'
                            : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/50'
                        )}
                      >
                        <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', isSelected ? 'text-primary' : '')} />
                        <div className="min-w-0 flex items-center gap-1 flex-1">
                          <span className="font-medium text-xs truncate">
                            {typeDef.label[language as 'es' | 'en'] || typeDef.label.en}
                          </span>
                          {isSuggested && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 leading-none flex-shrink-0">
                              ✓
                            </Badge>
                          )}
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {typeDef.description[language as 'es' | 'en'] || typeDef.description.en}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>

        {/* ── Cross variable selector ── */}
        {needsCross && (
          <div className="space-y-1.5 rounded-md border border-primary/20 bg-primary/5 p-3">
            <Label className="text-xs font-medium">
              {t.explore?.crossVariable || 'Variable de cruce (banner)'}
            </Label>
            <Select value={crossVariable} onValueChange={setCrossVariable}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder={t.explore?.selectBanner || 'Seleccionar variable de cruce...'} />
              </SelectTrigger>
              <SelectContent>
                {banners.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                      Banners sugeridos
                    </div>
                    {banners
                      .filter((b) => b !== selectedVariable.name)
                      .map((b) => (
                        <SelectItem key={b} value={b}>
                          ★ {b}
                        </SelectItem>
                      ))}
                    <div className="my-1 border-t" />
                    <div className="px-2 py-1 text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                      Todas las variables
                    </div>
                  </>
                )}
                {allVariables
                  .filter((v) => v.name !== selectedVariable.name && !banners.includes(v.name))
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

        {/* ── Confidence level ── */}
        {needsSignificance && (
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

        {/* ── Multi-variable selector (regression / factor analysis) ── */}
        {needsMultipleVars && (
          <div className="space-y-2 rounded-md border border-primary/20 bg-primary/5 p-3">
            <Label className="text-xs font-medium">
              {analysisType === 'regression'
                ? (language === 'es' ? 'Variables independientes' : 'Independent variables')
                : (language === 'es' ? 'Variables a analizar' : 'Variables to analyze')}
              {selectedVars.length > 0 && (
                <span className="ml-1 text-muted-foreground">({selectedVars.length})</span>
              )}
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={language === 'es' ? 'Buscar variable...' : 'Search variable...'}
                value={varSearch}
                onChange={(e) => setVarSearch(e.target.value)}
                className="h-8 pl-7 text-xs"
              />
            </div>
            <ScrollArea className="h-40 rounded-md border bg-background">
              <div className="p-1">
                {allVariables
                  .filter((v) => v.name !== selectedVariable?.name)
                  .filter((v) => {
                    if (!varSearch) return true;
                    const q = varSearch.toLowerCase();
                    return v.name.toLowerCase().includes(q) || (v.label?.toLowerCase().includes(q) ?? false);
                  })
                  .map((v) => (
                    <label
                      key={v.name}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 cursor-pointer text-xs"
                    >
                      <Checkbox
                        checked={selectedVars.includes(v.name)}
                        onCheckedChange={() => toggleVar(v.name)}
                      />
                      <span className="font-mono text-[11px]">{v.name}</span>
                      {v.label && (
                        <span className="text-muted-foreground truncate">{v.label}</span>
                      )}
                    </label>
                  ))}
              </div>
            </ScrollArea>
            {selectedVars.length > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={() => setSelectedVars([])}>
                {language === 'es' ? 'Limpiar seleccion' : 'Clear selection'}
              </Button>
            )}
          </div>
        )}

        {/* ── Factor Analysis options ── */}
        {analysisType === 'factor_analysis' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">{language === 'es' ? 'Metodo' : 'Method'}</Label>
              <Select value={faMethod} onValueChange={setFaMethod}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pca">PCA</SelectItem>
                  <SelectItem value="efa">EFA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{language === 'es' ? 'Rotacion' : 'Rotation'}</Label>
              <Select value={faRotation} onValueChange={setFaRotation}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="varimax">Varimax</SelectItem>
                  <SelectItem value="promax">Promax</SelectItem>
                  <SelectItem value="none">{language === 'es' ? 'Sin rotacion' : 'None'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              {t.explore?.filters || 'Filtros'}
            </Label>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addFilter}>
              + {t.explore?.addFilter || 'Agregar filtro'}
            </Button>
          </div>
          {filters.map((filter, index) => (
            <div key={index} className="flex gap-1.5 items-center">
              <Select value={filter.variable} onValueChange={(v) => updateFilter(index, 'variable', v)}>
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
              <Select value={filter.operator} onValueChange={(v) => updateFilter(index, 'operator', v)}>
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
                className="h-8 w-24 rounded-md border px-2 text-xs bg-background"
                placeholder="Valor"
              />
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeFilter(index)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* ── Run button ── */}
        <Button
          onClick={handleRun}
          disabled={isRunning || !selectedVariable || (needsCross && !crossVariable) || (needsMultipleVars && selectedVars.length === 0)}
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
