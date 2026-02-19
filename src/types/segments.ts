/** Types for Segment Manager feature. */

export interface SegmentCondition {
  variable: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in';
  value?: string | number | null;
  values?: (string | number)[] | null;
}

export interface SegmentConditionGroup {
  logic: 'and';
  conditions: SegmentCondition[];
}

export interface Segment {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  description: string | null;
  conditions: SegmentConditionGroup;
  is_active: boolean;
  created_at: string;
}

export interface SegmentCreate {
  name: string;
  description?: string | null;
  conditions: SegmentConditionGroup;
}

export interface SegmentUpdate {
  name?: string;
  description?: string | null;
  conditions?: SegmentConditionGroup;
  is_active?: boolean;
}

export interface SegmentPreviewResponse {
  original_rows: number;
  filtered_rows: number;
  pct_remaining: number;
}

export const OPERATOR_LABELS: Record<string, { es: string; en: string }> = {
  eq: { es: 'Igual a', en: 'Equals' },
  ne: { es: 'Diferente de', en: 'Not equal' },
  gt: { es: 'Mayor que', en: 'Greater than' },
  lt: { es: 'Menor que', en: 'Less than' },
  gte: { es: 'Mayor o igual', en: 'Greater or equal' },
  lte: { es: 'Menor o igual', en: 'Less or equal' },
  in: { es: 'Es uno de', en: 'Is one of' },
  not_in: { es: 'No es uno de', en: 'Is not one of' },
};
