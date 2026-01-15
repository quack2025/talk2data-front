import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { downloadFile } from '@/lib/downloadFile';
import type {
  BannerVariable,
  AnalysisVariable,
  AggfileConfig,
  AggfileResponse,
  AggfileStep,
  AggfileState,
  ValueFormat,
} from '@/types/aggfile';
import { MAX_BANNER_VARIABLES, DEFAULT_DECIMAL_PLACES } from '@/types/aggfile';

const initialState: AggfileState = {
  step: 'banners',
  bannerVariables: [],
  analysisVariables: [],
  selectedBanners: [],
  selectedAnalysis: 'all',
  format: {
    valueType: 'percentage',
    decimalPlaces: DEFAULT_DECIMAL_PLACES,
    includeBases: true,
  },
  result: null,
  error: null,
  isLoadingBanners: false,
  isLoadingAnalysis: false,
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

  // Fetch banner variables
  const fetchBannerVariables = useCallback(async () => {
    if (state.bannerVariables.length > 0) return; // Already cached

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
        error: error instanceof Error ? error.message : 'Error loading banner variables',
      }));
    }
  }, [projectId, state.bannerVariables.length]);

  // Fetch analysis variables
  const fetchAnalysisVariables = useCallback(async () => {
    if (state.analysisVariables.length > 0) return; // Already cached

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
        error: error instanceof Error ? error.message : 'Error loading analysis variables',
      }));
    }
  }, [projectId, state.analysisVariables.length]);

  // Toggle banner selection
  const toggleBanner = useCallback((name: string) => {
    setState((prev) => {
      const isSelected = prev.selectedBanners.includes(name);
      if (isSelected) {
        return {
          ...prev,
          selectedBanners: prev.selectedBanners.filter((b) => b !== name),
        };
      }
      if (prev.selectedBanners.length >= MAX_BANNER_VARIABLES) {
        return prev; // Max reached
      }
      return {
        ...prev,
        selectedBanners: [...prev.selectedBanners, name],
      };
    });
  }, []);

  // Toggle analysis selection
  const toggleAnalysis = useCallback((name: string) => {
    setState((prev) => {
      if (prev.selectedAnalysis === 'all') {
        // Switch to specific selection
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

  // Set analysis mode
  const setAnalysisMode = useCallback((mode: 'all' | 'selected') => {
    setState((prev) => ({
      ...prev,
      selectedAnalysis: mode === 'all' ? 'all' : [],
    }));
  }, []);

  // Set format options
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

  // Go to next step
  const goToNextStep = useCallback(() => {
    setState((prev) => {
      if (prev.step === 'banners') return { ...prev, step: 'analysis' };
      return prev;
    });
  }, []);

  // Go to previous step
  const goToPrevStep = useCallback(() => {
    setState((prev) => {
      if (prev.step === 'analysis') return { ...prev, step: 'banners' };
      return prev;
    });
  }, []);

  // Start simulated progress
  const startProgress = useCallback(() => {
    setState((prev) => ({ ...prev, progress: 0 }));
    progressIntervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.progress >= 90) {
          return prev;
        }
        return { ...prev, progress: prev.progress + Math.random() * 10 };
      });
    }, 500);
  }, []);

  // Stop progress
  const stopProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Generate aggfile
  const generateAggfile = useCallback(async () => {
    setState((prev) => ({ ...prev, step: 'generating', isGenerating: true, error: null }));
    startProgress();

    try {
      // When "all" is selected, send all variable names as an array
      const analysisVars = state.selectedAnalysis === 'all'
        ? state.analysisVariables.map(v => v.name)
        : state.selectedAnalysis;

      const config: AggfileConfig = {
        banner_variables: state.selectedBanners,
        analysis_variables: analysisVars,
        format: {
          value_type: state.format.valueType,
          decimal_places: state.format.decimalPlaces,
          include_bases: state.format.includeBases,
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
        error: error instanceof Error ? error.message : 'Error generating aggfile',
        isGenerating: false,
      }));
    }
  }, [projectId, state.selectedBanners, state.selectedAnalysis, state.format, startProgress, stopProgress]);

  // Download the generated file
  const downloadResult = useCallback(() => {
    if (state.result?.file_url) {
      const filename = `aggfile_${projectId}_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadFile(state.result.file_url, filename);
    }
  }, [state.result, projectId]);

  // Reset state
  const reset = useCallback(() => {
    stopProgress();
    setState({
      ...initialState,
      bannerVariables: state.bannerVariables, // Keep cached
      analysisVariables: state.analysisVariables, // Keep cached
    });
  }, [state.bannerVariables, state.analysisVariables, stopProgress]);

  // Retry after error
  const retry = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: 'analysis',
      error: null,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgress();
    };
  }, [stopProgress]);

  // Computed values
  const canProceedToAnalysis = state.selectedBanners.length >= 1;
  const canGenerate =
    state.selectedBanners.length >= 1 &&
    (state.selectedAnalysis === 'all' ||
      (Array.isArray(state.selectedAnalysis) && state.selectedAnalysis.length >= 1));

  return {
    // State
    ...state,
    canProceedToAnalysis,
    canGenerate,
    maxBanners: MAX_BANNER_VARIABLES,

    // Actions
    fetchBannerVariables,
    fetchAnalysisVariables,
    toggleBanner,
    toggleAnalysis,
    setAnalysisMode,
    setValueType,
    setDecimalPlaces,
    setIncludeBases,
    goToNextStep,
    goToPrevStep,
    generateAggfile,
    downloadResult,
    reset,
    retry,
  };
}
