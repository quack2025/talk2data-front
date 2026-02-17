import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAddMember } from '@/hooks/useTeams';
import { useLanguage } from '@/i18n/LanguageContext';
import { Loader2 } from 'lucide-react';
import type { TeamRole } from '@/types/teams';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName: string;
}

export function InviteMemberDialog({ open, onOpenChange, teamId, teamName }: InviteMemberDialogProps) {
  const { t } = useLanguage();
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<TeamRole>('viewer');
  const addMember = useAddMember();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;

    await addMember.mutateAsync({
      teamId,
      userId: userId.trim(),
      role,
    });

    setUserId('');
    setRole('viewer');
    onOpenChange(false);
  };

  const roleLabels: Record<TeamRole, string> = {
    admin: t.teams?.roleAdmin || 'Admin',
    editor: t.teams?.roleEditor || 'Editor',
    viewer: t.teams?.roleViewer || 'Viewer',
  };

  const roleDescriptions: Record<TeamRole, string> = {
    admin: t.teams?.roleAdminDesc || 'Puede gestionar equipo y miembros',
    editor: t.teams?.roleEditorDesc || 'Puede editar proyectos del equipo',
    viewer: t.teams?.roleViewerDesc || 'Solo puede ver proyectos',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t.teams?.inviteMember || 'Agregar miembro'}</DialogTitle>
            <DialogDescription>
              {t.teams?.inviteToTeam || 'Agregar usuario a'} <strong>{teamName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userId">{t.teams?.emailAddress || 'Correo electrónico'}</Label>
              <Input
                id="userId"
                type="email"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t.teams?.role || 'Rol'}</Label>
              <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['admin', 'editor', 'viewer'] as TeamRole[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{roleLabels[r]}</span>
                        <span className="text-xs text-muted-foreground">{roleDescriptions[r]}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common?.cancel || 'Cancelar'}
            </Button>
            <Button type="submit" disabled={addMember.isPending || !userId.trim()}>
              {addMember.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.teams?.addMember || 'Agregar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
