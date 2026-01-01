// Database types for Survey Genius

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: 'active' | 'processing' | 'completed' | 'archived';
  file_count: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  user_id: string;
  file_name: string;
  file_type: 'spss' | 'questionnaire';
  file_size: number;
  s3_key: string | null;
  metadata: Record<string, unknown>;
  status: 'pending' | 'uploading' | 'processing' | 'ready' | 'error';
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: {
    type?: 'text' | 'table' | 'chart';
    n?: number;
    p_value?: number;
    test_type?: string;
  };
  created_at: string;
}

export interface Export {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  format: 'pdf' | 'docx' | 'pptx';
  status: 'pending' | 'generating' | 'ready' | 'error';
  s3_key: string | null;
  options: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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
