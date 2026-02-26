// Types for Dashboard Feature — Sprint 16a (Gap G4)

export type WidgetType =
  | 'frequency_chart'
  | 'crosstab_table'
  | 'kpi_card'
  | 'nps_gauge'
  | 'trend_line'
  | 'compare_means_chart'
  | 'text_block';

export type ChartType =
  | 'bar'
  | 'horizontal_bar'
  | 'pie'
  | 'donut'
  | 'line'
  | 'stacked_bar'
  | 'table';

export interface GlobalFilterConfig {
  variable: string;
  label: string;
  filter_type: string;
}

export interface DashboardTheme {
  primary_color: string;
  logo_url?: string | null;
  company_name?: string | null;
}

export interface WidgetAnalysisConfig {
  analysis_type: string;
  variable?: string | null;
  cross_variable?: string | null;
  chart_type?: ChartType | null;
  metric?: string | null;
  format_string?: string | null;
  show_significance?: boolean;
  segment_id?: string | null;
  text_content?: string | null;
}

export interface WidgetLayoutItem {
  widget_id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// --- API response types ---

export interface DashboardWidget {
  id: string;
  created_at: string;
  dashboard_id: string;
  widget_type: WidgetType;
  title: string;
  analysis_config: WidgetAnalysisConfig;
  cached_result: Record<string, unknown> | null;
  cached_at: string | null;
  order_index: number;
}

export interface Dashboard {
  id: string;
  created_at: string;
  project_id: string;
  user_id: string;
  name: string;
  description: string | null;
  layout: WidgetLayoutItem[];
  global_filters: GlobalFilterConfig[];
  is_published: boolean;
  share_token: string | null;
  theme: DashboardTheme | null;
  updated_at: string | null;
}

export interface DashboardDetail extends Dashboard {
  widgets: DashboardWidget[];
}

// --- Request types ---

export interface DashboardCreateRequest {
  name: string;
  description?: string | null;
  global_filters?: GlobalFilterConfig[];
  theme?: DashboardTheme | null;
}

export interface DashboardUpdateRequest {
  name?: string;
  description?: string | null;
  layout?: WidgetLayoutItem[];
  global_filters?: GlobalFilterConfig[];
  theme?: DashboardTheme | null;
}

export interface WidgetCreateRequest {
  widget_type: WidgetType;
  title: string;
  analysis_config: WidgetAnalysisConfig;
  order_index?: number;
}

export interface WidgetUpdateRequest {
  widget_type?: WidgetType;
  title?: string;
  analysis_config?: WidgetAnalysisConfig;
  order_index?: number;
}

export interface WidgetCacheRefreshResponse {
  dashboard_id: string;
  widgets_refreshed: number;
  errors: string[];
}

// --- Constants ---

export const WIDGET_TYPE_LABELS: Record<WidgetType, { es: string; en: string }> = {
  frequency_chart: { es: 'Gráfico de frecuencias', en: 'Frequency Chart' },
  crosstab_table: { es: 'Tabla cruzada', en: 'Crosstab Table' },
  kpi_card: { es: 'Indicador KPI', en: 'KPI Card' },
  nps_gauge: { es: 'Medidor NPS', en: 'NPS Gauge' },
  trend_line: { es: 'Línea de tendencia', en: 'Trend Line' },
  compare_means_chart: { es: 'Comparación de medias', en: 'Compare Means' },
  text_block: { es: 'Bloque de texto', en: 'Text Block' },
};

export const CHART_TYPE_LABELS: Record<ChartType, { es: string; en: string }> = {
  bar: { es: 'Barras', en: 'Bar' },
  horizontal_bar: { es: 'Barras horizontales', en: 'Horizontal Bar' },
  pie: { es: 'Pastel', en: 'Pie' },
  donut: { es: 'Dona', en: 'Donut' },
  line: { es: 'Línea', en: 'Line' },
  stacked_bar: { es: 'Barras apiladas', en: 'Stacked Bar' },
  table: { es: 'Tabla', en: 'Table' },
};
