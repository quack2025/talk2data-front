// Types for Variable Groups feature

export interface SubGroupDefinition {
  name: string;
  variables: string[];
}

export interface VariableGroup {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  group_type: 'awareness' | 'grid' | 'ranking' | 'scale' | 'custom';
  variables: string[];
  sub_groups: SubGroupDefinition[] | null;
  created_at: string;
  updated_at: string | null;
}

export interface VariableGroupCreate {
  name: string;
  description?: string | null;
  group_type: string;
  variables: string[];
  sub_groups?: SubGroupDefinition[] | null;
}

export interface VariableGroupUpdate {
  name?: string;
  description?: string | null;
  group_type?: string;
  variables?: string[];
  sub_groups?: SubGroupDefinition[] | null;
}

export interface VariableGroupSuggestion {
  name: string;
  group_type: string;
  variables: string[];
  sub_groups: SubGroupDefinition[] | null;
  confidence: number;
  detection_method: string;
}

export interface AutoDetectResponse {
  suggestions: VariableGroupSuggestion[];
  total_variables_analyzed: number;
  detection_methods_used: string[];
}

export const GROUP_TYPE_LABELS: Record<string, { es: string; en: string }> = {
  awareness: { es: 'Conocimiento', en: 'Awareness' },
  grid: { es: 'Batería / Grid', en: 'Grid / Battery' },
  ranking: { es: 'Ranking', en: 'Ranking' },
  scale: { es: 'Escala', en: 'Scale' },
  custom: { es: 'Personalizado', en: 'Custom' },
};
