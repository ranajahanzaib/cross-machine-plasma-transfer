"""Scientific dataset ingestion and local profile management."""

import os
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional
import pyarrow.parquet as pq
from huggingface_hub import HfApi, hf_hub_download

from plasma_transfer.schemas.domain_models import ShotMetadata
from plasma_transfer.protocols.protocol_guard import ProtocolGuard, ResearchProtocol


HF_REPO_ID = "Sophelio/fusion-equilibrium-challenge"
HF_REVISION = "1e280905b85f2a6fdde7e06fca8cf3a1edf447cb"

# Preselected real experimental shots for Quickstart profile (deterministic, reproducible)
QUICKSTART_SHOTS = {
    "diii_d_train": [
        "data/diii_d_train/d3d_shot_00000a10ac.parquet",
        "data/diii_d_train/d3d_shot_00000c4a7b.parquet",
        "data/diii_d_train/d3d_shot_0003ff34e7.parquet",
        "data/diii_d_train/d3d_shot_0011c2afc9.parquet",
    ],
    "mast_public_test": [
        "data/mast_public_test/mast_shot_0035568738.parquet",
        "data/mast_public_test/mast_shot_00398d18da.parquet",
        "data/mast_public_test/mast_shot_0052369c79.parquet",
        "data/mast_public_test/mast_shot_009ba0ad8d.parquet",
    ],
    "diii_d_public_test": [
        "data/diii_d_public_test/d3d_shot_0047b7837b.parquet",
        "data/diii_d_public_test/d3d_shot_00b2ec09d2.parquet",
    ],
}


class DatasetManager:
    """Manages downloading, caching, and inspecting real experimental tokamak shot records."""

    def __init__(self, cache_dir: Optional[str] = None):
        self.cache_dir = Path(cache_dir or os.path.expanduser("~/.cache/plasma_transfer/data"))
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.api = HfApi()

    def ingest_quickstart(self, progress_callback: Optional[Callable[[str, float], None]] = None) -> List[str]:
        """Ingest the deterministic quickstart profile of real shots from Hugging Face."""
        downloaded_paths = []
        all_targets = []
        for cfg, files in QUICKSTART_SHOTS.items():
            for f in files:
                all_targets.append((cfg, f))

        total = len(all_targets)
        for idx, (cfg, rpath) in enumerate(all_targets):
            if progress_callback:
                progress_callback(f"Downloading {rpath} ({idx+1}/{total})", (idx) / total)

            local_path = hf_hub_download(
                repo_id=HF_REPO_ID,
                repo_type="dataset",
                filename=rpath,
                revision=HF_REVISION,
            )
            downloaded_paths.append(local_path)

        if progress_callback:
            progress_callback("Quickstart ingestion complete", 1.0)

        return downloaded_paths

    def load_shot(self, parquet_file_path: str) -> Dict[str, Any]:
        """Load a single shot record into a dictionary of arrays."""
        table = pq.read_table(parquet_file_path)
        record = {}
        for col in table.column_names:
            val = table[col][0].as_py()
            record[col] = val
        return record

    def inspect_shot(self, parquet_file_path: str) -> ShotMetadata:
        """Extract metadata summary for a shot file."""
        record = self.load_shot(parquet_file_path)
        filename = Path(parquet_file_path).name
        shot_id = filename.replace(".parquet", "")

        is_d3d = "d3d" in filename or "diii_d" in parquet_file_path
        machine = "diii_d" if is_d3d else "mast"
        has_labels = "efit_psirz" in record and record["efit_psirz"] is not None

        efit_times = record.get("efit_times", [])
        num_efit = len(efit_times)
        t_min = float(efit_times[0]) if num_efit > 0 else 0.0
        t_max = float(efit_times[-1]) if num_efit > 0 else 0.0
        duration = t_max - t_min

        ip_raw = record.get("magnetics_plasma_current", [])
        ip_mean = float(sum(ip_raw) / len(ip_raw)) if ip_raw else None
        ip_max = float(max(ip_raw)) if ip_raw else None

        cfg = "diii_d_train" if has_labels else ("diii_d_public_test" if is_d3d else "mast_public_test")

        return ShotMetadata(
            shot_id=shot_id,
            machine=machine,
            config_name=cfg,
            split="train" if "train" in cfg else "public_test",
            num_efit_times=num_efit,
            duration_ms=duration,
            t_min_ms=t_min,
            t_max_ms=t_max,
            ip_mean_ka=ip_mean,
            ip_max_ka=ip_max,
            has_labels=has_labels,
            source_file=parquet_file_path,
        )
