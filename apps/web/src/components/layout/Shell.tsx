"use client";

import {
  Activity,
  BarChart2,
  Compass,
  Cpu,
  Database,
  FileText,
  GitBranch,
  Layers,
  ShieldAlert,
  Sliders,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Compass },
  { href: "/feature-space", label: "Feature Space", icon: Layers },
  { href: "/machines", label: "Machine Geometry", icon: Cpu },
  { href: "/signals", label: "Signals", icon: Sliders },
  { href: "/profiles", label: "Profiles", icon: Activity },
  { href: "/domain-shift", label: "Domain Shift", icon: BarChart2 },
  { href: "/normalization", label: "Normalization", icon: Sliders },
  { href: "/adaptation", label: "Adaptation Lab", icon: GitBranch },
  { href: "/experiments", label: "Experiments", icon: Layers },
  { href: "/predictions", label: "Predictions", icon: Activity },
  { href: "/uncertainty", label: "Uncertainty", icon: ShieldAlert },
  { href: "/out-of-distribution", label: "OOD Detection", icon: ShieldAlert },
  { href: "/shots", label: "Shots", icon: Database },
  { href: "/datasets", label: "Datasets", icon: Database },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/methods", label: "Methods", icon: Compass },
  { href: "/settings", label: "Settings", icon: Sliders },
];

export const Shell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 bg-surface border-r border-border flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center space-x-3">
            <div className="w-7 h-7 rounded bg-gradient-to-tr from-source to-accent flex items-center justify-center font-mono font-bold text-background text-xs shadow-md">
              ψ
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-foreground">
                Plasma Transfer
              </h1>
              <p className="text-[10px] font-mono text-muted">
                DIII-D ⟷ MAST Transfer
              </p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-surface-elevated text-source border border-border"
                      : "text-muted hover:text-foreground hover:bg-surface-elevated/50"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${isActive ? "text-source" : "text-muted"}`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer protocol badge */}
        <div className="p-3 border-t border-border bg-surface-elevated/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase text-muted">
              Research Protocol
            </span>
            <span className="w-2 h-2 rounded-full bg-positive animate-pulse" />
          </div>
          <div className="bg-positive/10 border border-positive/30 rounded px-2 py-1 text-[11px] font-mono text-positive">
            Protocol B: Label-Free Adaptation
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top contextual bar */}
        <header className="h-12 border-b border-border bg-surface/50 backdrop-blur px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs text-muted">
              Scientific Instrument:
            </span>
            <span className="text-xs font-semibold text-foreground">
              Cross-Machine Plasma Transfer Analysis
            </span>
          </div>
          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-source inline-block" />
              <span className="text-muted">Source: DIII-D</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-target inline-block" />
              <span className="text-muted">Target: MAST</span>
            </span>
          </div>
        </header>

        {/* Page body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
};
