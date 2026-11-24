"use client";

export default function ProfilesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground">
          Thomson-Scattering Profile Explorer
        </h1>
        <p className="text-xs text-muted mt-1">
          Electron temperature (Te) and density (ne) profile analysis across
          core, edge, and divertor chords.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="text-sm font-bold text-source">
              DIII-D Thomson Scattering Geometry
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Vertical core laser + tangential edge system
            </p>
          </div>
          <div className="space-y-2 font-mono text-xs text-foreground">
            <div className="p-3 bg-surface-elevated rounded border border-border">
              <span className="text-muted block text-[10px] uppercase">
                Core System
              </span>
              <span className="font-bold">Vertical chord at R ≈ 1.94 m</span>
              <span className="text-muted block mt-1">
                Spans Z ∈ [-0.4, 0.8] m. Channel count varies between 59 and 138
                per campaign.
              </span>
            </div>
            <div className="p-3 bg-surface-elevated rounded border border-border">
              <span className="text-muted block text-[10px] uppercase">
                Edge / Divertor System
              </span>
              <span className="font-bold">Tangential system</span>
              <span className="text-muted block mt-1">
                Constant Z with varying R across the pedestal and divertor
                regions.
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="text-sm font-bold text-target">
              MAST Thomson Scattering Geometry
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Horizontal midplane laser
            </p>
          </div>
          <div className="space-y-2 font-mono text-xs text-foreground">
            <div className="p-3 bg-surface-elevated rounded border border-border">
              <span className="text-muted block text-[10px] uppercase">
                Midplane Laser
              </span>
              <span className="font-bold">Horizontal chord at Z = 0 m</span>
              <span className="text-muted block mt-1">
                Spans major radius R across the entire plasma cross-section with
                ~130 spatial channels.
              </span>
            </div>
            <div className="p-3 bg-surface-elevated rounded border border-border">
              <span className="text-muted block text-[10px] uppercase">
                Spatial Alignment Constraint
              </span>
              <span className="font-bold">Zero Z Upstream</span>
              <span className="text-muted block mt-1">
                FAIR-MAST Level 2 exposes exclusively R positions along the
                midplane.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-5 font-mono text-xs text-muted">
        <strong>Scientific Safeguard:</strong> Because the two machines possess
        orthogonal measurement geometries (vertical laser on DIII-D vs
        horizontal midplane on MAST), individual channel indices cannot be
        matched directly. The platform extracts spatial profile distribution
        quantiles ($q_{10}, q_{25}, q_{50}, q_{75}, q_{90}$, peak $T_e$, and
        spatial variance) to provide machine-invariant thermodynamic
        representations.
      </div>
    </div>
  );
}
