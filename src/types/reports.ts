export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  message_count: number;
  analysis_count: number;
}

export type ReportDepth = 'compact' | 'standard' | 'detailed';

export const REPORT_DEPTHS = [
  { value: 'compact' as const, labelEs: 'Compacto', labelEn: 'Compact', descEs: '8-12 slides. Ideal para resúmenes ejecutivos.', descEn: '8-12 slides. Ideal for executive summaries.' },
  { value: 'standard' as const, labelEs: 'Estándar', labelEn: 'Standard', descEs: '15-25 slides. Balance entre detalle y concisión.', descEn: '15-25 slides. Balance of detail and conciseness.' },
  { value: 'detailed' as const, labelEs: 'Detallado', labelEn: 'Detailed', descEs: '30-45 slides. Análisis completo con desgloses.', descEn: '30-45 slides. Full analysis with breakdowns.' },
] as const;

export interface ReportOptions {
  language: string;
  research_brief?: string;
  theme: 'modern_dark' | 'corporate_light' | 'minimal';
  depth: ReportDepth;
  include_speaker_notes: boolean;
  conversation_ids?: string[];
}

export interface ReportGenerateResponse {
  export_id: string;
  status: string;
}

export type ReportStatus = 'idle' | 'processing' | 'completed' | 'error';

export interface ReportHistoryItem {
  id: string;
  project_id: string;
  export_type: string;
  storage_url: string;
  created_at: string;
  generated_by: string;
  metadata: {
    language?: string;
    theme?: string;
    depth?: string;
    research_brief?: string;
    include_speaker_notes?: boolean;
    conversation_ids?: string[] | null;
  } | null;
}

export const REPORT_THEMES = [
  { value: 'modern_dark', labelEs: 'Moderno Oscuro', labelEn: 'Modern Dark' },
  { value: 'corporate_light', labelEs: 'Corporativo Claro', labelEn: 'Corporate Light' },
  { value: 'minimal', labelEs: 'Minimalista', labelEn: 'Minimal' },
] as const;

export const REPORT_LANGUAGES = [
  { value: 'es', labelEs: 'Español', labelEn: 'Spanish' },
  { value: 'en', labelEs: 'Inglés', labelEn: 'English' },
  { value: 'pt', labelEs: 'Portugués', labelEn: 'Portuguese' },
] as const;
