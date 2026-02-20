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

export type ReportTone = 'executive' | 'workshop' | 'academic';

export const REPORT_TONES = [
  {
    value: 'executive' as const,
    labelEs: 'Ejecutivo', labelEn: 'Executive',
    descEs: 'Directo, conciso, orientado a decisiones.',
    descEn: 'Direct, concise, action-oriented.',
    exampleEs: '"La marca X lidera con 42% de share, 8pp por encima del competidor."',
    exampleEn: '"Brand X leads with 42% share, 8pp above the competitor."',
  },
  {
    value: 'workshop' as const,
    labelEs: 'Workshop', labelEn: 'Workshop',
    descEs: 'Conversacional, explicativo, invita a la discusión.',
    descEn: 'Conversational, explanatory, invites discussion.',
    exampleEs: '"Algo interesante que vemos es que la marca X tiene un 42% de share..."',
    exampleEn: '"Something interesting we see is that Brand X has a 42% share..."',
  },
  {
    value: 'academic' as const,
    labelEs: 'Académico', labelEn: 'Academic',
    descEs: 'Riguroso, con notas metodológicas, preciso.',
    descEn: 'Rigorous, with methodological notes, precise.',
    exampleEs: '"La marca X registra un share de 42.3% (n=1,204, IC 95%: ±2.8pp)."',
    exampleEn: '"Brand X reports a share of 42.3% (n=1,204, 95% CI: ±2.8pp)."',
  },
] as const;

export interface ReportOptions {
  language: string;
  research_brief?: string;
  theme: 'modern_dark' | 'corporate_light' | 'minimal';
  depth: ReportDepth;
  tone: ReportTone;
  include_speaker_notes: boolean;
  include_appendix: boolean;
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
    tone?: string;
    research_brief?: string;
    include_speaker_notes?: boolean;
    include_appendix?: boolean;
    conversation_ids?: string[] | null;
  } | null;
}

export interface ReportTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  config: {
    language?: string;
    theme?: string;
    depth?: string;
    tone?: string;
    include_speaker_notes?: boolean;
    include_appendix?: boolean;
    research_brief?: string;
  };
  created_at: string;
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
