import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, FileSpreadsheet, MessageSquare, CreditCard, Clock, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import { ProjectFilters } from '@/components/projects/ProjectFilters';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { DraggableProjectCard } from '@/components/dashboard/DraggableProjectCard';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { useProjects } from '@/hooks/useProjects';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

export default function Projects() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const folderFilter = searchParams.get('folder'); // null = all, "unorganized" = no folder, otherwise folder id
  const { projects, isLoading } = useProjects({
    projectCreated: t.toasts.projectCreated,
    projectCreatedDesc: t.toasts.projectCreatedDesc,
    projectUpdated: t.toasts.projectUpdated,
    projectDeleted: t.toasts.projectDeleted,
    error: t.toasts.error,
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [activeTab, setActiveTab] = useState('active');

  // Folder assignments from Supabase (since backend API may not include folder_id yet)
  const [folderAssignments, setFolderAssignments] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const fetchFolderAssignments = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, folder_id');
        if (error) throw error;
        if (!data) return;
        const assignments: Record<string, string | null> = {};
        data.forEach((p: any) => {
          assignments[p.id] = p.folder_id;
        });
        setFolderAssignments(assignments);
      } catch (err) {
        console.error('Error fetching folder assignments:', err);
      }
    };
    fetchFolderAssignments();
  }, [projects]); // Refetch when projects change

  // Compute counts for tabs
  const counts = useMemo(() => {
    const active = projects.filter(
      (p) => p.status === 'processing' || p.status === 'ready'
    ).length;
    const archived = projects.filter(
      (p) => (p as any).archived === true
    ).length;
    const error = projects.filter((p) => p.status === 'error').length;
    return { active, archived, error };
  }, [projects]);

  // Filter projects by folder, tab, search, and status
  const filteredProjects = useMemo(() => {
    // 1. Apply folder filter
    let folderFiltered = projects;
    if (folderFilter === 'unorganized') {
      folderFiltered = projects.filter(
        (p) => !folderAssignments[p.id]
      );
    } else if (folderFilter) {
      folderFiltered = projects.filter(
        (p) => folderAssignments[p.id] === folderFilter
      );
    }

    // 2. Apply tab filter
    let tabFiltered = folderFiltered;
    if (activeTab === 'active') {
      tabFiltered = folderFiltered.filter(
        (p) => p.status !== 'error' && (p as any).archived !== true
      );
    } else if (activeTab === 'archived') {
      tabFiltered = folderFiltered.filter((p) => (p as any).archived === true);
    } else if (activeTab === 'error') {
      tabFiltered = folderFiltered.filter((p) => p.status === 'error');
    }

    // 3. Apply search and status filter
    return tabFiltered.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.description?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === 'all' || project.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, status, activeTab, folderFilter, folderAssignments]);

  // Stat card values
  const activeSpssProjects = projects.filter(
    (p) => p.status === 'ready' || p.status === 'processing'
  ).length;

  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.dashboard.title}</h1>
            <p className="text-muted-foreground">
              {t.dashboard.subtitle}
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t.dashboard.newProject}
          </Button>
        </div>

        {/* Stat Cards — Talk2data-specific metrics (section 6.1) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.dashboard.activeProjects}</p>
                  <p className="text-3xl font-bold mt-1">{activeSpssProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.dashboard.queriesThisMonth}</p>
                  <p className="text-3xl font-bold mt-1">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.dashboard.creditsUsed}</p>
                  <p className="text-3xl font-bold mt-1">0 / 100</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.dashboard.lastFileProcessed}</p>
                  <p className="text-3xl font-bold mt-1">--</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Active / Archived / Errors (section 6.5) */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active">
              {t.dashboard.tabActive} ({counts.active})
            </TabsTrigger>
            <TabsTrigger value="archived">
              {t.dashboard.tabArchived} ({counts.archived})
            </TabsTrigger>
            {counts.error > 0 && (
              <TabsTrigger value="error" className="text-destructive">
                {t.dashboard.tabErrors} ({counts.error})
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>

        {/* Filters */}
        <ProjectFilters
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          view={view}
          onViewChange={setView}
        />

        {/* Empty State (section 6.6) */}
        {!isLoading && projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t.dashboard.noProjects}</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              {t.dashboard.noProjectsDescription}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t.dashboard.createFirstProject}
            </Button>
          </div>
        ) : (
          <>
            {/* Projects List/Grid */}
            {view === 'list' ? (
              <ProjectsTable projects={filteredProjects} isLoading={isLoading} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[180px] rounded-lg border bg-card animate-pulse"
                    />
                  ))
                ) : filteredProjects.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">{t.projects.noProjectsFound}</p>
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <DraggableProjectCard key={project.id} projectId={project.id}>
                      <ProjectCard project={project} />
                    </DraggableProjectCard>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </AppLayout>
  );
}
