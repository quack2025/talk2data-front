export type ResponseStyle = 'executive' | 'detailed';
export type Tone = 'formal' | 'semiformal' | 'casual';
export type AutoVisualization = 'ask' | 'auto' | 'never';
export type ConfidenceLevel = '90' | '95' | '99';

export interface UserPreferences {
  response_style: ResponseStyle;
  tone: Tone;
  language: string;
  auto_visualizations: AutoVisualization;
  confidence_level: ConfidenceLevel;
  custom_summary_prompt: string | null;
}

export interface DefaultPromptResponse {
  default_prompt: string;
  available_placeholders: string[];
}

export const PLACEHOLDER_DESCRIPTIONS: Record<string, { es: string; en: string }> = {
  '{study_context}': {
    es: 'Contexto del estudio (objetivo, país, industria, etc.)',
    en: 'Study context (objective, country, industry, etc.)',
  },
  '{questionnaire}': {
    es: 'Texto del cuestionario si fue cargado',
    en: 'Questionnaire text if uploaded',
  },
  '{n_cases}': {
    es: 'Número de encuestados',
    en: 'Number of respondents',
  },
  '{variables}': {
    es: 'Lista de variables del dataset',
    en: 'List of dataset variables',
  },
  '{aggregated_data}': {
    es: 'Datos estadísticos precalculados',
    en: 'Pre-calculated statistical data',
  },
  '{response_style}': {
    es: 'Estilo de respuesta seleccionado',
    en: 'Selected response style',
  },
  '{tone}': {
    es: 'Tono seleccionado',
    en: 'Selected tone',
  },
  '{language}': {
    es: 'Idioma seleccionado',
    en: 'Selected language',
  },
};
