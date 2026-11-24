"use client";

import * as d3 from "d3";
import React, { useEffect, useRef } from "react";

interface Props {
  fluxMap: number[][]; // (65, 65)
  title: string;
  machineId: "diii_d" | "mast";
  colorScheme?: "plasma" | "viridis" | "inferno";
  unavailableNotice?: string;
}

export const FluxContourMap: React.FC<Props> = ({
  fluxMap,
  title,
  machineId,
  colorScheme = "plasma",
  unavailableNotice,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (unavailableNotice || !fluxMap || fluxMap.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const H = fluxMap.length;
    const W = fluxMap[0].length;

    // Flatten to find min/max
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const v = fluxMap[r][c];
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      }
    }

    const span = maxVal - minVal || 1e-5;
    const interp =
      colorScheme === "viridis" ? d3.interpolateViridis : d3.interpolatePlasma;

    // Create 65x65 image data and scale to canvas
    const imgData = ctx.createImageData(W, H);
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const norm = (fluxMap[r][c] - minVal) / span;
        const color = d3.color(interp(norm))?.rgb() || { r: 0, g: 0, b: 0 };
        const idx = (r * W + c) * 4;
        imgData.data[idx] = color.r;
        imgData.data[idx + 1] = color.g;
        imgData.data[idx + 2] = color.b;
        imgData.data[idx + 3] = 255;
      }
    }

    // Render onto offscreen canvas then scale smoothly
    const offscreen = document.createElement("canvas");
    offscreen.width = W;
    offscreen.height = H;
    const offCtx = offscreen.getContext("2d");
    offCtx?.putImageData(imgData, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
  }, [fluxMap, colorScheme, unavailableNotice]);

  if (unavailableNotice) {
    return (
      <div className="w-full h-[280px] bg-surface rounded-lg border border-border p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-border pb-1">
          <span className="text-xs font-mono font-bold text-foreground">
            {title}
          </span>
          <span className="text-[10px] font-mono text-muted uppercase">
            {machineId}
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-8 h-8 rounded-full border border-warning/40 bg-warning/10 text-warning flex items-center justify-center mb-2 font-mono text-sm">
            !
          </div>
          <span className="text-xs font-mono text-muted max-w-[240px]">
            {unavailableNotice}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[280px] bg-surface rounded-lg border border-border p-4 flex flex-col">
      <div className="flex items-center justify-between border-b border-border pb-1.5 mb-2">
        <span className="text-xs font-mono font-bold text-foreground">
          {title}
        </span>
        <span className="text-[10px] font-mono text-muted uppercase">
          {machineId} (65x65)
        </span>
      </div>
      <div className="relative flex-1 w-full rounded overflow-hidden">
        <canvas
          ref={canvasRef}
          width={260}
          height={260}
          className="w-full h-full object-contain block"
        />
      </div>
    </div>
  );
};
