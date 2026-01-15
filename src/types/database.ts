// Database types for Survey Genius - Adapted for Railway Backend
// These types match the Railway backend API responses

export type OwnerType = 'user' | 'team';
export type ProjectStatus = 'processing' | 'ready' | 'error';
export type FileType = 'spss_data' | 'questionnaire_pdf' | 'questionnaire_text';
export type MessageRole = 'user' | 'assistant';
export type ExportType = 'pdf' | 'excel' | 'pptx' | 'aggfile';

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_type: OwnerType;
  owner_id: string;
  status: ProjectStatus;
  created_at: string;
  n_cases?: number;
  n_variables?: number;
  has_executive_summary?: boolean;
  // Study context fields
  study_objective?: string;
  country?: string;
  industry?: string;
  target_audience?: string;
  brands?: string[];
  methodology?: string;
  study_date?: string;
  is_tracking?: boolean;
  wave_number?: number;
  additional_context?: string;
  report_language?: string;
}

export interface ProjectUpdateData {
  name?: string;
  description?: string;
  study_objective?: string;
  country?: string;
  industry?: string;
  target_audience?: string;
  brands?: string[];
  methodology?: string;
  study_date?: string;
  is_tracking?: boolean;
  wave_number?: number;
  additional_context?: string;
  report_language?: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  file_type: FileType;
  storage_url: string;
  original_name: string;
  size_bytes: number;
  uploaded_at: string;
}

export interface Conversation {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  created_at: string;
  last_activity: string;
  message_count?: number;
  messages?: Message[];
}

export type ChartType = 'bar' | 'horizontal_bar' | 'vertical_bar' | 'pie' | 'donut' | 'line' | 'nps_gauge';

export interface ChartDataStructured {
  labels: string[];
  values: number[];
  percentages?: number[];
  colors?: string[];
}

export interface ChartTableData {
  columns: string[];
  rows: (string | number)[][];
}

export interface ChartData {
  title: string;
  chart_type: ChartType;
  chart_base64?: string; // Fallback for compatibility
  data?: ChartDataStructured;
  table?: ChartTableData;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  analysis_executed?: Record<string, unknown>;
  charts?: ChartData[];
  created_at: string;
}

export interface QueryResponse {
  answer: string;
  conversation_id: string;
  message_id: string;
  analysis_performed?: Record<string, unknown>[];
  visualizations?: Record<string, unknown>;
  charts?: ChartData[];
}

export interface Export {
  id: string;
  export_type: ExportType;
  project_id: string;
  conversation_id?: string;
  download_url: string;
  created_at: string;
}

export interface ExecutiveSummary {
  id: string;
  project_id: string;
  content: string;
  key_findings?: string[];
  methodology_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  company: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}
