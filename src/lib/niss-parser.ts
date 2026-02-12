/**
 * NISS (Neural Impact Scoring System) Vector Parser v1.0
 *
 * Pure TypeScript parser for NISS vector strings used throughout the
 * QIF threat registry. Handles parsing, validation, serialization,
 * scoring (with optional context profiles), and PINS evaluation.
 *
 * Compatible with NissScore from threat-data.ts — can be used to
 * hydrate vectors from the registry or compute scores independently.
 *
 * Zero external dependencies.
 */

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

/** Code values for Biological Impact */
export type BiCode = 'N' | 'L' | 'H' | 'C' | 'X';

/** Code values for Cognitive Integrity */
export type CgCode = 'N' | 'L' | 'H' | 'C' | 'X';

/** Code values for Consent Violation */
export type CvCode = 'N' | 'P' | 'E' | 'I' | 'X';

/** Code values for Reversibility */
export type RvCode = 'F' | 'T' | 'P' | 'I' | 'X';

/** Code values for Neuroplasticity */
export type NpCode = 'N' | 'T' | 'S' | 'X';

/** Severity levels for NISS scores */
export type NissSeverity = 'none' | 'low' | 'medium' | 'high' | 'critical';

/** Context profile identifiers for weighted scoring */
export type ContextProfile = 'clinical' | 'research' | 'consumer' | 'military';

/** Parsed NISS vector */
export interface NissVector {
  version: string;
  bi: BiCode;
  cg: CgCode;
  cv: CvCode;
  rv: RvCode;
  np: NpCode;
}

/** Full scoring result */
export interface NissResult {
  vector: NissVector;
  vectorString: string;
  score: number;
  severity: NissSeverity;
  pins: boolean;
}

/** Weight set for a context profile */
export interface ProfileWeights {
  bi: number;
  cg: number;
  cv: number;
  rv: number;
  np: number;
}

// ═══════════════════════════════════════════════════════════════════
// Canonical Metric Definitions
// ═══════════════════════════════════════════════════════════════════

/**
 * Numeric values for each metric code.
 * X (undefined/unknown) maps to undefined — handled specially in scoring.
 */
const BI_VALUES: Record<BiCode, number | undefined> = {
  N: 0.0,
  L: 3.3,
  H: 6.7,
  C: 10.0,
  X: undefined,
};

const CG_VALUES: Record<CgCode, number | undefined> = {
  N: 0.0,
  L: 3.3,
  H: 6.7,
  C: 10.0,
  X: undefined,
};

const CV_VALUES: Record<CvCode, number | undefined> = {
  N: 0.0,
  P: 3.3,
  E: 6.7,
  I: 10.0,
  X: undefined,
};

const RV_VALUES: Record<RvCode, number | undefined> = {
  F: 0.0,
  T: 3.3,
  P: 6.7,
  I: 10.0,
  X: undefined,
};

const NP_VALUES: Record<NpCode, number | undefined> = {
  N: 0.0,
  T: 5.0,
  S: 10.0,
  X: undefined,
};

/** Valid code sets for validation */
const VALID_BI: ReadonlySet<string> = new Set(['N', 'L', 'H', 'C', 'X']);
const VALID_CG: ReadonlySet<string> = new Set(['N', 'L', 'H', 'C', 'X']);
const VALID_CV: ReadonlySet<string> = new Set(['N', 'P', 'E', 'I', 'X']);
const VALID_RV: ReadonlySet<string> = new Set(['F', 'T', 'P', 'I', 'X']);
const VALID_NP: ReadonlySet<string> = new Set(['N', 'T', 'S', 'X']);

/** Supported NISS versions */
const SUPPORTED_VERSIONS: ReadonlySet<string> = new Set(['1.0']);

// ═══════════════════════════════════════════════════════════════════
// Context Profiles (optional weight overrides)
// ═══════════════════════════════════════════════════════════════════

