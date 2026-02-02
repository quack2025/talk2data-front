-- Add email column for pending invitations
ALTER TABLE public.team_members 
ADD COLUMN invited_email TEXT;

-- Make user_id nullable for pending invitations
ALTER TABLE public.team_members 
ALTER COLUMN user_id DROP NOT NULL;

-- Add constraint: must have either user_id or invited_email
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_user_or_email_check 
CHECK (user_id IS NOT NULL OR invited_email IS NOT NULL);

-- Add unique constraint on team + email for pending invitations
CREATE UNIQUE INDEX team_members_team_email_unique 
ON public.team_members (team_id, invited_email) 
WHERE invited_email IS NOT NULL;

-- Update RLS policies to allow viewing pending invitations by email
DROP POLICY IF EXISTS "Team members can view team membership" ON public.team_members;

CREATE POLICY "Team members can view team membership" 
ON public.team_members 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR is_team_member(auth.uid(), team_id)
  OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Create function to link pending invitations when user registers
CREATE OR REPLACE FUNCTION public.link_pending_team_invitations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Link any pending invitations to the new user
  UPDATE public.team_members
  SET user_id = NEW.id,
      invited_email = NULL
  WHERE invited_email = NEW.email
    AND user_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to link invitations on signup
DROP TRIGGER IF EXISTS on_auth_user_created_link_invitations ON auth.users;

CREATE TRIGGER on_auth_user_created_link_invitations
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.link_pending_team_invitations();