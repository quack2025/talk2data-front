import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { downloadFile } from '@/lib/downloadFile';
import type {
  BannerVariable,
  AnalysisVariable,
  AggfileResponse,
  AggfileStep,
  AggfileState,
  ValueFormat,
  AnalysisTypeOption,
  FilterConfig,
  NetDefinition,
  NestedBannerConfig,
  GenerateTablesConfig,
  GenerateTablesPreviewResponse,
  GenerateTablesResponse,
  GenerateTablesExportResponse,
  ExportTaskCreatedResponse,
  ExportTaskStatusResponse,
} from '@/types/aggfile';
import { MAX_BANNER_VARIABLES, DEFAULT_DECIMAL_PLACES } from '@/types/aggfile';

const initialState: AggfileState = {
  step: 'banners',
  bannerVariables: [],
  analysisVariables: [],
  selectedBanners: [],
  selectedAnalysis: 'all',
  selectedGroups: [],
  analysisTypes: ['crosstab'],
  nestedBanners: [],
  format: {
    valueType: 'percentage',
    decimalPlaces: DEFAULT_DECIMAL_PLACES,
    includeBases: true,
    includeSignificance: false,
    significanceLevel: 0.95,
    minBaseSize: null,
  },
  filters: [],
  netDefinitions: [],
  title: '',
  preview: null,
  result: null,
  generateTablesResult: null,
  error: null,
  isLoadingBanners: false,
  isLoadingAnalysis: false,
  isLoadingPreview: false,
  isGenerating: false,
  progress: 0,
};

interface BannerVariablesResponse {
  variables: BannerVariable[];
}

interface AnalysisVariablesResponse {
  variables: AnalysisVariable[];
}

