"use client";

import { EmbeddingScatterplot } from "@/components/visualization/EmbeddingScatterplot";
import { FluxContourMap } from "@/components/visualization/FluxContourMap";
import { MachineGeometryCanvas } from "@/components/visualization/MachineGeometryCanvas";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

export default function OverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projection, setProjection] = useState<"umap" | "pca">("umap");

  useEffect(() => {
    fetch("/api/overview")
      .then((res) => res.json())
      .then((overview) => {
        return fetch("/api/embeddings?limit=700")
          .then((r) => r.json())
          .then((emb) => {
            return fetch("/api/predictions/sample")
              .then((pr) => pr.json())
              .then((pred) => {
                return fetch("/api/machines/diii_d/geometry")
                  .then((g1) => g1.json())
                  .then((geomD3D) => {
                    return fetch("/api/machines/mast/geometry")
                      .then((g2) => g2.json())
                      .then((geomMAST) => {
                        setData({
                          overview,
                          embeddings: emb.points,
                          predictions: pred,
                          geomD3D,
                          geomMAST,
                        });
                        setLoading(false);
                      });
                  });
              });
          });
      })
      .catch((err) => {
        console.error("Failed to load overview data:", err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center font-mono space-y-2">
          <div className="w-8 h-8 border-2 border-source border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs text-muted">
            Loading scientific laboratory data...
          </div>
        </div>
      </div>
    );
  }

  const { overview, embeddings, predictions, geomD3D, geomMAST } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Editorial Headline Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Learning plasma across machines.
          </h1>
          <p className="text-xs text-muted max-w-2xl mt-1">
            Investigating how machine geometry, Thomson-scattering diagnostic
            distributions, and operating conditions govern the zero-shot
            transferability of magnetic equilibrium reconstruction between
            DIII-D and MAST.
          </p>
        </div>

        {/* Statistical Summary Pills */}
        <div className="flex items-center space-x-3 font-mono text-xs">
          <div className="bg-surface border border-border px-3 py-2 rounded">
            <span className="text-muted block text-[10px]">
              MULTIVARIATE MMD
            </span>
            <span className="text-foreground font-bold text-sm">
              {overview.domain_shift_summary.mmd.toFixed(3)}
            </span>
          </div>
          <div className="bg-surface border border-border px-3 py-2 rounded">
            <span className="text-muted block text-[10px]">DOMAIN ROC-AUC</span>
            <span className="text-warning font-bold text-sm">
              {overview.domain_shift_summary.classifier_roc_auc.toFixed(2)}
            </span>
          </div>
          <div className="bg-surface border border-border px-3 py-2 rounded">
            <span className="text-muted block text-[10px]">SOURCE MAE (ψ)</span>
            <span className="text-positive font-bold text-sm">
              {overview.metadata.source_mae_flux.toFixed(3)} V·s/rad
            </span>
          </div>
        </div>
      </div>

      {/* Signature Centerpiece: Shared Feature-Space Explorer */}
      <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Shared Operating-Condition Landscape
            </h2>
            <p className="text-xs text-muted">
              Nonlinear manifold embedding of harmonized geometry-aware currents
              and profile statistics.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-surface-elevated p-1 rounded border border-border text-xs font-mono">
            <button
              onClick={() => setProjection("umap")}
              className={`px-2.5 py-1 rounded transition-colors ${
                projection === "umap"
                  ? "bg-source text-background font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              UMAP
            </button>
            <button
              onClick={() => setProjection("pca")}
              className={`px-2.5 py-1 rounded transition-colors ${
                projection === "pca"
                  ? "bg-source text-background font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              PCA
            </button>
          </div>
        </div>

        <div className="h-[480px] w-full">
          <EmbeddingScatterplot
            points={embeddings}
            projection={projection}
            colorBy="machine"
          />
        </div>
      </div>

      {/* Side-by-Side Machine Geometry Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted mb-2">
            Source Machine Geometry (DIII-D)
          </h3>
          <MachineGeometryCanvas
            machine={geomD3D.machine}
            conductors={geomD3D.conductors}
            chords={geomD3D.chords}
          />
        </div>
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted mb-2">
            Target Machine Geometry (MAST)
          </h3>
          <MachineGeometryCanvas
            machine={geomMAST.machine}
            conductors={geomMAST.conductors}
            chords={geomMAST.chords}
          />
        </div>
      </div>

      {/* Equilibrium Reconstruction Verification */}
      <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Equilibrium Reconstruction Transfer
            </h2>
            <p className="text-xs text-muted">
              Model reconstruction on source (with reference EFIT) vs zero-shot
              transfer on target (strictly label-free).
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-xs font-mono text-muted">
            <ShieldCheck className="w-4 h-4 text-positive" />
            <span>Protocol B Enforced</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FluxContourMap
            fluxMap={predictions.d3d.reference_flux}
            title="DIII-D Reference EFIT (ψ)"
            machineId="diii_d"
            colorScheme="plasma"
          />
          <FluxContourMap
            fluxMap={predictions.d3d.predicted_flux}
            title="DIII-D Model Prediction (ψ)"
            machineId="diii_d"
            colorScheme="plasma"
          />
          <FluxContourMap
            fluxMap={predictions.d3d.residual_flux}
            title="DIII-D Absolute Residual |Δψ|"
            machineId="diii_d"
            colorScheme="inferno"
          />
          <FluxContourMap
            fluxMap={predictions.mast.predicted_flux}
            title="MAST Zero-Shot Transfer (ψ)"
            machineId="mast"
            colorScheme="plasma"
          />
        </div>
      </div>
    </div>
  );
}
