// Team types for multi-user workspaces

export type TeamRole = 'admin' | 'editor' | 'viewer';

export interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id?: string | null;
  invited_email?: string | null;
  role: TeamRole;
  invited_by?: string;
  invited_at: string;
  accepted_at?: string;
  // Joined from profiles (when user exists)
  user_email?: string;
  user_name?: string;
  user_avatar?: string;
  // Computed
  is_pending?: boolean;
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
  member_count: number;
  is_owner: boolean;
  my_role?: TeamRole;
}

export interface CreateTeamData {
  name: string;
  description?: string;
}

export interface InviteMemberData {
  email: string;
  role: TeamRole;
}

export interface UpdateMemberRoleData {
  member_id: string;
  role: TeamRole;
}
