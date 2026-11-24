"use client";

import { useEffect, useState } from "react";

export default function SignalsPage() {
  const [shots, setShots] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/shots")
      .then((r) => r.json())
      .then((d) => setShots(d))
      .catch((err) => console.error(err));
  }, []);

  const d3dShots = shots.filter((s) => s.machine === "diii_d");
  const mastShots = shots.filter((s) => s.machine === "mast");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground">
          Coil-Current Distribution Laboratory
        </h1>
        <p className="text-xs text-muted mt-1">
          Comparing actuator channel dynamics, plasma current evolution, and
          geometry-weighted current moments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DIII-D Signals */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <div className="border-b border-border pb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-source">
              DIII-D Actuator Geometry (18 F-Coils)
            </h2>
            <span className="text-[10px] font-mono text-muted">kA·turn</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">
                Total Available Shaping Channels:
              </span>
              <span className="text-foreground font-bold">
                18 (F1A-F9A, F1B-F9B)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Typical Current Range:</span>
              <span className="text-foreground font-bold">
                ±200 kA·turn (Extremes ±580)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Central Solenoid (ECOILA):</span>
              <span className="text-foreground font-bold">
                kA (Lumped turn convention)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Observed Shots in Corpus:</span>
              <span className="text-foreground font-bold">
                {d3dShots.length} Loaded
              </span>
            </div>
          </div>
        </div>

        {/* MAST Signals */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <div className="border-b border-border pb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-target">
              MAST Actuator Geometry (10 P-Coils)
            </h2>
            <span className="text-[10px] font-mono text-muted">kA·turn</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">
                Total Available Shaping Channels:
              </span>
              <span className="text-foreground font-bold">
                10 (P2-P6 Lower & Upper)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Typical Current Range:</span>
              <span className="text-foreground font-bold">±170 kA·turn</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">
                Central Solenoid (sol_current):
              </span>
              <span className="text-foreground font-bold">kA</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Observed Shots in Corpus:</span>
              <span className="text-foreground font-bold">
                {mastShots.length} Loaded
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-5 font-mono text-xs text-muted leading-relaxed">
        <strong>Scientific Method:</strong> Raw actuator coil channels cannot be
        compared one-to-one because their physical locations and turn counts are
        distinct. The platform maps both machines onto{" "}
        <strong>geometry-weighted moments</strong> (radial centroid, vertical
        centroid, up-down asymmetry, and quadrupole moment) to preserve true
        invariant magnetic force distributions.
      </div>
    </div>
  );
}
