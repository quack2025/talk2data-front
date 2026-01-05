import { useEffect } from 'react';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useProject } from '@/hooks/useProjects';
import { useProjectFiles } from '@/hooks/useProjectFiles';
import { useLanguage } from '@/i18n/LanguageContext';
import { useLastProject } from '@/hooks/useLastProject';

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const dateLocale = language === 'es' ? es : enUS;
  const { setLastProjectId } = useLastProject();

  // Use the API hooks
  const { data: project, isLoading: projectLoading } = useProject(projectId!);
  const { files, isLoading: filesLoading } = useProjectFiles(projectId!);

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
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
      </div>
    </AppLayout>
  );
}
