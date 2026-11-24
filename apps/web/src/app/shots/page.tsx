"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ShotsPage() {
  const [shots, setShots] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [machineFilter, setMachineFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/shots")
      .then((r) => r.json())
      .then((d) => setShots(d))
      .catch((err) => console.error(err));
  }, []);

  const filtered = shots.filter((s) => {
    const matchesSearch = s.shot_id
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesMachine =
      machineFilter === "all" || s.machine === machineFilter;
    return matchesSearch && matchesMachine;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Experimental Shot Browser
          </h1>
          <p className="text-xs text-muted mt-1">
            Searchable catalog of individual experimental discharges across
            DIII-D and MAST.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <input
            type="text"
            placeholder="Search shot ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surface border border-border px-3 py-1.5 rounded text-foreground focus:outline-none focus:border-source"
          />

          <div className="flex bg-surface-elevated p-1 rounded border border-border">
            <button
              onClick={() => setMachineFilter("all")}
              className={`px-2.5 py-0.5 rounded ${
                machineFilter === "all"
                  ? "bg-source text-background font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setMachineFilter("diii_d")}
              className={`px-2.5 py-0.5 rounded ${
                machineFilter === "diii_d"
                  ? "bg-source text-background font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              DIII-D
            </button>
            <button
              onClick={() => setMachineFilter("mast")}
              className={`px-2.5 py-0.5 rounded ${
                machineFilter === "mast"
                  ? "bg-target text-background font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              MAST
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto font-mono text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted uppercase text-[10px] bg-surface-elevated/50">
                <th className="py-2.5 px-4">Shot Identifier</th>
                <th className="py-2.5 px-4">Machine</th>
                <th className="py-2.5 px-4">Config / Split</th>
                <th className="py-2.5 px-4">EFIT Frames</th>
                <th className="py-2.5 px-4">Discharge Window</th>
                <th className="py-2.5 px-4">Peak Ip</th>
                <th className="py-2.5 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground">
              {filtered.map((s, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-surface-elevated/50 transition-colors"
                >
                  <td className="py-2.5 px-4 font-bold text-foreground">
                    {s.shot_id}
                  </td>
                  <td className="py-2.5 px-4">
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
                  <td className="py-2.5 px-4 text-muted">{s.config_name}</td>
                  <td className="py-2.5 px-4">{s.num_efit_times}</td>
                  <td className="py-2.5 px-4 text-muted">
                    {s.t_min_ms.toFixed(0)} - {s.t_max_ms.toFixed(0)} ms
                  </td>
                  <td className="py-2.5 px-4">
                    {s.ip_max_ka ? `${s.ip_max_ka.toFixed(1)} kA` : "N/A"}
                  </td>
                  <td className="py-2.5 px-4">
                    <Link
                      href={`/shots/${s.machine}/${s.shot_id}`}
                      className="inline-flex items-center space-x-1 text-source hover:underline font-semibold"
                    >
                      <span>Inspect</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
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
