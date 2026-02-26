import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  LayoutDashboard,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronLeft,
  Copy,
  Check,
  Globe,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useDashboards } from '@/hooks/useDashboards';
import type { Dashboard, WidgetType, WidgetCreateRequest } from '@/types/dashboard';
import { WIDGET_TYPE_LABELS } from '@/types/dashboard';

interface DashboardManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

type View = 'list' | 'create' | 'detail';

const AVAILABLE_WIDGETS: WidgetType[] = [
  'kpi_card',
  'frequency_chart',
  'crosstab_table',
  'compare_means_chart',
  'nps_gauge',
  'text_block',
];

export function DashboardManagerDialog({
  open,
  onOpenChange,
  projectId,
}: DashboardManagerDialogProps) {
  const { t, language } = useLanguage();
  const dashboards = useDashboards(projectId);
  const [view, setView] = useState<View>('list');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      dashboards.fetchDashboards();
      setView('list');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    const result = await dashboards.createDashboard({
      name: newName.trim(),
      description: newDesc.trim() || null,
    });
    if (result) {
      setNewName('');
      setNewDesc('');
      setView('detail');
    }
  }, [newName, newDesc, dashboards]);

  const handleDelete = useCallback(
    async (id: string) => {
      await dashboards.deleteDashboard(id);
    },
    [dashboards]
  );

  const handleOpenDashboard = useCallback(
    async (id: string) => {
      await dashboards.fetchDashboard(id);
      setView('detail');
    },
    [dashboards]
  );

  const handleAddWidget = useCallback(
    async (widgetType: WidgetType) => {
      if (!dashboards.activeDashboard) return;
      const config: WidgetCreateRequest = {
        widget_type: widgetType,
        title: WIDGET_TYPE_LABELS[widgetType][language] || widgetType,
        analysis_config: {
          analysis_type:
            widgetType === 'text_block'
              ? 'text'
              : widgetType === 'kpi_card'
                ? 'kpi'
                : widgetType === 'frequency_chart'
                  ? 'frequency'
                  : widgetType === 'nps_gauge'
                    ? 'nps'
                    : widgetType === 'compare_means_chart'
                      ? 'compare_means'
                      : 'crosstab',
          text_content:
            widgetType === 'text_block' ? '## Title\nContent here...' : undefined,
        },
      };
      await dashboards.addWidget(dashboards.activeDashboard.id, config);
    },
    [dashboards, language]
  );

  const handleRefresh = useCallback(async () => {
    if (!dashboards.activeDashboard) return;
    await dashboards.refreshDashboard(dashboards.activeDashboard.id);
  }, [dashboards]);

  const handlePublish = useCallback(async () => {
    if (!dashboards.activeDashboard) return;
    setIsPublishing(true);
    await dashboards.publishDashboard(dashboards.activeDashboard.id);
    setIsPublishing(false);
  }, [dashboards]);

  const handleUnpublish = useCallback(async () => {
    if (!dashboards.activeDashboard) return;
    await dashboards.unpublishDashboard(dashboards.activeDashboard.id);
  }, [dashboards]);

  const handleCopyLink = useCallback((token: string) => {
    const url = `${window.location.origin}/dashboard/view/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const lang = language as 'es' | 'en';

  // --- List view ---
  const renderList = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 space-y-1">
        <h3 className="font-semibold">
          {lang === 'es' ? 'Dashboards del proyecto' : 'Project Dashboards'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {lang === 'es'
            ? 'Crea y gestiona dashboards interactivos'
            : 'Create and manage interactive dashboards'}
        </p>
      </div>

      <ScrollArea className="flex-1 px-4">
        {dashboards.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : dashboards.dashboards.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <LayoutDashboard className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">
              {lang === 'es' ? 'Sin dashboards aún' : 'No dashboards yet'}
            </p>
            <p className="text-sm mt-1">
              {lang === 'es'
                ? 'Crea tu primer dashboard para compartir resultados'
                : 'Create your first dashboard to share results'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {dashboards.dashboards.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleOpenDashboard(d.id)}
              >
                <LayoutDashboard className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{d.name}</p>
                  {d.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {d.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {d.is_published && (
                    <Eye className="h-3.5 w-3.5 text-green-500" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(d.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t">
        <Button onClick={() => setView('create')} className="w-full gap-2">
          <Plus className="h-4 w-4" />
          {lang === 'es' ? 'Crear dashboard' : 'Create Dashboard'}
        </Button>
      </div>
    </div>
  );

  // --- Create view ---
  const renderCreate = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <h3 className="font-semibold">
          {lang === 'es' ? 'Nuevo dashboard' : 'New Dashboard'}
        </h3>
      </div>

      <div className="flex-1 px-4 space-y-4">
        <div className="space-y-2">
          <Label>{lang === 'es' ? 'Nombre' : 'Name'}</Label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={
              lang === 'es'
                ? 'Ej: Dashboard Brand Tracker Q1'
                : 'E.g.: Brand Tracker Dashboard Q1'
            }
            maxLength={255}
          />
        </div>
        <div className="space-y-2">
          <Label>{lang === 'es' ? 'Descripción (opcional)' : 'Description (optional)'}</Label>
          <Input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder={
              lang === 'es'
                ? 'Descripción breve del dashboard'
                : 'Brief dashboard description'
            }
          />
        </div>
      </div>

      <div className="p-4 border-t flex gap-2">
        <Button variant="outline" onClick={() => setView('list')} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          {t.common.back}
        </Button>
        <Button
          onClick={handleCreate}
          disabled={!newName.trim() || dashboards.isLoading}
          className="flex-1"
        >
          {lang === 'es' ? 'Crear' : 'Create'}
        </Button>
      </div>
    </div>
  );

  // --- Detail view ---
  const renderDetail = () => {
    const dash = dashboards.activeDashboard;
    if (!dash) return null;

    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4 pb-2 space-y-1">
          <h3 className="font-semibold truncate">{dash.name}</h3>
          <p className="text-sm text-muted-foreground">
            {dash.widgets.length} widget{dash.widgets.length !== 1 ? 's' : ''}
          </p>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-3 pb-4">
            {/* Existing widgets */}
            {dash.widgets.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{w.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {WIDGET_TYPE_LABELS[w.widget_type]?.[lang] || w.widget_type}
                    {w.cached_at && (
                      <span className="ml-2 text-green-600">
                        {lang === 'es' ? 'en caché' : 'cached'}
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() =>
                    dashboards.deleteWidget(dash.id, w.id)
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            {/* Add widget section */}
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-2">
                {lang === 'es' ? 'Agregar widget' : 'Add Widget'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_WIDGETS.map((wt) => (
                  <Button
                    key={wt}
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start h-auto py-2"
                    onClick={() => handleAddWidget(wt)}
                  >
                    {WIDGET_TYPE_LABELS[wt][lang]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Publish / Share section */}
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-2">
                <Globe className="h-3.5 w-3.5 inline mr-1.5" />
                {lang === 'es' ? 'Compartir' : 'Share'}
              </p>
              {dash.is_published && dash.share_token ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                    <Eye className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                      {lang === 'es' ? 'Publicado' : 'Published'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      readOnly
                      value={`${window.location.origin}/dashboard/${dash.share_token}`}
                      className="text-xs h-8"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleCopyLink(dash.share_token!)}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:text-destructive w-full gap-1.5"
                    onClick={handleUnpublish}
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    {lang === 'es' ? 'Dejar de compartir' : 'Unpublish'}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs"
                  onClick={handlePublish}
                  disabled={isPublishing || dash.widgets.length === 0}
                >
                  <Globe className="h-3.5 w-3.5" />
                  {isPublishing
                    ? (lang === 'es' ? 'Publicando...' : 'Publishing...')
                    : (lang === 'es' ? 'Publicar dashboard' : 'Publish Dashboard')}
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              dashboards.clearActive();
              setView('list');
            }}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {t.common.back}
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={dashboards.isRefreshing || dash.widgets.length === 0}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${dashboards.isRefreshing ? 'animate-spin' : ''}`}
            />
            {lang === 'es' ? 'Actualizar' : 'Refresh'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg h-[80vh] max-h-[700px] flex flex-col p-0 gap-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle>
            {lang === 'es' ? 'Dashboards' : 'Dashboards'}
          </DialogTitle>
          <DialogDescription>
            {lang === 'es'
              ? 'Crea dashboards interactivos para compartir con tu equipo'
              : 'Create interactive dashboards to share with your team'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {view === 'list' && renderList()}
          {view === 'create' && renderCreate()}
          {view === 'detail' && renderDetail()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
