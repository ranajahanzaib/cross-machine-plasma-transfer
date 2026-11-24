"""Typed domain models for Cross-Machine Plasma Transfer."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import numpy as np


class MachineInfo(BaseModel):
    """Tokamak machine metadata."""
    id: str  # "diii_d" or "mast"
    name: str  # "DIII-D" or "MAST"
    type: str  # "Conventional Tokamak" or "Spherical Tokamak"
    location: str
    major_radius_m: float  # R0
    minor_radius_m: float  # a
    aspect_ratio: float  # R0 / a
    typical_ip_ka_range: List[float]
    typical_bt_t_range: List[float]
    grid_r_range: List[float]  # [R_min, R_max]
    grid_z_range: List[float]  # [Z_min, Z_max]
    flux_sign_convention: str  # "axis_minimum" (DIII-D) or "axis_maximum" (MAST)
    num_shaping_coils: int
    has_labels_in_challenge: bool


class ConductorGeometry(BaseModel):
    """Physical conductor element or coil geometry."""
    machine: str
    coil_name: str
    coil_input_column: str
    r_center: float
    z_center: float
    width: float
    height: float
    angle1_deg: float = 0.0  # EFIT shear angle 1 (0 means unskewed rectangle)
    angle2_deg: float = 0.0  # EFIT shear angle 2
    polygon_vertices: Optional[List[List[float]]] = None  # [[R1, Z1], ...] for skewed coils
    ampere_turns_multiplier: float = 1.0  # F-coils and P-coils already ampere-turns!


class DiagnosticChord(BaseModel):
    """Thomson scattering or magnetic diagnostic spatial coordinates."""
    machine: str
    subsystem: str  # "core", "edge", or "divertor"
    chord_name: str
    r_pos: float
    z_pos: float


class ShotMetadata(BaseModel):
    """Metadata summary for an individual experimental shot."""
    shot_id: str
    machine: str
    config_name: str  # "diii_d_train", "diii_d_public_test", "mast_public_test"
    split: str
    num_efit_times: int
    duration_ms: float
    t_min_ms: float
    t_max_ms: float
    ip_mean_ka: Optional[float] = None
    ip_max_ka: Optional[float] = None
    te_peak_ev: Optional[float] = None
    ne_peak_m3: Optional[float] = None
    has_labels: bool = False
    source_file: str = ""


class EquilibriumGrid(BaseModel):
    """Standardized 65x65 R-Z spatial grid specification."""
    machine: str
    r_grid: List[float]  # length 65
    z_grid: List[float]  # length 65
    n_r: int = 65
    n_z: int = 65


class FeatureVectorSummary(BaseModel):
    """Summary of extracted feature vector."""
    feature_names: List[str]
    feature_families: Dict[str, List[str]]
    num_samples: int
    num_features: int
    d3d_samples: int
    mast_samples: int
