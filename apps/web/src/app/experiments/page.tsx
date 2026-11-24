"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Overview = {
  metadata: {
    num_observations: number;
    d3d_observations: number;
    mast_observations: number;
    source_mae_flux: number;
  };
  domain_shift_summary: { mmd: number; classifier_roc_auc: number };
};

export default function ExperimentsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    fetch("/api/overview")
      .then((response) => {
        if (!response.ok) throw new Error("Analysis artifact is unavailable");
        return response.json();
      })
      .then(setOverview)
      .catch((error) => console.error("Failed to load analysis summary:", error));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground">Experiment Registry</h1>
        <p className="text-xs text-muted mt-1">
          Summary of the bundled quickstart analysis. Persisted training runs and
          model checkpoints are not included in this repository yet.
        </p>
      </div>

      {overview ? (
        <div className="bg-surface rounded-xl border border-border p-5 flex flex-wrap items-center justify-between gap-5 font-mono text-xs">
          <div className="space-y-1">
            <div className="font-bold text-sm text-foreground">
              Quickstart cross-machine analysis
            </div>
            <div className="text-muted">
              Protocol B · {overview.metadata.num_observations.toLocaleString()} observations
              ({overview.metadata.d3d_observations.toLocaleString()} DIII-D, {overview.metadata.mast_observations.toLocaleString()} MAST)
            </div>
          </div>
          <div className="flex items-center gap-6 text-right">
            <div>
              <span className="text-[10px] text-muted block uppercase">In-Sample Source MAE (ψ)</span>
              <span className="font-bold text-positive">
                {overview.metadata.source_mae_flux.toFixed(3)} V·s/rad
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted block uppercase">Domain ROC-AUC</span>
              <span className="font-bold text-foreground">
                {overview.domain_shift_summary.classifier_roc_auc.toFixed(2)}
              </span>
            </div>
            <Link
              href="/experiments/quickstart_analysis"
              className="px-3 py-1.5 rounded bg-surface-elevated hover:bg-border text-foreground font-semibold border border-border"
            >
              Inspect
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border p-5 text-xs text-muted">
          Loading the generated quickstart analysis summary…
        </div>
      )}
    </div>
  );
}
