"""Signal alignment, temporal interpolation, and missing-data handling."""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from scipy import interpolate


class SignalHarmonizer:
    """Preprocesses and temporally aligns disparate tokamak diagnostic signals to efit_times."""

    def __init__(self, max_interpolation_gap_ms: float = 200.0):
        self.max_interpolation_gap_ms = max_interpolation_gap_ms

    def align_1d_signal(
        self,
        source_times: np.ndarray,
        source_values: np.ndarray,
        target_times: np.ndarray,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Align a 1D time-series onto target_times (efit_times) with gap-aware linear interpolation.
        
        Returns:
            aligned_values: np.ndarray of shape (len(target_times),)
            valid_mask: np.ndarray bool of shape (len(target_times),) (True where measurement is valid)
        """
        source_times = np.asarray(source_times, dtype=np.float64)
        source_values = np.asarray(source_values, dtype=np.float64)
        target_times = np.asarray(target_times, dtype=np.float64)

        # Filter NaNs from source
        valid_src = ~np.isnan(source_times) & ~np.isnan(source_values)
        if np.sum(valid_src) < 2:
            return np.full_like(target_times, np.nan), np.zeros_like(target_times, dtype=bool)

        src_t = source_times[valid_src]
        src_v = source_values[valid_src]

        # Sort by timestamp and remove duplicates
        sort_idx = np.argsort(src_t)
        src_t = src_t[sort_idx]
        src_v = src_v[sort_idx]

        unique_t, uniq_idx = np.unique(src_t, return_index=True)
        unique_v = src_v[uniq_idx]

        # Interpolator
        interp_func = interpolate.interp1d(
            unique_t,
            unique_v,
            kind="linear",
            bounds_error=False,
            fill_value=np.nan,
        )
        aligned = interp_func(target_times)

        # Validate max gap
        valid_mask = ~np.isnan(aligned)
        for i, t in enumerate(target_times):
            if valid_mask[i]:
                # find closest source time
                idx = np.searchsorted(unique_t, t)
                dist_left = abs(t - unique_t[idx - 1]) if idx > 0 else np.inf
                dist_right = abs(t - unique_t[idx]) if idx < len(unique_t) else np.inf
                min_dist = min(dist_left, dist_right)
                if min_dist > self.max_interpolation_gap_ms:
                    aligned[i] = np.nan
                    valid_mask[i] = False

        return aligned, valid_mask

    def align_profile(
        self,
        profile_times: np.ndarray,
        profile_values: np.ndarray,  # (T_prof, N_chords)
        target_times: np.ndarray,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Align a 2D profile (time x channels) onto target_times."""
        profile_times = np.asarray(profile_times, dtype=np.float64)
        profile_values = np.asarray(profile_values, dtype=np.float64)
        target_times = np.asarray(target_times, dtype=np.float64)

        if profile_values.ndim == 1:
            profile_values = profile_values[:, np.newaxis]

        n_targets = len(target_times)
        n_channels = profile_values.shape[1] if profile_values.ndim > 1 else 1

        aligned_prof = np.full((n_targets, n_channels), np.nan, dtype=np.float64)
        aligned_mask = np.zeros((n_targets, n_channels), dtype=bool)

        for ch in range(n_channels):
            vals, mask = self.align_1d_signal(profile_times, profile_values[:, ch], target_times)
            aligned_prof[:, ch] = vals
            aligned_mask[:, ch] = mask

        return aligned_prof, aligned_mask
