// Types for Data Preparation feature

export type DataPrepRuleType = 'cleaning' | 'weight' | 'net' | 'recode' | 'computed' | 'exclude_columns';

export interface DataPrepRule {
  id: string;
  project_id: string;
  name: string;
  rule_type: DataPrepRuleType;
  config: Record<string, any>;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface DataPrepRuleCreate {
  name: string;
  rule_type: DataPrepRuleType;
  config: Record<string, any>;
  order_index?: number;
  is_active?: boolean;
}

export interface DataPrepRuleUpdate {
  name?: string;
  config?: Record<string, any>;
  order_index?: number;
  is_active?: boolean;
}

// Rule-specific config types

export interface CleaningConfig {
  variable: string;
  operator: 'equals' | 'not_equals' | 'less_than' | 'greater_than' | 'less_equal' | 'greater_equal' | 'in' | 'not_in' | 'is_null' | 'is_not_null' | 'is_duplicate';
  value?: any;
  values?: any[];
  action?: 'drop' | 'filter';
}

export interface WeightTarget {
  variable: string;
  targets: Record<string, number>;
}

export interface WeightConfig {
  targets: Record<string, Record<string, number>>;
  max_iterations?: number;
  max_weight?: number;
  min_weight?: number;
}

export interface NetConfig {
  variable: string;
  net_name: string;
  codes: number[];
}

export interface RecodeMapping {
  from_codes: number[];
  to_value: number;
  label: string;
}

export interface RecodeConfig {
  variable: string;
  mappings: RecodeMapping[];
  new_variable_name?: string;
}

export interface ComputedCondition {
  variable: string;
  operator: 'equals' | 'not_equals' | 'in' | 'less_than' | 'greater_than';
  value?: any;
  values?: any[];
}

export interface ComputedConfig {
  name: string;
  label: string;
  conditions: ComputedCondition[];
  combine?: 'or' | 'and';
}

export interface DataPrepPreviewResponse {
  original_rows: number;
  final_rows: number;
  rows_affected: number;
  columns_added: string[];
  weight_summary?: Record<string, any>;
  warnings: string[];
}

// Lovable's summary type (used by DataPrepManager at dataprep/)
export interface DataPrepSummary {
  total_rules: number;
  active_rules: number;
  by_type: Record<DataPrepRuleType, number>;
}

// Sprint 9 detailed summary (used by API endpoint)
export interface DataPrepSummaryResponse {
  total_rules: number;
  active_rules: number;
  rules_by_type: Record<string, number>;
  description: string;
}

export const RULE_TYPE_LABELS: Record<DataPrepRuleType, { es: string; en: string }> = {
  cleaning: { es: 'Limpieza', en: 'Cleaning' },
  weight: { es: 'Ponderación', en: 'Weighting' },
  net: { es: 'Net / Top Box', en: 'Net / Top Box' },
  recode: { es: 'Recodificación', en: 'Recode' },
  computed: { es: 'Variable Calculada', en: 'Computed Variable' },
  exclude_columns: { es: 'Excluir Columnas', en: 'Exclude Columns' },
};

// Sprint 11: Variable Profiles

export interface VariableProfile {
  name: string;
  label: string | null;
  original_type: string;
  detected_type: string;
  detected_subtype: string | null;
  confidence: number;
  signals: string[];
  value_range: number[] | null;
  n_unique: number;
  n_missing: number;
  pct_missing: number;
  value_labels: Record<string, string> | null;
  group_key: string | null;
  suggested_actions: string[];
}

export interface VariableProfilesSummary {
  total_variables: number;
  likert_scales: number;
  nps_variables: number;
  demographics: number;
  open_ended: number;
  id_metadata: number;
  binary: number;
  multi_response_groups: number;
  grids: number;
  categorical_nominal: number;
  continuous_scale: number;
}

export interface VariableProfilesResponse {
  profiles: VariableProfile[];
  summary: VariableProfilesSummary;
}

// Sprint 11: Prep Suggestions

export interface PrepSuggestion {
  id: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rule_type: string;
  rule_config: Record<string, any>;
  rule_name: string;
  affected_variable: string | null;
  confidence: number;
  reasoning: string;
}

export interface PrepSuggestionsResponse {
  suggestions: PrepSuggestion[];
  total_suggestions: number;
  by_category: Record<string, number>;
}

export interface ApplySuggestionsResponse {
  rules_created: number;
  rules: DataPrepRule[];
  warnings: string[];
}

// Sprint 11: QC Report

export interface QCCheckResult {
  check_type: string;
  status: 'ok' | 'warning' | 'critical';
  flagged_count: number;
  total_cases: number;
  pct_flagged: number;
  threshold: string;
  description: string;
  suggested_action: string;
}

export interface QCReportResponse {
  checks: QCCheckResult[];
  overall_quality: 'good' | 'acceptable' | 'poor';
  total_flagged: number;
  recommendation: string;
}

// Sprint 11: Templates

export interface TemplateRequiredVariable {
  key: string;
  label: string;
  required: boolean;
  auto_detected_type: string | null;
}

export interface PrepTemplate {
  id: string;
  name: string;
  description: string;
  study_type: string;
  rules_preview: string[];
  required_variables: TemplateRequiredVariable[];
}

export interface TemplatesListResponse {
  templates: PrepTemplate[];
}

export interface ApplyTemplateResponse {
  rules_created: number;
  rules: DataPrepRule[];
  auto_mapped: Record<string, string>;
  unmapped: string[];
  warnings: string[];
}

export const CLEANING_OPERATORS: { value: string; label: { es: string; en: string } }[] = [
  { value: 'equals', label: { es: 'Igual a', en: 'Equals' } },
  { value: 'not_equals', label: { es: 'Diferente de', en: 'Not equals' } },
  { value: 'less_than', label: { es: 'Menor que', en: 'Less than' } },
  { value: 'greater_than', label: { es: 'Mayor que', en: 'Greater than' } },
  { value: 'less_equal', label: { es: 'Menor o igual', en: 'Less or equal' } },
  { value: 'greater_equal', label: { es: 'Mayor o igual', en: 'Greater or equal' } },
  { value: 'in', label: { es: 'Está en', en: 'In' } },
  { value: 'not_in', label: { es: 'No está en', en: 'Not in' } },
  { value: 'is_null', label: { es: 'Es nulo', en: 'Is null' } },
  { value: 'is_not_null', label: { es: 'No es nulo', en: 'Is not null' } },
  { value: 'is_duplicate', label: { es: 'Es duplicado', en: 'Is duplicate' } },
];
