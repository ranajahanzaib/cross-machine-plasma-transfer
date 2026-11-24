"use client";

import { EmbeddingScatterplot } from "@/components/visualization/EmbeddingScatterplot";
import { EmbeddingPoint } from "@/types/scientific";
import { useEffect, useState } from "react";

export default function FeatureSpacePage() {
  const [points, setPoints] = useState<EmbeddingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [projection, setProjection] = useState<"umap" | "pca" | "umap_adapted">(
    "umap",
  );
  const [colorBy, setColorBy] = useState<
    "machine" | "plasma_current_ka" | "ood_score"
  >("machine");
  const [selectedPoint, setSelectedPoint] = useState<EmbeddingPoint | null>(
    null,
  );

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
        Loading shared embedding coordinates...
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      {/* Top Header & Toolbar */}
      <div className="flex items-center justify-between border-b border-border pb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Interactive Shared Feature-Space Explorer
          </h1>
          <p className="text-xs text-muted">
            High-dimensional manifold projection of harmonized experimental
            operating states.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          {/* Projection selector */}
          <div className="flex items-center space-x-1 bg-surface-elevated p-1 rounded border border-border">
            <span className="text-[10px] text-muted px-2 uppercase">
              Projection:
            </span>
            <button
              onClick={() => setProjection("umap")}
              className={`px-2 py-0.5 rounded ${
                projection === "umap"
                  ? "bg-source text-background font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              UMAP
            </button>
            <button
              onClick={() => setProjection("pca")}
              className={`px-2 py-0.5 rounded ${
                projection === "pca"
                  ? "bg-source text-background font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              PCA
            </button>
            <button
              onClick={() => setProjection("umap_adapted")}
              className={`px-2 py-0.5 rounded ${
                projection === "umap_adapted"
                  ? "bg-accent text-background font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              CORAL Adapted
            </button>
          </div>

          {/* Color by selector */}
          <div className="flex items-center space-x-1 bg-surface-elevated p-1 rounded border border-border">
            <span className="text-[10px] text-muted px-2 uppercase">
              Color by:
            </span>
            <button
              onClick={() => setColorBy("machine")}
              className={`px-2 py-0.5 rounded ${
                colorBy === "machine"
                  ? "bg-surface text-foreground font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Machine
            </button>
            <button
              onClick={() => setColorBy("plasma_current_ka")}
              className={`px-2 py-0.5 rounded ${
                colorBy === "plasma_current_ka"
                  ? "bg-surface text-foreground font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Ip (kA)
            </button>
            <button
              onClick={() => setColorBy("ood_score")}
              className={`px-2 py-0.5 rounded ${
                colorBy === "ood_score"
                  ? "bg-surface text-foreground font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              OOD Risk
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas + Detail Drawer */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        <div className="flex-1 h-full min-h-[460px]">
          <EmbeddingScatterplot
            points={points}
            projection={projection}
            colorBy={colorBy}
            onSelectPoint={setSelectedPoint}
            selectedPointId={selectedPoint?.id}
          />
        </div>

        {/* Selected observation details */}
        {selectedPoint ? (
          <div className="w-80 bg-surface rounded-lg border border-border p-4 flex flex-col justify-between font-mono text-xs overflow-y-auto">
            <div className="space-y-4">
              <div className="border-b border-border pb-2">
                <span className="text-[10px] uppercase text-muted block">
                  Observation Details
                </span>
                <span className="font-bold text-sm text-foreground">
                  {selectedPoint.shot_id}
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedPoint.machine === "diii_d"
                        ? "bg-source/20 text-source"
                        : "bg-target/20 text-target"
                    }`}
                  >
                    {selectedPoint.machine === "diii_d" ? "DIII-D" : "MAST"}
                  </span>
                  <span className="text-muted text-[11px]">
                    {selectedPoint.config_name}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">Timestamp:</span>
                  <span className="text-foreground">
                    {selectedPoint.timestamp_ms.toFixed(1)} ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Plasma Current:</span>
                  <span className="text-foreground">
                    {selectedPoint.plasma_current_ka.toFixed(1)} kA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">OOD Risk Score:</span>
                  <span className="text-warning">
                    {selectedPoint.ood_score.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">OOD Category:</span>
                  <span className="text-foreground font-semibold">
                    {selectedPoint.ood_category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Has Reference Flux:</span>
                  <span
                    className={
                      selectedPoint.has_label ? "text-positive" : "text-muted"
                    }
                  >
                    {selectedPoint.has_label
                      ? "Yes (Supervision)"
                      : "No (Withheld)"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedPoint(null)}
              className="mt-4 w-full py-1.5 rounded bg-surface-elevated hover:bg-border text-muted hover:text-foreground text-center"
            >
              Clear Selection
            </button>
          </div>
        ) : (
          <div className="w-80 bg-surface/50 rounded-lg border border-border/50 p-4 flex flex-col items-center justify-center text-center font-mono text-xs text-muted">
            Click on any observation in the manifold to inspect its experimental
            properties.
          </div>
        )}
      </div>
    </div>
  );
}
