"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

export default function ShotDetailPage({
  params,
}: {
  params: Promise<{ machine: string; id: string }>;
}) {
  const { machine, id } = use(params);
  const [shots, setShots] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/shots")
      .then((r) => r.json())
      .then((d) => setShots(d))
      .catch((err) => console.error(err));
  }, []);

  const shot = shots.find((s) => s.shot_id === id || s.shot_id.includes(id));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center space-x-3">
        <Link
          href="/shots"
          className="p-2 rounded bg-surface hover:bg-surface-elevated text-muted hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Discharge Analysis: {id}
          </h1>
          <p className="text-xs text-muted">Machine: {machine.toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="bg-surface rounded-lg border border-border p-4">
          <span className="text-[10px] text-muted uppercase">
            Machine Identifier
          </span>
          <div className="text-lg font-bold text-foreground mt-1">
            {machine.toUpperCase()}
          </div>
        </div>
        <div className="bg-surface rounded-lg border border-border p-4">
          <span className="text-[10px] text-muted uppercase">
            Configuration
          </span>
          <div className="text-lg font-bold text-source mt-1">
            {shot?.config_name || "Experimental"}
          </div>
        </div>
        <div className="bg-surface rounded-lg border border-border p-4">
          <span className="text-[10px] text-muted uppercase">
            EFIT Time-slices
          </span>
          <div className="text-lg font-bold text-accent mt-1">
            {shot?.num_efit_times || "Loaded"} frames
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-5 space-y-3 font-mono text-xs">
        <h2 className="text-sm font-bold text-foreground">
          Discharge Metadata & Time Base
        </h2>
        <div className="space-y-2 text-muted">
          <div>
            Time Span:{" "}
            <span className="text-foreground">
              {shot?.t_min_ms.toFixed(1)} ms to {shot?.t_max_ms.toFixed(1)} ms
            </span>
          </div>
          <div>
            Peak Plasma Current:{" "}
            <span className="text-foreground">
              {shot?.ip_max_ka
                ? `${shot.ip_max_ka.toFixed(1)} kA`
                : "Extracted"}
            </span>
          </div>
          <div>
            Supervision:{" "}
            <span
              className={shot?.has_labels ? "text-positive" : "text-warning"}
            >
              {shot?.has_labels
                ? "Supervised Reference Present"
                : "Withheld Target Evaluation"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
