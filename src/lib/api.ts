import { supabase } from "@/integrations/supabase/client";

// FastAPI Backend URL - will be configured via environment or secrets
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  isServerError: boolean;
  isServiceUnavailable: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.isServerError = status >= 500;
    this.isServiceUnavailable = status === 0 || status === 502 || status === 503 || status === 504;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
  retries?: number;
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

  private async executeRequest(url: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(url, init);
    } catch {
      // Network error — backend unreachable
      throw new ApiError("Service temporarily unavailable", 0);
    }
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, headers = {}, retries = 0 } = options;

    const token = await this.getAuthToken();

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    const init: RequestInit = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    };

    let lastError: ApiError | null = null;
    const maxAttempts = 1 + retries;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.executeRequest(url, init);

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ message: "Connection error" }));
          throw new ApiError(
            errorBody.detail || errorBody.message || `Error ${response.status}`,
            response.status,
          );
        }

        return await response.json();
      } catch (err) {
        lastError = err instanceof ApiError
          ? err
          : new ApiError((err as Error).message || "Unknown error", 0);

        // Only retry on server errors (5xx) or network failures
        if (attempt < maxAttempts - 1 && (lastError.isServerError || lastError.status === 0)) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
      }
    }

    throw lastError!;
  }

  // Convenience methods
  get<T>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>, retries?: number) {
    return this.request<T>(endpoint, { method: "POST", body, headers, retries });
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

    const response = await this.executeRequest(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: "Connection error" }));
      throw new ApiError(
        errorBody.detail || errorBody.message || `Error ${response.status}`,
        response.status,
      );
    }

    return response.json();
  }
  // Download a file as blob (for Excel exports, etc.)
  async downloadBlob(endpoint: string, method: "GET" | "POST" = "POST", body?: unknown): Promise<Blob> {
    const token = await this.getAuthToken();

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (body) {
      headers["Content-Type"] = "application/json";
    }

    const response = await this.executeRequest(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: "Download error" }));
      throw new ApiError(
        errorBody.detail || errorBody.message || `Error ${response.status}`,
        response.status,
      );
    }

    return response.blob();
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
