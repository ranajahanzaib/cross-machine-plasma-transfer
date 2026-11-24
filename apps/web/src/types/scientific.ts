export interface MachineInfo {
  id: string;
  name: string;
  type: string;
  location: string;
  major_radius_m: number;
  minor_radius_m: number;
  aspect_ratio: number;
  typical_ip_ka_range: number[];
  typical_bt_t_range: number[];
  grid_r_range: number[];
  grid_z_range: number[];
  flux_sign_convention: string;
  num_shaping_coils: number;
  has_labels_in_challenge: boolean;
}

export interface ConductorGeometry {
  machine: string;
  coil_name: string;
  coil_input_column: string;
  r_center: number;
  z_center: number;
  width: number;
  height: number;
  angle1_deg: number;
  angle2_deg: number;
  polygon_vertices?: number[][];
  ampere_turns_multiplier: number;
}

export interface DiagnosticChord {
  machine: string;
  subsystem: string;
  chord_name: string;
  r_pos: number;
  z_pos: number;
}

export interface EmbeddingPoint {
  id: string;
  shot_id: string;
  machine: "diii_d" | "mast";
  config_name: string;
  timestamp_ms: number;
  pca_x: number;
  pca_y: number;
  umap_x: number;
  umap_y: number;
  umap_adapted_x: number;
  umap_adapted_y: number;
  ood_score: number;
  ood_category: string;
  plasma_current_ka: number;
  has_label: boolean;
}

export interface DomainShiftMetrics {
  mmd: number;
  domain_classifier: {
    mean_roc_auc: number;
    roc_auc_std: number;
    feature_importance_ranking: { feature: string; importance: number }[];
    sample_counts: { source: number; target: number };
  };
  univariate: Record<
    string,
    {
      wasserstein_distance: number;
      ks_statistic: number;
      ks_pvalue: number;
      std_mean_difference: number;
      variance_ratio: number;
      distribution_overlap: number;
    }
  >;
}
