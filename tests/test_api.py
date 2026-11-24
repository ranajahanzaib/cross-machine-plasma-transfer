"""Comprehensive automated tests for Cross-Machine Plasma Transfer FastAPI endpoints."""

import pytest
import httpx2
from services.api.plasma_api.main import app


@pytest.mark.asyncio
async def test_api_health():
    async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert data["artifacts_ready"] is True
        assert data["active_protocol"] == "protocol_b"
        assert "diii_d" in data["machines"]
        assert "mast" in data["machines"]


@pytest.mark.asyncio
async def test_api_overview():
    async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/overview")
        assert res.status_code == 200
        data = res.json()
        assert "metadata" in data
        assert "domain_shift_summary" in data
        assert "mmd" in data["domain_shift_summary"]
        assert "classifier_roc_auc" in data["domain_shift_summary"]
        assert data["shots_count"] > 0


@pytest.mark.asyncio
async def test_api_machines_and_geometry():
    async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app), base_url="http://test") as client:
        machines_res = await client.get("/api/machines")
        assert machines_res.status_code == 200
        machines = machines_res.json()
        assert "diii_d" in machines
        assert "mast" in machines

        d3d_geo = await client.get("/api/machines/diii_d/geometry")
        assert d3d_geo.status_code == 200
        d3d_data = d3d_geo.json()
        assert "conductors" in d3d_data
        assert "chords" in d3d_data
        assert len(d3d_data["conductors"]) > 0

        mast_geo = await client.get("/api/machines/mast/geometry")
        assert mast_geo.status_code == 200
        mast_data = mast_geo.json()
        assert "conductors" in mast_data
        assert len(mast_data["conductors"]) > 0

        # Non-existent machine
        notFound = await client.get("/api/machines/iter/geometry")
        assert notFound.status_code == 404


@pytest.mark.asyncio
async def test_api_embeddings():
    async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/embeddings?limit=50")
        assert res.status_code == 200
        data = res.json()
        assert data["total_points"] >= 50
        assert len(data["points"]) == 50
        first_point = data["points"][0]
        assert "shot_id" in first_point
        assert "machine" in first_point
        assert "umap_x" in first_point
        assert "umap_y" in first_point
        assert "pca_x" in first_point
        assert "pca_y" in first_point


@pytest.mark.asyncio
async def test_api_domain_shift():
    async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/domain-shift")
        assert res.status_code == 200
        data = res.json()
        assert "mmd" in data
        assert "domain_classifier" in data
        assert "univariate" in data


@pytest.mark.asyncio
async def test_api_shots():
    async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app), base_url="http://test") as client:
        all_shots = await client.get("/api/shots")
        assert all_shots.status_code == 200
        shots_data = all_shots.json()
        assert len(shots_data) > 0

        d3d_shots = await client.get("/api/shots?machine=diii_d")
        assert d3d_shots.status_code == 200
        d3d_data = d3d_shots.json()
        assert all(s["machine"] == "diii_d" for s in d3d_data)


@pytest.mark.asyncio
async def test_api_predictions_sample():
    async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/predictions/sample")
        assert res.status_code == 200
        data = res.json()
        assert "d3d" in data
        assert "mast" in data
        assert "predicted_flux" in data["d3d"]
        assert "predicted_flux" in data["mast"]
        # In Protocol B, MAST reference flux MUST be None (leakage protection)
        assert data["mast"]["reference_flux"] is None


@pytest.mark.asyncio
async def test_api_reports_markdown():
    async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/reports/markdown")
        assert res.status_code == 200
        text = res.text
        assert "Cross-Machine Plasma Transfer Analysis" in text
        assert "Executive Summary" in text
