/**
 * NissRadarChart — SVG radar/spider chart visualizing the 6 NISS metrics
 * as a hexagonal shape. Supports severity-colored fills with pattern
 * overlays for colorblind accessibility, optional comparison overlay,
 * hover details, and clickable axis labels.
 */

import { useState } from 'react';
import type { NissVector, NissSeverity } from '../../lib/niss-parser';
import { METRIC_NAMES, METRIC_VALUES, CODE_LABELS, NISS_SEVERITY_COLORS } from '../../lib/niss-parser';
import { METRIC_KEYS } from './niss-display-utils';

interface Props {
  vector: NissVector;
  severity: NissSeverity;
  size?: number;
  compareVector?: NissVector;
  onAxisClick?: (metric: string) => void;
}

const PATTERN_IDS: Record<NissSeverity, string> = {
  none: 'niss-pat-none',
  low: 'niss-pat-low',
  medium: 'niss-pat-med',
  high: 'niss-pat-high',
  critical: 'niss-pat-crit',
};

function getMetricValue(metric: string, code: string): number {
  return METRIC_VALUES[metric]?.[code] ?? 0;
}

function polarToXY(angle: number, radius: number, cx: number, cy: number) {
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

export default function NissRadarChart({
  vector,
  severity,
  size = 240,
  compareVector,
  onAxisClick,
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.34;
  const labelR = size * 0.46;
  const startAngle = -Math.PI / 2; // BI at 12 o'clock
  const step = (2 * Math.PI) / 6;

  const axes = METRIC_KEYS.map((key, i) => {
    const angle = startAngle + i * step;
    const code = vector[key] as string;
    const value = getMetricValue(key, code);
    const r = (value / 10) * maxR;
    return { key, angle, code, value, point: polarToXY(angle, r, cx, cy), tip: polarToXY(angle, maxR, cx, cy), label: polarToXY(angle, labelR, cx, cy) };
  });

  const compareAxes = compareVector
    ? METRIC_KEYS.map((key, i) => {
        const angle = startAngle + i * step;
        const code = compareVector[key] as string;
        const value = getMetricValue(key, code);
        const r = (value / 10) * maxR;
        return { key, value, point: polarToXY(angle, r, cx, cy) };
      })
    : null;

  const colors = NISS_SEVERITY_COLORS[severity];
  const primaryPoly = axes.map((a) => `${a.point.x},${a.point.y}`).join(' ');
  const comparePoly = compareAxes?.map((a) => `${a.point.x},${a.point.y}`).join(' ');

  const gridRings = [0.25, 0.5, 0.75, 1.0];

  const hoveredAxis = hovered ? axes.find((a) => a.key === hovered) : null;
  const hoveredLabel = hoveredAxis
    ? `${METRIC_NAMES[hoveredAxis.key]} (${hoveredAxis.key.toUpperCase()}:${hoveredAxis.code}) = ${hoveredAxis.value.toFixed(1)}`
    : null;

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`NISS radar chart showing 6 metrics. Severity: ${severity}`}
      >
        <defs>
          {/* Colorblind-accessible pattern fills */}
          <pattern id={PATTERN_IDS.none} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill={colors.bg} />
          </pattern>
          <pattern id={PATTERN_IDS.low} width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill={NISS_SEVERITY_COLORS.low.bg} />
            <circle cx="4" cy="4" r="1" fill={NISS_SEVERITY_COLORS.low.border} />
          </pattern>
          <pattern id={PATTERN_IDS.medium} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill={NISS_SEVERITY_COLORS.medium.bg} />
            <line x1="0" y1="6" x2="6" y2="0" stroke={NISS_SEVERITY_COLORS.medium.border} strokeWidth="1" />
          </pattern>
          <pattern id={PATTERN_IDS.high} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill={NISS_SEVERITY_COLORS.high.bg} />
            <line x1="0" y1="3" x2="6" y2="3" stroke={NISS_SEVERITY_COLORS.high.border} strokeWidth="1" />
            <line x1="3" y1="0" x2="3" y2="6" stroke={NISS_SEVERITY_COLORS.high.border} strokeWidth="1" />
          </pattern>
          <pattern id={PATTERN_IDS.critical} width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill={NISS_SEVERITY_COLORS.critical.bg} />
            <line x1="0" y1="2" x2="4" y2="2" stroke={NISS_SEVERITY_COLORS.critical.border} strokeWidth="0.8" />
            <line x1="2" y1="0" x2="2" y2="4" stroke={NISS_SEVERITY_COLORS.critical.border} strokeWidth="0.8" />
            <line x1="0" y1="4" x2="4" y2="0" stroke={NISS_SEVERITY_COLORS.critical.border} strokeWidth="0.6" />
          </pattern>
        </defs>

        {/* Grid rings */}
        {gridRings.map((pct) => {
          const r = pct * maxR;
          const pts = Array.from({ length: 6 }, (_, i) => {
            const p = polarToXY(startAngle + i * step, r, cx, cy);
            return `${p.x},${p.y}`;
          }).join(' ');
          return (
            <polygon
              key={pct}
              points={pts}
              fill="none"
              stroke="rgba(148,163,184,0.15)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          );
        })}

        {/* Axis lines */}
        {axes.map((a) => (
          <line key={a.key} x1={cx} y1={cy} x2={a.tip.x} y2={a.tip.y} stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
        ))}

        {/* Primary shape */}
        <polygon points={primaryPoly} fill={`url(#${PATTERN_IDS[severity]})`} stroke={colors.border} strokeWidth="1.5" />

        {/* Comparison shape */}
        {comparePoly && (
          <polygon points={comparePoly} fill="none" stroke="rgba(96,165,250,0.6)" strokeWidth="1.5" strokeDasharray="5 3" />
        )}

        {/* Data points */}
        {axes.map((a) => (
          <circle
            key={a.key}
            cx={a.point.x}
            cy={a.point.y}
            r={hovered === a.key ? 5 : 3}
            fill={colors.text}
            stroke="#0f172a"
            strokeWidth="1"
            className="transition-all duration-150 cursor-pointer"
            onMouseEnter={() => setHovered(a.key)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* Comparison data points */}
        {compareAxes?.map((a) => (
          <circle key={`cmp-${a.key}`} cx={a.point.x} cy={a.point.y} r={2.5} fill="rgba(96,165,250,0.8)" stroke="#0f172a" strokeWidth="0.8" />
        ))}

        {/* Axis labels */}
        {axes.map((a) => (
          <text
            key={`lbl-${a.key}`}
            x={a.label.x}
            y={a.label.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="cursor-pointer select-none"
            fill={hovered === a.key ? colors.text : 'rgba(148,163,184,0.7)'}
            fontSize="11"
            fontWeight={hovered === a.key ? 700 : 500}
            onClick={() => onAxisClick?.(a.key)}
            onMouseEnter={() => setHovered(a.key)}
            onMouseLeave={() => setHovered(null)}
            role="button"
            tabIndex={0}
            aria-label={`${METRIC_NAMES[a.key]}: ${CODE_LABELS[a.key]?.[a.code] ?? a.code}`}
          >
            {a.key.toUpperCase()}
          </text>
        ))}
      </svg>

      {/* Hover detail */}
      <div className="h-5 text-xs text-slate-400 text-center tabular-nums" aria-live="polite">
        {hoveredLabel ?? '\u00A0'}
      </div>
    </div>
  );
}
