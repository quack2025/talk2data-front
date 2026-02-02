-- Update projects RLS policies to allow team access

-- 1. Drop existing SELECT policy for projects
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;

-- 2. Create new SELECT policy that includes team access
CREATE POLICY "Users can view own projects or team projects"
ON public.projects FOR SELECT
USING (
    user_id = auth.uid() OR 
    (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id))
);

-- 3. Drop existing UPDATE policy for projects
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;

-- 4. Create new UPDATE policy (owners, or team admins/editors)
CREATE POLICY "Users can update own projects or team projects with edit access"
ON public.projects FOR UPDATE
USING (
    user_id = auth.uid() OR 
    (team_id IS NOT NULL AND (
        public.is_team_admin(auth.uid(), team_id) OR 
        public.has_team_role(auth.uid(), team_id, 'editor')
    ))
);

-- 5. Drop existing DELETE policy for projects
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- 6. Create new DELETE policy (only owners or team admins)
CREATE POLICY "Users can delete own projects or team projects as admin"
ON public.projects FOR DELETE
USING (
    user_id = auth.uid() OR 
    (team_id IS NOT NULL AND public.is_team_admin(auth.uid(), team_id))
);

-- Keep INSERT policy unchanged - users create projects under their own id
-- They can then assign the project to a team

-- 7. Also update project_files RLS to allow team access
DROP POLICY IF EXISTS "Users can view their own files" ON public.project_files;

CREATE POLICY "Users can view own files or team project files"
ON public.project_files FOR SELECT
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.projects p 
        WHERE p.id = project_id 
        AND p.team_id IS NOT NULL 
        AND public.is_team_member(auth.uid(), p.team_id)
    )
);

-- 8. Update chat_sessions to allow team access
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.chat_sessions;

CREATE POLICY "Users can view own or team project chat sessions"
ON public.chat_sessions FOR SELECT
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.projects p 
        WHERE p.id = project_id 
        AND p.team_id IS NOT NULL 
        AND public.is_team_member(auth.uid(), p.team_id)
    )
);

-- 9. Update exports to allow team access
DROP POLICY IF EXISTS "Users can view exports of their projects" ON public.exports;

CREATE POLICY "Users can view exports of own or team projects"
ON public.exports FOR SELECT
USING (
    generated_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.projects p 
        WHERE p.id = project_id 
        AND (p.user_id = auth.uid() OR (p.team_id IS NOT NULL AND public.is_team_member(auth.uid(), p.team_id)))
    )
);