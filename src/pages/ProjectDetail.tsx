import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
  Eye,
  Compass,
  AlertTriangle,
  FolderOpen,
  Save,
  Trash2,
  ChevronDown,
  X,
  CalendarIcon,
  PanelRightOpen,
  PanelRightClose,
  Presentation,
  Merge,
} from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { useProjectFiles } from '@/hooks/useProjectFiles';
import { useLanguage } from '@/i18n/LanguageContext';
import { useLastProject } from '@/hooks/useLastProject';
import { useExecutiveSummary } from '@/hooks/useExecutiveSummary';
import { useExplore } from '@/hooks/useExplore';
import { useToast } from '@/hooks/use-toast';
import { AggfileGeneratorModal } from '@/components/aggfile';
import { ReportGeneratorDialog } from '@/components/reports';
import { useChat } from '@/hooks/useChat';
import { VariableGroupsManager } from '@/components/grouping';
import { DataPrepManager } from '@/components/data-prep';
import { VariableMetadataManager } from '@/components/dataprep/VariableMetadataManager';
import { SegmentManager } from '@/components/segments';
import { MergeWizardDialog } from '@/components/merge';
import { SegmentationWizardDialog } from '@/components/segmentation';
import { WaveManager } from '@/components/waves';
import { useProjectVariables } from '@/hooks/useProjectVariables';
import {
  VariableBrowser,
  AnalysisPanel,
  ResultDisplay,
  BookmarkManager,
} from '@/components/explore';
import { DataTableView } from '@/components/dataprep';
import type { RulePrefill } from '@/components/dataprep';
import type { ExploreVariable, ExploreRunRequest, ExploreBookmark } from '@/types/explore';
import type { ProjectUpdateData } from '@/types/database';

const INDUSTRIES = [
  'FMCG', 'Automotive', 'Banking', 'Telecom', 'Pharma',
  'Retail', 'Technology', 'Media', 'Healthcare', 'Other',
];

