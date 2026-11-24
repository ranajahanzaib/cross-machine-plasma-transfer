"use client";

import { EmbeddingScatterplot } from "@/components/visualization/EmbeddingScatterplot";
import { EmbeddingPoint } from "@/types/scientific";
import { AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

export default function OODPage() {
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
        Computing out-of-distribution distance risk scores...
      </div>
    );
  }

  const withinSupport = points.filter(
    (p) => p.ood_category === "Within Source Support",
  ).length;
  const nearBoundary = points.filter(
    (p) => p.ood_category === "Near Support Boundary",
  ).length;
  const outsideSupport = points.filter(
    (p) => p.ood_category === "Outside Source Support",
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground">
          Out-of-Distribution (OOD) Detection
        </h1>
        <p className="text-xs text-muted mt-1">
          Identifying unfamiliar target tokamak operating regimes via k-NN
          distance to DIII-D source support.
        </p>
      </div>

      {/* Risk Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="bg-surface rounded-lg border border-border p-4">
          <div className="flex items-center space-x-2 text-positive mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="font-bold">Within Source Support</span>
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {withinSupport}
          </div>
          <span className="text-[11px] text-muted">
            k-NN distance ≤ 95th percentile of source support
          </span>
        </div>

        <div className="bg-surface rounded-lg border border-border p-4">
          <div className="flex items-center space-x-2 text-warning mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-bold">Near Support Boundary</span>
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {nearBoundary}
          </div>
          <span className="text-[11px] text-muted">
            Distance between 1.0x and 1.5x source threshold
          </span>
        </div>

        <div className="bg-surface rounded-lg border border-border p-4">
          <div className="flex items-center space-x-2 text-negative mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span className="font-bold">Outside Source Support</span>
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {outsideSupport}
          </div>
          <span className="text-[11px] text-muted">
            Extreme unfamiliar regime (high epistemic uncertainty)
          </span>
        </div>
      </div>

      {/* Manifold with OOD risk coloring */}
      <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Manifold Out-of-Distribution Risk Overlay
            </h2>
            <p className="text-xs text-muted">
              Green represents strong source coverage; red indicates high
              cross-machine extrapolation risk.
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-positive inline-block" />
              <span className="text-muted">Safe Support</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" />
              <span className="text-muted">Boundary</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-negative inline-block" />
              <span className="text-muted">Unfamiliar (OOD)</span>
            </span>
          </div>
        </div>

        <div className="h-[480px]">
          <EmbeddingScatterplot
            points={points}
            projection="umap"
            colorBy="ood_score"
          />
        </div>
      </div>
    </div>
  );
}
