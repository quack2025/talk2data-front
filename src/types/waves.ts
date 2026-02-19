// Types for Wave Comparison feature

export interface ProjectWave {
  id: string;
  project_id: string;
  wave_name: string;
  wave_order: number;
  file_id: string | null;
  description: string | null;
  field_dates: { start?: string; end?: string } | null;
  created_at: string;
  updated_at: string | null;
}

export interface WaveCreate {
  wave_name: string;
  wave_order: number;
  file_id?: string | null;
  description?: string | null;
  field_dates?: { start?: string; end?: string } | null;
}

export interface WaveUpdate {
  wave_name?: string;
  wave_order?: number;
  file_id?: string | null;
  description?: string | null;
  field_dates?: { start?: string; end?: string } | null;
}

export interface WaveComparisonRequest {
  variable: string;
  wave_ids: string[];
  analysis_type: string;
  cross_variable?: string | null;
  confidence_level?: number;
}

export interface WaveComparisonResult {
  variable: string;
  variable_label: string | null;
  analysis_type: string;
  categories: string[];
  waves: {
    wave_id: string;
    wave_name: string;
    wave_order: number;
    values: Record<string, number>;
    sample_size: number;
  }[];
  trend_data: Record<string, string | number>[];
  deltas: {
    from_wave: string;
    to_wave: string;
    changes: Record<string, {
      value: number;
      direction: 'up' | 'down' | 'flat';
      p_value?: number | null;
      is_significant?: boolean;
      test_type?: string | null;
    }>;
  }[] | null;
  warnings: string[];
}
