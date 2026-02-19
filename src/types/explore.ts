/** Types for the Explore Mode API. */

export interface ExploreVariable {
  name: string;
  label: string | null;
  type: string;
  detected_type: string | null;
  detected_subtype: string | null;
  n_unique: number;
  n_missing: number;
  pct_missing: number;
  value_labels: Record<string, string> | null;
  suggested_analyses: string[];
  group_key: string | null;
  question_text: string | null;
}

export interface ExploreVariableGroup {
  name: string;
  variables: string[];
}

export interface ExploreVariablesResponse {
  variables: ExploreVariable[];
  total: number;
  groups: ExploreVariableGroup[];
  banners: string[];
}

export interface FilterCondition {
  variable: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in';
  value: string | number | (string | number)[];
}

export interface ExploreRunRequest {
  analysis_type: string;
  variable: string;
  cross_variable?: string;
  filters?: FilterCondition[];
  confidence_level?: number;
  nets?: Record<string, (string | number)[]>;
  // Multiple Response Sets
  mrs_variables?: string[];
  group_key?: string;
  // Regression + Factor Analysis (multi-variable)
  variables?: string[];
  // Factor Analysis specific
  n_factors?: number;
  method?: string; // "pca" or "efa"
  rotation?: string | null; // "varimax", "promax", or null
  // Segment filter
  segment_id?: string;
}

export interface ExploreRunResponse {
  success: boolean;
  analysis_type: string;
  variable: string;
  variable_label: string | null;
  cross_variable: string | null;
  cross_variable_label: string | null;
  result: Record<string, any> | null;
  sample_size: number | null;
  warnings: string[];
  execution_time_ms: number;
  python_code: string | null;
  error: string | null;
}

export interface ExploreBookmarkCreate {
  title: string;
  analysis_config: Record<string, any>;
  result_snapshot: Record<string, any>;
  notes?: string;
}

export interface ExploreBookmark {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  analysis_config: Record<string, any>;
  result_snapshot: Record<string, any>;
  notes: string | null;
  created_at: string;
}
