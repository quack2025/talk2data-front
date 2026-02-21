import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExecutiveSummaryCard } from '@/components/summary/ExecutiveSummaryCard';
import { useExecutiveSummary, useRegenerateSummary } from '@/hooks/useExecutiveSummary';
import { useProject } from '@/hooks/useProjects';
import { useLanguage } from '@/i18n/LanguageContext';

export default function ProjectSummary() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: project, isLoading: projectLoading } = useProject(projectId!);
  const { data: summary, isLoading: summaryLoading } = useExecutiveSummary(projectId!);
  const regenerateMutation = useRegenerateSummary(projectId!);

  const handleGoToChat = () => {
    navigate(`/projects/${projectId}/chat`);
  };

  const handleRegenerate = () => {
    regenerateMutation.mutate();
  };

  if (projectLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="p-4 md:p-8 text-center">
          <h1 className="text-2xl font-bold">{t.projectDetail.notFound}</h1>
          <Button
            variant="link"
            onClick={() => navigate('/projects')}
            className="mt-4"
          >
            {t.projectDetail.backToProjects}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">{t.projects.title}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/projects/${projectId}`}>
                {project.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t.summary?.title || 'Resumen Ejecutivo'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {t.summary?.title || 'Resumen Ejecutivo'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t.summary?.subtitle || 'Análisis automático de tus datos'}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <ExecutiveSummaryCard
          summary={summary}
          isLoading={summaryLoading}
          isRegenerating={regenerateMutation.isPending}
          onRegenerate={handleRegenerate}
        />

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t.summary?.nextSteps || '¿Qué sigue?'}
            </CardTitle>
            <CardDescription>
              {t.summary?.nextStepsDescription || 'Continúa explorando tus datos con el chat de IA'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGoToChat} className="gap-2">
              <MessageSquare className="h-4 w-4" />
              {t.summary?.goToChat || 'Ir al Chat'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
