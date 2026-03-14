/**
 * Evidence Tier System — classifies claims by strength of evidence.
 *
 * Seven codes grouped into four visual groups. Maps to existing Status
 * values from threat-data.ts so older data degrades gracefully.
 *
 * Zero React dependencies — pure types + functions.
 */

// ═══ Tier Codes ═══

export type EvidenceTierCode =
  | 'validated_rct'        // Tier 1 — peer-reviewed RCT or meta-analysis
  | 'validated_replication' // Tier 2 — independently replicated
  | 'demonstrated_lab'     // Tier 3 — lab-demonstrated, not yet replicated
  | 'demonstrated_case'    // Tier 4 — case study or observational evidence
  | 'theoretical_modeled'  // Tier 5 — modeled / simulated, no empirical test
  | 'theoretical_proposed' // Tier 6 — proposed framework, no model yet
  | 'speculative';         // Tier 7 — conjecture, no supporting evidence

// ═══ Tier Groups ═══

export type EvidenceTierGroup = 'validated' | 'demonstrated' | 'theoretical' | 'speculative';

/** Map every tier code to its visual group. */
export const EVIDENCE_TIER_GROUP: Record<EvidenceTierCode, EvidenceTierGroup> = {
  validated_rct:         'validated',
  validated_replication: 'validated',
  demonstrated_lab:      'demonstrated',
  demonstrated_case:     'demonstrated',
  theoretical_modeled:   'theoretical',
  theoretical_proposed:  'theoretical',
  speculative:           'speculative',
};

// ═══ Colors (WCAG AA on light AND dark) ═══

export interface EvidenceColorSet {
  /** Hex/rgb for inline style backgrounds */
  bg: string;
  /** Tailwind class for background */
  bgClass: string;
  /** Hex/rgb for inline style borders */
  border: string;
  /** Tailwind class for border color */
  borderClass: string;
  /** Hex/rgb for inline style text */
  text: string;
  /** Tailwind class for text color */
  textClass: string;
  /** Human-readable group label */
  label: string;
}

export const EVIDENCE_GROUP_COLORS: Record<EvidenceTierGroup, EvidenceColorSet> = {
  validated: {
    bg:          'rgba(22, 163, 74, 0.15)',
    bgClass:     'bg-green-600/15 dark:bg-green-500/15',
    border:      '#16a34a',
    borderClass: 'border-green-600 dark:border-green-500',
    text:        '#15803d',
    textClass:   'text-green-700 dark:text-green-400',
    label:       'Validated',
  },
  demonstrated: {
    bg:          'rgba(37, 99, 235, 0.15)',
    bgClass:     'bg-blue-600/15 dark:bg-blue-500/15',
    border:      '#2563eb',
    borderClass: 'border-blue-600 dark:border-blue-500',
    text:        '#1d4ed8',
    textClass:   'text-blue-700 dark:text-blue-400',
    label:       'Demonstrated',
  },
  theoretical: {
    bg:          'rgba(217, 119, 6, 0.15)',
    bgClass:     'bg-amber-600/15 dark:bg-amber-500/15',
    border:      '#d97706',
    borderClass: 'border-amber-600 dark:border-amber-500',
    text:        '#b45309',
    textClass:   'text-amber-700 dark:text-amber-400',
    label:       'Theoretical',
  },
  speculative: {
    bg:          'transparent',
    bgClass:     'bg-transparent',
    border:      '#dc2626',
    borderClass: 'border-red-600 dark:border-red-500',
    text:        '#dc2626',
    textClass:   'text-red-600 dark:text-red-400',
    label:       'Speculative',
  },
};

// ═══ Human-Readable Labels ═══

export const EVIDENCE_TIER_LABELS: Record<EvidenceTierCode, string> = {
  validated_rct:         'Tier 1 — Validated (RCT / Meta-analysis)',
  validated_replication: 'Tier 2 — Validated (Independently Replicated)',
  demonstrated_lab:      'Tier 3 — Demonstrated (Lab-proven)',
  demonstrated_case:     'Tier 4 — Demonstrated (Case Study / Observational)',
  theoretical_modeled:   'Tier 5 — Theoretical (Modeled / Simulated)',
  theoretical_proposed:  'Tier 6 — Theoretical (Proposed Framework)',
  speculative:           'Tier 7 — Speculative',
};

// ═══ Status → Group fallback ═══

/**
 * Map the existing Status field (CONFIRMED, DEMONSTRATED, THEORETICAL, EMERGING)
 * to the nearest evidence group. Used when a record has no explicit evidence.tier.
 */
export function statusToEvidenceGroup(status: string | undefined | null): EvidenceTierGroup {
  if (!status) return 'speculative';
  switch (status.toUpperCase()) {
    case 'CONFIRMED':
      return 'demonstrated'; // confirmed ≠ peer-reviewed; best we can claim is demonstrated
    case 'DEMONSTRATED':
      return 'demonstrated';
    case 'THEORETICAL':
      return 'theoretical';
    case 'EMERGING':
    case 'PROJECTED':
      return 'speculative';
    default:
      return 'speculative';
  }
}

// ═══ Primary accessor ═══

export interface EvidenceField {
  tier?: EvidenceTierCode;
}

/**
 * Resolve the evidence group for a record.
 * Prefers `evidence.tier` when present; falls back to the legacy `status` field.
 */
export function getEvidenceGroup(
  evidence: EvidenceField | undefined | null,
  status: string | undefined | null,
): EvidenceTierGroup {
  if (evidence?.tier && EVIDENCE_TIER_GROUP[evidence.tier]) {
    return EVIDENCE_TIER_GROUP[evidence.tier];
  }
  return statusToEvidenceGroup(status);
}
