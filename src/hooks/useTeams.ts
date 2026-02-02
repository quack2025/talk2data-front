import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Team, TeamMember, TeamWithMembers, CreateTeamData, TeamRole } from '@/types/teams';

const TEAMS_KEY = ['teams'];

export function useTeams() {
  return useQuery({
    queryKey: TEAMS_KEY,
    queryFn: async (): Promise<TeamWithMembers[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch teams where user is owner or member
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;

      // For each team, fetch members with profile info
      const teamsWithMembers: TeamWithMembers[] = await Promise.all(
        (teams || []).map(async (team: Team) => {
          const { data: members } = await supabase
            .from('team_members')
            .select(`
              *,
              profiles:user_id (
                email,
                full_name,
                avatar_url
              )
            `)
            .eq('team_id', team.id);

          const mappedMembers: TeamMember[] = (members || []).map((m: any) => ({
            id: m.id,
            team_id: m.team_id,
            user_id: m.user_id,
            invited_email: m.invited_email,
            role: m.role as TeamRole,
            invited_by: m.invited_by,
            invited_at: m.invited_at,
            accepted_at: m.accepted_at,
            // For existing users, use profile data; for pending invites, use invited_email
            user_email: m.profiles?.email || m.invited_email,
            user_name: m.profiles?.full_name,
            user_avatar: m.profiles?.avatar_url,
            is_pending: !m.user_id && !!m.invited_email,
          }));

          const myMembership = mappedMembers.find(m => m.user_id === user.id);

          return {
            ...team,
            members: mappedMembers,
            member_count: mappedMembers.filter(m => m.accepted_at).length,
            is_owner: team.owner_id === user.id,
            my_role: myMembership?.role,
          };
        })
      );

      return teamsWithMembers;
    },
  });
}

export function useTeam(teamId: string | undefined) {
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: async (): Promise<TeamWithMembers | null> => {
      if (!teamId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: team, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) throw error;
      if (!team) return null;

      const { data: members } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('team_id', teamId);

      const mappedMembers: TeamMember[] = (members || []).map((m: any) => ({
        id: m.id,
        team_id: m.team_id,
        user_id: m.user_id,
        invited_email: m.invited_email,
        role: m.role as TeamRole,
        invited_by: m.invited_by,
        invited_at: m.invited_at,
        accepted_at: m.accepted_at,
        user_email: m.profiles?.email || m.invited_email,
        user_name: m.profiles?.full_name,
        user_avatar: m.profiles?.avatar_url,
        is_pending: !m.user_id && !!m.invited_email,
      }));

      const myMembership = mappedMembers.find(m => m.user_id === user.id);

      return {
        ...team,
        members: mappedMembers,
        member_count: mappedMembers.filter(m => m.accepted_at).length,
        is_owner: team.owner_id === user.id,
        my_role: myMembership?.role,
      };
    },
    enabled: !!teamId,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (data: CreateTeamData): Promise<Team> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: team, error } = await supabase
        .from('teams')
        .insert({
          name: data.name,
          description: data.description,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-add owner as admin member
      await supabase.from('team_members').insert({
        team_id: team.id,
        user_id: user.id,
        role: 'admin',
        invited_by: user.id,
        accepted_at: new Date().toISOString(),
      });

      return team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
      toast({
        title: t.teams?.created || 'Equipo creado',
        description: t.teams?.createdDesc || 'El equipo se ha creado correctamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.toasts?.error || 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ teamId, data }: { teamId: string; data: Partial<CreateTeamData> }) => {
      const { error } = await supabase
        .from('teams')
        .update(data)
        .eq('id', teamId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
      toast({
        title: t.teams?.updated || 'Equipo actualizado',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.toasts?.error || 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
      toast({
        title: t.teams?.deleted || 'Equipo eliminado',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.toasts?.error || 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ teamId, email, role }: { teamId: string; email: string; role: TeamRole }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const normalizedEmail = email.trim().toLowerCase();

      // Check if there's already a pending invitation for this email
      const { data: existingPending } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('invited_email', normalizedEmail)
        .single();

      if (existingPending) {
        throw new Error(t.teams?.alreadyInvited || 'Este email ya tiene una invitación pendiente.');
      }

      // Try to find user by email in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .single();

      if (profile) {
        // User exists - check if already a member
        const { data: existingMember } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', teamId)
          .eq('user_id', profile.id)
          .single();

        if (existingMember) {
          throw new Error(t.teams?.alreadyMember || 'Este usuario ya es miembro del equipo.');
        }

        // Add existing user as member
        const { error } = await supabase.from('team_members').insert({
          team_id: teamId,
          user_id: profile.id,
          role,
          invited_by: user.id,
          accepted_at: new Date().toISOString(),
        });

        if (error) throw error;
      } else {
        // User doesn't exist - create pending invitation by email
        const { error } = await supabase.from('team_members').insert({
          team_id: teamId,
          invited_email: normalizedEmail,
          role,
          invited_by: user.id,
          // No accepted_at - pending invitation
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
      toast({
        title: t.teams?.memberAdded || 'Invitación enviada',
        description: t.teams?.memberAddedDesc || 'El usuario ha sido invitado al equipo.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.toasts?.error || 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: TeamRole }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
      toast({
        title: t.teams?.roleUpdated || 'Rol actualizado',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.toasts?.error || 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
      toast({
        title: t.teams?.memberRemoved || 'Miembro eliminado',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.toasts?.error || 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useAssignProjectToTeam() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ projectId, teamId }: { projectId: string; teamId: string | null }) => {
      const { error } = await supabase
        .from('projects')
        .update({ team_id: teamId })
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: t.teams?.projectAssigned || 'Proyecto asignado',
        description: t.teams?.projectAssignedDesc || 'El proyecto ha sido asignado al equipo.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.toasts?.error || 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
