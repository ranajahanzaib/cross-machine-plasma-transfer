"""Machine-invariant shared feature engineering across DIII-D and MAST."""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from plasma_transfer.protocols.protocol_guard import ProtocolGuard, ResearchProtocol
from plasma_transfer.preprocessing.harmonizer import SignalHarmonizer


class FeatureExtractor:
    """Builds shared, geometry-aware, and physics-inspired feature representations."""

    def __init__(self, protocol: ResearchProtocol = ResearchProtocol.PROTOCOL_B):
        self.protocol = protocol
        self.harmonizer = SignalHarmonizer()

    @staticmethod
    def _profile_statistics(
        aligned_profile: np.ndarray,
        profile_mask: np.ndarray,
    ) -> Dict[str, np.ndarray]:
        """Summarize profile rows while treating fully missing rows as zero coverage."""
        rows = aligned_profile.shape[0]
        valid_rows = np.isfinite(aligned_profile).any(axis=1)
        result = {
            key: np.zeros(rows, dtype=np.float64)
            for key in ("mean", "max", "std", "q25", "q50", "q75")
        }

        if np.any(valid_rows):
            valid = aligned_profile[valid_rows]
            result["mean"][valid_rows] = np.nanmean(valid, axis=1)
            result["max"][valid_rows] = np.nanmax(valid, axis=1)
            result["std"][valid_rows] = np.nanstd(valid, axis=1)
            result["q25"][valid_rows] = np.nanpercentile(valid, 25, axis=1)
            result["q50"][valid_rows] = np.nanmedian(valid, axis=1)
            result["q75"][valid_rows] = np.nanpercentile(valid, 75, axis=1)

        result["coverage"] = np.mean(profile_mask, axis=1)
        return result

    def extract_shot_features(
        self,
        shot_record: Dict[str, Any],
        machine: str,
    ) -> Tuple[np.ndarray, List[str], np.ndarray]:
        """Extract harmonized features for every efit_times frame in a shot.
        
        Returns:
            X: np.ndarray of shape (T, num_features)
            feature_names: List[str] of length num_features
            times: np.ndarray of shape (T,) (efit_times)
        """
        efit_times = np.asarray(shot_record["efit_times"], dtype=np.float64)
        T = len(efit_times)

        # Actuators and plasma current
        # Determine plasma current time base
        if "magnetics_plasma_current_times" in shot_record:
            ip_times = np.asarray(shot_record["magnetics_plasma_current_times"], dtype=np.float64)
        else:
            ip_times = np.asarray(shot_record.get("magnetics_time", efit_times), dtype=np.float64)

        ip_raw = np.asarray(shot_record["magnetics_plasma_current"], dtype=np.float64)
        ip_aligned, ip_mask = self.harmonizer.align_1d_signal(ip_times, ip_raw, efit_times)

        # Collect coil currents and geometries
        coil_cols = shot_record.get("coil_input_column", [])
        coil_r = np.asarray(shot_record.get("coil_R", []), dtype=np.float64)
        coil_z = np.asarray(shot_record.get("coil_Z", []), dtype=np.float64)

        # Align each coil current onto efit_times
        mag_time = np.asarray(shot_record.get("magnetics_time", efit_times), dtype=np.float64)
        aligned_coil_currents: List[np.ndarray] = []
        valid_coil_masks: List[np.ndarray] = []

        for col_name in coil_cols:
            if col_name in shot_record:
                raw_c = np.asarray(shot_record[col_name], dtype=np.float64)
                c_aligned, c_mask = self.harmonizer.align_1d_signal(mag_time, raw_c, efit_times)
                aligned_coil_currents.append(c_aligned)
                valid_coil_masks.append(c_mask)
            else:
                aligned_coil_currents.append(np.zeros(T, dtype=np.float64))
                valid_coil_masks.append(np.zeros(T, dtype=bool))

        aligned_coils_mat = np.column_stack(aligned_coil_currents) if aligned_coil_currents else np.zeros((T, 0))

        # Shared Geometry-Weighted Current Moments:
        # 1. Total absolute coil current (ampere-turns sum)
        # 2. Upper coil current (Z > 0)
        # 3. Lower coil current (Z < 0)
        # 4. Up-down asymmetry: (I_upper - I_lower) / (I_total + 1e-5)
        # 5. Radial current moment: sum(I_i * R_i) / (sum(|I_i|) + 1e-5)
        # 6. Vertical current moment: sum(I_i * Z_i) / (sum(|I_i|) + 1e-5)
        # 7. Current quadrupole moment: sum(I_i * (2*Z_i^2 - R_i^2)) / (sum(|I_i|) + 1e-5)
        n_coils = len(coil_cols)
        if n_coils > 0:
            abs_coils = np.abs(aligned_coils_mat)
            sum_abs_coils = np.sum(abs_coils, axis=1) + 1e-5

            is_upper = (coil_z > 0.05)
            is_lower = (coil_z < -0.05)

            i_upper = np.sum(aligned_coils_mat[:, is_upper], axis=1) if np.any(is_upper) else np.zeros(T)
            i_lower = np.sum(aligned_coils_mat[:, is_lower], axis=1) if np.any(is_lower) else np.zeros(T)
            asym_up_down = (i_upper - i_lower) / (np.abs(i_upper) + np.abs(i_lower) + 1e-5)

            r_moment = np.sum(aligned_coils_mat * coil_r[np.newaxis, :], axis=1) / sum_abs_coils
            z_moment = np.sum(aligned_coils_mat * coil_z[np.newaxis, :], axis=1) / sum_abs_coils
            quad_moment = np.sum(aligned_coils_mat * (2 * coil_z[np.newaxis, :]**2 - coil_r[np.newaxis, :]**2), axis=1) / sum_abs_coils
            coil_sum = np.sum(aligned_coils_mat, axis=1)
        else:
            sum_abs_coils = np.zeros(T)
            i_upper = np.zeros(T)
            i_lower = np.zeros(T)
            asym_up_down = np.zeros(T)
            r_moment = np.zeros(T)
            z_moment = np.zeros(T)
            quad_moment = np.zeros(T)
            coil_sum = np.zeros(T)

        # Thomson Profiles (Core and Edge)
        # Compute spatial profile quantiles (q10, q25, q50, q75, q90, mean, max)
        def process_profile_quantiles(times_key: str, val_key: str, prefix: str) -> Dict[str, np.ndarray]:
            res = {}
            if times_key in shot_record and val_key in shot_record:
                p_times = np.asarray(shot_record[times_key], dtype=np.float64)
                p_vals = np.asarray(shot_record[val_key], dtype=np.float64)
                aligned_p, p_mask = self.harmonizer.align_profile(p_times, p_vals, efit_times)

                stats = self._profile_statistics(aligned_p, p_mask)
                for suffix, values in stats.items():
                    res[f"{prefix}_{suffix}"] = values
            else:
                for suffix in ["mean", "max", "std", "q25", "q50", "q75", "coverage"]:
                    res[f"{prefix}_{suffix}"] = np.zeros(T)
            return res

        te_core_stats = process_profile_quantiles("thomson_core_times", "thomson_core_Te", "te_core")
        ne_core_stats = process_profile_quantiles("thomson_core_times", "thomson_core_ne", "ne_core")
        te_edge_stats = process_profile_quantiles("thomson_edge_times", "thomson_edge_Te", "te_edge")
        ne_edge_stats = process_profile_quantiles("thomson_edge_times", "thomson_edge_ne", "ne_edge")

        # Temporal rates of change (derivatives)
        dt = np.gradient(efit_times) / 1000.0  # seconds
        dt[dt <= 0] = 0.01
        dip_dt = np.gradient(np.nan_to_num(ip_aligned, nan=0.0)) / dt

        # Assemble shared feature dict
        features_dict: Dict[str, np.ndarray] = {
            "plasma_current_ka": np.nan_to_num(ip_aligned, nan=0.0),
            "plasma_current_rate_ka_s": np.nan_to_num(dip_dt, nan=0.0),
            "coil_current_abs_sum": sum_abs_coils,
            "coil_current_net_sum": coil_sum,
            "coil_current_upper_sum": i_upper,
            "coil_current_lower_sum": i_lower,
            "coil_up_down_asymmetry": asym_up_down,
            "coil_radial_moment_m": r_moment,
            "coil_vertical_moment_m": z_moment,
            "coil_quadrupole_moment_m2": quad_moment,
            "ip_to_coil_ratio": np.nan_to_num(ip_aligned / (sum_abs_coils + 1.0), nan=0.0),
            **te_core_stats,
            **ne_core_stats,
            **te_edge_stats,
            **ne_edge_stats,
        }

        feature_names = sorted(features_dict.keys())

        # Validate no leakage columns
        ProtocolGuard.validate_feature_columns(self.protocol, feature_names)

        X = np.column_stack([features_dict[name] for name in feature_names])
        return X, feature_names, efit_times
