"use client";

import { useEffect, useState } from "react";

export default function DatasetsPage() {
  const [shots, setShots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shots")
      .then((r) => r.json())
      .then((d) => {
        setShots(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center font-mono text-xs text-muted">
        Loading dataset inventory...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground">
          Experimental Tokamak Datasets & Inventory
        </h1>
        <p className="text-xs text-muted mt-1">
          Hugging Face Fusion Equilibrium Challenge real experimental shot files
          and execution profiles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="bg-surface rounded-lg border border-border p-4">
          <span className="text-[10px] text-muted uppercase">
            Primary Repository
          </span>
          <div className="text-sm font-bold text-foreground mt-1">
            Sophelio/fusion-equilibrium-challenge
          </div>
          <span className="text-[11px] text-muted block mt-1">
            Revision: 1e280905 (Pinned)
          </span>
        </div>
        <div className="bg-surface rounded-lg border border-border p-4">
          <span className="text-[10px] text-muted uppercase">
            Active Profile
          </span>
          <div className="text-sm font-bold text-positive mt-1">
            Quickstart (Real Experimental Data)
          </div>
          <span className="text-[11px] text-muted block mt-1">
            Deterministic bounded sample
          </span>
        </div>
        <div className="bg-surface rounded-lg border border-border p-4">
          <span className="text-[10px] text-muted uppercase">
            Target Leakage Protection
          </span>
          <div className="text-sm font-bold text-source mt-1">
            ProtocolGuard Active
          </div>
          <span className="text-[11px] text-muted block mt-1">
            Zero MAST labels admitted
          </span>
        </div>
      </div>

      {/* Shots Inventory Table */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-sm font-bold text-foreground mb-3">
          Loaded Experimental Shot Files
        </h2>
        <div className="overflow-x-auto font-mono text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted uppercase text-[10px]">
                <th className="py-2 px-3">Shot ID</th>
                <th className="py-2 px-3">Machine</th>
                <th className="py-2 px-3">Config Split</th>
                <th className="py-2 px-3">EFIT Frames</th>
                <th className="py-2 px-3">Time Range (ms)</th>
                <th className="py-2 px-3">Peak Ip (kA)</th>
                <th className="py-2 px-3">Supervision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground">
              {shots.map((s, idx) => (
                <tr key={idx} className="hover:bg-surface-elevated/50">
                  <td className="py-2 px-3 font-bold text-foreground">
                    {s.shot_id}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.machine === "diii_d"
                          ? "bg-source/20 text-source"
                          : "bg-target/20 text-target"
                      }`}
                    >
                      {s.machine === "diii_d" ? "DIII-D" : "MAST"}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-muted">{s.config_name}</td>
                  <td className="py-2 px-3">{s.num_efit_times}</td>
                  <td className="py-2 px-3">
                    {s.t_min_ms.toFixed(0)} - {s.t_max_ms.toFixed(0)}
                  </td>
                  <td className="py-2 px-3">
                    {s.ip_max_ka ? s.ip_max_ka.toFixed(1) : "N/A"}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={s.has_labels ? "text-positive" : "text-muted"}
                    >
                      {s.has_labels ? "Supervision (Train)" : "Withheld (Test)"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
