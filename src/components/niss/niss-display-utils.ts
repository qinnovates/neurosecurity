/**
 * NISS Display Utilities
 *
 * Shared display constants and helpers for NISS UI components.
 * Maps NISS types from niss-parser.ts to visual properties
 * (colors, icons, labels, descriptions) used by NissScoreBadge,
 * PinsBadge, and NissVectorChips.
 */

import type { NissSeverity, NissVector } from '../../lib/niss-parser';

// ═══════════════════════════════════════════════════════════════════
// Severity Display Map
// ═══════════════════════════════════════════════════════════════════

export interface SeverityDisplay {
  /** Tailwind background class */
  bg: string;
  /** Tailwind border class */
  border: string;
  /** Tailwind text class */
  text: string;
  /** Unique Unicode shape icon (colorblind-accessible) */
  icon: string;
  /** Human-readable label */
  label: string;
  /** Screen reader description */
  ariaLabel: string;
}

export const SEVERITY_DISPLAY: Record<NissSeverity, SeverityDisplay> = {
  none: {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    text: 'text-slate-400',
    icon: '\u25CB',       // ○ open circle
    label: 'None',
    ariaLabel: 'NISS severity: none',
  },
  low: {
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: '\u25CE',       // ◎ bullseye
    label: 'Low',
    ariaLabel: 'NISS severity: low',
  },
  medium: {
    bg: 'bg-yellow-500/15',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    icon: '\u25B2',       // ▲ triangle
    label: 'Medium',
    ariaLabel: 'NISS severity: medium',
  },
  high: {
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    icon: '\u25C6',       // ◆ diamond
    label: 'High',
    ariaLabel: 'NISS severity: high',
  },
  critical: {
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: '\u2B22',       // ⬢ hexagon
    label: 'Critical',
    ariaLabel: 'NISS severity: critical',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// Metric Descriptions
// ═══════════════════════════════════════════════════════════════════

export interface MetricDescription {
  /** One-line summary of the metric */
  summary: string;
  /** CVSS analog metric key, or null for NISS-only metrics */
  cvssAnalog: string | null;
  /** Description for each code value within the metric */
  codeDescriptions: Record<string, string>;
}

export const METRIC_DESCRIPTIONS: Record<string, MetricDescription> = {
  bi: {
    summary: 'Physical harm to biological tissue from the attack vector',
    cvssAnalog: null,
    codeDescriptions: {
      N: 'No biological impact. Signal stays within safe parameters.',
      L: 'Minor tissue stress. Temporary discomfort, no lasting damage.',
      H: 'Significant biological disruption. Potential for tissue damage requiring medical attention.',
      C: 'Severe or life-threatening biological harm. Permanent damage likely.',
      X: 'Biological impact is undefined or unknown for this vector.',
    },
  },
  cr: {
    summary: 'Unauthorized reading or inference of neural data',
    cvssAnalog: 'Confidentiality',
    codeDescriptions: {
      N: 'No neural data is read or inferred.',
      L: 'Basic signal characteristics observable. No cognitive content decoded.',
      H: 'Meaningful cognitive or emotional state information decoded.',
      C: 'Detailed thought content, memories, or intentions extracted.',
      X: 'Reconnaissance capability is undefined or unknown.',
    },
  },
  cd: {
    summary: 'Disruption of cognitive, sensory, motor, or autonomic function',
    cvssAnalog: 'Availability',
    codeDescriptions: {
      N: 'No functional disruption.',
      L: 'Mild interference. User notices but can compensate.',
      H: 'Significant disruption to one or more functional domains.',
      C: 'Complete loss of function in one or more domains. Incapacitation.',
      X: 'Disruption level is undefined or unknown.',
    },
  },
  cv: {
    summary: 'Degree to which informed consent was bypassed or violated',
    cvssAnalog: null,
    codeDescriptions: {
      N: 'Full informed consent obtained and maintained.',
      P: 'Consent partially obtained. Some aspects undisclosed.',
      E: 'Consent extensively violated. Key risks or purposes hidden.',
      I: 'No consent. Involuntary exposure to the attack.',
      X: 'Consent status is undefined or unknown.',
    },
  },
  rv: {
    summary: 'Whether the neural impact can be reversed or treated',
    cvssAnalog: null,
    codeDescriptions: {
      F: 'Fully reversible. Effects cease when attack stops.',
      T: 'Treatable. Effects persist but respond to intervention.',
      P: 'Partially reversible. Some effects permanent despite treatment.',
      I: 'Irreversible. Permanent neural or functional change.',
      X: 'Reversibility is undefined or unknown.',
    },
  },
  np: {
    summary: 'Risk of lasting neuroplastic change from the attack',
    cvssAnalog: null,
    codeDescriptions: {
      N: 'No neuroplastic impact. Neural pathways unaffected.',
      T: 'Temporary plasticity changes. Self-resolving within days.',
      P: 'Partial structural change. Some pathways durably altered.',
      S: 'Structural neuroplastic change. Permanent rewiring of neural circuits.',
      X: 'Neuroplasticity impact is undefined or unknown.',
    },
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// Metric Keys (Canonical Order)
// ═══════════════════════════════════════════════════════════════════

/** Metric keys in canonical display order matching the NISS vector format */
export const METRIC_KEYS: readonly (keyof Omit<NissVector, 'version'>)[] = [
  'bi', 'cr', 'cd', 'cv', 'rv', 'np',
] as const;

// ═══════════════════════════════════════════════════════════════════
// Chip Color Helper
// ═══════════════════════════════════════════════════════════════════

/** Color tier for an individual metric value chip */
export interface ChipColor {
  bg: string;
  border: string;
  text: string;
}

/**
 * Map a metric's numeric value (0-10 scale) to a color tier.
 * Colors reflect the individual metric intensity, not overall severity.
 *
 * - 0.0       -> slate  (none / baseline)
 * - 0.1-3.3   -> blue   (low)
 * - 3.4-6.7   -> amber  (moderate)
 * - 6.8-10.0  -> red    (high / critical)
 * - undefined  -> slate  (X / not defined)
 */
export function getMetricChipColor(value: number | undefined): ChipColor {
  if (value === undefined || value === 0) {
    return {
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/25',
      text: 'text-slate-400',
    };
  }
  if (value <= 3.3) {
    return {
      bg: 'bg-blue-500/15',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
    };
  }
  if (value <= 6.7) {
    return {
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
    };
  }
  return {
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
    text: 'text-red-400',
  };
}
