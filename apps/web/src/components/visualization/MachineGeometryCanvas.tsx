"use client";

import {
  ConductorGeometry,
  DiagnosticChord,
  MachineInfo,
} from "@/types/scientific";
import React, { useEffect, useRef, useState } from "react";

interface Props {
  machine: MachineInfo;
  conductors: ConductorGeometry[];
  chords: DiagnosticChord[];
}

export const MachineGeometryCanvas: React.FC<Props> = ({
  machine,
  conductors,
  chords,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 380, height: 480 });
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width || 380,
          height: entry.contentRect.height || 480,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const isD3D = machine.id === "diii_d";
  const primaryColor = isD3D ? "#38C5F4" : "#FB9162";

  // Scales maintaining physical aspect ratio in R-Z space
  const rMin = machine.grid_r_range[0] - 0.2;
  const rMax = machine.grid_r_range[1] + 0.2;
  const zMin = machine.grid_z_range[0] - 0.2;
  const zMax = machine.grid_z_range[1] + 0.2;

  const rSpan = rMax - rMin;
  const zSpan = zMax - zMin;

  const pad = 35;
  const availW = dimensions.width - pad * 2;
  const availH = dimensions.height - pad * 2;

  const scale = Math.min(availW / rSpan, availH / zSpan);

  const rToX = (r: number) => pad + (r - rMin) * scale;
  const zToY = (z: number) => dimensions.height - pad - (z - zMin) * scale;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[480px] bg-surface rounded-lg border border-border p-4 flex flex-col select-none"
    >
      <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-muted">
            Machine:{" "}
          </span>
          <span className="font-bold text-sm" style={{ color: primaryColor }}>
            {machine.name}
          </span>
          <span className="text-xs text-muted ml-2">({machine.type})</span>
        </div>
        <div className="text-xs font-mono text-muted">
          R0={machine.major_radius_m}m, a={machine.minor_radius_m}m
        </div>
      </div>

      <div className="relative flex-1">
        <svg
          width={dimensions.width}
          height={dimensions.height - 60}
          className="w-full h-full"
        >
          {/* Axis Grid lines */}
          <line
            x1={rToX(rMin)}
            y1={zToY(0)}
            x2={rToX(rMax)}
            y2={zToY(0)}
            stroke="#263142"
            strokeDasharray="3 3"
          />
          {/* Midplane marker */}
          <text
            x={rToX(rMax) - 5}
            y={zToY(0) - 5}
            fill="#8995A8"
            fontSize="10"
            textAnchor="end"
            fontFamily="monospace"
          >
            Z = 0 (Midplane)
          </text>

          {/* Major radius center line */}
          <line
            x1={rToX(machine.major_radius_m)}
            y1={zToY(zMin)}
            x2={rToX(machine.major_radius_m)}
            y2={zToY(zMax)}
            stroke="#263142"
            strokeDasharray="2 4"
          />

          {/* Conductors / Coils */}
          {conductors.map((c, idx) => {
            const isHovered = hoveredItem === c.coil_name;
            if (c.polygon_vertices && c.polygon_vertices.length > 2) {
              const pts = c.polygon_vertices
                .map(([r, z]) => `${rToX(r)},${zToY(z)}`)
                .join(" ");
              return (
                <polygon
                  key={idx}
                  points={pts}
                  fill={isHovered ? "#FFFFFF" : primaryColor}
                  fillOpacity={0.65}
                  stroke="#FFFFFF"
                  strokeWidth={isHovered ? 1.5 : 0.5}
                  onMouseEnter={() => setHoveredItem(c.coil_name)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="cursor-pointer transition-colors"
                />
              );
            }
            const cx = rToX(c.r_center);
            const cy = zToY(c.z_center);
            const w = c.width * scale;
            const h = c.height * scale;
            return (
              <rect
                key={idx}
                x={cx - w / 2}
                y={cy - h / 2}
                width={w}
                height={h}
                fill={isHovered ? "#FFFFFF" : primaryColor}
                fillOpacity={0.65}
                stroke="#FFFFFF"
                strokeWidth={isHovered ? 1.5 : 0.5}
                onMouseEnter={() => setHoveredItem(c.coil_name)}
                onMouseLeave={() => setHoveredItem(null)}
                className="cursor-pointer transition-colors"
              />
            );
          })}

          {/* Diagnostic Chords (Thomson Scattering points) */}
          {chords.map((ch, idx) => {
            const cx = rToX(ch.r_pos);
            const cy = zToY(ch.z_pos);
            return (
              <circle
                key={`ch_${idx}`}
                cx={cx}
                cy={cy}
                r={1.8}
                fill="#45D6AE"
                fillOpacity={0.8}
              />
            );
          })}
        </svg>

        {/* Hover metadata readout */}
        {hoveredItem && (
          <div className="absolute bottom-2 left-2 bg-surface-elevated/90 backdrop-blur border border-border px-2 py-1 rounded text-xs font-mono text-foreground">
            Coil: <span className="text-accent font-bold">{hoveredItem}</span>
          </div>
        )}
      </div>
    </div>
  );
};
