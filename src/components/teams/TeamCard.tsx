import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteTeam, useRemoveMember, useUpdateMemberRole } from '@/hooks/useTeams';
import { useLanguage } from '@/i18n/LanguageContext';
import { InviteMemberDialog } from './InviteMemberDialog';
import { Users, MoreVertical, UserPlus, Trash2, Crown, Edit, Eye } from 'lucide-react';
import type { TeamWithMembers, TeamRole } from '@/types/teams';

interface TeamCardProps {
  team: TeamWithMembers;
}

export function TeamCard({ team }: TeamCardProps) {
  const { t } = useLanguage();
  const [showInvite, setShowInvite] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteTeam = useDeleteTeam();
  const removeMember = useRemoveMember();
  const updateRole = useUpdateMemberRole();

  const canManage = team.is_owner || team.my_role === 'admin';

  const roleLabels: Record<TeamRole, string> = {
    admin: t.teams?.roleAdmin || 'Admin',
    editor: t.teams?.roleEditor || 'Editor',
    viewer: t.teams?.roleViewer || 'Viewer',
  };

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case 'admin': return <Crown className="h-3 w-3" />;
      case 'editor': return <Edit className="h-3 w-3" />;
      case 'viewer': return <Eye className="h-3 w-3" />;
    }
  };

  const getRoleBadgeVariant = (role: TeamRole): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'admin': return 'default';
      case 'editor': return 'secondary';
      case 'viewer': return 'outline';
    }
  };

  const handleRemoveMember = (memberId: string) => {
    removeMember.mutate(memberId);
  };

  const handleRoleChange = (memberId: string, newRole: TeamRole) => {
    updateRole.mutate({ memberId, role: newRole });
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{team.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {team.member_count} {t.teams?.members || 'miembros'}
                  {team.is_owner && (
                    <Badge variant="outline" className="text-xs">
                      <Crown className="mr-1 h-3 w-3" />
                      {t.teams?.owner || 'Propietario'}
                    </Badge>
                  )}
                  {!team.is_owner && team.my_role && (
                    <Badge variant={getRoleBadgeVariant(team.my_role)} className="text-xs">
                      {getRoleIcon(team.my_role)}
                      <span className="ml-1">{roleLabels[team.my_role]}</span>
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>

            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowInvite(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t.teams?.inviteMember || 'Invitar miembro'}
                  </DropdownMenuItem>
                  {team.is_owner && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t.teams?.deleteTeam || 'Eliminar equipo'}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {team.description && (
            <p className="text-sm text-muted-foreground mt-2">{team.description}</p>
          )}
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t.teams?.teamMembers || 'Miembros del equipo'}</h4>
            <div className="space-y-2">
              {team.members.filter(m => m.accepted_at).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user_avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {(member.user_name || member.user_email || '?').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {member.user_name || member.user_email || 'Usuario'}
                      </p>
                      {member.user_name && member.user_email && (
                        <p className="text-xs text-muted-foreground">{member.user_email}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManage && member.user_id !== team.owner_id ? (
                      <Select
                        value={member.role}
                        onValueChange={(v) => handleRoleChange(member.id, v as TeamRole)}
                      >
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(['admin', 'editor', 'viewer'] as TeamRole[]).map((r) => (
                            <SelectItem key={r} value={r}>
                              {roleLabels[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.user_id === team.owner_id ? (
                          <>
                            <Crown className="mr-1 h-3 w-3" />
                            {t.teams?.owner || 'Propietario'}
                          </>
                        ) : (
                          roleLabels[member.role]
                        )}
                      </Badge>
                    )}

                    {canManage && member.user_id !== team.owner_id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {canManage && (
              <Button
                variant="outline"
                className="w-full mt-3"
                onClick={() => setShowInvite(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {t.teams?.addMember || 'Añadir miembro'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <InviteMemberDialog
        open={showInvite}
        onOpenChange={setShowInvite}
        teamId={team.id}
        teamName={team.name}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.teams?.confirmDelete || '¿Eliminar equipo?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.teams?.confirmDeleteDesc || 'Esta acción no se puede deshacer. Se eliminarán todos los miembros del equipo.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common?.cancel || 'Cancelar'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTeam.mutate(team.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.common?.delete || 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
