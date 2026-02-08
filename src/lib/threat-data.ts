/**
 * QIF Threat Data — adapter over shared/threat-registry.json
 * Single source of truth: all 60 techniques come from the registry.
 *
 * Categories are inspired by MITRE ATT&CK but adapted for BCI/neural security.
 */

import { HOURGLASS_BANDS } from './qif-constants';
import registry from '@shared/threat-registry.json';

/** Attack categories (columns in the threat map) */
export const THREAT_CATEGORIES = [
  { id: 'SI', name: 'Signal Injection', description: 'Injecting false neural or electronic signals' },
  { id: 'SE', name: 'Signal Eavesdropping', description: 'Intercepting signals in transit' },
  { id: 'DM', name: 'Data Manipulation', description: 'Altering decoded intent or recordings' },
  { id: 'DS', name: 'Denial of Service', description: 'Disrupting BCI function' },
  { id: 'PE', name: 'Privilege Escalation', description: 'Gaining unauthorized access depth' },
  { id: 'CI', name: 'Cognitive Integrity', description: 'Thought privacy, perception, identity threats' },
  { id: 'PS', name: 'Physical Safety', description: 'Tissue damage, seizures, involuntary movement' },
  { id: 'EX', name: 'Data Exfiltration', description: 'Extracting neural data for exploitation' },
] as const;

/** MITRE tactics from registry */
export const THREAT_TACTICS = registry.tactics;

export type CategoryId = typeof THREAT_CATEGORIES[number]['id'];
export type BandId = typeof HOURGLASS_BANDS[number]['id'];
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type Status = 'CONFIRMED' | 'DEMONSTRATED' | 'THEORETICAL' | 'EMERGING';
export type AccessLevel = 'PUBLIC' | 'LICENSED' | 'RESTRICTED' | 'CLASSIFIED' | null;

export interface ThreatVector {
  /** MITRE-compatible ID: T2### */
  id: string;
  /** Display name */
  name: string;
  /** UI category for grid column */
  category: CategoryId;
  /** MITRE tactic ID */
  tactic: string;
  /** Hourglass bands affected */
  bands: BandId[];
  /** Severity level */
  severity: Severity;
  /** Evidence status */
  status: Status;
  /** Coupling mechanism (for frequency-domain attacks) */
  coupling: string | null;
  /** Access level required */
  access: AccessLevel;
  /** Classical detection capability */
  classicalDetection: string;
  /** Quantum detection capability */
  quantumDetection: string;
  /** Full description */
  description: string;
  /** Original band string from hourglass data */
  bandsStr: string;
  /** MITRE cross-reference */
  mitre: { tactics: string[]; techniques: string[]; note: string };
  /** Academic sources */
  sources: string[];
}

/** Transform registry techniques → ThreatVector[] */
export const THREAT_VECTORS: ThreatVector[] = registry.techniques.map(t => ({
  id: t.id,
  name: t.attack,
  category: (t as any).ui_category as CategoryId,
  tactic: t.category,
  bands: t.band_ids as unknown as BandId[],
  severity: (t as any).severity as Severity,
  status: t.status as Status,
  coupling: t.coupling,
  access: t.access as AccessLevel,
  classicalDetection: t.classical,
  quantumDetection: t.quantum,
  description: t.notes,
  bandsStr: t.bands,
  mitre: t.mitre,
  sources: t.sources,
}));

/** Severity color map */
export const SEVERITY_COLORS = {
  critical: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444' },
  high: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b' },
  medium: { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.3)', text: '#eab308' },
  low: { bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)', text: '#94a3b8' },
} as const;

/** Status color map */
export const STATUS_COLORS = {
  CONFIRMED: { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444' },
  DEMONSTRATED: { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b' },
  THEORETICAL: { bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8' },
  EMERGING: { bg: 'rgba(139, 92, 246, 0.12)', text: '#8b5cf6' },
} as const;

/** Zone color map (matches hourglass bands) */
export const ZONE_COLORS = {
  neural: { accent: '#22c55e', bg: 'rgba(34, 197, 94, 0.05)' },
  interface: { accent: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
  synthetic: { accent: '#3b82f6', bg: 'rgba(59, 130, 246, 0.05)' },
} as const;

/** Helper: get threats for a specific band+category intersection */
export function getThreatsForCell(bandId: BandId, categoryId: CategoryId): ThreatVector[] {
  return THREAT_VECTORS.filter(t => t.bands.includes(bandId) && t.category === categoryId);
}

/** Helper: get max severity for a cell */
export function getCellSeverity(bandId: BandId, categoryId: CategoryId): Severity | null {
  const threats = getThreatsForCell(bandId, categoryId);
  if (threats.length === 0) return null;
  const order: Severity[] = ['critical', 'high', 'medium', 'low'];
  for (const s of order) {
    if (threats.some(t => t.severity === s)) return s;
  }
  return null;
}

/** Helper: count threats per severity */
export function getThreatStats() {
  const stats = { critical: 0, high: 0, medium: 0, low: 0, total: THREAT_VECTORS.length };
  for (const t of THREAT_VECTORS) {
    stats[t.severity]++;
  }
  return stats;
}

/** Helper: count threats per status */
export function getStatusStats() {
  const stats: Record<Status, number> = { CONFIRMED: 0, DEMONSTRATED: 0, THEORETICAL: 0, EMERGING: 0 };
  for (const t of THREAT_VECTORS) {
    stats[t.status]++;
  }
  return stats;
}

/** Registry metadata */
export function getRegistryStats() {
  return {
    ...registry.statistics,
    totalTechniques: THREAT_VECTORS.length,
    totalTactics: THREAT_TACTICS.length,
    severity: getThreatStats(),
    status: getStatusStats(),
  };
}
