"""Univariate and multivariate domain shift analysis between DIII-D and MAST."""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from scipy import stats
from sklearn.metrics import roc_auc_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold


class DomainShiftAnalyzer:
    """Computes rigorous statistical domain shift metrics between source and target machines."""

    @staticmethod
    def compute_univariate_shift(x_source: np.ndarray, x_target: np.ndarray) -> Dict[str, float]:
        """Compute univariate distance metrics between two 1D empirical distributions."""
        xs = x_source[~np.isnan(x_source)]
        xt = x_target[~np.isnan(x_target)]

        if len(xs) < 2 or len(xt) < 2:
            return {
                "wasserstein_distance": 0.0,
                "ks_statistic": 0.0,
                "ks_pvalue": 1.0,
                "mean_difference": 0.0,
                "variance_ratio": 1.0,
                "distribution_overlap": 1.0,
            }

        # Wasserstein (Earth Mover's Distance)
        w_dist = float(stats.wasserstein_distance(xs, xt))

        # Kolmogorov-Smirnov Test
        ks_res = stats.ks_2samp(xs, xt)
        ks_stat = float(ks_res.statistic)
        ks_pval = float(ks_res.pvalue)

        # Standardized Mean Difference (Cohen's d)
        s_pool = np.sqrt(((len(xs) - 1) * np.var(xs, ddof=1) + (len(xt) - 1) * np.var(xt, ddof=1)) / (len(xs) + len(xt) - 2) + 1e-8)
        std_mean_diff = float((np.mean(xt) - np.mean(xs)) / s_pool)

        # Variance Ratio (target / source)
        var_s = np.var(xs) + 1e-8
        var_t = np.var(xt) + 1e-8
        var_ratio = float(var_t / var_s)

        # Empirical Distribution Overlap Area (histogram intersection)
        all_vals = np.concatenate([xs, xt])
        bins = np.linspace(np.min(all_vals), np.max(all_vals), 50)
        hist_s, _ = np.histogram(xs, bins=bins, density=True)
        hist_t, _ = np.histogram(xt, bins=bins, density=True)
        bin_w = bins[1] - bins[0]
        overlap = float(np.sum(np.minimum(hist_s, hist_t)) * bin_w)
        overlap = max(0.0, min(1.0, overlap))

        return {
            "wasserstein_distance": w_dist,
            "ks_statistic": ks_stat,
            "ks_pvalue": ks_pval,
            "std_mean_difference": std_mean_diff,
            "variance_ratio": var_ratio,
            "distribution_overlap": overlap,
        }

    @staticmethod
    def compute_mmd(X_s: np.ndarray, X_t: np.ndarray, gamma: Optional[float] = None) -> float:
        """Maximum Mean Discrepancy (MMD) with RBF kernel between multivariate distributions."""
        n_s = len(X_s)
        n_t = len(X_t)
        if n_s == 0 or n_t == 0:
            return 0.0

        # Subsample for efficiency if N > 1000
        if n_s > 1000:
            idx_s = np.random.choice(n_s, 1000, replace=False)
            X_s = X_s[idx_s]
            n_s = 1000
        if n_t > 1000:
            idx_t = np.random.choice(n_t, 1000, replace=False)
            X_t = X_t[idx_t]
            n_t = 1000

        if gamma is None:
            # Median heuristic
            dists = np.linalg.norm(X_s[:min(100, n_s)] - X_t[:min(100, n_t)], axis=1)
            med = np.median(dists) + 1e-5
            gamma = 1.0 / (2 * med**2)

        def rbf_kernel(A, B):
            sq_dists = np.sum(A**2, axis=1)[:, np.newaxis] + np.sum(B**2, axis=1)[np.newaxis, :] - 2 * np.dot(A, B.T)
            return np.exp(-gamma * np.maximum(sq_dists, 0.0))

        K_ss = rbf_kernel(X_s, X_s)
        K_tt = rbf_kernel(X_t, X_t)
        K_st = rbf_kernel(X_s, X_t)

        mmd_sq = np.mean(K_ss) + np.mean(K_tt) - 2 * np.mean(K_st)
        return float(np.sqrt(max(0.0, mmd_sq)))

    @staticmethod
    def train_domain_classifier(
        X_s: np.ndarray,
        X_t: np.ndarray,
        feature_names: List[str],
    ) -> Dict[str, Any]:
        """Train a domain classifier (Source vs Target) to quantify multivariate separability."""
        n_s = len(X_s)
        n_t = len(X_t)

        X = np.vstack([X_s, X_t])
        y = np.concatenate([np.zeros(n_s), np.ones(n_t)])

        cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
        aucs = []
        importances = np.zeros(X.shape[1])

        clf = RandomForestClassifier(n_estimators=50, max_depth=6, random_state=42, n_jobs=-1)

        for train_idx, val_idx in cv.split(X, y):
            clf.fit(X[train_idx], y[train_idx])
            preds = clf.predict_proba(X[val_idx])[:, 1]
            aucs.append(roc_auc_score(y[val_idx], preds))
            importances += clf.feature_importances_ / cv.n_splits

        # Rank features by importance in distinguishing domains
        ranked_features = []
        for rank_idx in np.argsort(-importances):
            ranked_features.append({
                "feature": feature_names[rank_idx],
                "importance": float(importances[rank_idx]),
            })

        return {
            "mean_roc_auc": float(np.mean(aucs)),
            "roc_auc_std": float(np.std(aucs)),
            "feature_importance_ranking": ranked_features,
            "sample_counts": {"source": n_s, "target": n_t},
        }
