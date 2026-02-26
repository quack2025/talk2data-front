/**
 * DendrogramChart — SVG-based dendrogram visualization for hierarchical clustering.
 *
 * Renders pre-computed dendrogram data (icoord/dcoord from scipy) as an SVG chart.
 * Each link is drawn as a U-shaped polyline connecting two child clusters.
 *
 * Sprint 14b (Dendrogram visualization)
 */

import { useMemo } from 'react';
import type { DendrogramData } from '@/types/segmentation';

interface DendrogramChartProps {
  data: DendrogramData;
  width?: number;
  height?: number;
}

// Map scipy color codes to actual CSS colors
const COLOR_MAP: Record<string, string> = {
  C0: '#1f77b4',
  C1: '#ff7f0e',
  C2: '#2ca02c',
  C3: '#d62728',
  C4: '#9467bd',
  C5: '#8c564b',
  C6: '#e377c2',
  C7: '#7f7f7f',
  C8: '#bcbd22',
  C9: '#17becf',
  b: '#1f77b4',
  g: '#2ca02c',
  r: '#d62728',
  c: '#17becf',
  m: '#9467bd',
  y: '#bcbd22',
  k: '#374151',
};

function resolveColor(c: string): string {
  return COLOR_MAP[c] || c || '#6b7280';
}

export function DendrogramChart({ data, width = 600, height = 320 }: DendrogramChartProps) {
  const { icoord, dcoord, ivl, color_list } = data;

  const svgContent = useMemo(() => {
    if (!icoord.length) return null;

    // Find data bounds
    let xMin = Infinity, xMax = -Infinity;
    let yMin = 0, yMax = -Infinity;
    for (const row of icoord) {
      for (const v of row) {
        if (v < xMin) xMin = v;
        if (v > xMax) xMax = v;
      }
    }
    for (const row of dcoord) {
      for (const v of row) {
        if (v > yMax) yMax = v;
      }
    }

    const pad = { top: 20, right: 20, bottom: 60, left: 60 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const scaleX = (v: number) => pad.left + ((v - xMin) / (xMax - xMin || 1)) * plotW;
    // Dendrogram: y=0 at bottom (leaves), max distance at top
    const scaleY = (v: number) => pad.top + plotH - (v / (yMax || 1)) * plotH;

    // Draw U-shaped links: each has 4 points [left-bottom, left-top, right-top, right-bottom]
    const links = icoord.map((xCoords, i) => {
      const yCoords = dcoord[i];
      const color = resolveColor(color_list[i]);
      // 3 line segments: left vertical, horizontal bar, right vertical
      const points = [
        `${scaleX(xCoords[0])},${scaleY(yCoords[0])}`,
        `${scaleX(xCoords[1])},${scaleY(yCoords[1])}`,
        `${scaleX(xCoords[2])},${scaleY(yCoords[2])}`,
        `${scaleX(xCoords[3])},${scaleY(yCoords[3])}`,
      ].join(' ');
      return (
        <polyline
          key={i}
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      );
    });

    // Y-axis ticks (distance)
    const nTicks = 5;
    const yTicks = Array.from({ length: nTicks + 1 }, (_, i) => (yMax * i) / nTicks);

    // Leaf labels
    const leafStep = plotW / (ivl.length || 1);
    const leafLabels = ivl.map((label, i) => {
      const x = pad.left + leafStep * i + leafStep / 2;
      return (
        <text
          key={`leaf-${i}`}
          x={x}
          y={height - pad.bottom + 14}
          textAnchor="middle"
          fontSize={9}
          fill="#6b7280"
          className="select-none"
        >
          {label}
        </text>
      );
    });

    return (
      <>
        {/* Y-axis */}
        <line
          x1={pad.left}
          y1={pad.top}
          x2={pad.left}
          y2={pad.top + plotH}
          stroke="#d1d5db"
          strokeWidth={1}
        />
        {yTicks.map((tick, i) => (
          <g key={`ytick-${i}`}>
            <line
              x1={pad.left - 4}
              y1={scaleY(tick)}
              x2={pad.left}
              y2={scaleY(tick)}
              stroke="#9ca3af"
            />
            <text
              x={pad.left - 8}
              y={scaleY(tick) + 3}
              textAnchor="end"
              fontSize={9}
              fill="#6b7280"
            >
              {tick.toFixed(1)}
            </text>
            {/* Grid line */}
            <line
              x1={pad.left}
              y1={scaleY(tick)}
              x2={pad.left + plotW}
              y2={scaleY(tick)}
              stroke="#f3f4f6"
              strokeWidth={0.5}
            />
          </g>
        ))}
        {/* Y-axis label */}
        <text
          x={14}
          y={pad.top + plotH / 2}
          textAnchor="middle"
          fontSize={10}
          fill="#374151"
          transform={`rotate(-90, 14, ${pad.top + plotH / 2})`}
        >
          Distance
        </text>

        {/* X-axis baseline */}
        <line
          x1={pad.left}
          y1={pad.top + plotH}
          x2={pad.left + plotW}
          y2={pad.top + plotH}
          stroke="#d1d5db"
          strokeWidth={1}
        />

        {/* Links */}
        {links}

        {/* Leaf labels */}
        {leafLabels}
      </>
    );
  }, [icoord, dcoord, ivl, color_list, width, height]);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto"
      >
        <rect width={width} height={height} fill="transparent" />
        {svgContent}
      </svg>
      <p className="text-[10px] text-muted-foreground text-center mt-1">
        {data.n_samples > data.n_leaves
          ? `Showing top ${data.n_leaves} clusters (${data.n_samples} samples total)`
          : `${data.n_samples} samples`}
      </p>
    </div>
  );
}
