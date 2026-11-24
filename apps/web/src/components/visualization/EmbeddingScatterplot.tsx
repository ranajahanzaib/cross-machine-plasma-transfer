"use client";

import { EmbeddingPoint } from "@/types/scientific";
import * as d3 from "d3";
import React, { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  points: EmbeddingPoint[];
  projection: "umap" | "pca" | "umap_adapted";
  colorBy: "machine" | "plasma_current_ka" | "ood_score";
  onSelectPoint?: (point: EmbeddingPoint | null) => void;
  selectedPointId?: string | null;
}

export const EmbeddingScatterplot: React.FC<Props> = ({
  points,
  projection,
  colorBy,
  onSelectPoint,
  selectedPointId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<EmbeddingPoint | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width || 800,
          height: entry.contentRect.height || 500,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute Scales
  const { xScale, yScale, colorScale } = useMemo(() => {
    const getX = (p: EmbeddingPoint) =>
      projection === "pca"
        ? p.pca_x
        : projection === "umap"
          ? p.umap_x
          : p.umap_adapted_x;
    const getY = (p: EmbeddingPoint) =>
      projection === "pca"
        ? p.pca_y
        : projection === "umap"
          ? p.umap_y
          : p.umap_adapted_y;

    const xExt = d3.extent(points, getX) as [number, number];
    const yExt = d3.extent(points, getY) as [number, number];

    const padX = (xExt[1] - xExt[0]) * 0.08 || 1;
    const padY = (yExt[1] - yExt[0]) * 0.08 || 1;

    const xS = d3
      .scaleLinear()
      .domain([xExt[0] - padX, xExt[1] + padX])
      .range([40, dimensions.width - 40]);

    const yS = d3
      .scaleLinear()
      .domain([yExt[0] - padY, yExt[1] + padY])
      .range([dimensions.height - 40, 40]);

    // Color scales
    let cS: any;
    if (colorBy === "machine") {
      cS = (p: EmbeddingPoint) =>
        p.machine === "diii_d" ? "#38C5F4" : "#FB9162";
    } else if (colorBy === "plasma_current_ka") {
      const ext = d3.extent(points, (p) => p.plasma_current_ka) as [
        number,
        number,
      ];
      cS = d3.scaleSequential(d3.interpolateViridis).domain(ext);
    } else {
      cS = (p: EmbeddingPoint) => {
        if (p.ood_category === "Within Source Support") return "#45D6AE";
        if (p.ood_category === "Near Support Boundary") return "#F2C66D";
        return "#F16E87";
      };
    }

    return { xScale: xS, yScale: yS, colorScale: cS };
  }, [points, projection, colorBy, dimensions]);

  // Render on 2D Canvas with zoom/pan
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    const getX = (p: EmbeddingPoint) =>
      projection === "pca"
        ? p.pca_x
        : projection === "umap"
          ? p.umap_x
          : p.umap_adapted_x;
    const getY = (p: EmbeddingPoint) =>
      projection === "pca"
        ? p.pca_y
        : projection === "umap"
          ? p.umap_y
          : p.umap_adapted_y;

    // Background grid
    ctx.strokeStyle = "#171F2C";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < dimensions.width; x += 60) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, dimensions.height);
    }
    for (let y = 0; y < dimensions.height; y += 60) {
      ctx.moveTo(0, y);
      ctx.lineTo(dimensions.width, y);
    }
    ctx.stroke();

    // Render points
    points.forEach((p) => {
      const cx = transform.applyX(xScale(getX(p)));
      const cy = transform.applyY(yScale(getY(p)));

      const isSelected = p.id === selectedPointId;
      const isHovered = hoveredPoint?.id === p.id;
      const radius = isSelected ? 6.5 : isHovered ? 5.5 : 3.5;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle =
        typeof colorScale === "function" ? colorScale(p) : colorScale;
      ctx.globalAlpha = isSelected || isHovered ? 1.0 : 0.75;
      ctx.fill();

      if (isSelected || isHovered) {
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    ctx.globalAlpha = 1.0;
  }, [
    points,
    projection,
    colorBy,
    dimensions,
    transform,
    xScale,
    yScale,
    colorScale,
    selectedPointId,
    hoveredPoint,
  ]);

  // Interactive mouse hover and selection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const getX = (p: EmbeddingPoint) =>
      projection === "pca"
        ? p.pca_x
        : projection === "umap"
          ? p.umap_x
          : p.umap_adapted_x;
    const getY = (p: EmbeddingPoint) =>
      projection === "pca"
        ? p.pca_y
        : projection === "umap"
          ? p.umap_y
          : p.umap_adapted_y;

    let closest: EmbeddingPoint | null = null;
    let minDist = 15; // 15px hover radius

    for (const p of points) {
      const cx = transform.applyX(xScale(getX(p)));
      const cy = transform.applyY(yScale(getY(p)));
      const dist = Math.hypot(cx - mx, cy - my);
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
    }
    setHoveredPoint(closest);
  };

  const handleClick = () => {
    if (hoveredPoint && onSelectPoint) {
      onSelectPoint(hoveredPoint);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[460px] bg-surface rounded-lg border border-border overflow-hidden select-none"
    >
      {/* Top Controls Bar */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center space-x-3 pointer-events-auto bg-surface-elevated/90 backdrop-blur px-3 py-1.5 rounded border border-border text-xs text-foreground">
          <span className="font-mono text-muted uppercase">Coord:</span>
          <span className="font-mono font-bold text-accent uppercase">
            {projection}
          </span>
          <span className="text-muted">|</span>
          <span className="font-mono text-muted">Total:</span>
          <span className="font-mono text-foreground font-semibold">
            {points.length}
          </span>
        </div>

        <div className="flex items-center space-x-2 pointer-events-auto">
          <div className="flex items-center space-x-3 bg-surface-elevated/90 backdrop-blur px-3 py-1.5 rounded border border-border text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-source inline-block" />
              <span className="text-foreground font-mono">DIII-D (Source)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-target inline-block" />
              <span className="text-foreground font-mono">MAST (Target)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scientific Canvas */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="cursor-crosshair w-full h-full block"
      />

      {/* Hover Inspection HUD */}
      {hoveredPoint && (
        <div className="absolute bottom-4 left-4 bg-surface-elevated/95 backdrop-blur border border-border rounded p-3 text-xs shadow-xl pointer-events-none z-20 font-mono">
          <div className="flex items-center space-x-2 mb-1">
            <span
              className={`w-2 h-2 rounded-full ${
                hoveredPoint.machine === "diii_d" ? "bg-source" : "bg-target"
              }`}
            />
            <span className="font-bold text-foreground">
              {hoveredPoint.machine === "diii_d" ? "DIII-D" : "MAST"} •{" "}
              {hoveredPoint.shot_id}
            </span>
          </div>
          <div className="text-muted space-y-0.5">
            <div>
              t:{" "}
              <span className="text-foreground">
                {hoveredPoint.timestamp_ms.toFixed(1)} ms
              </span>
            </div>
            <div>
              Ip:{" "}
              <span className="text-foreground">
                {hoveredPoint.plasma_current_ka.toFixed(1)} kA
              </span>
            </div>
            <div>
              OOD Risk:{" "}
              <span className="text-warning">
                {hoveredPoint.ood_score.toFixed(2)} ({hoveredPoint.ood_category}
                )
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
