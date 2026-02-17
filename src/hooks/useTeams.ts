import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Team, TeamWithMembers, CreateTeamData, TeamRole } from '@/types/teams';

const TEAMS_KEY = ['teams'];

/** Enrich a raw Team response with computed UI fields. */
async function enrichTeam(team: Team): Promise<TeamWithMembers> {
  const { data: { user } } = await supabase.auth.getUser();
  const myMembership = team.members.find((m) => m.user_id === user?.id);
  return {
    ...team,
    member_count: team.members.length,
    is_owner: team.owner_id === user?.id,
    my_role: myMembership?.role,
  };
}

export function useTeams() {
  return useQuery({
    queryKey: TEAMS_KEY,
    queryFn: async (): Promise<TeamWithMembers[]> => {
      const teams = await api.get<Team[]>('/teams');
      return Promise.all(teams.map(enrichTeam));
    },
  });
}

export function useTeam(teamId: string | undefined) {
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: async (): Promise<TeamWithMembers | null> => {
      if (!teamId) return null;
      const team = await api.get<Team>(`/teams/${teamId}`);
      return enrichTeam(team);
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
      return api.post<Team>('/teams', { name: data.name });
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
      await api.patch(`/teams/${teamId}`, data);
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
      await api.delete(`/teams/${teamId}`);
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

export function useAddMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ teamId, userId, role }: { teamId: string; userId: string; role: TeamRole }) => {
      return api.post(`/teams/${teamId}/members`, { user_id: userId, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
      toast({
        title: t.teams?.memberAdded || 'Miembro agregado',
        description: t.teams?.memberAddedDesc || 'El usuario ha sido agregado al equipo.',
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

// Keep backward-compatible name for existing InviteMemberDialog
export function useInviteMember() {
  return useAddMember();
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ teamId, userId, role }: { teamId: string; userId: string; role: TeamRole }) => {
      await api.patch(`/teams/${teamId}/members/${userId}?role=${role}`);
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
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      await api.delete(`/teams/${teamId}/members/${userId}`);
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
      await api.patch(`/projects/${projectId}`, { team_id: teamId });
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
