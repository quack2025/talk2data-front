import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { ProjectSelector } from '@/components/projects/ProjectSelector';
import { useLastProject } from '@/hooks/useLastProject';
import { useProjects } from '@/hooks/useProjects';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Chat() {
  const navigate = useNavigate();
  const { getLastProjectId } = useLastProject();
  const { projects, isLoading } = useProjects();
  const { t } = useLanguage();

  useEffect(() => {
    if (isLoading) return;

    const lastProjectId = getLastProjectId();
    
    // If there's a last project and it still exists, redirect to it
    if (lastProjectId && projects?.some(p => p.id === lastProjectId)) {
      navigate(`/projects/${lastProjectId}/chat`, { replace: true });
      return;
    }

    // If there's only one project, redirect to it
    if (projects?.length === 1) {
      navigate(`/projects/${projects[0].id}/chat`, { replace: true });
    }
  }, [isLoading, projects, getLastProjectId, navigate]);

  // Show selector if we have multiple projects and no last project
  return (
    <AppLayout>
      <div className="p-4 md:p-8">
        <ProjectSelector
          redirectPath="chat"
          title={t.sidebar.chat}
          description={t.chat.askAnything}
        />
      </div>
    </AppLayout>
  );
}
