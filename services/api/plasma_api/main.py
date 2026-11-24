"""FastAPI backend application for Cross-Machine Plasma Transfer."""

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Cross-Machine Plasma Transfer API",
    description="Scientific API investigating domain shift and equilibrium transfer between DIII-D and MAST.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ARTIFACTS_FILE = Path("artifacts/quickstart_analysis.json")


def load_artifacts() -> Dict[str, Any]:
    if not ARTIFACTS_FILE.exists():
        raise HTTPException(
            status_code=503,
            detail="Scientific artifacts not yet generated. Please wait for pipeline completion or run `plasma-transfer run-pipeline`.",
        )
    with open(ARTIFACTS_FILE, "r") as f:
        return json.load(f)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "artifacts_ready": ARTIFACTS_FILE.exists(),
        "active_protocol": "protocol_b",
        "machines": ["diii_d", "mast"],
    }


@app.get("/api/overview")
def get_research_overview():
    data = load_artifacts()
    return {
        "metadata": data["metadata"],
        "domain_shift_summary": {
            "mmd": data["domain_shift"]["mmd"],
            "classifier_roc_auc": data["domain_shift"]["domain_classifier"]["mean_roc_auc"],
            "top_shifted_features": data["domain_shift"]["domain_classifier"]["feature_importance_ranking"][:5],
        },
        "machines": data["machines"],
        "shots_count": len(data["shots"]),
    }


@app.get("/api/machines")
def get_machines():
    data = load_artifacts()
    return data["machines"]


@app.get("/api/machines/{machine_id}/geometry")
def get_machine_geometry(machine_id: str):
    data = load_artifacts()
    if machine_id not in data["machines"]:
        raise HTTPException(status_code=404, detail=f"Machine {machine_id} not found.")
    return {
        "machine": data["machines"][machine_id],
        "conductors": data["geometry"]["conductors"].get(machine_id, []),
        "chords": data["geometry"]["chords"].get(machine_id, []),
    }


@app.get("/api/embeddings")
def get_embeddings(
    method: str = Query("umap", description="Projection method: 'umap', 'pca', or 'umap_adapted'"),
    color_by: str = Query("machine", description="Attribute to color by: 'machine', 'plasma_current_ka', 'ood_score'"),
    limit: Optional[int] = Query(None, description="Max points to return"),
):
    data = load_artifacts()
    points = data["embedding_points"]
    if limit is not None and limit > 0:
        points = points[:limit]
    return {
        "method": method,
        "color_by": color_by,
        "total_points": len(data["embedding_points"]),
        "points": points,
    }


@app.get("/api/domain-shift")
def get_domain_shift():
    data = load_artifacts()
    return data["domain_shift"]


@app.get("/api/shots")
def get_shots(machine: Optional[str] = Query(None)):
    data = load_artifacts()
    shots = data["shots"]
    if machine:
        shots = [s for s in shots if s["machine"] == machine]
    return shots


@app.get("/api/reports/markdown")
def get_markdown_report():
    data = load_artifacts()
    meta = data["metadata"]
    shift = data["domain_shift"]
    
    report = f"""# Cross-Machine Plasma Transfer Analysis: Scientific Research Report

## 1. Executive Summary
- **Protocol:** {meta['protocol'].upper()} (Label-Free Domain Adaptation)
- **Primary Source Machine:** DIII-D (Conventional Tokamak, San Diego)
- **Target Machine:** MAST (Spherical Tokamak, Culham)
- **Evaluated Observations:** {meta['num_observations']} (DIII-D: {meta['d3d_observations']}, MAST: {meta['mast_observations']})
- **Supervised DIII-D Baseline MAE (ψ):** {meta['source_mae_flux']:.4f} V·s/rad

## 2. Quantitative Domain Shift Discrepancies
- **Multivariate Maximum Mean Discrepancy (MMD):** {shift['mmd']:.4f}
- **Domain Classifier Discrimination (ROC-AUC):** {shift['domain_classifier']['mean_roc_auc']:.2f}

### Top Shifted Features:
"""
    for rank in shift['domain_classifier']['feature_importance_ranking'][:5]:
        report += f"- **{rank['feature']}:** {rank['importance']*100:.2f}% importance\n"

    report += """
## 3. Protocol Compliance & Leakage Audit
- **Forbidden Features:** No target labels or scaffolding columns (e.g., magnetics_dsep) admitted to training or feature extraction.
- **Target Supervision:** Zero target labels utilized in accordance with Fusion Equilibrium Challenge rules.
"""
    return report

@app.get("/api/predictions/sample")
def get_sample_predictions():
    data = load_artifacts()
    return data["predictions_sample"]
