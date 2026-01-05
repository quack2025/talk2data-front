import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderOpen, Database, BarChart3, MoreHorizontal } from 'lucide-react';
import type { Project } from '@/types/database';
import { useLanguage } from '@/i18n/LanguageContext';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const dateLocale = language === 'es' ? es : enUS;

  const statusConfig = {
    processing: { label: t.projects.statusProcessing, variant: 'secondary' as const },
    ready: { label: t.projects.statusReady, variant: 'default' as const },
    error: { label: t.projects.statusError, variant: 'destructive' as const },
  };

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              <Badge variant={statusConfig[project.status]?.variant ?? 'secondary'} className="mt-1">
                {statusConfig[project.status]?.label ?? project.status}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {project.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {project.n_variables !== undefined && (
            <div className="flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>{project.n_variables} {t.projects.variables}</span>
            </div>
          )}
          {project.n_cases !== undefined && (
            <div className="flex items-center gap-1">
              <Database className="h-3.5 w-3.5" />
              <span>{project.n_cases} {t.projects.cases}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {format(new Date(project.created_at), "d MMM yyyy", { locale: dateLocale })}
        </p>
      </CardContent>
    </Card>
  );
}
