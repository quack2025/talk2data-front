import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useProjects } from '@/hooks/useProjects';
import { useLanguage } from '@/i18n/LanguageContext';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface ProjectSelectorProps {
  redirectPath: 'upload' | 'chat';
  title: string;
  description: string;
}

export function ProjectSelector({ redirectPath, title, description }: ProjectSelectorProps) {
  const navigate = useNavigate();
  const { projects, isLoading } = useProjects();
  const { t, language } = useLanguage();
  const dateLocale = language === 'es' ? es : enUS;

  const handleSelectProject = (projectId: string) => {
    navigate(`/projects/${projectId}/${redirectPath}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t.projects.noProjects}</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          {t.projects.noProjectsDescription}
        </p>
        <Button onClick={() => navigate('/projects')}>
          <Plus className="mr-2 h-4 w-4" />
          {t.projects.newProject}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
            onClick={() => handleSelectProject(project.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {project.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(project.last_activity), "d MMM yyyy", {
                      locale: dateLocale,
                    })}
                    {' · '}
                    {project.file_count} {t.projects.files}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
