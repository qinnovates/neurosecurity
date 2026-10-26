/**
 * NISS Display Utilities
 *
 * Shared display constants and helpers for NISS UI components: the shape and
 * the words for each severity, and the metric order.
 *
 * Colour is not here. The severity display used to carry its own Tailwind
 * classes, which was the second of four severity palettes in the tree and the
 * one that measured worst: every one of its five values sat between 1.3:1 and
 * 2.4:1 against a light page, under the 3:1 floor this codebase names. It now
 * carries the tone key of the one measured palette in
 * `components/radar/radar-palette.css`, and a consumer resolves it with
 * `data-radar-fill`.
 */

import type { NissSeverity, NissVector } from '../../lib/niss-parser';
import type { RadarTone } from '@/components/radar/radar-patterns';

// ═══════════════════════════════════════════════════════════════════
// Severity Display Map
// ═══════════════════════════════════════════════════════════════════

export interface SeverityDisplay {
  /** The tone key of the one radar palette; a consumer sets `data-radar-fill` to it and reads `--radar-tone`. */
  tone: RadarTone;
  /** Unique Unicode shape icon (colorblind-accessible) */
  icon: string;
  /** Human-readable label */
  label: string;
  /** Screen reader description */
  ariaLabel: string;
}

export const SEVERITY_DISPLAY: Record<NissSeverity, SeverityDisplay> = {
  none: { tone: 'none', icon: '\u25CB', label: 'None', ariaLabel: 'NISS severity: none' },
  low: { tone: 'low', icon: '\u25CE', label: 'Low', ariaLabel: 'NISS severity: low' },
  medium: { tone: 'medium', icon: '\u25B2', label: 'Medium', ariaLabel: 'NISS severity: medium' },
  high: { tone: 'high', icon: '\u25C6', label: 'High', ariaLabel: 'NISS severity: high' },
  critical: { tone: 'critical', icon: '\u2B22', label: 'Critical', ariaLabel: 'NISS severity: critical' },
} as const;

// ═══════════════════════════════════════════════════════════════════
// Metric Descriptions
// ═══════════════════════════════════════════════════════════════════

/**
 * Nothing renders these today: the chip component that did was orphaned and has
 * been removed, and the scoring page carries its own copy of the metric prose.
 * Left in place rather than deleted because it is framework content, not a
 * display detail; wire it in or delete it when the NISS copy is next revised.
 */
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
