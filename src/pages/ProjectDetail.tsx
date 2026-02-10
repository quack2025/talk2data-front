import { useState, useEffect, useCallback } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertTriangle,
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  SlidersHorizontal,
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
import { DataPrepManager } from '@/components/dataprep';
import { useProjectVariables } from '@/hooks/useProjectVariables';
import { useDataPrep, type DataPrepStatus } from '@/hooks/useDataPrep';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const dateLocale = language === 'es' ? es : enUS;
  const { setLastProjectId } = useLastProject();
  const [aggfileModalOpen, setAggfileModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Use the API hooks
  const { data: project, isLoading: projectLoading } = useProject(projectId!);
  const { files, isLoading: filesLoading } = useProjectFiles(projectId!);
  const { data: summary, isLoading: summaryLoading } = useExecutiveSummary(projectId!);
  const { data: variableNames = [], variableLabels } = useProjectVariables(projectId);
  const { dataPrepStatus } = useDataPrep(projectId!);
  const [localDataPrepStatus, setLocalDataPrepStatus] = useState<DataPrepStatus>(dataPrepStatus);

  useEffect(() => {
    setLocalDataPrepStatus(dataPrepStatus);
  }, [dataPrepStatus]);

  const handleDataPrepStatusChange = useCallback((status: DataPrepStatus) => {
    setLocalDataPrepStatus(status);
  }, []);

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
  const isDataReady = localDataPrepStatus !== 'pending';
  const canAccessAnalysis = hasReadyFiles && isDataReady;

  // Check if project has study context configured
  const hasStudyContext = project.study_objective || project.country || 
    project.industry || project.target_audience || 
    (project.brands && project.brands.length > 0) || 
    project.methodology || project.study_date || project.is_tracking;

  // Data prep status indicator dot
  const dataPrepDot = localDataPrepStatus === 'pending'
    ? 'bg-amber-500'
    : 'bg-emerald-500';

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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAggfileModalOpen(true)}
                      disabled={!canAccessAnalysis}
                    >
                      <Table2 className="h-4 w-4 mr-2" />
                      {t.aggfile?.generateTables || 'Generar Tablas'}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!isDataReady && hasReadyFiles && (
                  <TooltipContent>{t.dataPrep?.gateTooltip || 'Confirma la preparación de datos primero'}</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/projects/${projectId}/chat`)}
                      disabled={!canAccessAnalysis}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {t.projectDetail.openChat}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!isDataReady && hasReadyFiles && (
                  <TooltipContent>{t.dataPrep?.gateTooltip || 'Confirma la preparación de datos primero'}</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Data Readiness Banner */}
        {hasReadyFiles && !isDataReady && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-amber-800 dark:text-amber-200">
                {t.dataPrep?.gateBanner || 'Revisa y confirma la preparación de datos antes de iniciar el análisis'}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="ml-4 shrink-0 border-amber-500/50 text-amber-800 hover:bg-amber-500/10 dark:text-amber-200"
                onClick={() => setActiveTab('data')}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                {t.projectDetail.goToDataPrep}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview" className="gap-1.5">
              <LayoutDashboard className="h-4 w-4" />
              {t.projectDetail.tabOverview}
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-1.5">
              <SlidersHorizontal className="h-4 w-4" />
              {t.projectDetail.tabData}
              {hasReadyFiles && (
                <span className={`ml-1 h-2 w-2 rounded-full ${dataPrepDot}`} />
              )}
            </TabsTrigger>
            <TabsTrigger value="context" className="gap-1.5">
              <BookOpen className="h-4 w-4" />
              {t.projectDetail.tabContext}
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-1.5">
              <FolderOpen className="h-4 w-4" />
              {t.projectDetail.tabFiles}
              {hasFiles && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {files.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab: Overview */}
          <TabsContent value="overview" className="space-y-6 mt-4">
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
                  canAccessAnalysis ? 'hover:border-primary/50' : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => canAccessAnalysis && navigate(`/projects/${projectId}/chat`)}
              >
                <CardHeader className="pb-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base">{t.projectDetail.chatCard}</CardTitle>
                  <CardDescription>
                    {!hasReadyFiles 
                      ? t.projectDetail.chatCardDisabled 
                      : !isDataReady 
                        ? (t.dataPrep?.gateTooltip || 'Confirma la preparación de datos primero')
                        : t.projectDetail.chatCardDescription}
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
                  canAccessAnalysis ? 'hover:border-primary/50' : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => canAccessAnalysis && setAggfileModalOpen(true)}
              >
                <CardHeader className="pb-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Table2 className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base">{t.aggfile?.generateTablesCard || 'Generar Tablas'}</CardTitle>
                  <CardDescription>
                    {!hasReadyFiles 
                      ? t.projectDetail.chatCardDisabled
                      : !isDataReady
                        ? (t.dataPrep?.gateTooltip || 'Confirma la preparación de datos primero')
                        : (t.aggfile?.generateTablesCardDescription || 'Excel con tablas cruzadas')}
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

            {/* Data Prep Status Badge */}
            {hasReadyFiles && !isDataReady && (
              <button
                onClick={() => setActiveTab('data')}
                className="inline-flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-md px-3 py-1.5 hover:bg-amber-500/20 transition-colors"
              >
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {t.dataPrep?.gateBanner || 'Revisa y confirma la preparación de datos antes de iniciar el análisis'}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}

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
          </TabsContent>

          {/* Tab: Data */}
          <TabsContent value="data" className="space-y-6 mt-4">
            {/* Data Preparation */}
            {hasReadyFiles && (
              <DataPrepManager
                projectId={projectId!}
                availableVariables={variableNames}
                variableLabels={variableLabels}
                onStatusChange={handleDataPrepStatusChange}
              />
            )}

            {/* Variable Groups */}
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
                    variableLabels={variableLabels}
                  />
                </CardContent>
              </Card>
            )}

            {/* Wave Manager (only for tracking studies) */}
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

            {!hasReadyFiles && (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-12">
                  <SlidersHorizontal className="h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground">{t.projectDetail.chatCardDisabled}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Context */}
          <TabsContent value="context" className="space-y-6 mt-4">
            {hasStudyContext ? (
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
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-12">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {language === 'es' ? 'No hay contexto configurado' : 'No context configured'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/projects/${projectId}/settings`)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Configurar contexto' : 'Configure context'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Files */}
          <TabsContent value="files" className="space-y-6 mt-4">
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
          </TabsContent>
        </Tabs>

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
