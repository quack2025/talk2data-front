import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout';
import { ExportCard } from '@/components/exports/ExportCard';
import { CreateExportDialog } from '@/components/exports/CreateExportDialog';
import { useProjects } from '@/hooks/useProjects';
import { useExports } from '@/hooks/useExports';
import type { Export } from '@/types/database';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Exports() {
  const { t } = useLanguage();
  const { projects, isLoading: projectsLoading } = useProjects({
    projectCreated: t.toasts.projectCreated,
    projectCreatedDesc: t.toasts.projectCreatedDesc,
    projectUpdated: t.toasts.projectUpdated,
    projectDeleted: t.toasts.projectDeleted,
    error: t.toasts.error,
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Use first project by default if available
  const projectId = selectedProjectId || (projects.length > 0 ? projects[0].id : '');
  const { exports, isLoading, deleteExport, handleDownload } = useExports(projectId, {
    exportCreated: t.toasts.exportCreated,
    exportCreatedDesc: t.toasts.exportCreatedDesc,
    exportDeleted: t.toasts.exportDeleted,
    downloadStarted: t.toasts.downloadStarted,
    downloadError: t.toasts.downloadError,
    error: t.toasts.error,
  });

  const handleDelete = async (id: string) => {
    await deleteExport.mutateAsync(id);
  };

  const isLoadingAll = projectsLoading || isLoading;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.exports.title}</h1>
            <p className="text-muted-foreground">
              {t.exports.subtitle}
            </p>
          </div>
          <Button 
            onClick={() => setCreateDialogOpen(true)} 
            className="gap-2"
            disabled={!projectId}
          >
            <Plus className="h-4 w-4" />
            {t.exports.newExport}
          </Button>
        </div>

        {/* Project selector for exports */}
        {projects.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {projects.map((project) => (
              <Button
                key={project.id}
                variant={projectId === project.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedProjectId(project.id)}
              >
                {project.name}
              </Button>
            ))}
          </div>
        )}

        {/* Exports Grid */}
        {isLoadingAll ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[200px] rounded-lg border bg-card animate-pulse"
              />
            ))}
          </div>
        ) : exports.length === 0 ? (
          <div className="rounded-lg border bg-card">
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">{t.exports.noExports}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.exports.noExportsDescription}
              </p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="mt-6 gap-2"
                disabled={!projectId}
              >
                <Plus className="h-4 w-4" />
                {t.exports.newExport}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exports.map((export_) => (
              <ExportCard
                key={export_.id}
                export_={export_}
                onDelete={handleDelete}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </div>

      <CreateExportDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultProjectId={projectId}
      />
    </AppLayout>
  );
}
