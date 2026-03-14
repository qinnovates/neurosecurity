/**
 * EvidenceTierBanner — full-width banner showing evidence classification.
 *
 * Visual rules:
 *   - Validated (tiers 1-2): green fill
 *   - Demonstrated (tiers 3-4): blue fill
 *   - Theoretical (tiers 5-6): amber fill
 *   - Speculative (tier 7): red DASHED OUTLINE, no fill
 */

import type { ReactNode } from 'react';
import type { EvidenceTierCode } from '../../lib/evidence-tiers';
import {
  EVIDENCE_TIER_GROUP,
  EVIDENCE_TIER_LABELS,
  EVIDENCE_GROUP_COLORS,
  type EvidenceTierGroup,
} from '../../lib/evidence-tiers';

interface Props {
  tier: EvidenceTierCode;
  status?: string;
  confidenceNote?: string;
  lastVerified?: string;
}

// ═══ Icons (inline SVG, no dependency) ═══

const ICONS: Record<EvidenceTierGroup, ReactNode> = {
  validated: (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  demonstrated: (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M7 2a2 2 0 00-2 2v1a1 1 0 001 1h8a1 1 0 001-1V4a2 2 0 00-2-2H7z" />
      <path fillRule="evenodd" d="M6 6v8.5A2.5 2.5 0 008.5 17h3a2.5 2.5 0 002.5-2.5V6H6zm2 2a1 1 0 112 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
  ),
  theoretical: (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
    </svg>
  ),
  speculative: (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
};

export default function EvidenceTierBanner({ tier, status, confidenceNote, lastVerified }: Props) {
  const group = EVIDENCE_TIER_GROUP[tier];
  const colors = EVIDENCE_GROUP_COLORS[group];
  const label = EVIDENCE_TIER_LABELS[tier];
  const isSpeculative = group === 'speculative';

  // Build className and inline style for the outer container
  const containerClass = [
    'w-full rounded-lg border-l-4 px-4 py-3 flex items-start gap-3',
    colors.borderClass,
    isSpeculative
      ? 'border border-dashed border-red-600 dark:border-red-500 bg-transparent'
      : colors.bgClass,
  ].join(' ');

  return (
    <div className={containerClass} role="status" aria-label={`Evidence level: ${colors.label}`}>
      {/* Icon */}
      <span className={colors.textClass}>
        {ICONS[group]}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Tier label */}
        <p className={`text-sm font-semibold leading-tight ${colors.textClass}`}>
          {label}
        </p>

        {/* Confidence note */}
        {confidenceNote && (
          <p className="mt-1 text-xs text-gray-700 dark:text-gray-300 leading-snug">
            {confidenceNote}
          </p>
        )}

        {/* Last verified */}
        {lastVerified && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Last verified: {lastVerified}
          </p>
        )}

        {/* Legacy status fallback note */}
        {status && (
          <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Legacy status: {status}
          </p>
        )}
      </div>
    </div>
  );
}
