export interface ReportOptions {
  language: string;
  research_brief?: string;
  theme: 'modern_dark' | 'corporate_light' | 'minimal';
  include_speaker_notes: boolean;
  conversation_ids?: string[];
}

export interface ReportGenerateResponse {
  export_id: string;
  status: string;
}

export type ReportStatus = 'idle' | 'processing' | 'completed' | 'error';

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
