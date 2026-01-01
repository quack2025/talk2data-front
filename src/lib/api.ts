import { supabase } from "@/integrations/supabase/client";

// FastAPI Backend URL - will be configured via environment or secrets
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, headers = {} } = options;

    const token = await this.getAuthToken();
    
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Error de conexión" }));
      throw new Error(error.detail || error.message || `Error ${response.status}`);
    }

    return response.json();
  }

  // Convenience methods
  get<T>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: "POST", body, headers });
  }

  put<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: "PUT", body, headers });
  }

  patch<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: "PATCH", body, headers });
  }

  delete<T>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: "DELETE", headers });
  }

  // File upload with multipart/form-data
  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = await this.getAuthToken();
    
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Error de conexión" }));
      throw new Error(error.detail || error.message || `Error ${response.status}`);
    }

    return response.json();
  }
}

export const api = new ApiClient(API_BASE_URL);

// Type definitions for API responses
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "archived" | "processing";
  created_at: string;
  updated_at: string;
  file_count: number;
  variable_count?: number;
  record_count?: number;
}

export interface SPSSFile {
  id: string;
  project_id: string;
  filename: string;
  size_bytes: number;
  status: "uploading" | "processing" | "ready" | "error";
  variable_count?: number;
  record_count?: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  metadata?: {
    analysis_type?: string;
    n?: number;
    p_value?: number;
    variables?: string[];
  };
}

export interface ChatSession {
  id: string;
  project_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ExportReport {
  id: string;
  project_id: string;
  title: string;
  format: "pdf" | "docx";
  status: "generating" | "ready" | "error";
  download_url?: string;
  created_at: string;
}
