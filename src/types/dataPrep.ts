export type DataPrepRuleType = 'cleaning' | 'weight' | 'net' | 'recode' | 'computed';

export interface DataPrepRule {
  id: string;
  project_id: string;
  name: string;
  rule_type: DataPrepRuleType;
  config: Record<string, unknown>;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface DataPrepRuleCreate {
  name: string;
  rule_type: DataPrepRuleType;
  config: Record<string, unknown>;
  order_index?: number;
  is_active?: boolean;
}

export interface DataPrepPreviewResponse {
  original_rows: number;
  final_rows: number;
  rows_affected: number;
  columns_added: string[];
  weight_summary?: Record<string, unknown>;
  warnings: string[];
}

export interface DataPrepSummary {
  total_rules: number;
  active_rules: number;
  by_type: Record<DataPrepRuleType, number>;
}
