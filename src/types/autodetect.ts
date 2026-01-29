// Types for QuantipyMRX Auto-Detection & Grouped Analysis

export interface DetectedBanner {
  variable: string;
  label: string;
  banner_type: string;
  confidence: number;
  n_categories: number;
  categories: string[];
}

export interface DetectedGroup {
  name: string;
  display_name: string;
  question_type: string;
  variables: string[];
  confidence: number;
  suggested_calculations: string[];
  metadata: Record<string, unknown>;
}

export interface DetectedVariable {
  name: string;
  label: string;
  question_type: string;
  confidence: number;
  group_name: string | null;
  suggested_calculations: string[];
}

export interface ProcessingSpec {
  dataset_name: string;
  case_count: number;
  detected_weight: string | null;
  banners: DetectedBanner[];
  variable_groups: DetectedGroup[];
  individual_variables: DetectedVariable[];
  suggested_analyses: SuggestedAnalysis[];
}

export interface SuggestedAnalysis {
  type: string;
  variables: string[];
  description: string;
}

// Grouped analysis results
export interface GroupSummaryBase {
  group_name: string;
  display_name: string;
  question_type: string;
  variables: string[];
  confidence: number;
  summary_type: string;
  error?: string;
}

export interface AwarenessItem {
  item: string;
  base: number;
  aware_count: number;
  awareness_pct: number;
}

export interface AwarenessSummary extends GroupSummaryBase {
  summary_type: "awareness";
  total_base: number;
  average_awareness: number;
  items: AwarenessItem[];
}

export interface GridItem {
  item: string;
  base: number;
  mean: number;
  std_dev: number;
  top2box?: number;
  bottom2box?: number;
}

export interface GridSummary extends GroupSummaryBase {
  summary_type: "grid";
  overall_mean: number;
  scale_min: number;
  scale_max: number;
  items: GridItem[];
}

export interface TopOfMindItem {
  item: string;
  count: number;
  pct: number;
}

export interface TopOfMindSummary extends GroupSummaryBase {
  summary_type: "top_of_mind";
  total_base: number;
  total_mentioners: number;
  first_mention: TopOfMindItem[];
}

export type GroupSummary = AwarenessSummary | GridSummary | TopOfMindSummary | GroupSummaryBase;

export interface GroupedAnalysisResult {
  groups: GroupSummary[];
  total_groups_processed: number;
  errors: string[];
}
