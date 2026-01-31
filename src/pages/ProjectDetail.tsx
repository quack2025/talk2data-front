import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Upload,
  MessageSquare,
  FileText,
  Settings,
  FileSpreadsheet,
  Plus,
  Loader2,
  BarChart3,
  Database,
  Target,
  Globe,
  Building2,
  Users,
  Tag,
  FlaskConical,
  Calendar,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Table2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useProject } from '@/hooks/useProjects';
import { useProjectFiles } from '@/hooks/useProjectFiles';
import { useLanguage } from '@/i18n/LanguageContext';
import { useLastProject } from '@/hooks/useLastProject';
import { useExecutiveSummary } from '@/hooks/useExecutiveSummary';
import { AggfileGeneratorModal } from '@/components/aggfile';
import { VariableGroupsManager } from '@/components/grouping';
import { WaveManager } from '@/components/waves';
import { useProjectVariables } from '@/hooks/useProjectVariables';

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const dateLocale = language === 'es' ? es : enUS;
  const { setLastProjectId } = useLastProject();
  const [aggfileModalOpen, setAggfileModalOpen] = useState(false);

  // Use the API hooks
  const { data: project, isLoading: projectLoading } = useProject(projectId!);
  const { files, isLoading: filesLoading } = useProjectFiles(projectId!);
  const { data: summary, isLoading: summaryLoading } = useExecutiveSummary(projectId!);
  const { data: variableNames = [] } = useProjectVariables(projectId);

  // Track last used project
  useEffect(() => {
    if (projectId) {
      setLastProjectId(projectId);
    }
  }, [projectId, setLastProjectId]);

  const statusConfig = {
    processing: { label: t.projects.processing, variant: 'secondary' as const },
    ready: { label: t.projects.completed, variant: 'default' as const },
    error: { label: 'Error', variant: 'destructive' as const },
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
        <div className="p-6 lg:p-8 text-center">
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

  const hasFiles = files && files.length > 0;
  const hasReadyFiles = project.status === 'ready';
  const hasSummary = !!summary;

  // Check if project has study context configured
  const hasStudyContext = project.study_objective || project.country || 
    project.industry || project.target_audience || 
    (project.brands && project.brands.length > 0) || 
    project.methodology || project.study_date || project.is_tracking;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">{t.projects.title}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant={statusConfig[project.status]?.variant ?? 'secondary'}>
                {statusConfig[project.status]?.label ?? project.status}
              </Badge>
            </div>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <span>
                {t.projectDetail.createdOn}{' '}
                {format(new Date(project.created_at), language === 'es' ? "d 'de' MMMM, yyyy" : "MMMM d, yyyy", {
                  locale: dateLocale,
                })}
              </span>
              {project.n_variables !== undefined && (
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-3.5 w-3.5" />
                  {project.n_variables} variables
                </span>
              )}
              {project.n_cases !== undefined && (
                <span className="flex items-center gap-1">
                  <Database className="h-3.5 w-3.5" />
                  {project.n_cases} casos
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/upload`)}
            >
              <Upload className="h-4 w-4 mr-2" />
              {t.projectDetail.uploadFiles}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAggfileModalOpen(true)}
              disabled={!hasReadyFiles}
            >
              <Table2 className="h-4 w-4 mr-2" />
              {t.aggfile?.generateTables || 'Generar Tablas'}
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/chat`)}
              disabled={!hasReadyFiles}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {t.projectDetail.openChat}
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(`/projects/${projectId}/upload`)}
          >
            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base">{t.projectDetail.uploadCard}</CardTitle>
              <CardDescription>{t.projectDetail.uploadCardDescription}</CardDescription>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-colors ${
              hasReadyFiles ? 'hover:border-primary/50' : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={() => hasReadyFiles && navigate(`/projects/${projectId}/chat`)}
          >
            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base">{t.projectDetail.chatCard}</CardTitle>
              <CardDescription>
                {hasReadyFiles ? t.projectDetail.chatCardDescription : t.projectDetail.chatCardDisabled}
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-colors ${
              hasReadyFiles ? 'hover:border-primary/50' : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={() => hasReadyFiles && navigate('/exports')}
          >
            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base">{t.projectDetail.exportCard}</CardTitle>
              <CardDescription>{t.projectDetail.exportCardDescription}</CardDescription>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-colors ${
              hasReadyFiles ? 'hover:border-primary/50' : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={() => hasReadyFiles && setAggfileModalOpen(true)}
          >
            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Table2 className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base">{t.aggfile?.generateTablesCard || 'Generar Tablas'}</CardTitle>
              <CardDescription>
                {hasReadyFiles 
                  ? (t.aggfile?.generateTablesCardDescription || 'Excel con tablas cruzadas')
                  : t.projectDetail.chatCardDisabled}
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(`/projects/${projectId}/settings`)}
          >
            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base">{t.projectDetail.settingsCard}</CardTitle>
              <CardDescription>{t.projectDetail.settingsCardDescription}</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Executive Summary Preview */}
        {hasSummary && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{t.summary?.title || 'Resumen Ejecutivo'}</CardTitle>
                  <CardDescription>{t.summary?.generatedByAI || 'Generado automáticamente con IA'}</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/projects/${projectId}/summary`)}
                className="gap-2"
              >
                {t.summary?.viewFullSummary || 'Ver resumen completo'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {summary.content}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Study Context Summary */}
        {hasStudyContext && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t.settings.studyContext}</CardTitle>
                <CardDescription>{t.projectDetail.studyContextDescription}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/projects/${projectId}/settings`)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {t.common.edit}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {project.study_objective && (
                  <div className="col-span-full space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Target className="h-4 w-4" />
                      {t.settings.studyObjective}
                    </div>
                    <p className="text-sm">{project.study_objective}</p>
                  </div>
                )}

                {project.country && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      {t.settings.country}
                    </div>
                    <p className="text-sm font-medium">{project.country}</p>
                  </div>
                )}

                {project.industry && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      {t.settings.industry}
                    </div>
                    <p className="text-sm font-medium">{project.industry}</p>
                  </div>
                )}

                {project.methodology && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FlaskConical className="h-4 w-4" />
                      {t.settings.methodology}
                    </div>
                    <p className="text-sm font-medium">{project.methodology}</p>
                  </div>
                )}

                {project.target_audience && (
                  <div className="col-span-full space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {t.settings.targetAudience}
                    </div>
                    <p className="text-sm">{project.target_audience}</p>
                  </div>
                )}

                {project.brands && project.brands.length > 0 && (
                  <div className="col-span-full space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag className="h-4 w-4" />
                      {t.settings.brands}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.brands.map((brand) => (
                        <Badge key={brand} variant="secondary">{brand}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {project.study_date && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {t.settings.studyDate}
                    </div>
                    <p className="text-sm font-medium">
                      {format(new Date(project.study_date), 'PPP', { locale: dateLocale })}
                    </p>
                  </div>
                )}

                {project.is_tracking && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4" />
                      {t.settings.isTracking}
                    </div>
                    <p className="text-sm font-medium">
                      {project.wave_number ? `Wave ${project.wave_number}` : t.common.yes}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Files section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t.projectDetail.filesSection}</CardTitle>
              <CardDescription>{t.projectDetail.filesSectionDescription}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/upload`)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.common.add}
            </Button>
          </CardHeader>
          <CardContent>
            {filesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !hasFiles ? (
              <div className="text-center py-8">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">{t.projectDetail.noFilesYet}</p>
                <Button
                  variant="link"
                  onClick={() => navigate(`/projects/${projectId}/upload`)}
                  className="mt-2"
                >
                  {t.projectDetail.uploadFirstFile}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileSpreadsheet className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.original_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size_bytes / 1024 / 1024).toFixed(2)} MB •{' '}
                        {format(new Date(file.uploaded_at), "d MMM yyyy", { locale: dateLocale })}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {file.file_type === 'spss_data' ? 'SPSS' : 'Cuestionario'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Variable Groups Section */}
        {hasReadyFiles && variableNames.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t.grouping?.title || 'Grupos de Variables'}</CardTitle>
              <CardDescription>
                {t.grouping?.autoDetectDescription || 'Organiza las variables en grupos para análisis más estructurados'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VariableGroupsManager
                projectId={projectId!}
                availableVariables={variableNames}
              />
            </CardContent>
          </Card>
        )}

        {/* Wave Manager Section (only for tracking studies) */}
        {hasReadyFiles && project.is_tracking && (
          <Card>
            <CardHeader>
              <CardTitle>{t.waves?.title || 'Waves / Tracking'}</CardTitle>
              <CardDescription>
                {t.waves?.description || 'Gestiona las olas del estudio y compara resultados entre periodos'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WaveManager
                projectId={projectId!}
                availableFiles={files?.map(f => ({ id: f.id, name: f.original_name })) || []}
                availableVariables={variableNames}
              />
            </CardContent>
          </Card>
        )}

        {/* Aggfile Generator Modal */}
        <AggfileGeneratorModal
          open={aggfileModalOpen}
          onOpenChange={setAggfileModalOpen}
          projectId={projectId!}
        />
      </div>
    </AppLayout>
  );
}
