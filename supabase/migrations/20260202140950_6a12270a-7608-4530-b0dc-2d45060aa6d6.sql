-- 1. Create enum for team roles
CREATE TYPE public.team_role AS ENUM ('admin', 'editor', 'viewer');

-- 2. Create teams table
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create team_members table (many-to-many with roles)
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role team_role NOT NULL DEFAULT 'viewer',
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (team_id, user_id)
);

-- 4. Add team_id to projects table (optional - project can belong to user OR team)
ALTER TABLE public.projects ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- 5. Create indexes for performance
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_projects_team_id ON public.projects(team_id);

-- 6. Enable RLS on new tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 7. Create security definer function to check team membership
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.team_members
        WHERE user_id = _user_id
          AND team_id = _team_id
          AND accepted_at IS NOT NULL
    )
$$;

-- 8. Create function to check if user has specific role in team
CREATE OR REPLACE FUNCTION public.has_team_role(_user_id UUID, _team_id UUID, _role team_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.team_members
        WHERE user_id = _user_id
          AND team_id = _team_id
          AND role = _role
          AND accepted_at IS NOT NULL
    )
$$;

-- 9. Create function to check if user is team admin or owner
CREATE OR REPLACE FUNCTION public.is_team_admin(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.teams
        WHERE id = _team_id AND owner_id = _user_id
    ) OR EXISTS (
        SELECT 1
        FROM public.team_members
        WHERE user_id = _user_id
          AND team_id = _team_id
          AND role = 'admin'
          AND accepted_at IS NOT NULL
    )
$$;

-- 10. RLS Policies for teams table
-- Team owners and members can view their teams
CREATE POLICY "Users can view teams they own or belong to"
ON public.teams FOR SELECT
USING (
    owner_id = auth.uid() OR 
    public.is_team_member(auth.uid(), id)
);

-- Only authenticated users can create teams
CREATE POLICY "Authenticated users can create teams"
ON public.teams FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Only team owners can update their teams
CREATE POLICY "Team owners can update their teams"
ON public.teams FOR UPDATE
USING (owner_id = auth.uid());

-- Only team owners can delete their teams
CREATE POLICY "Team owners can delete their teams"
ON public.teams FOR DELETE
USING (owner_id = auth.uid());

-- 11. RLS Policies for team_members table
-- Members can see other members of their teams
CREATE POLICY "Team members can view team membership"
ON public.team_members FOR SELECT
USING (
    user_id = auth.uid() OR 
    public.is_team_member(auth.uid(), team_id)
);

-- Team admins/owners can add members
CREATE POLICY "Team admins can add members"
ON public.team_members FOR INSERT
WITH CHECK (
    public.is_team_admin(auth.uid(), team_id)
);

-- Team admins/owners can update member roles
CREATE POLICY "Team admins can update members"
ON public.team_members FOR UPDATE
USING (public.is_team_admin(auth.uid(), team_id));

-- Team admins/owners can remove members, users can remove themselves
CREATE POLICY "Team admins can remove members or self-remove"
ON public.team_members FOR DELETE
USING (
    user_id = auth.uid() OR 
    public.is_team_admin(auth.uid(), team_id)
);

-- 12. Trigger for updated_at on teams
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();