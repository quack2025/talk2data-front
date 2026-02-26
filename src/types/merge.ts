/** Types for Dataset Merge feature (Sprint 13 — Gap G1). */

export type MergeType = 'append' | 'join' | 'wave_merge';

export interface JoinConfig {
  key_variable: string;
  how: 'left' | 'inner' | 'outer';
}

export interface MergeRequest {
  source_project_ids: string[];
  merge_type: MergeType;
  join_config?: JoinConfig | null;
  wave_labels?: string[] | null;
  apply_source_prep_rules: boolean;
  merged_project_name?: string | null;
}

export interface VariableConflict {
  variable: string;
  conflict_type: 'type_mismatch' | 'value_label_diff' | 'missing_in_source' | 'encoding_diff';
  details: string;
  sources: number[];
}

export interface CompatibilityReport {
  is_compatible: boolean;
  matched_variables: number;
  total_variables_union: number;
  conflicts: VariableConflict[];
  warnings: string[];
}

export interface MergeReport {
  source_cases: number[];
  matched_variables: number;
  new_variables: number;
  total_variables: number;
  conflicts: VariableConflict[];
  warnings: string[];
}

export interface MergeResponse {
  merged_project_id: string;
  total_cases: number;
  total_variables: number;
  merge_type: string;
  merge_report: MergeReport;
}

export interface ValidateCompatibilityRequest {
  source_project_ids: string[];
  merge_type: MergeType;
  join_config?: JoinConfig | null;
}

/** Simplified project info for the merge source selector. */
export interface ProjectSummary {
  id: string;
  name: string;
  n_cases?: number | null;
  n_variables?: number | null;
  status: string;
}

export const MERGE_TYPE_LABELS: Record<MergeType, { es: string; en: string; desc_es: string; desc_en: string }> = {
  append: {
    es: 'Concatenar (vertical)',
    en: 'Append (vertical)',
    desc_es: 'Combina filas de múltiples datasets. Ideal para combinar oleadas, splits de campo, o mercados.',
    desc_en: 'Combines rows from multiple datasets. Ideal for combining waves, fieldwork splits, or markets.',
  },
  join: {
    es: 'Unir (horizontal)',
    en: 'Join (horizontal)',
    desc_es: 'Combina columnas cruzando por una variable clave. Ideal para añadir datos CRM o ventas.',
    desc_en: 'Combines columns by matching on a key variable. Ideal for adding CRM or sales data.',
  },
  wave_merge: {
    es: 'Merge de oleadas',
    en: 'Wave merge',
    desc_es: 'Concatenación especializada para estudios tracking. Añade columna _wave automáticamente.',
    desc_en: 'Specialized append for tracking studies. Automatically adds _wave column.',
  },
};