export function useAggfileGenerator(projectId: string) {
  const [state, setState] = useState<AggfileState>(initialState);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep a ref to latest state so buildConfig stays identity-stable.
  // Without this, buildConfig depends on [state] → fetchPreview depends on
  // [buildConfig] → PreviewStep's useEffect fires on every state change →
  // infinite API call loop that exhausts the DB connection pool.
  const stateRef = useRef(state);
  stateRef.current = state;

  // --- Build GenerateTablesConfig from wizard state ---
  const buildConfig = useCallback((): GenerateTablesConfig => {
    const s = stateRef.current;
    const analysisVars =
      s.selectedAnalysis === 'all'
        ? s.analysisVariables.map((v) => v.name)
        : s.selectedAnalysis;

    // Determine analysis types based on configuration
    let analysisTypes = [...s.analysisTypes];
    if (s.format.includeSignificance && analysisTypes.includes('crosstab')) {
      analysisTypes = analysisTypes.filter((t) => t !== 'crosstab');
      if (!analysisTypes.includes('crosstab_with_significance')) {
        analysisTypes.push('crosstab_with_significance');
      }
    }

    const hasCrosstab = analysisTypes.some(
      (t) => t === 'crosstab' || t === 'crosstab_with_significance'
    );

    return {
      selected_variables: analysisVars,
      analysis_types: analysisTypes,
      crosstab_config: hasCrosstab
        ? {
            row_variables: analysisVars,
            column_variables: s.selectedBanners,
            include_percentages: s.format.valueType === 'percentage',
            chi_square_test: s.format.includeSignificance,
            nested_banners: s.nestedBanners.length > 0 ? s.nestedBanners : undefined,
          }
        : null,
      filters: s.filters.length > 0 ? s.filters : null,
      output_format: 'json',
      confidence_level: s.format.includeSignificance
        ? s.format.significanceLevel
        : 0.95,
      net_definitions:
        s.netDefinitions.length > 0 ? s.netDefinitions : null,
      title: s.title || null,
      variable_group_ids:
        s.selectedGroups.length > 0 ? s.selectedGroups : undefined,
      min_base_size: s.format.minBaseSize ?? undefined,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Fetch variables ---
  const fetchBannerVariables = useCallback(async () => {
    if (state.bannerVariables.length > 0) return;
    setState((prev) => ({ ...prev, isLoadingBanners: true }));
    try {
      const response = await api.get<BannerVariablesResponse>(
        `/projects/${projectId}/exports/banner-variables`
      );
      setState((prev) => ({
        ...prev,
        bannerVariables: response.variables,
        isLoadingBanners: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoadingBanners: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error loading banner variables',
      }));
    }
  }, [projectId, state.bannerVariables.length]);

  const fetchAnalysisVariables = useCallback(async () => {
    if (state.analysisVariables.length > 0) return;
    setState((prev) => ({ ...prev, isLoadingAnalysis: true }));
    try {
      const response = await api.get<AnalysisVariablesResponse>(
        `/projects/${projectId}/exports/analysis-variables`
      );
      setState((prev) => ({
        ...prev,
        analysisVariables: response.variables,
        isLoadingAnalysis: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoadingAnalysis: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error loading analysis variables',
      }));
    }
  }, [projectId, state.analysisVariables.length]);

  // --- Toggle selections ---
  const toggleBanner = useCallback((name: string) => {
    setState((prev) => {
      const isSelected = prev.selectedBanners.includes(name);
      if (isSelected) {
        // Also remove any nested banners that reference this variable
        const cleanedNested = prev.nestedBanners.filter(
          (nb) => !nb.variables.includes(name)
        );
        return {
          ...prev,
          selectedBanners: prev.selectedBanners.filter((b) => b !== name),
          nestedBanners: cleanedNested,
        };
      }
      if (prev.selectedBanners.length >= MAX_BANNER_VARIABLES) {
        return prev;
      }
      return {
        ...prev,
        selectedBanners: [...prev.selectedBanners, name],
      };
    });
  }, []);

  const toggleAnalysis = useCallback((name: string) => {
    setState((prev) => {
      if (prev.selectedAnalysis === 'all') {
        return { ...prev, selectedAnalysis: [name] };
      }
      const isSelected = prev.selectedAnalysis.includes(name);
      if (isSelected) {
        const newSelection = prev.selectedAnalysis.filter((a) => a !== name);
        return {
          ...prev,
          selectedAnalysis: newSelection.length === 0 ? 'all' : newSelection,
        };
      }
      return {
        ...prev,
        selectedAnalysis: [...prev.selectedAnalysis, name],
      };
    });
  }, []);

  const toggleGroup = useCallback((groupId: string, groupVars: string[]) => {
    setState((prev) => {
      const isSelected = prev.selectedGroups.includes(groupId);
      if (isSelected) {
        return {
          ...prev,
          selectedGroups: prev.selectedGroups.filter((id) => id !== groupId),
          selectedAnalysis:
            prev.selectedAnalysis === 'all'
              ? 'all'
              : prev.selectedAnalysis.filter((v) => !groupVars.includes(v)),
        };
      }
      return {
        ...prev,
        selectedGroups: [...prev.selectedGroups, groupId],
        selectedAnalysis:
          prev.selectedAnalysis === 'all'
            ? 'all'
            : [...prev.selectedAnalysis, ...groupVars],
      };
    });
  }, []);

  // --- Nested banners ---
  const addNestedBanner = useCallback((variables: string[]) => {
    setState((prev) => ({
      ...prev,
      nestedBanners: [...prev.nestedBanners, { variables }],
    }));
  }, []);

  const removeNestedBanner = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      nestedBanners: prev.nestedBanners.filter((_, i) => i !== index),
    }));
  }, []);

  const setAnalysisMode = useCallback((mode: 'all' | 'selected') => {
    setState((prev) => ({
      ...prev,
      selectedAnalysis: mode === 'all' ? 'all' : [],
    }));
  }, []);

  // --- Analysis types ---
  const toggleAnalysisType = useCallback((type: AnalysisTypeOption) => {
    setState((prev) => {
      const has = prev.analysisTypes.includes(type);
      if (has) {
        const next = prev.analysisTypes.filter((t) => t !== type);
        return { ...prev, analysisTypes: next.length > 0 ? next : prev.analysisTypes };
      }
      return { ...prev, analysisTypes: [...prev.analysisTypes, type] };
    });
  }, []);

  // --- Format setters ---
  const setValueType = useCallback((valueType: ValueFormat) => {
    setState((prev) => ({
      ...prev,
      format: { ...prev.format, valueType },
    }));
  }, []);

  const setDecimalPlaces = useCallback((decimalPlaces: number) => {
    setState((prev) => ({
      ...prev,
      format: { ...prev.format, decimalPlaces },
    }));
  }, []);

  const setIncludeBases = useCallback((includeBases: boolean) => {
    setState((prev) => ({
      ...prev,
      format: { ...prev.format, includeBases },
    }));
  }, []);

  const setIncludeSignificance = useCallback((includeSignificance: boolean) => {
    setState((prev) => ({
      ...prev,
      format: { ...prev.format, includeSignificance },
    }));
  }, []);

  const setSignificanceLevel = useCallback((significanceLevel: number) => {
    setState((prev) => ({
      ...prev,
      format: { ...prev.format, significanceLevel },
    }));
  }, []);

  const setMinBaseSize = useCallback((minBaseSize: number | null) => {
    setState((prev) => ({
      ...prev,
      format: { ...prev.format, minBaseSize },
    }));
  }, []);

  const setTitle = useCallback((title: string) => {
    setState((prev) => ({ ...prev, title }));
  }, []);

  // --- Filters ---
  const addFilter = useCallback((filter: FilterConfig) => {
    setState((prev) => ({
      ...prev,
      filters: [...prev.filters, filter],
    }));
  }, []);

  const removeFilter = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index),
    }));
  }, []);

  // --- Navigation ---
  const goToNextStep = useCallback(() => {
    setState((prev) => {
      const steps: AggfileStep[] = ['banners', 'stubs', 'configure', 'preview'];
      const idx = steps.indexOf(prev.step);
      if (idx >= 0 && idx < steps.length - 1) {
        return { ...prev, step: steps[idx + 1] };
      }
      return prev;
    });
  }, []);

  const goToPrevStep = useCallback(() => {
    setState((prev) => {
      const steps: AggfileStep[] = ['banners', 'stubs', 'configure', 'preview'];
      const idx = steps.indexOf(prev.step);
      if (idx > 0) {
        return { ...prev, step: steps[idx - 1] };
      }
      return prev;
    });
  }, []);

  const goToStep = useCallback((step: AggfileStep) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  // --- Progress simulation ---
  const startProgress = useCallback(() => {
    setState((prev) => ({ ...prev, progress: 0 }));
    progressIntervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.progress >= 90) return prev;
        return { ...prev, progress: prev.progress + Math.random() * 10 };
      });
    }, 500);
  }, []);

  const stopProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // --- Preview ---
  const isPreviewFetchingRef = useRef(false);

  const fetchPreview = useCallback(async () => {
    // Guard against concurrent/duplicate calls
    if (isPreviewFetchingRef.current) return;
    isPreviewFetchingRef.current = true;

    setState((prev) => ({ ...prev, isLoadingPreview: true, error: null }));
    try {
      const config = buildConfig();
      const response = await api.post<GenerateTablesPreviewResponse>(
        `/projects/${projectId}/generate-tables/preview`,
        config
      );
      setState((prev) => ({
        ...prev,
        preview: response,
        isLoadingPreview: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoadingPreview: false,
        error:
          error instanceof Error ? error.message : 'Error loading preview',
      }));
    } finally {
      isPreviewFetchingRef.current = false;
    }
  }, [projectId, buildConfig]);

  // --- Generate ---
  const generateTables = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      step: 'generating',
      isGenerating: true,
      error: null,
    }));
    startProgress();

    try {
      const config = buildConfig();
      const response = await api.post<GenerateTablesResponse>(
        `/projects/${projectId}/generate-tables`,
        config
      );

      stopProgress();
      setState((prev) => ({
        ...prev,
        step: 'success',
        generateTablesResult: response,
        isGenerating: false,
        progress: 100,
      }));
    } catch (error) {
      stopProgress();
      setState((prev) => ({
        ...prev,
        step: 'error',
        error:
          error instanceof Error ? error.message : 'Error generating tables',
        isGenerating: false,
      }));
    }
  }, [projectId, buildConfig, startProgress, stopProgress]);

  // --- Export to Excel (async with real progress polling) ---
  const exportToExcel = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      step: 'generating',
      isGenerating: true,
      error: null,
      progress: 0,
    }));

    try {
      const config = buildConfig();
      config.output_format = 'excel';

      // Start async export — returns immediately with task_id
      const { task_id } = await api.post<ExportTaskCreatedResponse>(
        `/projects/${projectId}/generate-tables/export-async`,
        config
      );

      // Poll for progress every 2 seconds
      const poll = async (): Promise<ExportTaskStatusResponse> => {
        const status = await api.get<ExportTaskStatusResponse>(
          `/generate-tables/export-status/${task_id}`
        );

        if (status.status === 'completed') return status;
        if (status.status === 'failed') {
          throw new Error(status.error || 'Export failed');
        }

        // Update real progress
        setState((prev) => ({
          ...prev,
          progress: Math.round(status.progress * 100),
        }));

        // Wait 2s then poll again
        await new Promise((r) => setTimeout(r, 2000));
        return poll();
      };

      const result = await poll();

      // Download from the signed URL
      if (result.download_url) {
        const filename = `tables_${projectId}_${new Date().toISOString().split('T')[0]}.xlsx`;
        downloadFile(result.download_url, filename);
      }

      setState((prev) => ({
        ...prev,
        step: 'success',
        generateTablesResult: {
          title: result.title,
          total_analyses: result.total_analyses,
          results: [],
          python_code: null,
          execution_time_ms: result.execution_time_ms,
          warnings: result.warnings,
        },
        isGenerating: false,
        progress: 100,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: 'error',
        error:
          error instanceof Error ? error.message : 'Error exporting to Excel',
        isGenerating: false,
      }));
    }
  }, [projectId, buildConfig]);

  // Legacy generate (keeping for backward compat)
  const generateAggfile = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      step: 'generating',
      isGenerating: true,
      error: null,
    }));
    startProgress();

    try {
      const analysisVars =
        state.selectedAnalysis === 'all'
          ? state.analysisVariables.map((v) => v.name)
          : state.selectedAnalysis;

      const config = {
        banner_variables: state.selectedBanners,
        analysis_variables: analysisVars,
        format: {
          value_type: state.format.valueType,
          decimal_places: state.format.decimalPlaces,
          include_bases: state.format.includeBases,
          include_significance: state.format.includeSignificance,
          significance_level: state.format.significanceLevel,
        },
      };

      const response = await api.post<AggfileResponse>(
        `/projects/${projectId}/exports/aggfile`,
        config
      );

      stopProgress();
      setState((prev) => ({
        ...prev,
        step: 'success',
        result: response,
        isGenerating: false,
        progress: 100,
      }));
    } catch (error) {
      stopProgress();
      setState((prev) => ({
        ...prev,
        step: 'error',
        error:
          error instanceof Error ? error.message : 'Error generating aggfile',
        isGenerating: false,
      }));
    }
  }, [
    projectId,
    state.selectedBanners,
    state.selectedAnalysis,
    state.analysisVariables,
    state.format,
    startProgress,
    stopProgress,
  ]);

  // --- Download result ---
  const downloadResult = useCallback(() => {
    if (state.result?.file_url) {
      const filename = `aggfile_${projectId}_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadFile(state.result.file_url, filename);
    }
  }, [state.result, projectId]);

  // --- Reset ---
  const reset = useCallback(() => {
    stopProgress();
    setState({
      ...initialState,
      bannerVariables: state.bannerVariables,
      analysisVariables: state.analysisVariables,
      selectedGroups: [],
    });
  }, [state.bannerVariables, state.analysisVariables, stopProgress]);

  // --- Retry ---
  const retry = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: 'configure',
      error: null,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgress();
    };
  }, [stopProgress]);

  // --- Computed values ---
  const canProceedToStubs = state.selectedBanners.length >= 1;
  const canProceedToConfigure =
    state.selectedAnalysis === 'all' ||
    (Array.isArray(state.selectedAnalysis) && state.selectedAnalysis.length >= 1);
  const canProceedToPreview =
    canProceedToStubs && canProceedToConfigure && state.analysisTypes.length >= 1;
  const canGenerate = canProceedToPreview;

  return {
    // State
    ...state,
    canProceedToStubs,
    canProceedToConfigure,
    canProceedToPreview,
    canGenerate,
    // Keep old name for backward compat
    canProceedToAnalysis: canProceedToStubs,
    maxBanners: MAX_BANNER_VARIABLES,

    // Actions
    fetchBannerVariables,
    fetchAnalysisVariables,
    toggleBanner,
    toggleAnalysis,
    toggleGroup,
    addNestedBanner,
    removeNestedBanner,
    setAnalysisMode,
    toggleAnalysisType,
    setValueType,
    setDecimalPlaces,
    setIncludeBases,
    setIncludeSignificance,
    setSignificanceLevel,
    setMinBaseSize,
    setTitle,
    addFilter,
    removeFilter,
    goToNextStep,
    goToPrevStep,
    goToStep,
    fetchPreview,
    generateTables,
    generateAggfile,
    exportToExcel,
    downloadResult,
    buildConfig,
    reset,
    retry,
  };
}
