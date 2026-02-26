/**
 * WidgetConfigEditor — side panel for editing a widget's analysis config.
 *
 * Allows setting: variable, cross_variable, chart_type, metric, text_content.
 * Uses the explore/variables API for the variable selector.
 *
 * Sprint 17a (Gap G4)
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Save } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useExplore } from '@/hooks/useExplore';
import type {
  DashboardWidget,
  WidgetAnalysisConfig,
  WidgetType,
  ChartType,
} from '@/types/dashboard';
import { WIDGET_TYPE_LABELS, CHART_TYPE_LABELS } from '@/types/dashboard';

interface WidgetConfigEditorProps {
  widget: DashboardWidget;
  projectId: string;
  onSave: (widgetId: string, config: {
    title?: string;
    widget_type?: WidgetType;
    analysis_config?: WidgetAnalysisConfig;
  }) => void;
  onClose: () => void;
}

const ANALYSIS_TYPE_FOR_WIDGET: Record<string, string> = {
  kpi_card: 'kpi',
  frequency_chart: 'frequency',
  crosstab_table: 'crosstab',
  nps_gauge: 'nps',
  compare_means_chart: 'compare_means',
  trend_line: 'trend',
  text_block: 'text',
};

const KPI_METRICS = [
  { value: 'mean', labelEs: 'Promedio', labelEn: 'Mean' },
  { value: 'median', labelEs: 'Mediana', labelEn: 'Median' },
  { value: 'count', labelEs: 'Conteo', labelEn: 'Count' },
  { value: 'sum', labelEs: 'Suma', labelEn: 'Sum' },
  { value: 'percentage', labelEs: 'Porcentaje', labelEn: 'Percentage' },
];

const CHART_OPTIONS: ChartType[] = [
  'bar', 'horizontal_bar', 'pie', 'donut', 'line', 'stacked_bar', 'table',
];

export function WidgetConfigEditor({
  widget,
  projectId,
  onSave,
  onClose,
}: WidgetConfigEditorProps) {
  const { language } = useLanguage();
  const lang = language as 'es' | 'en';
  const { variables, fetchVariables } = useExplore(projectId);

  const [title, setTitle] = useState(widget.title);
  const [variable, setVariable] = useState(widget.analysis_config.variable || '');
  const [crossVariable, setCrossVariable] = useState(
    widget.analysis_config.cross_variable || ''
  );
  const [chartType, setChartType] = useState<string>(
    widget.analysis_config.chart_type || 'bar'
  );
  const [metric, setMetric] = useState(widget.analysis_config.metric || 'mean');
  const [textContent, setTextContent] = useState(
    widget.analysis_config.text_content || ''
  );

  useEffect(() => {
    fetchVariables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analysisType = ANALYSIS_TYPE_FOR_WIDGET[widget.widget_type] || 'frequency';
  const needsVariable = analysisType !== 'text';
  const needsCrossVariable = ['crosstab', 'compare_means', 'trend'].includes(analysisType);
  const needsChartType = ['frequency'].includes(analysisType);
  const needsMetric = analysisType === 'kpi';
  const needsTextContent = analysisType === 'text';

  const handleSave = () => {
    const config: WidgetAnalysisConfig = {
      analysis_type: analysisType,
      variable: needsVariable ? variable : undefined,
      cross_variable: needsCrossVariable ? crossVariable : undefined,
      chart_type: needsChartType ? (chartType as ChartType) : undefined,
      metric: needsMetric ? metric : undefined,
      text_content: needsTextContent ? textContent : undefined,
    };
    onSave(widget.id, { title, analysis_config: config });
  };

  return (
    <div className="flex flex-col h-full border-l bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">
          {lang === 'es' ? 'Configurar widget' : 'Configure Widget'}
        </h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs">{lang === 'es' ? 'Título' : 'Title'}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* Widget Type (read-only) */}
          <div className="space-y-1.5">
            <Label className="text-xs">{lang === 'es' ? 'Tipo' : 'Type'}</Label>
            <div className="text-sm text-muted-foreground px-2 py-1.5 bg-muted rounded">
              {WIDGET_TYPE_LABELS[widget.widget_type]?.[lang] || widget.widget_type}
            </div>
          </div>

          {/* Variable selector */}
          {needsVariable && (
            <div className="space-y-1.5">
              <Label className="text-xs">{lang === 'es' ? 'Variable' : 'Variable'}</Label>
              <Select value={variable} onValueChange={setVariable}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue
                    placeholder={
                      lang === 'es' ? 'Seleccionar variable...' : 'Select variable...'
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {(variables || []).map((v) => (
                    <SelectItem key={v.name} value={v.name} className="text-xs">
                      {v.label || v.name}
                      <span className="ml-1 text-muted-foreground">({v.type})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Cross variable (for crosstab, compare_means, trend) */}
          {needsCrossVariable && (
            <div className="space-y-1.5">
              <Label className="text-xs">
                {lang === 'es' ? 'Variable cruzada' : 'Cross Variable'}
              </Label>
              <Select value={crossVariable} onValueChange={setCrossVariable}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue
                    placeholder={
                      lang === 'es' ? 'Seleccionar banner...' : 'Select banner...'
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {(variables || []).map((v) => (
                    <SelectItem key={v.name} value={v.name} className="text-xs">
                      {v.label || v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Chart type (for frequency) */}
          {needsChartType && (
            <div className="space-y-1.5">
              <Label className="text-xs">
                {lang === 'es' ? 'Tipo de gráfico' : 'Chart Type'}
              </Label>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHART_OPTIONS.map((ct) => (
                    <SelectItem key={ct} value={ct} className="text-xs">
                      {CHART_TYPE_LABELS[ct]?.[lang] || ct}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Metric (for KPI) */}
          {needsMetric && (
            <div className="space-y-1.5">
              <Label className="text-xs">
                {lang === 'es' ? 'Métrica' : 'Metric'}
              </Label>
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KPI_METRICS.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="text-xs">
                      {lang === 'es' ? m.labelEs : m.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Text content (for text_block) */}
          {needsTextContent && (
            <div className="space-y-1.5">
              <Label className="text-xs">
                {lang === 'es' ? 'Contenido' : 'Content'}
              </Label>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="text-sm min-h-[120px]"
                placeholder="## Title&#10;Content here..."
              />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Save button */}
      <div className="p-4 border-t">
        <Button onClick={handleSave} className="w-full gap-2" size="sm">
          <Save className="h-3.5 w-3.5" />
          {lang === 'es' ? 'Guardar y actualizar' : 'Save & Refresh'}
        </Button>
      </div>
    </div>
  );
}
