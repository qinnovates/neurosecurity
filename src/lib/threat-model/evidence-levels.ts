/**
 * How strongly a technique is evidenced, as the interface draws it. The catalog grades
 * evidence by tier (see src/lib/evidence-tiers.ts) and keeps its older one-word status as
 * a legacy field. The tier is read first. A record with no tier falls back to the status,
 * and a value neither scheme knows is kept under its own word and drawn as "other", so a
 * new value is shown and never hidden.
 */

import { EVIDENCE_TIER_GROUP, EVIDENCE_TIER_LABELS, type EvidenceTierCode } from '@/lib/evidence-tiers';
import { EVIDENCE_STATUS_RANK } from './catalog-types';

/** Strongest first. The first four are the catalog's tier groups. */
export const EVIDENCE_LEVELS = ['validated', 'demonstrated', 'theoretical', 'speculative', 'other'] as const;
export type EvidenceLevel = typeof EVIDENCE_LEVELS[number];

const TIER_CODES = Object.keys(EVIDENCE_TIER_GROUP) as EvidenceTierCode[];
const TIER_NUMBER_PREFIX = /^Tier \d+ — /;

/** Used only when a record has no tier: the nearest group for each ranked legacy status. */
const LEVEL_BY_LEGACY_STATUS: Readonly<Record<typeof EVIDENCE_STATUS_RANK[number], EvidenceLevel>> = {
  CONFIRMED: 'demonstrated',
  DEMONSTRATED: 'demonstrated',
  EMERGING: 'theoretical',
  THEORETICAL: 'theoretical',
};

export interface EvidenceSource {
  /** The catalog's derived tier code, or null when the record has none. */
  evidenceTier: string | null;
  /** The legacy one-word status. */
  evidenceStatus: string | null;
}

export interface Evidence {
  level: EvidenceLevel;
  /** The catalog's own words: the tier's name, or the legacy status in sentence case. */
  label: string;
  /** Position among everything the catalog can say, strongest first; used for sorting. */
  rank: number;
}

function isTierCode(value: string | null): value is EvidenceTierCode {
  return value !== null && (TIER_CODES as readonly string[]).includes(value);
}

function isRankedStatus(status: string): status is typeof EVIDENCE_STATUS_RANK[number] {
  return (EVIDENCE_STATUS_RANK as readonly string[]).includes(status);
}

function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function describeEvidence(source: EvidenceSource): Evidence {
  if (isTierCode(source.evidenceTier)) {
    return {
      level: EVIDENCE_TIER_GROUP[source.evidenceTier],
      label: EVIDENCE_TIER_LABELS[source.evidenceTier].replace(TIER_NUMBER_PREFIX, ''),
      rank: TIER_CODES.indexOf(source.evidenceTier),
    };
  }
  const status = (source.evidenceTier ?? source.evidenceStatus ?? '').trim();
  const upperStatus = status.toUpperCase();
  if (isRankedStatus(upperStatus)) {
    return { level: LEVEL_BY_LEGACY_STATUS[upperStatus], label: sentenceCase(status), rank: TIER_CODES.length + EVIDENCE_STATUS_RANK.indexOf(upperStatus) };
  }
  return { level: 'other', label: status === '' ? 'Not stated' : sentenceCase(status.replaceAll('_', ' ')), rank: TIER_CODES.length + EVIDENCE_STATUS_RANK.length };
}

export interface EvidenceCount extends Evidence {
  count: number;
}

/** One entry per distinct evidence value present, strongest first. */
export function countByEvidence(items: readonly EvidenceSource[]): EvidenceCount[] {
  const counts = new Map<string, EvidenceCount>();
  for (const item of items) {
    const evidence = describeEvidence(item);
    const entry = counts.get(evidence.label);
    if (entry === undefined) counts.set(evidence.label, { ...evidence, count: 1 });
    else entry.count += 1;
  }
  return [...counts.values()].sort((left, right) => left.rank - right.rank || left.label.localeCompare(right.label));
}

/** One entry per level, strongest first, including levels with a count of zero. */
export function countByEvidenceLevel(items: readonly EvidenceSource[]): { level: EvidenceLevel; count: number }[] {
  const byLevel = new Map<EvidenceLevel, number>(EVIDENCE_LEVELS.map((level) => [level, 0]));
  for (const item of items) {
    const { level } = describeEvidence(item);
    byLevel.set(level, (byLevel.get(level) ?? 0) + 1);
  }
  return EVIDENCE_LEVELS.map((level) => ({ level, count: byLevel.get(level) ?? 0 }));
}
