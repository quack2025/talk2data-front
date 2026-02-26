/** Types for Segmentation / Clustering feature (Sprint 14 — Gap G2). */

export type ClusterMethod = 'kmeans' | 'hierarchical';
export type LinkageMethod = 'ward' | 'complete' | 'average';

export interface ClusterRequest {
  variables: string[];
  method: ClusterMethod;
  n_clusters: number | null;
  standardize: boolean;
  linkage: LinkageMethod;
  save_as_segment: boolean;
  cluster_name_prefix: string;
}

export interface AutoDetectKRequest {
  variables: string[];
  standardize: boolean;
  k_range: [number, number];
}

export interface ClusterProfile {
  cluster_id: number;
  label: string;
  size: number;
  pct: number;
  variable_means: Record<string, number>;
  differentiators: Array<{
    variable: string;
    cluster_mean: number;
    overall_mean: number;
    delta: number;
    pct_delta: number;
  }>;
  demographics: Record<string, Record<string, { count: number; pct_in_cluster: number; pct_in_total: number }>>;
}

export interface AutoDetectKResult {
  k_values: number[];
  inertias: number[];
  silhouette_scores: number[];
  recommended_k: number;
  recommendation_reason: string;
}

export interface DendrogramData {
  icoord: number[][];
  dcoord: number[][];
  ivl: string[];
  color_list: string[];
  n_leaves: number;
  n_samples: number;
}

export interface ClusterResult {
  method: string;
  n_clusters: number;
  total_cases: number;
  variables_used: string[];
  silhouette_score: number;
  inertia: number | null;
  profiles: ClusterProfile[];
  auto_detect: AutoDetectKResult | null;
  segment_ids: string[];
  data_prep_rule_id: string | null;
  dendrogram_data: DendrogramData | null;
}

export const METHOD_LABELS: Record<ClusterMethod, { es: string; en: string; desc_es: string; desc_en: string }> = {
  kmeans: {
    es: 'K-Means',
    en: 'K-Means',
    desc_es: 'Agrupación por centroides. El más utilizado en investigación de mercados.',
    desc_en: 'Centroid-based clustering. Most widely used in market research.',
  },
  hierarchical: {
    es: 'Jerárquico',
    en: 'Hierarchical',
    desc_es: 'Agrupación por aglomeración. Útil para inspeccionar dendrogramas.',
    desc_en: 'Agglomerative clustering. Useful for dendrogram inspection.',
  },
};
