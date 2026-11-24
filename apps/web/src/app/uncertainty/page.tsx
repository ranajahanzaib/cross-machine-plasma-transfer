"use client";

import { FluxContourMap } from "@/components/visualization/FluxContourMap";
import { useEffect, useState } from "react";

export default function UncertaintyPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/predictions/sample")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((err) => console.error(err));
  }, []);

  if (!data) {
    return (
      <div className="flex h-full w-full items-center justify-center font-mono text-xs text-muted">
        Loading spatial uncertainty laboratory...
      </div>
    );
  }

  const { d3d, mast } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground">
          Spatial Uncertainty Laboratory
        </h1>
        <p className="text-xs text-muted mt-1">
          2D spatial standard deviation σ(R, Z), ensemble disagreement, and 95%
          predictive interval mapping.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <div className="border-b border-border pb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-source">
              Source Domain Reconstruction Residual (DIII-D)
            </h2>
            <span className="text-[10px] font-mono text-positive bg-positive/10 border border-positive/30 px-2 py-0.5 rounded">
              Supervised Reference Available
            </span>
          </div>
          <FluxContourMap
            fluxMap={d3d.residual_flux}
            title="DIII-D Reconstruction Error |ψ_pred − ψ_ref|"
            machineId="diii_d"
            colorScheme="inferno"
          />
          <div className="font-mono text-xs text-muted">
            Demonstrates spatial residual concentration near the magnetic
            X-point and outer divertor boundary.
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <div className="border-b border-border pb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-target">
              Target Domain Epistemic Uncertainty (MAST)
            </h2>
            <span className="text-[10px] font-mono text-warning bg-warning/10 border border-warning/30 px-2 py-0.5 rounded">
              Zero-Shot Epistemic Spread
            </span>
          </div>
          <FluxContourMap
            fluxMap={mast.predicted_flux}
            title="MAST Predictive Mean ψ(R, Z)"
            machineId="mast"
            colorScheme="plasma"
          />
          <div className="font-mono text-xs text-muted">
            Target reference flux is withheld under Protocol B. Epistemic risk
            is quantified via source-support k-NN and ensemble variance.
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-5 font-mono text-xs text-muted leading-relaxed">
        <strong>Scientific Rigor:</strong> In-distribution calibrated error
        intervals do not guarantee coverage under severe domain shift. Epistemic
        uncertainty, ensemble disagreement, and observed errors represent
        distinct physical quantities and must not be conflated.
      </div>
    </div>
  );
}
