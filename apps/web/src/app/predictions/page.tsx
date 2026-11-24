"use client";

import { FluxContourMap } from "@/components/visualization/FluxContourMap";
import { useEffect, useState } from "react";

export default function PredictionsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/predictions/sample")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-full w-full items-center justify-center font-mono text-xs text-muted">
        Loading equilibrium reconstruction predictions...
      </div>
    );
  }

  const { d3d, mast } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground">
          Equilibrium Reconstruction Prediction Explorer
        </h1>
        <p className="text-xs text-muted mt-1">
          Synchronized 2D poloidal magnetic flux ψ(R, Z) maps with edge safety
          factor q95 and normalized beta βN.
        </p>
      </div>

      {/* Source Domain (DIII-D with EFIT Ground Truth) */}
      <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <span className="text-xs font-mono font-bold text-source uppercase">
              Source Validation View
            </span>
            <h2 className="text-sm font-bold text-foreground mt-0.5">
              DIII-D Discharge {d3d.shot_id} (t = {d3d.timestamp_ms.toFixed(1)}{" "}
              ms)
            </h2>
          </div>
          <div className="flex items-center space-x-4 font-mono text-xs">
            <span className="text-muted">
              Predicted q95:{" "}
              <strong className="text-foreground">{d3d.q95.toFixed(2)}</strong>
            </span>
            <span className="text-muted">
              Predicted βN:{" "}
              <strong className="text-foreground">
                {d3d.beta_n.toFixed(2)}
              </strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FluxContourMap
            fluxMap={d3d.reference_flux}
            title="1. EFIT Reference ψ(R, Z)"
            machineId="diii_d"
            colorScheme="plasma"
          />
          <FluxContourMap
            fluxMap={d3d.predicted_flux}
            title="2. Baseline Model Prediction ψ"
            machineId="diii_d"
            colorScheme="plasma"
          />
          <FluxContourMap
            fluxMap={d3d.residual_flux}
            title="3. Absolute Error |ψ_pred − ψ_ref|"
            machineId="diii_d"
            colorScheme="inferno"
          />
        </div>
      </div>

      {/* Target Domain (MAST Zero-Shot Transfer) */}
      <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <span className="text-xs font-mono font-bold text-target uppercase">
              Unlabelled Target Zero-Shot View
            </span>
            <h2 className="text-sm font-bold text-foreground mt-0.5">
              MAST Discharge {mast.shot_id} (t = {mast.timestamp_ms.toFixed(1)}{" "}
              ms)
            </h2>
          </div>
          <div className="flex items-center space-x-4 font-mono text-xs">
            <span className="text-muted">
              Predicted q95:{" "}
              <strong className="text-foreground">{mast.q95.toFixed(2)}</strong>
            </span>
            <span className="text-muted">
              Predicted βN:{" "}
              <strong className="text-foreground">
                {mast.beta_n.toFixed(2)}
              </strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FluxContourMap
            fluxMap={mast.predicted_flux}
            title="1. Zero-Shot Predicted ψ(R, Z)"
            machineId="mast"
            colorScheme="plasma"
          />
          <FluxContourMap
            fluxMap={[]}
            title="2. EFIT Ground Truth"
            machineId="mast"
            unavailableNotice="Reference equilibrium unavailable under Challenge Protocol B. MAST ground truth is strictly withheld."
          />
          <FluxContourMap
            fluxMap={[]}
            title="3. Reconstruction Residual"
            machineId="mast"
            unavailableNotice="Target error map unavailable without authorized scoring feedback. Leakage prevention strictly enforced."
          />
        </div>
      </div>
    </div>
  );
}
