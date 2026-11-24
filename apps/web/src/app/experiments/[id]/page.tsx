"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

type Overview = {
  metadata: {
    protocol: string;
    num_observations: number;
    d3d_observations: number;
    mast_observations: number;
    features_count: number;
    source_mae_flux: number;
  };
  domain_shift_summary: { mmd: number; classifier_roc_auc: number };
};

export default function ExperimentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [overview, setOverview] = useState<Overview | null>(null);
  const isQuickstart = id === "quickstart_analysis";

  useEffect(() => {
    if (!isQuickstart) return;
    fetch("/api/overview")
      .then((response) => {
        if (!response.ok) throw new Error("Analysis artifact is unavailable");
        return response.json();
      })
      .then(setOverview)
      .catch((error) =>
        console.error("Failed to load analysis summary:", error),
      );
  }, [isQuickstart]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center space-x-3">
        <Link
          href="/experiments"
          className="p-2 rounded bg-surface hover:bg-surface-elevated text-muted hover:text-foreground"
          aria-label="Back to experiment registry"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {isQuickstart ? "Quickstart Analysis" : "Analysis Not Found"}
          </h1>
          <p className="text-xs text-muted">
            Generated analysis artifact summary
          </p>
        </div>
      </div>

      {!isQuickstart ? (
        <div className="bg-surface rounded-xl border border-border p-5 text-xs text-muted">
          This repository does not contain a persisted run with ID “{id}”.
          Return to the registry to inspect the available quickstart analysis.
        </div>
      ) : overview ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="bg-surface rounded-lg border border-border p-4">
              <span className="text-[10px] text-muted uppercase">Protocol</span>
              <div className="text-lg font-bold text-source mt-1">
                {overview.metadata.protocol.toUpperCase()}
              </div>
            </div>
            <div className="bg-surface rounded-lg border border-border p-4">
              <span className="text-[10px] text-muted uppercase">
                Observations
              </span>
              <div className="text-lg font-bold text-foreground mt-1">
                {overview.metadata.num_observations.toLocaleString()}
              </div>
            </div>
            <div className="bg-surface rounded-lg border border-border p-4">
              <span className="text-[10px] text-muted uppercase">
                Feature Count
              </span>
              <div className="text-lg font-bold text-foreground mt-1">
                {overview.metadata.features_count}
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl border border-border p-5 space-y-3 font-mono text-xs">
            <h2 className="text-sm font-bold text-foreground">
              Artifact Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted">
              <div>
                DIII-D observations:{" "}
                <span className="text-foreground">
                  {overview.metadata.d3d_observations.toLocaleString()}
                </span>
              </div>
              <div>
                MAST observations:{" "}
                <span className="text-foreground">
                  {overview.metadata.mast_observations.toLocaleString()}
                </span>
              </div>
              <div>
                Source MAE (ψ):{" "}
                <span className="text-foreground">
                  {overview.metadata.source_mae_flux.toFixed(4)} V·s/rad
                </span>
              </div>
              <div>
                Domain MMD:{" "}
                <span className="text-foreground">
                  {overview.domain_shift_summary.mmd.toFixed(3)}
                </span>
              </div>
              <div>
                Domain classifier ROC-AUC:{" "}
                <span className="text-foreground">
                  {overview.domain_shift_summary.classifier_roc_auc.toFixed(2)}
                </span>
              </div>
            </div>
            <p className="pt-2 text-muted">
              These values are read from the generated quickstart artifact. It
              does not include run lineage records, model checkpoints, or
              independent ProtocolGuard audit results.
            </p>
          </div>
        </>
      ) : (
        <div className="bg-surface rounded-xl border border-border p-5 text-xs text-muted">
          Loading quickstart artifact metrics…
        </div>
      )}
    </div>
  );
}
