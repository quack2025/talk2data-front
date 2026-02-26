/**
 * DashboardBuilder — full-page drag-and-drop dashboard editor.
 *
 * Uses react-grid-layout for grid positioning and resizing.
 * Widgets render their cached_result via DashboardWidgetRenderer.
 * Layout changes are debounced and saved to the backend.
 *
 * Sprint 17a (Gap G4) + Sprint 17b (Theme customization)
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeft,
  Plus,
  RefreshCw,
  Settings2,
  Trash2,
  Globe,
  GripVertical,
  Palette,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useDashboards } from '@/hooks/useDashboards';
import { DashboardWidgetRenderer } from '@/components/dashboards/DashboardWidgetRenderer';
import { WidgetConfigEditor } from '@/components/dashboards/WidgetConfigEditor';
import { ThemeEditor } from '@/components/dashboards/ThemeEditor';
import type {
  DashboardWidget,
  DashboardTheme,
  WidgetType,
  WidgetCreateRequest,
  WidgetLayoutItem,
} from '@/types/dashboard';
import { WIDGET_TYPE_LABELS } from '@/types/dashboard';

const ResponsiveGridLayout = WidthProvider(Responsive);

const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
const ROW_HEIGHT = 80;

const WIDGET_CATALOG: Array<{
  type: WidgetType;
  defaultW: number;
  defaultH: number;
}> = [
  { type: 'kpi_card', defaultW: 3, defaultH: 2 },
  { type: 'frequency_chart', defaultW: 6, defaultH: 4 },
  { type: 'crosstab_table', defaultW: 6, defaultH: 4 },
  { type: 'compare_means_chart', defaultW: 6, defaultH: 4 },
  { type: 'nps_gauge', defaultW: 4, defaultH: 3 },
  { type: 'text_block', defaultW: 4, defaultH: 2 },
];

export default function DashboardBuilder() {
  const { projectId, dashboardId } = useParams<{
    projectId: string;
    dashboardId: string;
  }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const lang = language as 'es' | 'en';

  const dashboards = useDashboards(projectId || '');
  const dash = dashboards.activeDashboard;

  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load dashboard on mount
  useEffect(() => {
    if (projectId && dashboardId) {
      dashboards.fetchDashboard(dashboardId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, dashboardId]);

  // Build react-grid-layout items from dashboard layout + widgets
  const layoutItems = useMemo(() => {
    if (!dash) return [];

    return dash.widgets.map((w, idx) => {
      // Find position from layout array, or generate a default
      const layoutEntry = dash.layout.find(
        (l) => l.widget_id === w.id
      );
      return {
        i: w.id,
        x: layoutEntry?.x ?? (idx % 2) * 6,
        y: layoutEntry?.y ?? Math.floor(idx / 2) * 4,
        w: layoutEntry?.w ?? 6,
        h: layoutEntry?.h ?? 4,
        minW: 2,
        minH: 2,
      };
    });
  }, [dash]);

  // Save layout with debounce
  const saveLayout = useCallback(
    (newLayout: Array<{ i: string; x: number; y: number; w: number; h: number }>) => {
      if (!dash || !projectId) return;

      if (saveTimeout.current) clearTimeout(saveTimeout.current);

      saveTimeout.current = setTimeout(() => {
        const widgetLayout: WidgetLayoutItem[] = newLayout.map((item) => ({
          widget_id: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        }));
        dashboards.updateDashboard(dash.id, { layout: widgetLayout });
      }, 800);
    },
    [dash, projectId, dashboards]
  );

  const handleLayoutChange = useCallback(
    (layout: Array<{ i: string; x: number; y: number; w: number; h: number }>) => {
      saveLayout(layout);
    },
    [saveLayout]
  );

  // Add widget
  const handleAddWidget = useCallback(
    async (widgetType: WidgetType, defaultW: number, defaultH: number) => {
      if (!dash) return;
      const config: WidgetCreateRequest = {
        widget_type: widgetType,
        title: WIDGET_TYPE_LABELS[widgetType][lang] || widgetType,
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
        order_index: dash.widgets.length,
      };
      const newWidget = await dashboards.addWidget(dash.id, config);
      if (newWidget) {
        // Open config editor for the new widget
        setEditingWidget(newWidget);
      }
    },
    [dash, dashboards, lang]
  );

  // Delete widget
  const handleDeleteWidget = useCallback(
    async (widgetId: string) => {
      if (!dash) return;
      if (editingWidget?.id === widgetId) setEditingWidget(null);
      await dashboards.deleteWidget(dash.id, widgetId);
    },
    [dash, dashboards, editingWidget]
  );

  // Save widget config
  const handleSaveWidgetConfig = useCallback(
    async (
      widgetId: string,
      config: { title?: string; analysis_config?: unknown }
    ) => {
      if (!dash) return;
      await dashboards.updateWidget(dash.id, widgetId, config as Record<string, unknown>);
      // Refresh to recompute cached results
      await dashboards.refreshDashboard(dash.id);
      setEditingWidget(null);
    },
    [dash, dashboards]
  );

  // Refresh all
  const handleRefresh = useCallback(async () => {
    if (!dash) return;
    await dashboards.refreshDashboard(dash.id);
  }, [dash, dashboards]);

  // Save theme
  const handleSaveTheme = useCallback(
    (theme: DashboardTheme) => {
      if (!dash) return;
      dashboards.updateDashboard(dash.id, { theme });
    },
    [dash, dashboards],
  );

  // Derive theme CSS custom properties for live preview
  const themeStyles = useMemo(() => {
    const t = dash?.theme as DashboardTheme | null | undefined;
    if (!t) return {};
    return {
      '--dash-primary': t.primary_color || '#1e40af',
      '--dash-accent': t.accent_color || '#f59e0b',
      '--dash-bg': t.background_color || '#ffffff',
      '--dash-text': t.text_color || '#1f2937',
      '--dash-font': t.font_family || 'Inter',
    } as React.CSSProperties;
  }, [dash?.theme]);

  if (!projectId || !dashboardId) {
    return <div className="p-8 text-center">Missing project or dashboard ID</div>;
  }

  if (dashboards.isLoading && !dash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!dash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Dashboard not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Toolbar */}
      <header className="border-b bg-card px-4 py-2 flex items-center gap-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate">{dash.name}</h1>
          <p className="text-xs text-muted-foreground">
            {dash.widgets.length} widget{dash.widgets.length !== 1 ? 's' : ''}
            {dash.is_published && (
              <span className="ml-2 text-green-600">
                <Globe className="h-3 w-3 inline mr-0.5" />
                {lang === 'es' ? 'Publicado' : 'Published'}
              </span>
            )}
          </p>
        </div>

        {/* Add widget dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {lang === 'es' ? 'Widget' : 'Widget'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {WIDGET_CATALOG.map((wc) => (
              <DropdownMenuItem
                key={wc.type}
                onClick={() => handleAddWidget(wc.type, wc.defaultW, wc.defaultH)}
              >
                {WIDGET_TYPE_LABELS[wc.type][lang]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme */}
        <Button
          variant={showThemeEditor ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setShowThemeEditor((v) => !v);
            if (!showThemeEditor) setEditingWidget(null);
          }}
        >
          <Palette className="h-3.5 w-3.5" />
          {lang === 'es' ? 'Tema' : 'Theme'}
        </Button>

        {/* Refresh */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleRefresh}
          disabled={dashboards.isRefreshing}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${dashboards.isRefreshing ? 'animate-spin' : ''}`}
          />
          {lang === 'es' ? 'Actualizar' : 'Refresh'}
        </Button>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Grid — apply theme styles */}
        <div
          className="flex-1 overflow-auto p-4"
          style={{
            backgroundColor: themeStyles['--dash-bg'] as string || undefined,
            color: themeStyles['--dash-text'] as string || undefined,
            fontFamily: themeStyles['--dash-font'] as string || undefined,
            ...themeStyles,
          }}
        >
          {dash.widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Plus className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">
                {lang === 'es'
                  ? 'Agrega widgets para construir tu dashboard'
                  : 'Add widgets to build your dashboard'}
              </p>
              <p className="text-sm mt-1">
                {lang === 'es'
                  ? 'Usa el botón "Widget" en la barra superior'
                  : 'Use the "Widget" button in the toolbar'}
              </p>
            </div>
          ) : (
            <ResponsiveGridLayout
              className="layout"
              layouts={{ lg: layoutItems }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={COLS}
              rowHeight={ROW_HEIGHT}
              onLayoutChange={handleLayoutChange}
              draggableHandle=".widget-drag-handle"
              isResizable
              isDraggable
              compactType="vertical"
              margin={[12, 12]}
            >
              {dash.widgets.map((widget) => (
                <div key={widget.id}>
                  <Card className="h-full flex flex-col overflow-hidden group">
                    {/* Widget header */}
                    <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-muted/30 shrink-0">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab widget-drag-handle opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-xs font-medium truncate flex-1">
                        {widget.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setEditingWidget(widget);
                          setShowThemeEditor(false);
                        }}
                      >
                        <Settings2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                        onClick={() => handleDeleteWidget(widget.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {/* Widget content */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <DashboardWidgetRenderer widget={widget} />
                    </div>
                  </Card>
                </div>
              ))}
            </ResponsiveGridLayout>
          )}
        </div>

        {/* Config editor panel */}
        {editingWidget && !showThemeEditor && (
          <div className="w-72 shrink-0">
            <WidgetConfigEditor
              widget={editingWidget}
              projectId={projectId}
              onSave={handleSaveWidgetConfig}
              onClose={() => setEditingWidget(null)}
            />
          </div>
        )}

        {/* Theme editor panel */}
        {showThemeEditor && (
          <div className="w-72 shrink-0">
            <ThemeEditor
              theme={(dash.theme as DashboardTheme) || null}
              onSave={handleSaveTheme}
              onClose={() => setShowThemeEditor(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
