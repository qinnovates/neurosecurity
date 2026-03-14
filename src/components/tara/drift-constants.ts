/**
 * Drift visualization constants for TARA temporal drift categories.
 *
 * Drift describes how a threat's impact evolves over time:
 * - A (Acute): immediate, single-event impact
 * - C (Cumulative): builds over repeated exposures
 * - L (Latent): delayed onset, emerges after dormant period
 * - P (Persistent): ongoing, continuous effect
 */

export type DriftCode = 'A' | 'C' | 'L' | 'P';

export interface DriftConfig {
  color: string;
  bg: string;
  border: string;
  icon: string;
  label: string;
}

export const DRIFT_CONFIG: Record<DriftCode, DriftConfig> = {
  A: {
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.25)',
    icon: '\u26A1',
    label: 'ACUTE',
  },
  C: {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.25)',
    icon: '\u2581\u2583\u2585\u2587',
    label: 'CUMULATIVE',
  },
  L: {
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.25)',
    icon: '\u231B',
    label: 'LATENT',
  },
  P: {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.25)',
    icon: '\uD83D\uDD12',
    label: 'PERSISTENT',
  },
};
