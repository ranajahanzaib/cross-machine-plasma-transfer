"use client";

import { DomainShiftMetrics } from "@/types/scientific";
import { useEffect, useState } from "react";

export default function DomainShiftPage() {
  const [data, setData] = useState<DomainShiftMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/domain-shift")
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
        Computing statistical domain shift discrepancies...
      </div>
    );
  }

  const { mmd, domain_classifier, univariate } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground">
          Quantitative Domain Shift Analysis
        </h1>
        <p className="text-xs text-muted mt-1">
          Univariate metrics (Wasserstein distance, KS-statistic, overlap) and
          multivariate discrepancy (MMD, domain discriminator).
        </p>
      </div>

      {/* Multivariate KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <div className="bg-surface rounded-lg border border-border p-4">
          <span className="text-[10px] text-muted uppercase">
            Maximum Mean Discrepancy (MMD)
          </span>
          <div className="text-2xl font-bold text-foreground mt-1">
            {mmd.toFixed(3)}
          </div>
          <p className="text-[11px] text-muted mt-2">
            Non-parametric distance between RKHS embeddings of source and target
            feature distributions.
          </p>
        </div>

        <div className="bg-surface rounded-lg border border-border p-4">
          <span className="text-[10px] text-muted uppercase">
            Domain Classifier ROC-AUC
          </span>
          <div className="text-2xl font-bold text-warning mt-1">
            {domain_classifier.mean_roc_auc.toFixed(2)}
          </div>
          <p className="text-[11px] text-muted mt-2">
            Perfect separability (AUC = 1.0) under raw shared inputs
            demonstrates pronounced distribution shift.
          </p>
        </div>

        <div className="bg-surface rounded-lg border border-border p-4">
          <span className="text-[10px] text-muted uppercase">
            Samples Evaluated
          </span>
          <div className="text-2xl font-bold text-accent mt-1">
            {domain_classifier.sample_counts.source} DIII-D /{" "}
            {domain_classifier.sample_counts.target} MAST
          </div>
          <p className="text-[11px] text-muted mt-2">
            Shot-stratified 3-fold cross-validation on real experimental
            time-slices.
          </p>
        </div>
      </div>

      {/* Ranked Feature Importance */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-sm font-bold text-foreground mb-3">
          Top Driving Features of Cross-Machine Domain Shift
        </h2>
        <div className="space-y-2 font-mono text-xs">
          {domain_classifier.feature_importance_ranking
            .slice(0, 8)
            .map((f, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <span className="w-6 text-muted text-right">{idx + 1}.</span>
                <span className="w-56 text-foreground font-semibold truncate">
                  {f.feature}
                </span>
                <div className="flex-1 bg-surface-elevated rounded-full h-2 overflow-hidden border border-border">
                  <div
                    className="bg-accent h-full rounded-full"
                    style={{ width: `${Math.min(100, f.importance * 400)}%` }}
                  />
                </div>
                <span className="w-16 text-muted text-right">
                  {(f.importance * 100).toFixed(1)}%
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Univariate Shift Table */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-sm font-bold text-foreground mb-3">
          Univariate Distance Metrics by Feature
        </h2>
        <div className="overflow-x-auto font-mono text-xs max-h-96">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted uppercase text-[10px] sticky top-0 bg-surface">
                <th className="py-2 px-3">Feature Name</th>
                <th className="py-2 px-3">Wasserstein (EMD)</th>
                <th className="py-2 px-3">KS Statistic</th>
                <th className="py-2 px-3">Std Mean Diff</th>
                <th className="py-2 px-3">Distribution Overlap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground">
              {Object.entries(univariate).map(
                ([fname, u]: [string, any], idx) => (
                  <tr key={idx} className="hover:bg-surface-elevated/50">
                    <td className="py-2 px-3 font-semibold text-muted">
                      {fname}
                    </td>
                    <td className="py-2 px-3">
                      {u.wasserstein_distance.toFixed(3)}
                    </td>
                    <td className="py-2 px-3">{u.ks_statistic.toFixed(3)}</td>
                    <td className="py-2 px-3">
                      {u.std_mean_difference.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 font-bold text-positive">
                      {(u.distribution_overlap * 100).toFixed(1)}%
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