const METHODOLOGIES = [
  'Online panel', 'CATI', 'Face-to-face', 'Focus groups',
  'In-depth interviews', 'Mixed methods', 'Other',
];

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const dateLocale = language === 'es' ? es : enUS;
  const { setLastProjectId } = useLastProject();
  const { toast } = useToast();
  const [aggfileModalOpen, setAggfileModalOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [segmentationDialogOpen, setSegmentationDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [exploreSubTab, setExploreSubTab] = useState<'table' | 'analysis'>('table');
  const [showBookmarks, setShowBookmarks] = useState(true);
  const [pendingRulePrefill, setPendingRulePrefill] = useState<RulePrefill | null>(null);

  // Explore state
  const [selectedVariable, setSelectedVariable] = useState<ExploreVariable | null>(null);
  const [currentRequest, setCurrentRequest] = useState<ExploreRunRequest | null>(null);

  // Study context form state
  const [hasChanges, setHasChanges] = useState(false);
  const [ctxName, setCtxName] = useState('');
  const [ctxDescription, setCtxDescription] = useState('');
  const [studyObjective, setStudyObjective] = useState('');
  const [country, setCountry] = useState('');
  const [industry, setIndustry] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [brandInput, setBrandInput] = useState('');
  const [methodology, setMethodology] = useState('');
  const [studyDate, setStudyDate] = useState<Date | undefined>();
  const [isTracking, setIsTracking] = useState(false);
  const [waveNumber, setWaveNumber] = useState<number | undefined>();
  const [additionalContext, setAdditionalContext] = useState('');
  const [reportLanguage, setReportLanguage] = useState('en');
  const [isContextOpen, setIsContextOpen] = useState(false);

  const { data: project, isLoading: projectLoading } = useProject(projectId!);
  const { files, isLoading: filesLoading } = useProjectFiles(projectId!);
  const { conversations } = useChat(projectId!);
  const { data: summary } = useExecutiveSummary(projectId!);
  const { data: variableNames = [], isLoading: variablesLoading } = useProjectVariables(projectId, project?.status);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const explore = useExplore(projectId!);


  useEffect(() => {
    if (projectId) {
      setLastProjectId(projectId);
      explore.fetchVariables();
      explore.fetchBookmarks();
    }
  }, [projectId, setLastProjectId]);

  // Initialize study context form when project loads
  useEffect(() => {
    if (project) {
      setCtxName(project.name);
      setCtxDescription(project.description || '');
      setStudyObjective(project.study_objective || '');
      setCountry(project.country || '');
      setIndustry(project.industry || '');
      setTargetAudience(project.target_audience || '');
      setBrands(project.brands || []);
      setMethodology(project.methodology || '');
      setStudyDate(project.study_date ? new Date(project.study_date) : undefined);
      setIsTracking(project.is_tracking || false);
      setWaveNumber(project.wave_number);
      setAdditionalContext(project.additional_context || '');
      setReportLanguage(project.report_language || 'en');
      const hasCtx = project.study_objective || project.country || project.industry ||
        project.target_audience || (project.brands && project.brands.length > 0) ||
        project.methodology || project.study_date || project.is_tracking;
      setIsContextOpen(!!hasCtx);
    }
  }, [project]);

  const markChanged = () => setHasChanges(true);

  const handleAddBrand = () => {
    const trimmed = brandInput.trim();
    if (trimmed && !brands.includes(trimmed)) {
      setBrands([...brands, trimmed]);
      setBrandInput('');
      markChanged();
    }
  };

  const handleRemoveBrand = (brand: string) => {
    setBrands(brands.filter(b => b !== brand));
    markChanged();
  };

  const handleSaveContext = async () => {
    if (!projectId) return;
    const data: ProjectUpdateData = {
      name: ctxName,
      description: ctxDescription || undefined,
      study_objective: studyObjective || undefined,
      country: country || undefined,
      industry: industry || undefined,
      target_audience: targetAudience || undefined,
      brands: brands.length > 0 ? brands : undefined,
      methodology: methodology || undefined,
      study_date: studyDate ? format(studyDate, 'yyyy-MM-dd') : undefined,
      is_tracking: isTracking,
      wave_number: isTracking && waveNumber ? waveNumber : undefined,
      additional_context: additionalContext || undefined,
      report_language: reportLanguage,
    };
    try {
      await updateProject.mutateAsync({ projectId, data, toastMessages: { success: t.toasts.projectUpdated, error: t.toasts.error } });
      setHasChanges(false);
    } catch { /* handled in hook */ }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    try {
      await deleteProject.mutateAsync({ projectId, toastMessages: { success: t.toasts.projectDeleted, error: t.toasts.error } });
      navigate('/projects');
    } catch { /* handled in hook */ }
  };

  // Cross-tab: rule creation from Explorer → DataPrep
  const handleCreateRuleFromExplorer = useCallback((prefill: RulePrefill) => {
    setPendingRulePrefill(prefill);
    setActiveTab('dataprep');
  }, []);

  // Explore handlers
  const handleSelectVariable = useCallback((variable: ExploreVariable) => {
    setSelectedVariable(variable);
    explore.clearResult();
  }, [explore.clearResult]);

  const handleRun = useCallback(async (request: ExploreRunRequest) => {
    setCurrentRequest(request);
    try {
      await explore.runAnalysis(request);
    } catch {
      toast({ title: t.explore?.error || 'Error', description: explore.error || '', variant: 'destructive' });
    }
  }, [explore.runAnalysis, toast, t]);

  const handleExportExplore = useCallback(async () => {
    if (!currentRequest) return;
    try {
      await explore.exportToExcel(currentRequest);
      toast({ title: t.explore?.exportStarted || 'Descarga iniciada' });
    } catch {
      toast({ title: t.explore?.error || 'Error', variant: 'destructive' });
    }
  }, [currentRequest, explore.exportToExcel, toast, t]);

  const handleBookmark = useCallback(async () => {
    if (!currentRequest || !explore.result) return;
    const title = `${explore.result.analysis_type}: ${explore.result.variable}${explore.result.cross_variable ? ` x ${explore.result.cross_variable}` : ''}`;
    try {
      await explore.createBookmark({ title, analysis_config: currentRequest, result_snapshot: explore.result.result || {} });
      toast({ title: t.explore?.bookmarkSaved || 'Análisis guardado' });
    } catch { toast({ title: t.explore?.error || 'Error', variant: 'destructive' }); }
  }, [currentRequest, explore.result, explore.createBookmark, toast, t]);

  const handleSelectBookmark = useCallback((bookmark: ExploreBookmark) => {
    const config = bookmark.analysis_config as ExploreRunRequest;
    setCurrentRequest(config);
    setExploreSubTab('analysis');
    if (explore.variables) {
      const v = explore.variables.variables.find((v) => v.name === config.variable);
      if (v) setSelectedVariable(v);
    }
    explore.runAnalysis(config);
  }, [explore.variables, explore.runAnalysis]);

  const handleDeleteBookmark = useCallback(async (bookmarkId: string) => {
    try {
      await explore.deleteBookmark(bookmarkId);
      toast({ title: t.explore?.bookmarkDeleted || 'Bookmark eliminado' });
    } catch { /* handled */ }
  }, [explore.deleteBookmark, toast, t]);

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
        <div className="p-4 md:p-8 text-center">
          <h1 className="text-2xl font-bold">{t.projectDetail.notFound}</h1>
          <Button variant="link" onClick={() => navigate('/projects')} className="mt-4">
            {t.projectDetail.backToProjects}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const hasFiles = files && files.length > 0;
  const hasReadyFiles = project.status === 'ready';
  const hasSummary = !!summary;
  const dataPrepReady = hasReadyFiles; // could be more granular later
  const showDataReadinessBanner = hasFiles && !hasReadyFiles;

  const hasStudyContext =
    project.study_objective ||
    project.country ||
    project.industry ||
    project.target_audience ||
    (project.brands && project.brands.length > 0) ||
    project.methodology ||
    project.study_date ||
    project.is_tracking;

  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-4">
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
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant={statusConfig[project.status]?.variant ?? 'secondary'}>
                {statusConfig[project.status]?.label ?? project.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
              <span>
                {t.projectDetail.createdOn}{' '}
                {format(
                  new Date(project.created_at),
                  language === 'es' ? "d 'de' MMMM, yyyy" : 'MMMM d, yyyy',
                  { locale: dateLocale }
                )}
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
                  {project.n_cases} {t.projectDetail?.cases || 'cases'}
                </span>
              )}
            </div>
          </div>

          {/* Header action buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/upload`)}
            >
              <Upload className="h-4 w-4 mr-2" />
              {t.projectDetail.uploadFiles}
            </Button>
            <Button
              size="sm"
              onClick={() => setAggfileModalOpen(true)}
              disabled={!hasReadyFiles}
            >
              <Table2 className="h-4 w-4 mr-2" />
              {t.aggfile?.generateTables || 'Generar Tablas'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReportDialogOpen(true)}
              disabled={!hasReadyFiles}
            >
              <Presentation className="h-4 w-4 mr-2" />
              {t.reports?.generateReport ?? 'Generate Report'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/chat`)}
              disabled={!hasReadyFiles}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {t.projectDetail.openChat}
            </Button>
          </div>
        </div>

        {/* Data Readiness Banner */}
        {!dataPrepReady && hasFiles && (
          <div className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
            <div className="flex items-center gap-2 text-warning-foreground text-sm" style={{ color: 'hsl(var(--warning))' }}>
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{t.projectDetail.dataPrepBanner}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              style={{ borderColor: 'hsl(var(--warning) / 0.5)', color: 'hsl(var(--warning))' }}
              onClick={() => setActiveTab('dataprep')}
            >
              <ArrowRight className="h-4 w-4 mr-1" />
              {t.projectDetail.goToDataPrep}
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="border-b rounded-none bg-transparent p-0 h-auto gap-0 w-full justify-start overflow-x-auto">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-1 text-base font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              {t.projectDetail.tabOverview || 'Project Overview'}
            </TabsTrigger>
            <TabsTrigger
              value="dataprep"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-1 text-base font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              <span className="flex items-center gap-2">
                {t.projectDetail.tabData}
                <span className={`h-2 w-2 rounded-full ${dataPrepReady ? 'bg-green-500' : 'bg-amber-500'}`} />
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="explore"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-1 text-base font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              {t.explore?.title || 'Data Explorer'}
            </TabsTrigger>
            <TabsTrigger
              value="context"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-1 text-base font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              {t.settings?.studyContext || 'Study Context'}
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-1 text-base font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              <span className="flex items-center gap-2">
                {t.projectDetail.tabFiles || 'Files'}
                {files && files.length > 0 && (
                  <span className="text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 leading-none">
                    {files.length}
                  </span>
                )}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* === TAB: PROJECT OVERVIEW === */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Quick action cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                    {hasReadyFiles
                      ? t.projectDetail.chatCardDescription
                      : t.projectDetail.chatCardDisabled}
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
                  <CardTitle className="text-base">
                    {t.aggfile?.generateTablesCard || 'Generar Tablas'}
                  </CardTitle>
                  <CardDescription>
                    {hasReadyFiles
                      ? t.aggfile?.generateTablesCardDescription || 'Excel con tablas cruzadas'
                      : t.projectDetail.chatCardDisabled}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-colors ${
                  hasReadyFiles ? 'hover:border-primary/50' : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => hasReadyFiles && setMergeDialogOpen(true)}
              >
                <CardHeader className="pb-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Merge className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base">
                    {language === 'es' ? 'Combinar Datos' : 'Merge Data'}
                  </CardTitle>
                  <CardDescription>
                    {hasReadyFiles
                      ? language === 'es'
                        ? 'Combina múltiples datasets'
                        : 'Combine multiple datasets'
                      : t.projectDetail.chatCardDisabled}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-colors ${
                  hasReadyFiles ? 'hover:border-primary/50' : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => hasReadyFiles && setSegmentationDialogOpen(true)}
              >
                <CardHeader className="pb-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base">
                    {language === 'es' ? 'Segmentación' : 'Segmentation'}
                  </CardTitle>
                  <CardDescription>
                    {hasReadyFiles
                      ? language === 'es'
                        ? 'Clustering K-Means / Jerárquico'
                        : 'K-Means / Hierarchical Clustering'
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

            {/* Data readiness inline banner */}
            {!dataPrepReady && hasFiles && (
              <button
                onClick={() => setActiveTab('dataprep')}
                className="w-auto flex items-center gap-2 text-sm rounded-lg px-4 py-2.5 border transition-colors"
                style={{ color: 'hsl(var(--warning))', borderColor: 'hsl(var(--warning) / 0.4)', backgroundColor: 'hsl(var(--warning) / 0.08)' }}
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: 'hsl(var(--warning))' }} />
                {t.projectDetail.dataPrepBanner}
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </button>
            )}

            {/* Executive Summary */}
            {hasSummary && (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{t.summary?.title || 'Resumen Ejecutivo'}</CardTitle>
                      <CardDescription>
                        {t.summary?.generatedByAI || 'Generado automáticamente con IA'}
                      </CardDescription>
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
                  <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-3">
                    <ReactMarkdown>{summary.content}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {!hasFiles && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="font-semibold mb-1">{t.projectDetail.noFilesYet}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t.projectDetail.uploadCardDescription}
                  </p>
                  <Button onClick={() => navigate(`/projects/${projectId}/upload`)}>
                    <Upload className="h-4 w-4 mr-2" />
                    {t.projectDetail.uploadFiles}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* === TAB: DATA PREPARATION === */}
          <TabsContent value="dataprep" className="space-y-6 mt-0">
            {hasReadyFiles ? (
              variableNames.length > 0 ? (
              <>
                {files?.some(f => f.file_type === 'csv_data' || f.file_type === 'excel_data') && (
                  <VariableMetadataManager projectId={projectId!} />
                )}
                <DataPrepManager
                  projectId={projectId!}
                  availableVariables={variableNames}
                  externalPrefill={pendingRulePrefill}
                  onExternalPrefillConsumed={() => setPendingRulePrefill(null)}
                />
                {project.is_tracking && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.waves?.title || 'Waves / Tracking'}</CardTitle>
                      <CardDescription>
                        {t.waves?.description ||
                          'Gestiona las olas del estudio y compara resultados entre periodos'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <WaveManager
                        projectId={projectId!}
                        availableFiles={
                          files?.map((f) => ({ id: f.id, name: f.original_name })) || []
                        }
                        availableVariables={variableNames}
                      />
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.grouping?.title || 'Grupos de Variables'}</CardTitle>
                    <CardDescription>
                      {t.grouping?.autoDetectDescription ||
                        'Organiza las variables en grupos para análisis más estructurados'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VariableGroupsManager
                      projectId={projectId!}
                      availableVariables={variableNames}
                    />
                  </CardContent>
                </Card>

                {/* Segment Manager */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.segments?.title || 'Segmentos'}</CardTitle>
                    <CardDescription>
                      {t.segments?.subtitle || 'Define reusable audience segments to filter analyses'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SegmentManager
                      projectId={projectId!}
                      availableVariables={explore.variables?.variables || []}
                    />
                  </CardContent>
                </Card>
              </>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">
                      {t.common?.loading || 'Loading...'}
                    </span>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle className="h-12 w-12 mb-4" style={{ color: 'hsl(var(--warning) / 0.6)' }} />
                  <h3 className="font-semibold mb-1">
                    {t.projectDetail.chatCardDisabled || 'Confirm data preparation first'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t.projectDetail.uploadCardDescription}
                  </p>
                  <Button variant="outline" onClick={() => navigate(`/projects/${projectId}/upload`)}>
                    <Upload className="h-4 w-4 mr-2" />
                    {t.projectDetail.uploadFiles}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* === TAB: DATA EXPLORER === */}
          <TabsContent value="explore" className="mt-0 -mx-6 -mb-6 lg:-mx-8 lg:-mb-8">
            {hasReadyFiles ? (
              <Tabs value={exploreSubTab} onValueChange={(v) => setExploreSubTab(v as 'table' | 'analysis')}>
                {/* Sub-tab header */}
                <div className="px-6 lg:px-8 border-b bg-muted/20">
                  <TabsList className="bg-transparent p-0 h-auto gap-0 rounded-none">
                    <TabsTrigger
                      value="table"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      {t.explore?.browse || 'Browse'}
                    </TabsTrigger>
                    <TabsTrigger
                      value="analysis"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      {t.explore?.analyze || 'Analyze'}
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Sub-tab: Data Table */}
                <TabsContent value="table" className="mt-0 h-[calc(100vh-290px)] overflow-hidden">
                  <DataTableView
                    projectId={projectId!}
                    groups={explore.variables?.groups}
                    onCreateRule={handleCreateRuleFromExplorer}
                  />
                </TabsContent>

                {/* Sub-tab: Frequency Analysis */}
                <TabsContent value="analysis" className="mt-0 h-[calc(100vh-290px)] flex overflow-hidden">
                  {/* Left: Variable Browser */}
                  <div className="w-64 border-r flex-shrink-0 overflow-hidden">
                    {explore.variables && (
                      <VariableBrowser
                        variables={explore.variables.variables}
                        groups={explore.variables.groups}
                        banners={explore.variables.banners}
                        selectedVariable={selectedVariable?.name || null}
                        onSelectVariable={handleSelectVariable}
                      />
                    )}
                    {explore.isLoading && (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Center: Analysis + Results */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <AnalysisPanel
                      selectedVariable={selectedVariable}
                      allVariables={explore.variables?.variables || []}
                      banners={explore.variables?.banners || []}
                      isRunning={explore.isRunning}
                      onRun={handleRun}
                    />
                    {explore.result && (
                      <ResultDisplay
                        result={explore.result}
                        currentRequest={currentRequest}
                        onExport={handleExportExplore}
                        onBookmark={handleBookmark}
                      />
                    )}
                  </div>

                  {/* Right: Bookmarks (toggleable) */}
                  {showBookmarks && (
                    <div className="w-64 border-l flex-shrink-0 overflow-hidden">
                      <div className="p-3 border-b flex items-center justify-between">
                        <h3 className="font-medium text-sm">
                          {t.explore?.bookmarks || 'Bookmarks'} ({explore.bookmarks.length})
                        </h3>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowBookmarks(false)}>
                          <PanelRightClose className="h-4 w-4" />
                        </Button>
                      </div>
                      <BookmarkManager
                        bookmarks={explore.bookmarks}
                        onSelect={handleSelectBookmark}
                        onDelete={handleDeleteBookmark}
                      />
                    </div>
                  )}
                  {!showBookmarks && (
                    <div className="border-l p-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowBookmarks(true)}>
                        <PanelRightOpen className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="border-dashed m-0">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Compass className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="font-semibold mb-1">
                    {t.projectDetail.chatCardDisabled || 'Primero sube y procesa tus datos'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t.projectDetail.uploadCardDescription}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* === TAB: STUDY CONTEXT (inline editor) === */}
          <TabsContent value="context" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>{t.settings.studyContext}</CardTitle>
                  <CardDescription>{t.projectDetail.studyContextDescription}</CardDescription>
                </div>
                <Button
                  onClick={handleSaveContext}
                  disabled={!hasChanges || updateProject.isPending || !ctxName.trim()}
                  size="sm"
                >
                  {updateProject.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t.common.save}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ctx-name">{t.projects.name} *</Label>
                    <Input id="ctx-name" value={ctxName} onChange={(e) => { setCtxName(e.target.value); markChanged(); }} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ctx-desc">{t.projects.description}</Label>
                    <Input id="ctx-desc" value={ctxDescription} onChange={(e) => { setCtxDescription(e.target.value); markChanged(); }} />
                  </div>
                </div>

                {/* Study Context collapsible */}
                <Collapsible open={isContextOpen} onOpenChange={setIsContextOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                      <span className="text-sm font-medium">{t.settings.studyContext}</span>
                      <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isContextOpen && 'rotate-180')} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>{t.settings.studyObjective}</Label>
                      <Textarea value={studyObjective} onChange={(e) => { setStudyObjective(e.target.value); markChanged(); }} placeholder={t.settings.studyObjectivePlaceholder} rows={3} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{t.settings.country}</Label>
                        <Input value={country} onChange={(e) => { setCountry(e.target.value); markChanged(); }} placeholder={t.settings.countryPlaceholder} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.settings.industry}</Label>
                        <Select value={industry} onValueChange={(v) => { setIndustry(v); markChanged(); }}>
                          <SelectTrigger><SelectValue placeholder={t.settings.industryPlaceholder} /></SelectTrigger>
                          <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{t.settings.methodology}</Label>
                        <Select value={methodology} onValueChange={(v) => { setMethodology(v); markChanged(); }}>
                          <SelectTrigger><SelectValue placeholder={t.settings.methodologyPlaceholder} /></SelectTrigger>
                          <SelectContent>{METHODOLOGIES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t.settings.studyDate}</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !studyDate && 'text-muted-foreground')}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {studyDate ? format(studyDate, 'PPP', { locale: dateLocale }) : t.settings.studyDatePlaceholder}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarPicker mode="single" selected={studyDate} onSelect={(d) => { setStudyDate(d); markChanged(); }} initialFocus className="pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t.settings.targetAudience}</Label>
                      <Textarea value={targetAudience} onChange={(e) => { setTargetAudience(e.target.value); markChanged(); }} placeholder={t.settings.targetAudiencePlaceholder} rows={2} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.settings.brands}</Label>
                      <div className="flex gap-2">
                        <Input value={brandInput} onChange={(e) => setBrandInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBrand())} placeholder={t.settings.brandsPlaceholder} />
                        <Button type="button" variant="secondary" onClick={handleAddBrand}>{t.common.add}</Button>
                      </div>
                      {brands.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {brands.map(b => (
                            <Badge key={b} variant="secondary" className="gap-1">{b}
                              <button type="button" onClick={() => handleRemoveBrand(b)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>{t.settings.isTracking}</Label>
                      <Switch checked={isTracking} onCheckedChange={(v) => { setIsTracking(v); markChanged(); }} />
                    </div>
                    {isTracking && (
                      <div className="space-y-2">
                        <Label>{t.settings.waveNumber}</Label>
                        <Input type="number" min={1} value={waveNumber || ''} onChange={(e) => { setWaveNumber(e.target.value ? parseInt(e.target.value) : undefined); markChanged(); }} placeholder={t.settings.waveNumberPlaceholder} />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>{t.settings.additionalContext}</Label>
                      <Textarea value={additionalContext} onChange={(e) => { setAdditionalContext(e.target.value); markChanged(); }} placeholder={t.settings.additionalContextPlaceholder} rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'es' ? 'Idioma del Reporte' : 'Report Language'}</Label>
                      <Select value={reportLanguage} onValueChange={(v) => { setReportLanguage(v); markChanged(); }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="es">🇪🇸 Español</SelectItem>
                          <SelectItem value="en">🇺🇸 English</SelectItem>
                          <SelectItem value="pt">🇧🇷 Português</SelectItem>
                          <SelectItem value="fr">🇫🇷 Français</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Danger zone */}
                <div className="border-t pt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t.settings.deleteProject}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t.settings.deleteProjectConfirm}</AlertDialogTitle>
                        <AlertDialogDescription>{t.settings.deleteProjectWarning}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          {deleteProject.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                          {t.common.delete}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* === TAB: FILES === */}
          <TabsContent value="files" className="mt-0">
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
                            {format(new Date(file.uploaded_at), 'd MMM yyyy', { locale: dateLocale })}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {file.file_type === 'spss_data' ? 'SPSS'
                            : file.file_type === 'csv_data' ? 'CSV'
                            : file.file_type === 'excel_data' ? 'Excel'
                            : t.projectDetail?.questionnaire ?? 'Cuestionario'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Aggfile Generator Modal */}
      <AggfileGeneratorModal
        open={aggfileModalOpen}
        onOpenChange={setAggfileModalOpen}
        projectId={projectId!}
      />

      {/* Merge Wizard Dialog */}
      <MergeWizardDialog
        open={mergeDialogOpen}
        onOpenChange={setMergeDialogOpen}
        projectId={projectId!}
        projectName={project?.name || 'Project'}
      />

      {/* Segmentation Wizard Dialog */}
      <SegmentationWizardDialog
        open={segmentationDialogOpen}
        onOpenChange={setSegmentationDialogOpen}
        projectId={projectId!}
        variables={explore.variables?.variables ?? []}
      />

      {/* Report Generator Dialog */}
      <ReportGeneratorDialog
        projectId={projectId!}
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        studyObjective={project?.study_objective || undefined}
        conversationCount={conversations?.length ?? 0}
      />
    </AppLayout>
  );
}
