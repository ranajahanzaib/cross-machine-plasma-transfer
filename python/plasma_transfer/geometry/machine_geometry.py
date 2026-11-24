"""Machine geometry engine for DIII-D and MAST."""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from plasma_transfer.schemas.domain_models import ConductorGeometry, DiagnosticChord, MachineInfo


# Verified machine specifications
DIII_D_INFO = MachineInfo(
    id="diii_d",
    name="DIII-D",
    type="Conventional Tokamak",
    location="San Diego, USA (General Atomics)",
    major_radius_m=1.67,
    minor_radius_m=0.67,
    aspect_ratio=2.5,
    typical_ip_ka_range=[500.0, 2200.0],
    typical_bt_t_range=[1.0, 2.2],
    grid_r_range=[1.0, 2.5],  # Standard 65-point grid
    grid_z_range=[-1.4, 1.4],
    flux_sign_convention="axis_minimum",
    num_shaping_coils=18,
    has_labels_in_challenge=True,
)

MAST_INFO = MachineInfo(
    id="mast",
    name="MAST",
    type="Spherical Tokamak",
    location="Culham, UK (Culham Centre for Fusion Energy / UKAEA)",
    major_radius_m=0.85,
    minor_radius_m=0.65,
    aspect_ratio=1.3,
    typical_ip_ka_range=[400.0, 1000.0],
    typical_bt_t_range=[0.4, 0.6],
    grid_r_range=[0.06, 2.0],  # 65 real columns
    grid_z_range=[-2.0, 2.0],
    flux_sign_convention="axis_maximum",
    num_shaping_coils=10,
    has_labels_in_challenge=False,
)


def compute_conductor_polygon(
    r_center: float,
    z_center: float,
    width: float,
    height: float,
    angle1_deg: float = 0.0,
    angle2_deg: float = 0.0,
) -> List[List[float]]:
    """Compute physical R-Z vertices for a conductor element.
    
    Rules from challenge README:
    - 0.0 means 'no skew - a plain axis-aligned rectangle' (same as 90 deg in EFIT).
    - If angle1 == 0 and angle2 == 0, it's a rectangle: [R +/- width/2, Z +/- height/2].
    - Otherwise, shear that rectangle using angle1 and angle2 (used for 6 DIII-D coils: F5A/B, F6A/B, F7A/B).
    """
    hw = width / 2.0
    hh = height / 2.0

    if (abs(angle1_deg) < 1e-4 and abs(angle2_deg) < 1e-4) or (abs(angle1_deg - 90.0) < 1e-4 and abs(angle2_deg) < 1e-4):
        # Plain rectangle
        return [
            [r_center - hw, z_center - hh],
            [r_center + hw, z_center - hh],
            [r_center + hw, z_center + hh],
            [r_center - hw, z_center + hh],
        ]

    # Skewed parallelogram using EFIT shear angles
    a1_rad = np.radians(angle1_deg)
    a2_rad = np.radians(angle2_deg)

    # Unit vectors for skewed edges
    v1 = np.array([np.cos(a1_rad), np.sin(a1_rad)]) * hw
    v2 = np.array([-np.sin(a2_rad), np.cos(a2_rad)]) * hh
    c = np.array([r_center, z_center])

    p1 = c - v1 - v2
    p2 = c + v1 - v2
    p3 = c + v1 + v2
    p4 = c - v1 + v2

    return [p1.tolist(), p2.tolist(), p3.tolist(), p4.tolist()]


def extract_geometry_from_record(shot_record: Dict[str, Any], machine: str) -> Tuple[List[ConductorGeometry], List[DiagnosticChord]]:
    """Extract conductor elements and diagnostic chords from a shot record."""
    conductors: List[ConductorGeometry] = []
    chords: List[DiagnosticChord] = []

    coil_names = shot_record.get("coil_name", [])
    coil_cols = shot_record.get("coil_input_column", [])
    coil_r = shot_record.get("coil_R", [])
    coil_z = shot_record.get("coil_Z", [])
    coil_w = shot_record.get("coil_width", [])
    coil_h = shot_record.get("coil_height", [])
    coil_a1 = shot_record.get("coil_angle1", [0.0] * len(coil_names))
    coil_a2 = shot_record.get("coil_angle2", [0.0] * len(coil_names))

    for i in range(len(coil_names)):
        r = float(coil_r[i])
        z = float(coil_z[i])
        w = float(coil_w[i])
        h = float(coil_h[i])
        a1 = float(coil_a1[i]) if i < len(coil_a1) else 0.0
        a2 = float(coil_a2[i]) if i < len(coil_a2) else 0.0
        poly = compute_conductor_polygon(r, z, w, h, a1, a2)

        conductors.append(
            ConductorGeometry(
                machine=machine,
                coil_name=str(coil_names[i]),
                coil_input_column=str(coil_cols[i]),
                r_center=r,
                z_center=z,
                width=w,
                height=h,
                angle1_deg=a1,
                angle2_deg=a2,
                polygon_vertices=poly,
                ampere_turns_multiplier=1.0,  # Never double multiply!
            )
        )

    # Diagnostic chords
    chord_names = shot_record.get("thomson_chord_name", [])
    chord_r = shot_record.get("thomson_chord_R", [])
    chord_z = shot_record.get("thomson_chord_Z", [])

    for i in range(len(chord_names)):
        name = str(chord_names[i])
        subsys = "divertor" if "div" in name.lower() else ("edge" if "edge" in name.lower() else "core")
        chords.append(
            DiagnosticChord(
                machine=machine,
                subsystem=subsys,
                chord_name=name,
                r_pos=float(chord_r[i]),
                z_pos=float(chord_z[i]),
            )
        )

    return conductors, chords
