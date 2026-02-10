import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

export interface ColumnMeta {
  name: string;
  label: string;
  type: string;
  value_labels: Record<string, string> | null;
}

export interface DataTableResponse {
  columns: ColumnMeta[];
  rows: Record<string, unknown>[];
  total_rows: number;
  offset: number;
  limit: number;
  is_prepared: boolean;
}

export interface ColumnDistributionEntry {
  value: string | number;
  label: string;
  count: number;
  percentage: number;
}

export interface ColumnDistributionResponse {
  column: string;
  label: string;
  distribution: ColumnDistributionEntry[];
  total: number;
}

export function useDataTable(projectId: string) {
  const [tableData, setTableData] = useState<DataTableResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distributionData, setDistributionData] = useState<ColumnDistributionResponse | null>(null);
  const [isDistLoading, setIsDistLoading] = useState(false);

  const fetchData = useCallback(
    async (offset = 0, limit = 50, prepared = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.get<DataTableResponse>(
          `/projects/${projectId}/data-prep/data-rows?offset=${offset}&limit=${limit}&prepared=${prepared}`
        );
        setTableData(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error loading data');
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  const fetchDistribution = useCallback(
    async (columnName: string) => {
      setIsDistLoading(true);
      try {
        const data = await api.get<ColumnDistributionResponse>(
          `/projects/${projectId}/data-prep/column-distribution/${columnName}`
        );
        setDistributionData(data);
        return data;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error loading distribution');
        return null;
      } finally {
        setIsDistLoading(false);
      }
    },
    [projectId]
  );

  const clearDistribution = useCallback(() => setDistributionData(null), []);

  return {
    tableData,
    isLoading,
    error,
    distributionData,
    isDistLoading,
    fetchData,
    fetchDistribution,
    clearDistribution,
  };
}
