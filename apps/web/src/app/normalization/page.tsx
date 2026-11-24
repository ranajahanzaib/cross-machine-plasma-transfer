"use client";

import { useEffect, useState } from "react";

export default function NormalizationPage() {
  const [strategy, setStrategy] = useState<
    "standard" | "robust" | "minmax" | "whitening"
  >("standard");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/domain-shift")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((err) => console.error(err));
  }, []);

  const strategies = [
    {
      id: "standard",
      name: "Standard Scaling (Z-score)",
      protocol: "Protocol A/B (Source-fit)",
      desc: "Zero mean and unit variance fitted strictly on source training shots.",
    },
    {
      id: "robust",
      name: "Robust Scaling (Median/IQR)",
      protocol: "Protocol A/B",
      desc: "Outlier-resistant scaling based on percentiles (IQR) fitted on DIII-D.",
    },
    {
      id: "minmax",
      name: "Min-Max Scaling [0, 1]",
      protocol: "Protocol A/B",
      desc: "Linearly maps source features to [0, 1] range; clips target extrapolation.",
    },
    {
      id: "whitening",
      name: "Covariance Whitening (PCA)",
      protocol: "Protocol B (Unsupervised)",
      desc: "Decorrelates feature channels via empirical covariance decomposition.",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground">
          Normalization Laboratory
        </h1>
        <p className="text-xs text-muted mt-1">
          Investigating feature transformation stability and source-fit scaling
          behaviors across tokamak domains.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {strategies.map((s) => (
          <button
            key={s.id}
            onClick={() => setStrategy(s.id as any)}
            className={`p-4 rounded-xl border text-left transition-all ${
              strategy === s.id
                ? "bg-surface-elevated border-source shadow-lg"
                : "bg-surface border-border hover:border-border/80"
            }`}
          >
            <div className="text-[10px] font-mono text-muted uppercase">
              {s.protocol}
            </div>
            <div className="text-sm font-bold text-foreground mt-1">
              {s.name}
            </div>
            <div className="text-xs text-muted mt-2">{s.desc}</div>
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-bold text-foreground">
          Transformation Impact on Domain Overlap
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="bg-surface-elevated p-4 rounded border border-border">
            <span className="text-[10px] text-muted uppercase">
              Selected Strategy
            </span>
            <div className="text-lg font-bold text-source mt-1 capitalize">
              {strategy} Scaling
            </div>
            <span className="text-[11px] text-muted">
              Fit Lineage: DIII-D Train (Strict)
            </span>
          </div>
          <div className="bg-surface-elevated p-4 rounded border border-border">
            <span className="text-[10px] text-muted uppercase">
              Target Outlier Sensitivity
            </span>
            <div className="text-lg font-bold text-warning mt-1">
              {strategy === "robust"
                ? "Low (Preserved)"
                : strategy === "minmax"
                  ? "High (Clipping)"
                  : "Moderate"}
            </div>
            <span className="text-[11px] text-muted">
              Behavior on MAST Tail Currents
            </span>
          </div>
          <div className="bg-surface-elevated p-4 rounded border border-border">
            <span className="text-[10px] text-muted uppercase">
              Protocol Eligibility
            </span>
            <div className="text-lg font-bold text-positive mt-1">
              Compliant
            </div>
            <span className="text-[11px] text-muted">No MAST Labels Used</span>
          </div>
        </div>

        <div className="mt-4 p-4 rounded bg-surface-elevated/50 border border-border text-xs text-muted leading-relaxed">
          <strong>Scientific Principle:</strong> A normalization strategy must
          not be judged successful solely because it collapses source and target
          distributions together in a 2D plot. Preserving source predictive
          variance and physical relationships takes precedence over artificial
          alignment.
        </div>
      </div>
    </div>
  );
}
