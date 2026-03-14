/**
 * Attack Chain visualization constants.
 * Domain colors, chain role labels, and TARA alias parsers.
 */

export type DomainCode =
  | 'VIS' | 'AUD' | 'SOM' | 'VES' | 'MOT' | 'EMO'
  | 'COG' | 'MEM' | 'LNG' | 'AUT' | 'IDN' | 'SIL';

export interface DomainStyle {
  fill: string;
  stroke: string;
  label: string;
}

/** 12 domains from the TARA domain taxonomy (Section 3). */
export const DOMAIN_COLORS: Record<DomainCode, DomainStyle> = {
  SIL: { fill: '#dbeafe', stroke: '#3b82f6', label: 'Silicon' },
  VIS: { fill: '#ede9fe', stroke: '#8b5cf6', label: 'Vision' },
  AUD: { fill: '#fce7f3', stroke: '#ec4899', label: 'Audition' },
  SOM: { fill: '#fee2e2', stroke: '#ef4444', label: 'Somatosensory' },
  VES: { fill: '#e0e7ff', stroke: '#6366f1', label: 'Vestibular' },
  MOT: { fill: '#dcfce7', stroke: '#22c55e', label: 'Motor' },
  EMO: { fill: '#fef3c7', stroke: '#f59e0b', label: 'Affect' },
  COG: { fill: '#fef9c3', stroke: '#eab308', label: 'Cognition' },
  MEM: { fill: '#ccfbf1', stroke: '#14b8a6', label: 'Memory' },
  LNG: { fill: '#f0fdf4', stroke: '#16a34a', label: 'Language' },
  AUT: { fill: '#fae8ff', stroke: '#d946ef', label: 'Autonomic' },
  IDN: { fill: '#f1f5f9', stroke: '#64748b', label: 'Identity' },
};

export type ChainRole =
  | 'reconnaissance' | 'initial_access' | 'pivot'
  | 'objective' | 'persistence' | 'exfiltration';

export interface RoleConfig {
  label: string;
  icon: string;
}

export const ROLE_CONFIG: Record<ChainRole, RoleConfig> = {
  reconnaissance: { label: 'Recon', icon: '\uD83D\uDD0D' },
  initial_access:  { label: 'Access', icon: '\uD83D\uDD13' },
  pivot:           { label: 'Pivot', icon: '\u21AA' },
  objective:       { label: 'Objective', icon: '\uD83C\uDFAF' },
  persistence:     { label: 'Persist', icon: '\uD83D\uDD12' },
  exfiltration:    { label: 'Exfil', icon: '\uD83D\uDCE4' },
};

/** Detectability levels for the detection timeline bar. */
export const DETECT_COLORS: Record<string, string> = {
  easy: '#22c55e',
  moderate: '#f59e0b',
  hard: '#ef4444',
};

/** Extract domain code from a TARA alias like "TARA-SIL-M-012". */
export function extractDomain(alias: string): DomainCode | null {
  const m = alias.match(/^TARA-([A-Z]{3})-/);
  return m ? (m[1] as DomainCode) : null;
}

/** Extract mode code (R/M/D) from a TARA alias. */
export function extractMode(alias: string): string | null {
  const m = alias.match(/^TARA-[A-Z]{3}-([RMD])-/);
  return m ? m[1] : null;
}

/** True if this domain is in the silicon zone (not biological). */
export function isSilicon(domain: DomainCode | null): boolean {
  return domain === 'SIL';
}
