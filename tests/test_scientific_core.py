"""Comprehensive automated tests for Cross-Machine Plasma Transfer."""

import pytest
import numpy as np
import warnings

from plasma_transfer.protocols.protocol_guard import (
    ProtocolGuard,
    ResearchProtocol,
    ProtocolViolationError,
    LineageRecord,
)
from plasma_transfer.geometry.machine_geometry import (
    compute_conductor_polygon,
    DIII_D_INFO,
    MAST_INFO,
)
from plasma_transfer.preprocessing.harmonizer import SignalHarmonizer
from plasma_transfer.features.feature_extractor import FeatureExtractor
from plasma_transfer.domain_shift.domain_shift_analyzer import DomainShiftAnalyzer
from plasma_transfer.models.baselines import PCARegressionBaseline, MeanReferenceBaseline
from plasma_transfer.uncertainty.uncertainty_analyzer import OODDetector, SpatialUncertaintyEstimator


def test_protocol_guard_leakage_prevention():
    """Verify that forbidden columns and target-label leakage are strictly blocked."""
    # Forbidden column in features must raise ProtocolViolationError
    with pytest.raises(ProtocolViolationError):
        ProtocolGuard.validate_feature_columns(
            ResearchProtocol.PROTOCOL_B, ["plasma_current_ka", "magnetics_dsep"]
        )

    with pytest.raises(ProtocolViolationError):
        ProtocolGuard.validate_feature_columns(
            ResearchProtocol.PROTOCOL_B, ["plasma_current_ka", "efit_psirz"]
        )

    # Valid feature set should pass
    ProtocolGuard.validate_feature_columns(
        ResearchProtocol.PROTOCOL_B, ["plasma_current_ka", "coil_current_abs_sum"]
    )

    # Protocol A prohibits target machine training
    with pytest.raises(ProtocolViolationError):
        ProtocolGuard.validate_training_data(
            ResearchProtocol.PROTOCOL_A, machine="mast", has_labels=False, is_target=True
        )

    # Protocol B prohibits target machine labels
    with pytest.raises(ProtocolViolationError):
        ProtocolGuard.validate_training_data(
            ResearchProtocol.PROTOCOL_B, machine="mast", has_labels=True, is_target=True
        )


def test_split_integrity_guard():
    """Verify group-aware split integrity prevents shot contamination."""
    train_shots = {"shot_001", "shot_002", "shot_003"}
    val_shots = {"shot_004", "shot_005"}
    test_shots = {"shot_006"}

    # No overlap passes
    ProtocolGuard.validate_split_integrity(train_shots, val_shots, test_shots)

    # Overlap between train and val must fail
    with pytest.raises(ProtocolViolationError):
        ProtocolGuard.validate_split_integrity(train_shots, {"shot_002", "shot_005"}, test_shots)


def test_machine_geometry_polygon_computation():
    """Verify unskewed and skewed conductor polygon calculations."""
    # Unskewed rectangle
    rect = compute_conductor_polygon(r_center=1.5, z_center=0.0, width=0.2, height=0.4, angle1_deg=0.0, angle2_deg=0.0)
    assert len(rect) == 4
    assert np.isclose(rect[0][0], 1.4)
    assert np.isclose(rect[1][0], 1.6)

    # 90 degrees in EFIT convention is also unskewed rectangle
    rect90 = compute_conductor_polygon(r_center=1.5, z_center=0.0, width=0.2, height=0.4, angle1_deg=90.0, angle2_deg=0.0)
    assert np.allclose(rect, rect90)

    # Skewed coil (e.g. F5A with 45 degree angle)
    skewed = compute_conductor_polygon(r_center=2.0, z_center=1.0, width=0.2, height=0.4, angle1_deg=45.0, angle2_deg=0.0)
    assert len(skewed) == 4
    assert not np.allclose(rect, skewed)


def test_signal_harmonizer_alignment():
    """Verify gap-aware linear interpolation and NaN mask generation."""
    harmonizer = SignalHarmonizer(max_interpolation_gap_ms=100.0)
    src_times = np.array([0.0, 50.0, 100.0, 500.0])  # Note > 100ms gap between 100 and 500
    src_vals = np.array([10.0, 20.0, 30.0, 40.0])

    target_times = np.array([25.0, 75.0, 250.0])
    aligned, mask = harmonizer.align_1d_signal(src_times, src_vals, target_times)

    assert np.isclose(aligned[0], 15.0)
    assert bool(mask[0]) is True
    assert np.isclose(aligned[1], 25.0)
    assert bool(mask[1]) is True

    # 250ms is in gap (> 100ms from 100 or 500)
    assert np.isnan(aligned[2])
    assert bool(mask[2]) is False


def test_profile_statistics_handle_all_missing_rows_without_warnings():
    aligned = np.array([[np.nan, np.nan], [2.0, np.nan], [2.0, 4.0]])
    mask = np.array([[False, False], [True, False], [True, True]])

    with warnings.catch_warnings():
        warnings.simplefilter("error", RuntimeWarning)
        stats = FeatureExtractor._profile_statistics(aligned, mask)

    assert np.allclose(stats["mean"], [0.0, 2.0, 3.0])
    assert np.allclose(stats["max"], [0.0, 2.0, 4.0])
    assert np.allclose(stats["q50"], [0.0, 2.0, 3.0])
    assert np.allclose(stats["coverage"], [0.0, 0.5, 1.0])


def test_domain_shift_metrics():
    """Verify statistical domain shift computation."""
    np.random.seed(42)
    s1 = np.random.normal(0.0, 1.0, 200)
    s2 = np.random.normal(2.0, 1.0, 200)

    res = DomainShiftAnalyzer.compute_univariate_shift(s1, s2)
    assert res["wasserstein_distance"] > 1.5
    assert res["ks_statistic"] > 0.5
    assert res["distribution_overlap"] < 0.5

    # Identical distributions
    res_id = DomainShiftAnalyzer.compute_univariate_shift(s1, s1)
    assert np.isclose(res_id["wasserstein_distance"], 0.0, atol=1e-3)
    assert np.isclose(res_id["distribution_overlap"], 1.0, atol=1e-2)


def test_pca_regression_baseline():
    """Verify low-dimensional flux PCA regression model."""
    np.random.seed(42)
    N = 20
    X = np.random.randn(N, 10)
    # Synthetic 65x65 flux maps
    flux_maps = np.random.randn(N, 65, 65)
    q95 = np.random.uniform(2.0, 6.0, N)
    betan = np.random.uniform(1.0, 3.0, N)

    model = PCARegressionBaseline(n_components=5, alpha=1.0)
    model.fit(X, flux_maps, q95, betan)

    pred_flux, pred_q, pred_b = model.predict(X[:5])
    assert pred_flux.shape == (5, 65, 65)
    assert pred_q.shape == (5,)
    assert pred_b.shape == (5,)


def test_ood_detector():
    """Verify out-of-distribution detection on source support."""
    np.random.seed(42)
    X_source = np.random.normal(0.0, 1.0, (100, 5))
    ood = OODDetector(k_neighbors=5)
    ood.fit_source_support(X_source)

    # Test in-distribution point (near 0)
    X_in = np.zeros((1, 5))
    scores_in = ood.score_samples(X_in)
    assert scores_in["normalized_risk_score"][0] <= 1.0
    assert scores_in["risk_categories"][0] == "Within Source Support"

    # Test extreme out-of-distribution point (far away)
    X_out = np.ones((1, 5)) * 10.0
    scores_out = ood.score_samples(X_out)
    assert scores_out["normalized_risk_score"][0] > 1.5
    assert scores_out["risk_categories"][0] == "Outside Source Support"
