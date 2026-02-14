/**
 * QIF Threat Data — adapter over shared/qtara-registrar.json
 * Single source of truth: all techniques from the QIF TARA Taxonomy.
 * Scoring: NISS v1.0 (Neural Impact Scoring System)
 * TARA: Therapeutic Applications & Risk Assessment (four-projection overlay)
 * Projections: Modality (merged Security+Engineering), Clinical, Diagnostic (DSM-5-TR), Governance
 * Neural Impact Chain (NIC): Technique → Band → Structure → Function → NISS + DSM
 */

import { HOURGLASS_BANDS } from './qif-constants';
import registry from '@shared/qtara-registrar.json';

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

/** TARA Tactics from registry */
export const THREAT_TACTICS = registry.tactics;

/** QIF Operational Domains */
export const THREAT_DOMAINS = (registry as any).domains ?? [];

/** NISS specification */
export const NISS_SPEC = (registry as any).niss_spec ?? null;

/** TARA specification */
export const TARA_SPEC = (registry as any).tara_spec ?? null;

export type CategoryId = typeof THREAT_CATEGORIES[number]['id'];
export type BandId = typeof HOURGLASS_BANDS[number]['id'];
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type NissSeverity = 'critical' | 'high' | 'medium' | 'low' | 'none';
export type Status = 'CONFIRMED' | 'DEMONSTRATED' | 'THEORETICAL' | 'EMERGING';
export type AccessLevel = 'PUBLIC' | 'LICENSED' | 'RESTRICTED' | 'CLASSIFIED' | null;
export type DualUse = 'confirmed' | 'probable' | 'possible' | 'silicon_only';
export type ConsentTier = 'standard' | 'enhanced' | 'IRB' | 'prohibited';
export type FdaStatus = 'cleared' | 'approved' | 'breakthrough' | 'investigational' | 'none' | 'N/A';
export type EvidenceLevel = 'meta_analysis' | 'RCT' | 'cohort' | 'case_series' | 'preclinical' | 'theoretical' | 'N/A';
export type DiagnosticCluster = 'cognitive_psychotic' | 'mood_trauma' | 'motor_neurocognitive' | 'persistent_personality' | 'non_diagnostic';
export type Dsm5Confidence = 'established' | 'probable' | 'theoretical';
export type Dsm5RiskClass = 'direct' | 'indirect' | 'none';

export interface Dsm5Diagnosis {
  code: string;
  name: string;
  confidence: Dsm5Confidence;
}

export interface Dsm5DiagProfile {
  primary: Dsm5Diagnosis[];
  secondary: Dsm5Diagnosis[];
  risk_class: Dsm5RiskClass;
  cluster: DiagnosticCluster;
  pathway: string;
  niss_correlation: string;
}

export interface TaraClinical {
  therapeutic_analog: string;
  conditions: string[];
  fda_status: FdaStatus;
  evidence_level: EvidenceLevel;
  safe_parameters: string;
  sources: string[];
}

export interface TaraGovernance {
  consent_tier: ConsentTier;
  safety_ceiling: string;
  monitoring: string[];
  regulations: string[];
  data_classification: string;
}

export interface TaraEngineering {
  coupling: string[];
  parameters: Record<string, string>;
  hardware: string[];
  detection: string;
}

export interface TaraProjection {
  mechanism: string;
  dual_use: DualUse;
  clinical: TaraClinical | null;
  governance: TaraGovernance;
  engineering: TaraEngineering;
  dsm5: Dsm5DiagProfile | null;
}

export interface NissScore {
  version: string;
  vector: string;
  score: number;
  severity: NissSeverity;
  pins: boolean;
}

export interface CvssScore {
  version: string;
  base_vector: string;
  supplemental: string;
  gap_group: 1 | 2 | 3;
  gap_summary: string;
}

export interface ThreatVector {
  /** QIF technique ID: QIF-T#### */
  id: string;
  /** Display name */
  name: string;
  /** UI category for grid column */
  category: CategoryId;
  /** TARA Tactic ID (e.g. QIF-N.IJ) */
  tactic: string;
  /** Hourglass bands affected */
  bands: BandId[];
  /** Severity level (original assessment) */
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
  /** NISS v1.0 scoring data (extension metrics: BI, CG, CV, RV, NP) */
  niss: NissScore;
  /** CVSS v4.0 scoring data (base + supplemental metrics) */
  cvss: CvssScore | null;
  /** Cross-references (related IDs, secondary tactics) */
  crossRefs: { related_ids?: string[]; secondary_tactics?: string[] } | null;
  /** Academic sources */
  sources: string[];
  /** TARA projection data (clinical, governance, engineering overlays) */
  tara: TaraProjection | null;
}

