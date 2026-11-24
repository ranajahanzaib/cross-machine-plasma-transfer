"""Domain adaptation algorithms: CORAL, MMD minimization, and Optimal Transport."""

from typing import Any, Dict, Optional, Tuple
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
import ot  # Python Optimal Transport


class CoralAlignment(BaseEstimator, TransformerMixin):
    """Correlation Alignment (CORAL): Align target covariance to source covariance."""

    def __init__(self, reg: float = 1e-4):
        self.reg = reg
        self.mean_s_: Optional[np.ndarray] = None
        self.cov_s_sqrt_: Optional[np.ndarray] = None
        self.mean_t_: Optional[np.ndarray] = None
        self.cov_t_inv_sqrt_: Optional[np.ndarray] = None

    def fit(self, X_s: np.ndarray, X_t: np.ndarray):
        """Fit covariances of source and target."""
        self.mean_s_ = np.mean(X_s, axis=0)
        self.mean_t_ = np.mean(X_t, axis=0)

        # Center data
        X_s_c = X_s - self.mean_s_
        X_t_c = X_t - self.mean_t_

        # Covariances with Tikhonov regularization
        cov_s = np.cov(X_s_c, rowvar=False) + self.reg * np.eye(X_s.shape[1])
        cov_t = np.cov(X_t_c, rowvar=False) + self.reg * np.eye(X_t.shape[1])

        # SVD / Matrix square root
        def matrix_pow(cov, p):
            u, s, vt = np.linalg.svd(cov)
            return u @ np.diag(np.power(s, p)) @ vt

        self.cov_s_sqrt_ = matrix_pow(cov_s, 0.5)
        self.cov_t_inv_sqrt_ = matrix_pow(cov_t, -0.5)
        return self

    def transform_target(self, X_t: np.ndarray) -> np.ndarray:
        """Transform target features to align with source covariance structure."""
        if self.cov_t_inv_sqrt_ is None or self.cov_s_sqrt_ is None:
            raise ValueError("CoralAlignment must be fitted first.")
        X_t_c = X_t - self.mean_t_
        # Whiten target covariance and color with source covariance
        X_t_aligned = X_t_c @ self.cov_t_inv_sqrt_ @ self.cov_s_sqrt_ + self.mean_s_
        return X_t_aligned


class OptimalTransportAlignment:
    """Feature distribution alignment using Sinkhorn entropic optimal transport."""

    def __init__(self, reg: float = 1e-2, max_samples: int = 500):
        self.reg = reg
        self.max_samples = max_samples

    def compute_transport_plan(self, X_s: np.ndarray, X_t: np.ndarray) -> np.ndarray:
        """Compute optimal transport pairing matrix between source and target distributions."""
        n_s = min(len(X_s), self.max_samples)
        n_t = min(len(X_t), self.max_samples)

        idx_s = np.random.choice(len(X_s), n_s, replace=False) if len(X_s) > n_s else np.arange(len(X_s))
        idx_t = np.random.choice(len(X_t), n_t, replace=False) if len(X_t) > n_t else np.arange(len(X_t))

        xs_sub = X_s[idx_s]
        xt_sub = X_t[idx_t]

        # Uniform marginals
        a = np.ones(n_s) / n_s
        b = np.ones(n_t) / n_t

        # Cost matrix (squared Euclidean distance)
        M = ot.dist(xs_sub, xt_sub, metric="sqeuclidean")
        M /= (np.max(M) + 1e-5)

        # Sinkhorn plan
        P = ot.sinkhorn(a, b, M, self.reg)
        return P
