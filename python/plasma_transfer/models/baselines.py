"""Equilibrium reconstruction baseline models and neural architectures."""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import torch
import torch.nn as nn
from sklearn.decomposition import PCA
from sklearn.linear_model import Ridge

from plasma_transfer.protocols.protocol_guard import ProtocolGuard, ResearchProtocol


class MeanReferenceBaseline:
    """Baseline 1: Source-trained mean reference predictor."""

    def __init__(self):
        self.mean_flux_: Optional[np.ndarray] = None  # (65, 65)
        self.mean_q95_: float = 0.0
        self.mean_beta_n_: float = 0.0

    def fit(self, flux_maps: np.ndarray, q95: np.ndarray, beta_n: np.ndarray):
        """Fit exclusively on source training data."""
        self.mean_flux_ = np.mean(flux_maps, axis=0)
        self.mean_q95_ = float(np.mean(q95))
        self.mean_beta_n_ = float(np.mean(beta_n))
        return self

    def predict(self, N: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Predict mean equilibrium for N observations."""
        pred_flux = np.repeat(self.mean_flux_[np.newaxis, :, :], N, axis=0)
        pred_q95 = np.full(N, self.mean_q95_)
        pred_beta_n = np.full(N, self.mean_beta_n_)
        return pred_flux, pred_q95, pred_beta_n


class PCARegressionBaseline:
    """Baseline 2: Low-dimensional PCA basis on 65x65 flux maps + Ridge regression from features."""

    def __init__(self, n_components: int = 20, alpha: float = 1.0):
        self.n_components = n_components
        self.alpha = alpha
        self.pca_ = PCA(n_components=n_components)
        self.reg_flux_ = Ridge(alpha=alpha)
        self.reg_q95_ = Ridge(alpha=alpha)
        self.reg_beta_n_ = Ridge(alpha=alpha)

    def fit(self, X: np.ndarray, flux_maps: np.ndarray, q95: np.ndarray, beta_n: np.ndarray):
        """Fit PCA basis on source flux maps and train regression heads."""
        N, H, W = flux_maps.shape
        flat_flux = flux_maps.reshape(N, -1)
        pca_coeffs = self.pca_.fit_transform(flat_flux)

        self.reg_flux_.fit(X, pca_coeffs)
        self.reg_q95_.fit(X, q95)
        self.reg_beta_n_.fit(X, beta_n)
        return self

    def predict(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Predict full 2D flux maps, q95, and betaN."""
        pred_coeffs = self.reg_flux_.predict(X)
        pred_flat = self.pca_.inverse_transform(pred_coeffs)
        pred_flux = pred_flat.reshape(len(X), 65, 65)
        pred_q95 = self.reg_q95_.predict(X)
        pred_beta_n = self.reg_beta_n_.predict(X)
        return pred_flux, pred_q95, pred_beta_n


class EquilibriumMLP(nn.Module):
    """Baseline 3: Shared-feature multi-layer perceptron with flux decoder and scalar heads."""

    def __init__(self, in_features: int, hidden_dim: int = 128, dropout: float = 0.1):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(in_features, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
        )

        # Decoder for 65x65 flux map (4225 elements)
        self.flux_head = nn.Sequential(
            nn.Linear(hidden_dim, 256),
            nn.GELU(),
            nn.Linear(256, 65 * 65),
        )

        self.q95_head = nn.Sequential(
            nn.Linear(hidden_dim, 64),
            nn.GELU(),
            nn.Linear(64, 1),
        )

        self.beta_n_head = nn.Sequential(
            nn.Linear(hidden_dim, 64),
            nn.GELU(),
            nn.Linear(64, 1),
        )

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """Forward pass returning (flux_maps, q95, beta_n)."""
        latent = self.encoder(x)
        B = x.shape[0]
        flux = self.flux_head(latent).view(B, 65, 65)
        q95 = self.q95_head(latent).squeeze(-1)
        beta_n = self.beta_n_head(latent).squeeze(-1)
        return flux, q95, beta_n
