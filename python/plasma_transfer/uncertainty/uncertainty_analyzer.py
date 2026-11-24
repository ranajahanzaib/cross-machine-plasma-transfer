"""Spatial uncertainty quantification and out-of-distribution detection."""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.ensemble import IsolationForest


class SpatialUncertaintyEstimator:
    """Estimates 2D spatial uncertainty maps for reconstructed poloidal magnetic flux."""

    @staticmethod
    def compute_ensemble_uncertainty(flux_predictions: np.ndarray) -> Dict[str, np.ndarray]:
        """Compute mean prediction and spatial uncertainty from ensemble predictions.
        
        Args:
            flux_predictions: np.ndarray of shape (N_models, Batch_size, 65, 65)
            
        Returns:
            Dict containing:
                "mean_flux": (Batch_size, 65, 65)
                "std_flux": (Batch_size, 65, 65)  # Epistemic / disagreement uncertainty
                "interval_95_width": (Batch_size, 65, 65)
        """
        mean_flux = np.mean(flux_predictions, axis=0)
        std_flux = np.std(flux_predictions, axis=0)
        # 95% interval width (assuming approximate normality ~ 3.92 sigma)
        interval_width = 3.92 * std_flux

        return {
            "mean_flux": mean_flux,
            "std_flux": std_flux,
            "interval_95_width": interval_width,
        }


class OODDetector:
    """Out-of-distribution detector using k-nearest-neighbors and isolation forests on source support."""

    def __init__(self, k_neighbors: int = 5):
        self.k_neighbors = k_neighbors
        self.nn_ = NearestNeighbors(n_neighbors=k_neighbors)
        self.iso_forest_ = IsolationForest(contamination=0.05, random_state=42)
        self.source_dist_threshold_95_: float = 0.0

    def fit_source_support(self, X_source: np.ndarray):
        """Fit exclusively on source training data (Protocol A / B compliant)."""
        self.nn_.fit(X_source)
        self.iso_forest_.fit(X_source)

        # Compute internal distances within source to calibrate threshold
        distances, _ = self.nn_.kneighbors(X_source)
        mean_dists = np.mean(distances, axis=1)
        self.source_dist_threshold_95_ = float(np.percentile(mean_dists, 95))
        return self

    def score_samples(self, X: np.ndarray) -> Dict[str, np.ndarray]:
        """Score observations for out-of-distribution risk."""
        distances, indices = self.nn_.kneighbors(X)
        knn_scores = np.mean(distances, axis=1)

        # Normalized risk score: 1.0 at 95th percentile of source support
        norm_risk = knn_scores / (self.source_dist_threshold_95_ + 1e-5)

        # Categorical risk assignment
        categories = []
        for r in norm_risk:
            if r <= 1.0:
                categories.append("Within Source Support")
            elif r <= 1.5:
                categories.append("Near Support Boundary")
            else:
                categories.append("Outside Source Support")

        return {
            "knn_distance": knn_scores,
            "normalized_risk_score": norm_risk,
            "risk_categories": np.array(categories),
            "nearest_neighbor_indices": indices,
        }
