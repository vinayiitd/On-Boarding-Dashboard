"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SparklineProps {
  /** Series values, oldest → newest. */
  data: number[];
  /** Stroke color (accepts any CSS color, incl. var(--…)). */
  stroke?: string;
  /** Fill color for the area under the curve. */
  fill?: string;
  /** Height in px. */
  height?: number;
  /** Optional width; defaults to 100% */
  width?: number | string;
  /** Show final point marker. */
  showEnd?: boolean;
  className?: string;
}

/**
 * Compact SVG sparkline. Uses a Catmull-Rom-esque smoothing via bezier
 * midpoints so the line reads elegantly even at small sizes.
 * Renders viewBox-based so it scales cleanly at any card width.
 */
export function Sparkline({
  data,
  stroke = "var(--primary)",
  fill,
  height = 44,
  width = "100%",
  showEnd = true,
  className,
}: SparklineProps) {
  const w = 120;
  const h = height;
  const padY = 4;

  const { linePath, areaPath, endX, endY } = React.useMemo(() => {
    if (data.length < 2) {
      return { linePath: "", areaPath: "", endX: 0, endY: 0 };
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = w / (data.length - 1);
    const points = data.map((v, i) => {
      const x = i * stepX;
      const y = h - padY - ((v - min) / range) * (h - padY * 2);
      return { x, y };
    });
    // Smoothed path with midpoint quadratics.
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const mid = { x: (prev.x + curr.x) / 2, y: (prev.y + curr.y) / 2 };
      d += ` Q ${prev.x} ${prev.y} ${mid.x} ${mid.y}`;
      if (i === points.length - 1) {
        d += ` T ${curr.x} ${curr.y}`;
      }
    }
    const area = `${d} L ${w} ${h} L 0 ${h} Z`;
    return {
      linePath: d,
      areaPath: area,
      endX: points[points.length - 1].x,
      endY: points[points.length - 1].y,
    };
  }, [data, h]);

  const gradientId = React.useId();

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={width}
      height={h}
      preserveAspectRatio="none"
      className={cn("block overflow-visible", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      {areaPath ? (
        <motion.path
          d={areaPath}
          fill={fill ?? `url(#${gradientId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ) : null}
      {linePath ? (
        <motion.path
          d={linePath}
          fill="none"
          stroke={stroke}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0.6 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.05, ease: "easeOut" }}
        />
      ) : null}
      {showEnd && linePath ? (
        <>
          <circle
            cx={endX}
            cy={endY}
            r={4.5}
            fill={stroke}
            opacity={0.15}
          />
          <circle cx={endX} cy={endY} r={2} fill={stroke} />
        </>
      ) : null}
    </svg>
  );
}
