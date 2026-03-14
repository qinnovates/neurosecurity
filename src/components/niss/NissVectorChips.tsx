/**
 * NissVectorChips — Renders the 6 NISS metrics as colored, interactive chips.
 *
 * Each chip shows the metric key and code value (e.g. "BI:H"), colored by
 * the individual metric intensity (not overall severity). Chips are keyboard-
 * accessible buttons with hover tooltips showing the metric name, code label,
 * and description.
 */

import { useState } from 'react';
import type { NissVector } from '../../lib/niss-parser';
import { METRIC_NAMES, CODE_LABELS, METRIC_VALUES } from '../../lib/niss-parser';
import {
  METRIC_KEYS,
  METRIC_DESCRIPTIONS,
  getMetricChipColor,
} from './niss-display-utils';

interface Props {
  /** Parsed NISS vector */
  vector: NissVector;
  /** Callback when a metric chip is clicked */
  onMetricClick?: (metricKey: string, metricValue: string) => void;
  /** Compact mode: smaller chips, no gaps */
  compact?: boolean;
}

export default function NissVectorChips({
  vector,
  onMetricClick,
  compact = false,
}: Props) {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  const chipSize = compact
    ? 'px-1.5 py-0.5 text-xs gap-0.5'
    : 'px-2.5 py-1 text-sm gap-1';

  const containerGap = compact ? 'gap-1' : 'gap-2';

  return (
    <div className={`inline-flex flex-wrap ${containerGap}`} role="group" aria-label="NISS vector metrics">
      {METRIC_KEYS.map((key) => {
        const code = vector[key];
        const metricKey = key.toUpperCase();
        const numericValue = METRIC_VALUES[key]?.[code];
        const color = getMetricChipColor(numericValue);
        const metricName = METRIC_NAMES[key] ?? key;
        const codeLabel = CODE_LABELS[key]?.[code] ?? code;
        const description = METRIC_DESCRIPTIONS[key]?.codeDescriptions[code] ?? '';
        const isHovered = hoveredMetric === key;

        return (
          <div key={key} className="relative">
            <button
              type="button"
              className={`inline-flex items-center rounded border font-mono cursor-pointer transition-all duration-150 ${color.bg} ${color.border} ${color.text} ${chipSize} hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-1 focus:ring-offset-slate-900`}
              onClick={() => onMetricClick?.(key, code)}
              onMouseEnter={() => setHoveredMetric(key)}
              onMouseLeave={() => setHoveredMetric(null)}
              onFocus={() => setHoveredMetric(key)}
              onBlur={() => setHoveredMetric(null)}
              aria-label={`${metricName}: ${codeLabel}. ${description}`}
              aria-describedby={isHovered ? `tooltip-${key}` : undefined}
            >
              <span className="font-semibold">{metricKey}</span>
              <span className="opacity-50">:</span>
              <span>{code}</span>
            </button>

            {/* Tooltip */}
            {isHovered && (
              <div
                id={`tooltip-${key}`}
                role="tooltip"
                className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 shadow-xl text-left pointer-events-none"
              >
                <div className="text-xs font-semibold text-slate-200 mb-1">
                  {metricName}
                </div>
                <div className={`text-xs font-mono mb-1 ${color.text}`}>
                  {metricKey}:{code} — {codeLabel}
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  {description}
                </div>
                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-700" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
