// Database types for Survey Genius - Adapted for Railway Backend
// These types match the Railway backend API responses

export type OwnerType = 'user' | 'team';
export type ProjectStatus = 'processing' | 'ready' | 'error';
export type FileType = 'spss_data' | 'questionnaire_pdf' | 'questionnaire_text';
export type MessageRole = 'user' | 'assistant';
export type ExportType = 'pdf' | 'excel' | 'pptx';

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

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  analysis_executed?: Record<string, unknown>;
  created_at: string;
}

export interface QueryResponse {
  answer: string;
  conversation_id: string;
  message_id: string;
  analysis_performed?: Record<string, unknown>[];
  visualizations?: Record<string, unknown>;
}

export interface Export {
  id: string;
  export_type: ExportType;
  project_id: string;
  conversation_id?: string;
  download_url: string;
  created_at: string;
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
