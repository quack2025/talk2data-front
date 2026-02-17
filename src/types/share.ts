/** Types for the Share Links API. */

export type ShareResourceType =
  | 'executive_summary'
  | 'conversation'
  | 'explore_bookmark'
  | 'export';

export interface ShareLinkCreate {
  resource_type: ShareResourceType;
  resource_id?: string | null;
  expires_in_hours?: number | null;
  password?: string | null;
  notes?: string | null;
}

export interface ShareLinkOut {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  created_by: string;
  token: string;
  resource_type: ShareResourceType;
  resource_id: string | null;
  is_active: boolean;
  expires_at: string | null;
  has_password: boolean;
  view_count: number;
  notes: string | null;
  share_url: string | null;
}

export interface SharedResourceResponse {
  resource_type: ShareResourceType;
  project_name: string;
  content: Record<string, any>;
}
