"use client";

import { EmbeddingScatterplot } from "@/components/visualization/EmbeddingScatterplot";
import { EmbeddingPoint } from "@/types/scientific";
import { useEffect, useState } from "react";

export default function AdaptationPage() {
  const [points, setPoints] = useState<EmbeddingPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/embeddings")
      .then((r) => r.json())
      .then((d) => {
        setPoints(d.points);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center font-mono text-xs text-muted">
        Loading domain adaptation comparison...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground">
          Domain Adaptation Laboratory
        </h1>
        <p className="text-xs text-muted mt-1">
          Comparing unadapted source-target manifolds against CORAL covariance
          alignment and MMD feature minimization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unadapted Feature Space */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div>
              <span className="text-[10px] font-mono uppercase text-muted">
                Baseline Manifold
              </span>
              <h2 className="text-sm font-bold text-foreground">
                1. Unadapted UMAP (Strict Source-Only)
              </h2>
            </div>
            <span className="text-xs font-mono text-negative bg-negative/10 border border-negative/30 px-2 py-0.5 rounded">
              High Domain Shift
            </span>
          </div>
          <div className="h-[420px]">
            <EmbeddingScatterplot
              points={points}
              projection="umap"
              colorBy="machine"
            />
          </div>
        </div>

        {/* Adapted Feature Space */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div>
              <span className="text-[10px] font-mono uppercase text-muted">
                Adapted Manifold
              </span>
              <h2 className="text-sm font-bold text-foreground">
                2. CORAL Covariance Aligned Manifold
              </h2>
            </div>
            <span className="text-xs font-mono text-positive bg-positive/10 border border-positive/30 px-2 py-0.5 rounded">
              Aligned Distribution
            </span>
          </div>
          <div className="h-[420px]">
            <EmbeddingScatterplot
              points={points}
              projection="umap_adapted"
              colorBy="machine"
            />
          </div>
        </div>
      </div>

      {/* Adaptation methodology notes */}
      <div className="bg-surface rounded-xl border border-border p-5 font-mono text-xs space-y-3">
        <h3 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
          Scientific Protocol & Adaptation Constraints
        </h3>
        <p className="text-muted leading-relaxed">
          Correlation Alignment (CORAL) minimizes domain shift by aligning the
          second-order statistics (covariance matrices) of target features to
          the source features via Tikhonov-regularized whitening and recoloring.
          This operation uses <strong>zero target labels</strong>, strictly
          adhering to Challenge Protocol B.
        </p>
      </div>
    </div>
  );
}