export const CONTEXT_PROFILES: Record<ContextProfile, ProfileWeights> = {
  clinical:  { bi: 2.0, cg: 1.5, cv: 1.0, rv: 2.0, np: 1.0 },
  research:  { bi: 1.0, cg: 2.0, cv: 2.0, rv: 1.0, np: 1.5 },
  consumer:  { bi: 1.0, cg: 1.5, cv: 2.0, rv: 1.0, np: 1.0 },
  military:  { bi: 2.0, cg: 2.0, cv: 0.5, rv: 1.5, np: 1.5 },
} as const;

// ═══════════════════════════════════════════════════════════════════
// Parser
// ═══════════════════════════════════════════════════════════════════

/**
 * Parse a NISS vector string into a typed NissVector object.
 *
 * Expected format: `NISS:1.0/BI:H/CG:H/CV:E/RV:P/NP:T`
 *
 * @throws Error if the string is malformed or contains unrecognized segments.
 */
export function parseNiss(vectorString: string): NissVector {
  if (!vectorString || typeof vectorString !== 'string') {
    throw new Error('NISS vector string is required');
  }

  const trimmed = vectorString.trim();
  const segments = trimmed.split('/');

  if (segments.length !== 6) {
    throw new Error(
      `Expected 6 segments (NISS:version + 5 metrics), got ${segments.length}: "${trimmed}"`
    );
  }

  // Parse version prefix
  const versionSegment = segments[0];
  if (!versionSegment.startsWith('NISS:')) {
    throw new Error(
      `Vector must start with "NISS:" prefix, got "${versionSegment}"`
    );
  }
  const version = versionSegment.slice(5);
  if (!SUPPORTED_VERSIONS.has(version)) {
    throw new Error(
      `Unsupported NISS version "${version}". Supported: ${Array.from(SUPPORTED_VERSIONS).join(', ')}`
    );
  }

  // Parse metric segments
  const metrics: Record<string, string> = {};
  const expectedOrder = ['BI', 'CG', 'CV', 'RV', 'NP'];

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    const colonIdx = segment.indexOf(':');
    if (colonIdx === -1) {
      throw new Error(`Malformed segment (missing ":"): "${segment}"`);
    }
    const key = segment.slice(0, colonIdx);
    const value = segment.slice(colonIdx + 1);

    if (key !== expectedOrder[i - 1]) {
      throw new Error(
        `Expected metric "${expectedOrder[i - 1]}" at position ${i}, got "${key}"`
      );
    }

    metrics[key] = value;
  }

  return {
    version,
    bi: metrics['BI'] as BiCode,
    cg: metrics['CG'] as CgCode,
    cv: metrics['CV'] as CvCode,
    rv: metrics['RV'] as RvCode,
    np: metrics['NP'] as NpCode,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Validator
// ═══════════════════════════════════════════════════════════════════

/**
 * Validate a NissVector against canonical metric definitions.
 *
 * @returns Array of error strings. Empty array means valid.
 */
export function validateNiss(vector: NissVector): string[] {
  const errors: string[] = [];

  if (!vector) {
    return ['Vector is null or undefined'];
  }

  // Version check
  if (!SUPPORTED_VERSIONS.has(vector.version)) {
    errors.push(
      `Unsupported version "${vector.version}". Supported: ${Array.from(SUPPORTED_VERSIONS).join(', ')}`
    );
  }

  // Metric code checks
  if (!VALID_BI.has(vector.bi)) {
    errors.push(
      `Invalid BI code "${vector.bi}". Valid: ${Array.from(VALID_BI).join(', ')}`
    );
  }
  if (!VALID_CG.has(vector.cg)) {
    errors.push(
      `Invalid CG code "${vector.cg}". Valid: ${Array.from(VALID_CG).join(', ')}`
    );
  }
  if (!VALID_CV.has(vector.cv)) {
    errors.push(
      `Invalid CV code "${vector.cv}". Valid: ${Array.from(VALID_CV).join(', ')}`
    );
  }
  if (!VALID_RV.has(vector.rv)) {
    errors.push(
      `Invalid RV code "${vector.rv}". Valid: ${Array.from(VALID_RV).join(', ')}`
    );
  }
  if (!VALID_NP.has(vector.np)) {
    errors.push(
      `Invalid NP code "${vector.np}". Valid: ${Array.from(VALID_NP).join(', ')}`
    );
  }

  return errors;
}

// ═══════════════════════════════════════════════════════════════════
// Serializer
// ═══════════════════════════════════════════════════════════════════

/**
 * Serialize a NissVector back to the canonical string format.
 *
 * @returns String like `NISS:1.0/BI:H/CG:H/CV:E/RV:P/NP:T`
 */
export function serializeNiss(vector: NissVector): string {
  return [
    `NISS:${vector.version}`,
    `BI:${vector.bi}`,
    `CG:${vector.cg}`,
    `CV:${vector.cv}`,
    `RV:${vector.rv}`,
    `NP:${vector.np}`,
  ].join('/');
}

// ═══════════════════════════════════════════════════════════════════
// Scoring
// ═══════════════════════════════════════════════════════════════════

/**
 * Ceiling round to one decimal place.
 * e.g. 6.71 -> 6.8, 6.70 -> 6.7, 6.00 -> 6.0
 */
function ceilToTenth(value: number): number {
  return Math.ceil(value * 10) / 10;
}

/**
 * Determine severity label from a numeric score.
 */
export function getSeverity(score: number): NissSeverity {
  if (score === 0.0) return 'none';
  if (score <= 3.9) return 'low';
  if (score <= 6.9) return 'medium';
  if (score <= 8.9) return 'high';
  return 'critical';
}

/**
 * Evaluate the PINS (Priority Impact Notification System) flag.
 *
 * PINS is true when:
 * - BI is H or C (or X, treated as worst-case C), OR
 * - RV is I (or X, treated as worst-case I)
 */
export function evaluatePins(vector: NissVector): boolean {
  // BI: X treated as worst-case (C) -> PINS triggers
  const biTriggers = vector.bi === 'H' || vector.bi === 'C' || vector.bi === 'X';
  // RV: X treated as worst-case (I) -> PINS triggers
  const rvTriggers = vector.rv === 'I' || vector.rv === 'X';

  return biTriggers || rvTriggers;
}

/**
 * Score a NISS vector with optional context profile weighting.
 *
 * Without a profile: equal-weight average of assessed metrics.
 * With a profile: weighted average of assessed metrics.
 *
 * X (Not Defined) metrics are excluded from both numerator and denominator
 * per NISS spec Section 4.1. If all five metrics are X, returns score 0.0
 * with severity 'none'.
 *
 * Result is ceiling-rounded to 0.1.
 *
 * @param vector  Parsed NISS vector
 * @param profile Optional context profile name or custom weights
 * @returns Full NissResult with score, severity, and PINS
 */
export function scoreNiss(
  vector: NissVector,
  profile?: ContextProfile | ProfileWeights
): NissResult {
  // Validate first
  const errors = validateNiss(vector);
  if (errors.length > 0) {
    throw new Error(`Cannot score invalid vector: ${errors.join('; ')}`);
  }

  // Resolve numeric values — X returns undefined (excluded from scoring)
  const metrics: { key: keyof ProfileWeights; value: number | undefined }[] = [
    { key: 'bi', value: BI_VALUES[vector.bi] },
    { key: 'cg', value: CG_VALUES[vector.cg] },
    { key: 'cv', value: CV_VALUES[vector.cv] },
    { key: 'rv', value: RV_VALUES[vector.rv] },
    { key: 'np', value: NP_VALUES[vector.np] },
  ];

  // Filter out X (undefined) metrics
  const assessed = metrics.filter((m) => m.value !== undefined) as
    { key: keyof ProfileWeights; value: number }[];

  // All X — no composite score can be produced
  if (assessed.length === 0) {
    return {
      vector,
      vectorString: serializeNiss(vector),
      score: 0.0,
      severity: 'none',
      pins: evaluatePins(vector),
    };
  }

  let score: number;

  if (profile) {
    // Resolve profile weights
    const weights: ProfileWeights =
      typeof profile === 'string' ? CONTEXT_PROFILES[profile] : profile;

    if (!weights) {
      throw new Error(
        `Unknown context profile "${profile}". Valid: ${Object.keys(CONTEXT_PROFILES).join(', ')}`
      );
    }

    let weightedSum = 0;
    let weightTotal = 0;
    for (const m of assessed) {
      weightedSum += weights[m.key] * m.value;
      weightTotal += weights[m.key];
    }

    score = ceilToTenth(weightedSum / weightTotal);
  } else {
    // Equal-weight: average of assessed (non-X) metrics
    const sum = assessed.reduce((acc, m) => acc + m.value, 0);
    score = ceilToTenth(sum / assessed.length);
  }

  // Clamp to [0, 10]
  score = Math.min(10.0, Math.max(0.0, score));

  return {
    vector,
    vectorString: serializeNiss(vector),
    score,
    severity: getSeverity(score),
    pins: evaluatePins(vector),
  };
}

// ═══════════════════════════════════════════════════════════════════
// Convenience: parse + score in one call
// ═══════════════════════════════════════════════════════════════════

/**
 * Parse a vector string and immediately score it.
 *
 * @param vectorString  e.g. `NISS:1.0/BI:H/CG:H/CV:E/RV:P/NP:T`
 * @param profile       Optional context profile for weighted scoring
 * @returns Full NissResult
 */
export function parseAndScore(
  vectorString: string,
  profile?: ContextProfile | ProfileWeights
): NissResult {
  const vector = parseNiss(vectorString);
  return scoreNiss(vector, profile);
}

// ═══════════════════════════════════════════════════════════════════
// Lookup helpers (for UI display, tooltips, etc.)
// ═══════════════════════════════════════════════════════════════════

/** Human-readable metric names */
export const METRIC_NAMES: Record<string, string> = {
  bi: 'Biological Impact',
  cg: 'Cognitive Integrity',
  cv: 'Consent Violation',
  rv: 'Reversibility',
  np: 'Neuroplasticity',
} as const;

/** Human-readable code labels per metric */
export const CODE_LABELS: Record<string, Record<string, string>> = {
  bi: { N: 'None', L: 'Low', H: 'High', C: 'Critical', X: 'Undefined' },
  cg: { N: 'None', L: 'Low', H: 'High', C: 'Critical', X: 'Undefined' },
  cv: { N: 'None', P: 'Partial', E: 'Extensive', I: 'Involuntary', X: 'Undefined' },
  rv: { F: 'Fully Reversible', T: 'Treatable', P: 'Partially Reversible', I: 'Irreversible', X: 'Undefined' },
  np: { N: 'None', T: 'Temporary', S: 'Structural', X: 'Undefined' },
} as const;

/** Numeric value lookups keyed by metric id */
export const METRIC_VALUES: Record<string, Record<string, number | undefined>> = {
  bi: BI_VALUES,
  cg: CG_VALUES,
  cv: CV_VALUES,
  rv: RV_VALUES,
  np: NP_VALUES,
} as const;

/** Severity color map (matches threat-data.ts SEVERITY_COLORS + none) */
export const NISS_SEVERITY_COLORS: Record<NissSeverity, { bg: string; border: string; text: string }> = {
  none:     { bg: 'rgba(148, 163, 184, 0.08)', border: 'rgba(148, 163, 184, 0.2)', text: '#64748b' },
  low:      { bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)', text: '#94a3b8' },
  medium:   { bg: 'rgba(234, 179, 8, 0.15)',   border: 'rgba(234, 179, 8, 0.3)',   text: '#eab308' },
  high:     { bg: 'rgba(245, 158, 11, 0.15)',  border: 'rgba(245, 158, 11, 0.3)',  text: '#f59e0b' },
  critical: { bg: 'rgba(239, 68, 68, 0.15)',   border: 'rgba(239, 68, 68, 0.3)',   text: '#ef4444' },
} as const;
