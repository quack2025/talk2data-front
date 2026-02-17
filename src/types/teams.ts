// Team types matching FastAPI backend schemas

export type TeamRole = 'admin' | 'editor' | 'viewer';
export type TeamPlan = 'team' | 'enterprise';

export interface TeamMemberUser {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
}

export interface TeamMember {
  id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  user: TeamMemberUser | null;
}

export interface Team {
  id: string;
  name: string;
  plan: TeamPlan;
  owner_id: string;
  members: TeamMember[];
  created_at: string;
  updated_at?: string;
}

// Enriched type used by UI components
export interface TeamWithMembers extends Team {
  member_count: number;
  is_owner: boolean;
  my_role?: TeamRole;
}

export interface CreateTeamData {
  name: string;
}

export interface AddMemberData {
  user_id: string;
  role: TeamRole;
}
