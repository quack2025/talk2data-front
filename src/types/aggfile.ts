// Types for Aggfile Generator Feature

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

export type AggfileStep = 'banners' | 'analysis' | 'generating' | 'success' | 'error';

export interface AggfileState {
  step: AggfileStep;
  bannerVariables: BannerVariable[];
  analysisVariables: AnalysisVariable[];
  selectedBanners: string[];
  selectedAnalysis: string[] | 'all';
  format: {
    valueType: ValueFormat;
    decimalPlaces: number;
    includeBases: boolean;
    includeSignificance: boolean;
    significanceLevel: number;
  };
  result: AggfileResponse | null;
  error: string | null;
  isLoadingBanners: boolean;
  isLoadingAnalysis: boolean;
  isGenerating: boolean;
  progress: number;
}

// Constants
export const MAX_BANNER_VARIABLES = 20;
export const DEFAULT_DECIMAL_PLACES = 1;
