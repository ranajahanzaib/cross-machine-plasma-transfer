"use client";

import { Save } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [profile, setProfile] = useState("quickstart");
  const [protocol, setProtocol] = useState("protocol_b");
  const [hardware, setHardware] = useState("auto");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground">
          Platform Configuration & Research Settings
        </h1>
        <p className="text-xs text-muted mt-1">
          Execution parameters, dataset profiles, and research protocol
          enforcement.
        </p>
      </div>

      <div className="bg-surface rounded-xl border border-border p-5 space-y-6 max-w-2xl font-mono text-xs">
        <div>
          <label className="font-bold text-foreground block mb-1">
            Active Research Protocol
          </label>
          <select
            value={protocol}
            onChange={(e) => setProtocol(e.target.value)}
            className="w-full bg-surface-elevated border border-border p-2 rounded text-foreground focus:outline-none focus:border-source"
          >
            <option value="protocol_a">
              Protocol A: Strict Source-Only (Inductive Zero-Shot)
            </option>
            <option value="protocol_b">
              Protocol B: Challenge-Compatible Label-Free Adaptation
            </option>
            <option value="protocol_c">
              Protocol C: Independent Labelled MAST Research (FAIR-MAST)
            </option>
          </select>
          <span className="text-[11px] text-muted block mt-1">
            Governs label accessibility and prohibits target leakage into
            feature engineering.
          </span>
        </div>

        <div>
          <label className="font-bold text-foreground block mb-1">
            Dataset Profile
          </label>
          <select
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            className="w-full bg-surface-elevated border border-border p-2 rounded text-foreground focus:outline-none focus:border-source"
          >
            <option value="quickstart">
              Quickstart (Real Bounded Experimental Sample)
            </option>
            <option value="research">
              Research Sample (Extended Discharges)
            </option>
            <option value="full">Full Corpus (98 GB Streaming)</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-foreground block mb-1">
            Hardware Backend
          </label>
          <select
            value={hardware}
            onChange={(e) => setHardware(e.target.value)}
            className="w-full bg-surface-elevated border border-border p-2 rounded text-foreground focus:outline-none focus:border-source"
          >
            <option value="auto">
              Auto-Detect (Apple Silicon MPS / CUDA / CPU)
            </option>
            <option value="cpu">CPU Only (Deterministic Float64)</option>
            <option value="mps">Apple Silicon MPS</option>
          </select>
        </div>

        <div className="pt-3 border-t border-border flex justify-end">
          <button className="flex items-center space-x-2 px-4 py-2 rounded bg-source hover:bg-source/80 text-background font-bold">
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
}
