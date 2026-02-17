import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Loader2, ArrowLeft, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { useProject } from '@/hooks/useProjects';
import { useExplore } from '@/hooks/useExplore';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  VariableBrowser,
  AnalysisPanel,
  ResultDisplay,
  BookmarkManager,
} from '@/components/explore';
import type { ExploreVariable, ExploreRunRequest, ExploreBookmark } from '@/types/explore';

export default function ProjectExplore() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();

  const { data: project, isLoading: projectLoading } = useProject(projectId!);
  const explore = useExplore(projectId!);

  const [selectedVariable, setSelectedVariable] = useState<ExploreVariable | null>(null);
  const [currentRequest, setCurrentRequest] = useState<ExploreRunRequest | null>(null);
  const [showBookmarks, setShowBookmarks] = useState(true);

  // Load variables and bookmarks on mount
  useEffect(() => {
    explore.fetchVariables();
    explore.fetchBookmarks();
  }, [projectId]);

  const handleSelectVariable = useCallback((variable: ExploreVariable) => {
    setSelectedVariable(variable);
    explore.clearResult();
  }, [explore.clearResult]);

  const handleRun = useCallback(
    async (request: ExploreRunRequest) => {
      setCurrentRequest(request);
      try {
        await explore.runAnalysis(request);
      } catch {
        toast({
          title: t.explore?.error || 'Error',
          description: explore.error || 'Error running analysis',
          variant: 'destructive',
        });
      }
    },
    [explore.runAnalysis, toast, t]
  );

  const handleExport = useCallback(async () => {
    if (!currentRequest) return;
    try {
      await explore.exportToExcel(currentRequest);
      toast({ title: t.explore?.exportStarted || 'Descarga iniciada' });
    } catch {
      toast({
        title: t.explore?.error || 'Error',
        description: t.explore?.exportError || 'Error exporting',
        variant: 'destructive',
      });
    }
  }, [currentRequest, explore.exportToExcel, toast, t]);

  const handleBookmark = useCallback(async () => {
    if (!currentRequest || !explore.result) return;
    const title = `${explore.result.analysis_type}: ${explore.result.variable}${
      explore.result.cross_variable ? ` x ${explore.result.cross_variable}` : ''
    }`;
    try {
      await explore.createBookmark({
        title,
        analysis_config: currentRequest,
        result_snapshot: explore.result.result || {},
      });
      toast({ title: t.explore?.bookmarkSaved || 'Análisis guardado' });
    } catch {
      toast({
        title: t.explore?.error || 'Error',
        variant: 'destructive',
      });
    }
  }, [currentRequest, explore.result, explore.createBookmark, toast, t]);

  const handleSelectBookmark = useCallback(
    (bookmark: ExploreBookmark) => {
      const config = bookmark.analysis_config as ExploreRunRequest;
      setCurrentRequest(config);
      // Find and select the variable
      if (explore.variables) {
        const v = explore.variables.variables.find((v) => v.name === config.variable);
        if (v) setSelectedVariable(v);
      }
      // Run the analysis to get fresh result
      explore.runAnalysis(config);
    },
    [explore.variables, explore.runAnalysis]
  );

  const handleDeleteBookmark = useCallback(
    async (bookmarkId: string) => {
      try {
        await explore.deleteBookmark(bookmarkId);
        toast({ title: t.explore?.bookmarkDeleted || 'Bookmark eliminado' });
      } catch {
        // Error already set in hook
      }
    },
    [explore.deleteBookmark, toast, t]
  );

  if (projectLoading || explore.isLoading) {
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
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold">{t.projectDetail?.notFound || 'Project not found'}</h1>
          <Button variant="link" onClick={() => navigate('/projects')} className="mt-4">
            {t.projectDetail?.backToProjects || 'Back to projects'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const vars = explore.variables;

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/projects">{t.projects?.title || 'Proyectos'}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/projects/${projectId}`}>{project.name}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t.explore?.title || 'Explorar Datos'}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBookmarks(!showBookmarks)}
          >
            {showBookmarks ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Main 3-panel layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Variable Browser */}
          <div className="w-72 border-r flex-shrink-0 overflow-hidden">
            {vars && (
              <VariableBrowser
                variables={vars.variables}
                groups={vars.groups}
                banners={vars.banners}
                selectedVariable={selectedVariable?.name || null}
                onSelectVariable={handleSelectVariable}
              />
            )}
          </div>

          {/* Center: Analysis + Results */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnalysisPanel
              selectedVariable={selectedVariable}
              allVariables={vars?.variables || []}
              banners={vars?.banners || []}
              isRunning={explore.isRunning}
              onRun={handleRun}
            />

            {explore.result && (
              <ResultDisplay
                result={explore.result}
                currentRequest={currentRequest}
                onExport={handleExport}
                onBookmark={handleBookmark}
              />
            )}
          </div>

          {/* Right: Bookmarks */}
          {showBookmarks && (
            <div className="w-72 border-l flex-shrink-0 overflow-hidden">
              <div className="p-3 border-b">
                <h3 className="font-medium text-sm">
                  {t.explore?.bookmarks || 'Bookmarks'} ({explore.bookmarks.length})
                </h3>
              </div>
              <BookmarkManager
                bookmarks={explore.bookmarks}
                onSelect={handleSelectBookmark}
                onDelete={handleDeleteBookmark}
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
