"use client";

import { Download } from "lucide-react";
import { useState } from "react";

export default function ReportsPage() {
  const [downloading, setDownloading] = useState(false);

  const downloadReport = () => {
    setDownloading(true);
    fetch("/api/reports/markdown")
      .then((res) => res.text())
      .then((text) => {
        const blob = new Blob([text], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "cross_machine_plasma_transfer_report.md";
        a.click();
        setDownloading(false);
      })
      .catch((err) => {
        console.error(err);
        setDownloading(false);
      });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Research Report Generation
          </h1>
          <p className="text-xs text-muted mt-1">
            Deterministic research reports summarizing dataset provenance,
            domain shift statistics, and baseline evaluations.
          </p>
        </div>

        <button
          onClick={downloadReport}
          disabled={downloading}
          className="flex items-center space-x-2 px-4 py-2 rounded bg-source hover:bg-source/80 text-background font-mono font-bold text-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>
            {downloading ? "Generating..." : "Export Research Report (.md)"}
          </span>
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 font-mono text-xs space-y-4">
        <h2 className="text-sm font-bold text-foreground">
          Report Contents & Synthesis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted">
          <div className="p-3 bg-surface-elevated rounded border border-border">
            1. Core Research Question & Tokamak Configurations
          </div>
          <div className="p-3 bg-surface-elevated rounded border border-border">
            2. Dataset Provenance & Pinned Revisions
          </div>
          <div className="p-3 bg-surface-elevated rounded border border-border">
            3. Machine Geometry & Diagnostic Harmonization
          </div>
          <div className="p-3 bg-surface-elevated rounded border border-border">
            4. Univariate & Multivariate Domain Shift Quantifications (MMD,
            ROC-AUC)
          </div>
          <div className="p-3 bg-surface-elevated rounded border border-border">
            5. Baseline Model Evaluations & DIII-D Supervised Reconstruction
          </div>
          <div className="p-3 bg-surface-elevated rounded border border-border">
            6. Protocol Compliance & Leakage Prevention Audit
          </div>
        </div>
      </div>
    </div>
  );
}
