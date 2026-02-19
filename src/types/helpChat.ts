export interface HelpChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface HelpChatContext {
  current_page: string;
  current_section: string | null;
  project_id: string | null;
  project_name: string | null;
}

export interface HelpChatRequest {
  message: string;
  history: { role: string; content: string }[];
  context: HelpChatContext;
  language: string;
}

export interface HelpChatResponse {
  answer: string;
  remaining_today: number;
}
