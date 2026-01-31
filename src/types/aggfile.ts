// Types for Aggfile Generator Feature (4-step wizard)

export interface BannerVariable {
  name: string;
  label: string;
  n_values: number;
  suggested: boolean;
}

export interface AnalysisVariable {
  name: string;
  label: string;
  n_values: number;
  variable_type: 'single' | 'multiple' | 'scale' | 'open';
}

export type ValueFormat = 'percentage' | 'decimal' | 'count';

// Legacy config (still used by /exports/aggfile)
export interface AggfileConfig {
  banner_variables: string[];
  analysis_variables: string[] | 'all';
  format: {
    value_type: ValueFormat;
    decimal_places: number;
    include_bases: boolean;
    include_significance: boolean;
    significance_level: number;
  };
}

export interface AggfileResponse {
  export_id: string;
  file_url: string;
  n_questions: number;
  n_banners: number;
  created_at: string;
}

// --- Generate Tables API types ---

export type AnalysisTypeOption =
  | 'frequency'
  | 'crosstab'
  | 'mean'
  | 'compare_means'
  | 'nps'
  | 'net_score'
  | 'crosstab_with_significance';

export type OutputFormat = 'json' | 'excel' | 'spss';

export interface CrosstabConfig {
  row_variables: string[];
  column_variables: string[];
  include_percentages: boolean;
  chi_square_test: boolean;
}

export interface FilterConfig {
  variable: string;
  values: (string | number)[];
}

export interface NetDefinition {
  name: string;
  values: (string | number)[];
}

export interface GenerateTablesConfig {
  selected_variables: string[];
  analysis_types: AnalysisTypeOption[];
  crosstab_config?: CrosstabConfig | null;
  filters?: FilterConfig[] | null;
  output_format: OutputFormat;
  confidence_level: number;
  net_definitions?: NetDefinition[] | null;
  title?: string | null;
}

export interface GenerateTablesPreviewResponse {
  title: string | null;
  total_analyses: number;
  analyses_plan: Record<string, unknown>[];
  estimated_variables: number;
  filters_summary: string[] | null;
  warnings: string[];
}

export interface TableResultItem {
  analysis_type: string;
  variable: string;
  cross_variable: string | null;
  title: string;
  result: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface GenerateTablesResponse {
  title: string | null;
  total_analyses: number;
  results: TableResultItem[];
  python_code: string | null;
  execution_time_ms: number;
  warnings: string[];
}

// --- Wizard state ---

export type AggfileStep =
  | 'banners'
  | 'stubs'
  | 'configure'
  | 'preview'
  | 'generating'
  | 'success'
  | 'error';

export interface AggfileState {
  step: AggfileStep;
  bannerVariables: BannerVariable[];
  analysisVariables: AnalysisVariable[];
  selectedBanners: string[];
  selectedAnalysis: string[] | 'all';
  analysisTypes: AnalysisTypeOption[];
  format: {
    valueType: ValueFormat;
    decimalPlaces: number;
    includeBases: boolean;
    includeSignificance: boolean;
    significanceLevel: number;
  };
  filters: FilterConfig[];
  netDefinitions: NetDefinition[];
  title: string;
  preview: GenerateTablesPreviewResponse | null;
  result: AggfileResponse | null;
  generateTablesResult: GenerateTablesResponse | null;
  error: string | null;
  isLoadingBanners: boolean;
  isLoadingAnalysis: boolean;
  isLoadingPreview: boolean;
  isGenerating: boolean;
  progress: number;
}

// Constants
export const MAX_BANNER_VARIABLES = 20;
export const DEFAULT_DECIMAL_PLACES = 1;

export const ANALYSIS_TYPE_LABELS: Record<AnalysisTypeOption, string> = {
  frequency: 'Frecuencias',
  crosstab: 'Tablas cruzadas',
  mean: 'Media',
  compare_means: 'Comparar medias',
  nps: 'NPS',
  net_score: 'Net Score',
  crosstab_with_significance: 'Crosstab con significancia',
};
