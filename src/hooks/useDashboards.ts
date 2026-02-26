import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  Dashboard,
  DashboardDetail,
  DashboardCreateRequest,
  DashboardUpdateRequest,
  DashboardWidget,
  WidgetCreateRequest,
  WidgetUpdateRequest,
  WidgetCacheRefreshResponse,
  PublishRequest,
  PublishResponse,
} from '@/types/dashboard';

interface UseDashboardsState {
  dashboards: Dashboard[];
  activeDashboard: DashboardDetail | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

export function useDashboards(projectId: string) {
  const [state, setState] = useState<UseDashboardsState>({
    dashboards: [],
    activeDashboard: null,
    isLoading: false,
    isRefreshing: false,
    error: null,
  });

  // --- List dashboards ---
  const fetchDashboards = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.get<Dashboard[]>(
        `/projects/${projectId}/dashboards`
      );
      setState((prev) => ({
        ...prev,
        dashboards: response,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error loading dashboards',
      }));
    }
  }, [projectId]);

  // --- Get dashboard detail ---
  const fetchDashboard = useCallback(
    async (dashboardId: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const response = await api.get<DashboardDetail>(
          `/projects/${projectId}/dashboards/${dashboardId}`
        );
        setState((prev) => ({
          ...prev,
          activeDashboard: response,
          isLoading: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error.message : 'Error loading dashboard',
        }));
      }
    },
    [projectId]
  );

  // --- Create dashboard ---
  const createDashboard = useCallback(
    async (data: DashboardCreateRequest) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const response = await api.post<DashboardDetail>(
          `/projects/${projectId}/dashboards`,
          data
        );
        setState((prev) => ({
          ...prev,
          dashboards: [response, ...prev.dashboards],
          activeDashboard: response,
          isLoading: false,
        }));
        return response;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Error creating dashboard',
        }));
        return null;
      }
    },
    [projectId]
  );

  // --- Update dashboard ---
  const updateDashboard = useCallback(
    async (dashboardId: string, data: DashboardUpdateRequest) => {
      try {
        const response = await api.put<DashboardDetail>(
          `/projects/${projectId}/dashboards/${dashboardId}`,
          data
        );
        setState((prev) => ({
          ...prev,
          activeDashboard: response,
          dashboards: prev.dashboards.map((d) =>
            d.id === dashboardId ? { ...d, ...response } : d
          ),
        }));
        return response;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Error updating dashboard',
        }));
        return null;
      }
    },
    [projectId]
  );

  // --- Delete dashboard ---
  const deleteDashboard = useCallback(
    async (dashboardId: string) => {
      try {
        await api.delete(`/projects/${projectId}/dashboards/${dashboardId}`);
        setState((prev) => ({
          ...prev,
          dashboards: prev.dashboards.filter((d) => d.id !== dashboardId),
          activeDashboard:
            prev.activeDashboard?.id === dashboardId
              ? null
              : prev.activeDashboard,
        }));
        return true;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Error deleting dashboard',
        }));
        return false;
      }
    },
    [projectId]
  );

  // --- Add widget ---
  const addWidget = useCallback(
    async (dashboardId: string, data: WidgetCreateRequest) => {
      try {
        const response = await api.post<DashboardWidget>(
          `/projects/${projectId}/dashboards/${dashboardId}/widgets`,
          data
        );
        setState((prev) => {
          if (!prev.activeDashboard || prev.activeDashboard.id !== dashboardId)
            return prev;
          return {
            ...prev,
            activeDashboard: {
              ...prev.activeDashboard,
              widgets: [...prev.activeDashboard.widgets, response],
            },
          };
        });
        return response;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : 'Error adding widget',
        }));
        return null;
      }
    },
    [projectId]
  );

  // --- Update widget ---
  const updateWidget = useCallback(
    async (
      dashboardId: string,
      widgetId: string,
      data: WidgetUpdateRequest
    ) => {
      try {
        const response = await api.put<DashboardWidget>(
          `/projects/${projectId}/dashboards/${dashboardId}/widgets/${widgetId}`,
          data
        );
        setState((prev) => {
          if (!prev.activeDashboard || prev.activeDashboard.id !== dashboardId)
            return prev;
          return {
            ...prev,
            activeDashboard: {
              ...prev.activeDashboard,
              widgets: prev.activeDashboard.widgets.map((w) =>
                w.id === widgetId ? response : w
              ),
            },
          };
        });
        return response;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : 'Error updating widget',
        }));
        return null;
      }
    },
    [projectId]
  );

  // --- Delete widget ---
  const deleteWidget = useCallback(
    async (dashboardId: string, widgetId: string) => {
      try {
        await api.delete(
          `/projects/${projectId}/dashboards/${dashboardId}/widgets/${widgetId}`
        );
        setState((prev) => {
          if (!prev.activeDashboard || prev.activeDashboard.id !== dashboardId)
            return prev;
          return {
            ...prev,
            activeDashboard: {
              ...prev.activeDashboard,
              widgets: prev.activeDashboard.widgets.filter(
                (w) => w.id !== widgetId
              ),
            },
          };
        });
        return true;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : 'Error deleting widget',
        }));
        return false;
      }
    },
    [projectId]
  );

  // --- Refresh all widget caches ---
  const refreshDashboard = useCallback(
    async (dashboardId: string) => {
      setState((prev) => ({ ...prev, isRefreshing: true, error: null }));
      try {
        const response = await api.post<WidgetCacheRefreshResponse>(
          `/projects/${projectId}/dashboards/${dashboardId}/refresh`
        );
        // Re-fetch to get updated cached results
        await fetchDashboard(dashboardId);
        setState((prev) => ({ ...prev, isRefreshing: false }));
        return response;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isRefreshing: false,
          error:
            error instanceof Error
              ? error.message
              : 'Error refreshing dashboard',
        }));
        return null;
      }
    },
    [projectId, fetchDashboard]
  );

  // --- Publish dashboard ---
  const publishDashboard = useCallback(
    async (dashboardId: string, data: PublishRequest = {}) => {
      try {
        const response = await api.post<PublishResponse>(
          `/projects/${projectId}/dashboards/${dashboardId}/publish`,
          data
        );
        // Update local state
        setState((prev) => ({
          ...prev,
          dashboards: prev.dashboards.map((d) =>
            d.id === dashboardId
              ? { ...d, is_published: true, share_token: response.share_token }
              : d
          ),
          activeDashboard:
            prev.activeDashboard?.id === dashboardId
              ? {
                  ...prev.activeDashboard,
                  is_published: true,
                  share_token: response.share_token,
                }
              : prev.activeDashboard,
        }));
        return response;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Error publishing dashboard',
        }));
        return null;
      }
    },
    [projectId]
  );

  // --- Unpublish dashboard ---
  const unpublishDashboard = useCallback(
    async (dashboardId: string) => {
      try {
        await api.delete(
          `/projects/${projectId}/dashboards/${dashboardId}/publish`
        );
        setState((prev) => ({
          ...prev,
          dashboards: prev.dashboards.map((d) =>
            d.id === dashboardId
              ? { ...d, is_published: false, share_token: null }
              : d
          ),
          activeDashboard:
            prev.activeDashboard?.id === dashboardId
              ? {
                  ...prev.activeDashboard,
                  is_published: false,
                  share_token: null,
                }
              : prev.activeDashboard,
        }));
        return true;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Error unpublishing dashboard',
        }));
        return false;
      }
    },
    [projectId]
  );

  // --- Clear active dashboard ---
  const clearActive = useCallback(() => {
    setState((prev) => ({ ...prev, activeDashboard: null }));
  }, []);

  return {
    ...state,
    fetchDashboards,
    fetchDashboard,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    addWidget,
    updateWidget,
    deleteWidget,
    refreshDashboard,
    publishDashboard,
    unpublishDashboard,
    clearActive,
  };
}
