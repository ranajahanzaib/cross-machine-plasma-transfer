"""Complete reproducible experiment runner and artifact generator for Quickstart/Research profiles."""

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import umap

from plasma_transfer.ingestion.dataset_manager import (
    DatasetManager,
    HF_REPO_ID,
    HF_REVISION,
    QUICKSTART_SHOTS,
)
from plasma_transfer.features.feature_extractor import FeatureExtractor
from plasma_transfer.geometry.machine_geometry import (
    DIII_D_INFO,
    MAST_INFO,
    extract_geometry_from_record,
)
from plasma_transfer.domain_shift.domain_shift_analyzer import DomainShiftAnalyzer
from plasma_transfer.adaptation.adaptation_methods import CoralAlignment
from plasma_transfer.models.baselines import PCARegressionBaseline, MeanReferenceBaseline
from plasma_transfer.uncertainty.uncertainty_analyzer import SpatialUncertaintyEstimator, OODDetector
from plasma_transfer.protocols.protocol_guard import ProtocolGuard, ResearchProtocol, LineageRecord


class ExperimentPipeline:
    """End-to-end scientific experiment pipeline generating verified analytical artifacts."""

    def __init__(self, output_dir: str = "artifacts"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.dm = DatasetManager()
        self.fe = FeatureExtractor(protocol=ResearchProtocol.PROTOCOL_B)

    def run_quickstart_analysis(self) -> Dict[str, Any]:
        """Execute complete Quickstart analysis using real downloaded experimental shots."""
        print("Ensuring quickstart shots are downloaded...")
        shot_paths = self.dm.ingest_quickstart()

        # Ingest and extract features per shot
        all_features: List[np.ndarray] = []
        all_metadata: List[Dict[str, Any]] = []
        all_labels_flux: List[np.ndarray] = []
        all_labels_q95: List[np.ndarray] = []
        all_labels_betan: List[np.ndarray] = []

        shots_summary = []
        conductors_by_machine: Dict[str, Any] = {"diii_d": [], "mast": []}
        chords_by_machine: Dict[str, Any] = {"diii_d": [], "mast": []}
        feature_names: List[str] = []

        for p in shot_paths:
            rec = self.dm.load_shot(p)
            shot_meta = self.dm.inspect_shot(p)
            shots_summary.append(shot_meta.model_dump())

            # Extract geometry once per machine
            mach = shot_meta.machine
            if len(conductors_by_machine[mach]) == 0:
                c_geom, c_chords = extract_geometry_from_record(rec, mach)
                conductors_by_machine[mach] = [cg.model_dump() for cg in c_geom]
                chords_by_machine[mach] = [ch.model_dump() for ch in c_chords]

            X_shot, f_names, t_shot = self.fe.extract_shot_features(rec, mach)
            feature_names = f_names

            all_features.append(X_shot)
            for idx, t in enumerate(t_shot):
                all_metadata.append({
                    "shot_id": shot_meta.shot_id,
                    "machine": mach,
                    "config_name": shot_meta.config_name,
                    "timestamp_ms": float(t),
                    "has_label": shot_meta.has_labels,
                })

            if shot_meta.has_labels and "efit_psirz" in rec:
                all_labels_flux.append(np.asarray(rec["efit_psirz"], dtype=np.float32))
                all_labels_q95.append(np.asarray(rec["efit_q95"], dtype=np.float32))
                all_labels_betan.append(np.asarray(rec["efit_beta_n"], dtype=np.float32))

        X_all = np.vstack(all_features)
        machines = np.array([m["machine"] for m in all_metadata])
        is_d3d = (machines == "diii_d")
        is_mast = (machines == "mast")

        X_d3d = X_all[is_d3d]
        X_mast = X_all[is_mast]

        print(f"Extracted shared features: Total={len(X_all)}, DIII-D={len(X_d3d)}, MAST={len(X_mast)}, Features={len(feature_names)}")

        # 1. Normalization & Projections (Standardized PCA & UMAP)
        scaler = StandardScaler()
        scaler.fit(X_d3d)  # Strictly fit on source under Protocol A & B!
        X_norm = scaler.transform(X_all)

        print("Fitting PCA...")
        pca = PCA(n_components=2, random_state=42)
        pca_proj = pca.fit_transform(X_norm)

        print("Fitting UMAP...")
        reducer = umap.UMAP(n_components=2, random_state=42, n_neighbors=15, min_dist=0.1)
        umap_proj = reducer.fit_transform(X_norm)

        # 2. Domain Shift Analysis
        print("Computing Domain Shift metrics...")
        univariate_shift = {}
        for idx, fname in enumerate(feature_names):
            univariate_shift[fname] = DomainShiftAnalyzer.compute_univariate_shift(X_d3d[:, idx], X_mast[:, idx])

        mmd_val = DomainShiftAnalyzer.compute_mmd(X_d3d, X_mast)
        classifier_res = DomainShiftAnalyzer.train_domain_classifier(X_d3d, X_mast, feature_names)

        # 3. CORAL Domain Adaptation
        print("Computing CORAL Domain Adaptation...")
        coral = CoralAlignment(reg=1e-4)
        coral.fit(X_d3d, X_mast)
        X_mast_adapted = coral.transform_target(X_mast)
        X_adapted_all = np.copy(X_all)
        X_adapted_all[is_mast] = X_mast_adapted

        # Adapted UMAP projection
        adapted_norm = scaler.transform(X_adapted_all)
        umap_adapted_proj = reducer.transform(adapted_norm)

        # 4. Out-of-Distribution Scoring
        print("Computing OOD scores...")
        ood = OODDetector(k_neighbors=5)
        ood.fit_source_support(scaler.transform(X_d3d))
        ood_res = ood.score_samples(X_norm)

        # 5. Baseline Models & Spatial Uncertainty
        print("Fitting Baseline Models on DIII-D...")
        if all_labels_flux:
            Y_flux_train = np.vstack(all_labels_flux)
            Y_q95_train = np.concatenate(all_labels_q95)
            Y_betan_train = np.concatenate(all_labels_betan)
            X_train_labeled = X_d3d[:len(Y_flux_train)]

            pca_reg = PCARegressionBaseline(n_components=15, alpha=1.0)
            pca_reg.fit(scaler.transform(X_train_labeled), Y_flux_train, Y_q95_train, Y_betan_train)

            # Predict on D3D (source validation) and MAST (target zero-shot)
            pred_flux_d3d, pred_q95_d3d, pred_betan_d3d = pca_reg.predict(scaler.transform(X_train_labeled))
            pred_flux_mast, pred_q95_mast, pred_betan_mast = pca_reg.predict(scaler.transform(X_mast))

            # Residual on D3D
            residual_d3d = np.abs(pred_flux_d3d - Y_flux_train)
            # The baseline is evaluated on the same labelled observations used
            # for fitting, so this is in-sample source error, not validation MAE.
            mean_mae_d3d = float(np.mean(residual_d3d))
        else:
            pred_flux_d3d = np.zeros((1, 65, 65))
            pred_flux_mast = np.zeros((1, 65, 65))
            mean_mae_d3d = 0.0

        # Construct Embedding points payload
        embedding_points = []
        for i in range(len(X_all)):
            pt = {
                "id": f"pt_{i}",
                "shot_id": all_metadata[i]["shot_id"],
                "machine": all_metadata[i]["machine"],
                "config_name": all_metadata[i]["config_name"],
                "timestamp_ms": all_metadata[i]["timestamp_ms"],
                "pca_x": float(pca_proj[i, 0]),
                "pca_y": float(pca_proj[i, 1]),
                "umap_x": float(umap_proj[i, 0]),
                "umap_y": float(umap_proj[i, 1]),
                "umap_adapted_x": float(umap_adapted_proj[i, 0]),
                "umap_adapted_y": float(umap_adapted_proj[i, 1]),
                "ood_score": float(ood_res["normalized_risk_score"][i]),
                "ood_category": str(ood_res["risk_categories"][i]),
                "plasma_current_ka": float(X_all[i, feature_names.index("plasma_current_ka")]),
                "has_label": bool(all_metadata[i]["has_label"]),
            }
            embedding_points.append(pt)

        # Assemble full artifacts dictionary
        artifacts = {
            "metadata": {
                "protocol": ResearchProtocol.PROTOCOL_B.value,
                "dataset_repo": HF_REPO_ID,
                "dataset_revision": HF_REVISION,
                "num_observations": len(X_all),
                "d3d_observations": int(np.sum(is_d3d)),
                "mast_observations": int(np.sum(is_mast)),
                "features_count": len(feature_names),
                "source_mae_flux": mean_mae_d3d,
            },
            "machines": {
                "diii_d": DIII_D_INFO.model_dump(),
                "mast": MAST_INFO.model_dump(),
            },
            "geometry": {
                "conductors": conductors_by_machine,
                "chords": chords_by_machine,
            },
            "shots": shots_summary,
            "feature_names": feature_names,
            "embedding_points": embedding_points,
            "domain_shift": {
                "mmd": mmd_val,
                "domain_classifier": classifier_res,
                "univariate": univariate_shift,
            },
            "predictions_sample": {
                "d3d": {
                    "shot_id": all_metadata[0]["shot_id"],
                    "timestamp_ms": all_metadata[0]["timestamp_ms"],
                    "predicted_flux": pred_flux_d3d[0].tolist() if len(pred_flux_d3d) > 0 else [],
                    "reference_flux": Y_flux_train[0].tolist() if all_labels_flux else [],
                    "residual_flux": residual_d3d[0].tolist() if all_labels_flux else [],
                    "q95": float(pred_q95_d3d[0]) if len(pred_flux_d3d) > 0 else 0.0,
                    "beta_n": float(pred_betan_d3d[0]) if len(pred_flux_d3d) > 0 else 0.0,
                },
                "mast": {
                    "shot_id": all_metadata[np.where(is_mast)[0][0]]["shot_id"] if np.any(is_mast) else "",
                    "timestamp_ms": all_metadata[np.where(is_mast)[0][0]]["timestamp_ms"] if np.any(is_mast) else 0.0,
                    "predicted_flux": pred_flux_mast[0].tolist() if len(pred_flux_mast) > 0 else [],
                    "reference_flux": None,  # Strictly unavailable under Protocol A & B!
                    "residual_flux": None,   # Strictly unavailable under Protocol A & B!
                    "q95": float(pred_q95_mast[0]) if len(pred_flux_mast) > 0 else 0.0,
                    "beta_n": float(pred_betan_mast[0]) if len(pred_flux_mast) > 0 else 0.0,
                },
            },
        }

        # Save artifacts to json
        out_file = self.output_dir / "quickstart_analysis.json"
        with open(out_file, "w") as fp:
            json.dump(artifacts, fp)

        print(f"Artifacts successfully written to {out_file}")
        return artifacts
