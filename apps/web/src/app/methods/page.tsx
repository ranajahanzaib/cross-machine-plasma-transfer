"use client";

export default function MethodsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground">
          Scientific Methodology & Mathematical Foundations
        </h1>
        <p className="text-xs text-muted mt-1">
          Detailed formulation of machine-invariant features, domain discrepancy
          metrics, and equilibrium baselines.
        </p>
      </div>

      <div className="space-y-6 font-mono text-xs">
        <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
          <h2 className="text-sm font-bold text-source">
            1. Geometry-Weighted Actuator Moments
          </h2>
          <p className="text-muted leading-relaxed">
            Because DIII-D features 18 shaping coils and MAST features 10
            poloidal coils, direct channel concatenation causes severe
            structural mismatch. We define geometry-weighted moments:
          </p>
          <div className="bg-surface-elevated p-3 rounded border border-border text-foreground space-y-1">
            <div>
              Radial Current Centroid: R_moment = ∑ (I_i · R_i) / (∑ |I_i| + ε)
            </div>
            <div>
              Vertical Current Centroid: Z_moment = ∑ (I_i · Z_i) / (∑ |I_i| +
              ε)
            </div>
            <div>
              Up-Down Asymmetry: A_ud = (I_upper − I_lower) / (|I_upper| +
              |I_lower| + ε)
            </div>
            <div>
              Quadrupole Moment: Q_moment = ∑ (I_i · [2·Z_i² − R_i²]) / (∑ |I_i|
              + ε)
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
          <h2 className="text-sm font-bold text-accent">
            2. Multivariate Discrepancy (Maximum Mean Discrepancy)
          </h2>
          <p className="text-muted leading-relaxed">
            Maximum Mean Discrepancy (MMD) evaluates the distance between
            distributions P (DIII-D) and Q (MAST) mapped into a Reproducing
            Kernel Hilbert Space (RKHS) with an RBF kernel:
          </p>
          <div className="bg-surface-elevated p-3 rounded border border-border text-foreground">
            MMD²(P, Q) = E[k(x, x')] + E[k(y, y')] − 2·E[k(x, y)]
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
          <h2 className="text-sm font-bold text-positive">
            3. Correlation Alignment (CORAL)
          </h2>
          <p className="text-muted leading-relaxed">
            CORAL aligns the second-order statistics (covariance matrices) of
            the target features C_T to the source features C_S using
            Tikhonov-regularized whitening and recoloring matrices:
          </p>
          <div className="bg-surface-elevated p-3 rounded border border-border text-foreground">
            X_T_adapted = (X_T − μ_T) · (C_T + γ·I)^(-1/2) · (C_S + γ·I)^(1/2) +
            μ_S
          </div>
        </div>
      </div>
    </div>
  );
}
