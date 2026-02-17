// API Key types for key management

export type APIKeyPermission = 'read' | 'write' | 'admin';

export type OwnerType = 'user' | 'team';

export interface APIKeyCreate {
  name: string;
  permissions?: APIKeyPermission;
  owner_type?: OwnerType;
  team_id?: string | null;
}

export interface APIKeyOut {
  id: string;
  name: string;
  permissions: APIKeyPermission;
  owner_type: OwnerType;
  last_used_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface APIKeyWithSecret extends APIKeyOut {
  key: string;
}
