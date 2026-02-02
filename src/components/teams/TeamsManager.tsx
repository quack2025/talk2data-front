import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTeams } from '@/hooks/useTeams';
import { useLanguage } from '@/i18n/LanguageContext';
import { CreateTeamDialog } from './CreateTeamDialog';
import { TeamCard } from './TeamCard';
import { Users, Plus, Loader2 } from 'lucide-react';

export function TeamsManager() {
  const { t } = useLanguage();
  const { data: teams, isLoading, error } = useTeams();
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
        <p className="text-sm text-destructive">
          {t.toasts?.error || 'Error'}: {(error as Error).message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t.teams?.title || 'Equipos'}</h2>
          <p className="text-muted-foreground">
            {t.teams?.subtitle || 'Gestiona tus workspaces y colaboradores'}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t.teams?.newTeam || 'Nuevo equipo'}
        </Button>
      </div>

      {teams && teams.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Users className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">
            {t.teams?.noTeams || 'No tienes equipos'}
          </h3>
          <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
            {t.teams?.noTeamsDesc || 'Crea un equipo para colaborar con otros usuarios en tus proyectos de investigación.'}
          </p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t.teams?.createFirstTeam || 'Crear primer equipo'}
          </Button>
        </div>
      )}

      <CreateTeamDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
