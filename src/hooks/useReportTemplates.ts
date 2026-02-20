import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ReportTemplate } from '@/types/reports';

interface ReportTemplateCreate {
  name: string;
  description?: string | null;
  config: ReportTemplate['config'];
}

interface ReportTemplateUpdate {
  name?: string;
  description?: string | null;
  config?: ReportTemplate['config'];
}

export function useReportTemplates(projectId: string) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ReportTemplate[]>(
        `/projects/${projectId}/report-templates`
      );
      setTemplates(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading templates');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const createTemplate = useCallback(
    async (data: ReportTemplateCreate) => {
      try {
        const response = await api.post<ReportTemplate>(
          `/projects/${projectId}/report-templates`,
          data
        );
        setTemplates((prev) => [response, ...prev]);
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error creating template');
        throw e;
      }
    },
    [projectId]
  );

  const updateTemplate = useCallback(
    async (templateId: string, data: ReportTemplateUpdate) => {
      try {
        const response = await api.put<ReportTemplate>(
          `/projects/${projectId}/report-templates/${templateId}`,
          data
        );
        setTemplates((prev) =>
          prev.map((t) => (t.id === templateId ? response : t))
        );
        return response;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error updating template');
        throw e;
      }
    },
    [projectId]
  );

  const deleteTemplate = useCallback(
    async (templateId: string) => {
      try {
        await api.delete(
          `/projects/${projectId}/report-templates/${templateId}`
        );
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error deleting template');
        throw e;
      }
    },
    [projectId]
  );

  return {
    templates,
    isLoading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