/** Transform registry techniques → ThreatVector[] */
export const THREAT_VECTORS: ThreatVector[] = registry.techniques.map((t: any) => ({
  id: t.id,
  name: t.attack,
  category: t.ui_category as CategoryId,
  tactic: t.tactic,
  bands: t.band_ids as unknown as BandId[],
  severity: t.severity as Severity,
  status: t.status as Status,
  coupling: t.coupling,
  access: t.access as AccessLevel,
  classicalDetection: t.classical,
  quantumDetection: t.quantum,
  description: t.notes,
  bandsStr: t.bands,
  niss: t.niss ?? { version: '1.0', vector: '', score: 0, severity: 'none', pins: false },
  cvss: t.cvss ?? null,
  crossRefs: t.cross_references ?? null,
  sources: t.sources ?? [],
  tara: t.tara ?? null,
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

/** Helper: count threats per NISS severity */
export function getNissStats() {
  const stats: Record<NissSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0, none: 0 };
  for (const t of THREAT_VECTORS) {
    stats[t.niss.severity]++;
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
    niss: getNissStats(),
  };
}

/** Lookup tactic name by ID */
export function getTacticName(tacticId: string): string {
  const tactic = THREAT_TACTICS.find((t: any) => t.id === tacticId);
  return tactic ? (tactic as any).name : tacticId;
}

/** Get tactic details with computed technique counts */
export function getTacticsWithCounts() {
  return THREAT_TACTICS.map((t: any) => ({
    id: t.id as string,
    name: t.name as string,
    domain: t.domain as string,
    domain_code: t.domain_code as string,
    action_code: t.action_code as string,
    description: t.description as string,
    count: THREAT_VECTORS.filter(v => v.tactic === t.id).length,
  }));
}

// ═══════════════════════════════════════════════════════════════
// TARA — Therapeutic Applications & Risk Assessment
// Four-projection overlay: Security (existing), Clinical, Governance, Engineering
// ═══════════════════════════════════════════════════════════════

/** Dual-use classification colors */
export const DUAL_USE_COLORS = {
  confirmed: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981' },
  probable: { bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.3)', text: '#06b6d4' },
  possible: { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)', text: '#8b5cf6' },
  silicon_only: { bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)', text: '#94a3b8' },
} as const;

/** FDA status colors */
export const FDA_STATUS_COLORS = {
  cleared: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981' },
  approved: { bg: 'rgba(34, 197, 94, 0.12)', text: '#22c55e' },
  breakthrough: { bg: 'rgba(6, 182, 212, 0.12)', text: '#06b6d4' },
  investigational: { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b' },
  none: { bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8' },
  'N/A': { bg: 'rgba(100, 116, 139, 0.12)', text: '#64748b' },
} as const;

/** Consent tier colors */
export const CONSENT_TIER_COLORS = {
  standard: { bg: 'rgba(34, 197, 94, 0.12)', text: '#22c55e' },
  enhanced: { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b' },
  IRB: { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444' },
  prohibited: { bg: 'rgba(127, 29, 29, 0.2)', text: '#ef4444' },
} as const;

/** Diagnostic cluster colors (NISS-DSM Bridge driven) */
export const DIAGNOSTIC_CLUSTER_COLORS = {
  cognitive_psychotic: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b' },
  mood_trauma: { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.3)', text: '#eab308' },
  motor_neurocognitive: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444' },
  persistent_personality: { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)', text: '#a855f7' },
  non_diagnostic: { bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)', text: '#94a3b8' },
} as const;

/** Diagnostic cluster display labels */
export const DIAGNOSTIC_CLUSTER_LABELS: Record<DiagnosticCluster, string> = {
  cognitive_psychotic: 'Cognitive/Psychotic',
  mood_trauma: 'Mood/Trauma',
  motor_neurocognitive: 'Motor/Neurocognitive',
  persistent_personality: 'Persistent/Personality',
  non_diagnostic: 'Non-Diagnostic',
} as const;

/** Engineering coupling type colors */
export const COUPLING_COLORS = {
  electromagnetic: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#3b82f6' },
  mechanical: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b' },
  thermal: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444' },
  optical: { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)', text: '#a855f7' },
  none: { bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)', text: '#94a3b8' },
} as const;

/** Filter: techniques with clinical therapeutic analogs */
export function getClinicalTechniques(): ThreatVector[] {
  return THREAT_VECTORS.filter(t => t.tara?.clinical != null);
}

/** Filter: silicon-only techniques (no therapeutic analog) */
export function getSiliconOnlyTechniques(): ThreatVector[] {
  return THREAT_VECTORS.filter(t => t.tara?.dual_use === 'silicon_only');
}

/** Filter: techniques by dual-use classification */
export function getTechniquesByDualUse(classification: DualUse): ThreatVector[] {
  return THREAT_VECTORS.filter(t => t.tara?.dual_use === classification);
}

/** Filter: techniques by FDA status of their therapeutic analog */
export function getTechniquesByFdaStatus(status: FdaStatus): ThreatVector[] {
  return THREAT_VECTORS.filter(t => t.tara?.clinical?.fda_status === status);
}

/** Filter: techniques by consent tier */
export function getTechniquesByConsentTier(tier: ConsentTier): ThreatVector[] {
  return THREAT_VECTORS.filter(t => t.tara?.governance.consent_tier === tier);
}

/** Filter: techniques by coupling mechanism */
export function getTechniquesByCoupling(mechanism: string): ThreatVector[] {
  return THREAT_VECTORS.filter(t => t.tara?.engineering.coupling.includes(mechanism));
}

/** Filter: techniques that treat a specific condition */
export function getTechniquesByCondition(condition: string): ThreatVector[] {
  const lc = condition.toLowerCase();
  return THREAT_VECTORS.filter(t =>
    t.tara?.clinical?.conditions.some(c => c.toLowerCase().includes(lc))
  );
}

/** DSM-5-TR specification from registry */
export const DSM5_SPEC = (registry as any).dsm5_spec ?? null;

/** Filter: techniques by diagnostic cluster */
export function getTechniquesByDiagCluster(cluster: DiagnosticCluster): ThreatVector[] {
  return THREAT_VECTORS.filter(t => t.tara?.dsm5?.cluster === cluster);
}

/** Filter: techniques by DSM-5 code */
export function getTechniquesByDsm5Code(code: string): ThreatVector[] {
  return THREAT_VECTORS.filter(t => {
    const dsm = t.tara?.dsm5;
    if (!dsm) return false;
    return dsm.primary.some(d => d.code === code) || dsm.secondary.some(d => d.code === code);
  });
}

/** DSM-5-TR diagnostic statistics */
export function getDsm5Stats() {
  const clusters: Record<DiagnosticCluster, number> = {
    cognitive_psychotic: 0, mood_trauma: 0, motor_neurocognitive: 0,
    persistent_personality: 0, non_diagnostic: 0,
  };
  const riskClass: Record<Dsm5RiskClass, number> = { direct: 0, indirect: 0, none: 0 };
  const codes = new Map<string, number>();
  let withDsm5 = 0;

  for (const t of THREAT_VECTORS) {
    const dsm = t.tara?.dsm5;
    if (!dsm) continue;
    withDsm5++;
    clusters[dsm.cluster]++;
    riskClass[dsm.risk_class]++;
    for (const d of dsm.primary) {
      codes.set(d.code, (codes.get(d.code) ?? 0) + 1);
    }
  }

  return {
    total: THREAT_VECTORS.length,
    withDsm5,
    clusters,
    riskClass,
    topCodes: [...codes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20),
  };
}

/** TARA changelog entries from the registry */
export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  summary: string;
  added?: string[];
  added_range?: string[];
  therapeutic_highlights: string[];
  techniques?: ThreatVector[];
}

export function getChangelog(): ChangelogEntry[] {
  const raw = (registry as any).changelog ?? [];
  return raw.map((entry: any) => {
    const ids = entry.added ?? [];
    const techniques = ids.length > 0
      ? THREAT_VECTORS.filter(t => ids.includes(t.id))
      : [];
    return { ...entry, techniques };
  });
}

export function getLatestChangelog(): ChangelogEntry | null {
  const log = getChangelog();
  return log.length > 0 ? log[0] : null;
}

/** TARA statistics summary */
export function getTaraStats() {
  const dualUse: Record<DualUse, number> = { confirmed: 0, probable: 0, possible: 0, silicon_only: 0 };
  const fdaStatus: Record<FdaStatus, number> = { cleared: 0, approved: 0, breakthrough: 0, investigational: 0, none: 0, 'N/A': 0 };
  const consentTier: Record<ConsentTier, number> = { standard: 0, enhanced: 0, IRB: 0, prohibited: 0 };
  const conditions = new Map<string, number>();
  let clinicalCount = 0;

  for (const t of THREAT_VECTORS) {
    if (!t.tara) continue;
    dualUse[t.tara.dual_use]++;
    consentTier[t.tara.governance.consent_tier]++;
    if (t.tara.clinical) {
      clinicalCount++;
      fdaStatus[t.tara.clinical.fda_status]++;
      for (const c of t.tara.clinical.conditions) {
        conditions.set(c, (conditions.get(c) ?? 0) + 1);
      }
    }
  }

  return {
    total: THREAT_VECTORS.length,
    withTara: THREAT_VECTORS.filter(t => t.tara).length,
    clinicalCount,
    dualUse,
    fdaStatus,
    consentTier,
    topConditions: [...conditions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20),
  };
}
