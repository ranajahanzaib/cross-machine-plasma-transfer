"use client";

import { MachineGeometryCanvas } from "@/components/visualization/MachineGeometryCanvas";
import { useEffect, useState } from "react";

export default function MachinesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/machines/diii_d/geometry").then((r) => r.json()),
      fetch("/api/machines/mast/geometry").then((r) => r.json()),
    ])
      .then(([geomD3D, geomMAST]) => {
        setData({ geomD3D, geomMAST });
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
        Loading machine geometry specifications...
      </div>
    );
  }

  const { geomD3D, geomMAST } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground">
          Machine Geometry Comparison
        </h1>
        <p className="text-xs text-muted mt-1">
          Direct physical R-Z comparison between conventional aspect ratio
          DIII-D and spherical tokamak MAST.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <MachineGeometryCanvas
            machine={geomD3D.machine}
            conductors={geomD3D.conductors}
            chords={geomD3D.chords}
          />
        </div>
        <div>
          <MachineGeometryCanvas
            machine={geomMAST.machine}
            conductors={geomMAST.conductors}
            chords={geomMAST.chords}
          />
        </div>
      </div>

      {/* Comparison metrics table */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-sm font-bold text-foreground mb-3">
          Verified Machine Characteristics
        </h2>
        <div className="overflow-x-auto font-mono text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted uppercase text-[10px]">
                <th className="py-2 px-3">Parameter</th>
                <th className="py-2 px-3 text-source">DIII-D (Source)</th>
                <th className="py-2 px-3 text-target">MAST (Target)</th>
                <th className="py-2 px-3">Physical Implication</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground">
              <tr>
                <td className="py-2 px-3 font-semibold text-muted">
                  Machine Concept
                </td>
                <td className="py-2 px-3">Conventional Tokamak</td>
                <td className="py-2 px-3">Spherical Tokamak</td>
                <td className="py-2 px-3 text-muted">
                  Different magnetic field topology and curvature
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-muted">
                  Aspect Ratio (R0 / a)
                </td>
                <td className="py-2 px-3">2.5 (1.67m / 0.67m)</td>
                <td className="py-2 px-3">1.3 (0.85m / 0.65m)</td>
                <td className="py-2 px-3 text-muted">
                  MAST has tight spherical geometry with minimal inboard space
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-muted">
                  Shaping Coils
                </td>
                <td className="py-2 px-3">18 F-coils (kA·turn)</td>
                <td className="py-2 px-3">10 P-coils (kA·turn)</td>
                <td className="py-2 px-3 text-muted">
                  Disparate actuator channels requiring invariant moment mapping
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-muted">
                  Flux Map Sign Convention
                </td>
                <td className="py-2 px-3">Axis is Minimum</td>
                <td className="py-2 px-3">Axis is Maximum</td>
                <td className="py-2 px-3 text-muted">
                  Opposite numerical convention normalized by competition scorer
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
