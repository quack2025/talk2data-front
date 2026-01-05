import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, FolderOpen, Trash2, MessageSquare } from 'lucide-react';
import type { Project } from '@/types/database';
import { useProjects } from '@/hooks/useProjects';
import { useLanguage } from '@/i18n/LanguageContext';

interface ProjectsTableProps {
  projects: Project[];
  isLoading: boolean;
}

export function ProjectsTable({ projects, isLoading }: ProjectsTableProps) {
  const navigate = useNavigate();
  const { deleteProject } = useProjects();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { t, language } = useLanguage();

  const dateLocale = language === 'es' ? es : enUS;

  const statusConfig = {
    processing: { label: t.projects.processing, variant: 'secondary' as const },
    ready: { label: t.projects.completed, variant: 'default' as const },
    error: { label: 'Error', variant: 'destructive' as const },
  };

  const handleDelete = async () => {
    if (selectedProject) {
      await deleteProject.mutateAsync(selectedProject.id);
      setDeleteDialogOpen(false);
      setSelectedProject(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">{t.projects.loadingProjects}</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-12 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">{t.projects.noProjects}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.projects.noProjectsDescription}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.projects.name}</TableHead>
              <TableHead>{t.projects.status}</TableHead>
              <TableHead className="text-center">Variables</TableHead>
              <TableHead className="text-center">Casos</TableHead>
              <TableHead>{t.common.create === 'Crear' ? 'Creado' : 'Created'}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow
                key={project.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{project.name}</p>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {project.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig[project.status]?.variant ?? 'secondary'}>
                    {statusConfig[project.status]?.label ?? project.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">{project.n_variables ?? '-'}</TableCell>
                <TableCell className="text-center">{project.n_cases ?? '-'}</TableCell>
                <TableCell>
                  {format(new Date(project.created_at), "d MMM yyyy, HH:mm", {
                    locale: dateLocale,
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${project.id}/chat`);
                        }}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        {t.projects.openChat}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(project);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t.common.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.projects.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.projects.deleteConfirmDescriptionFull.replace('{name}', selectedProject?.name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
