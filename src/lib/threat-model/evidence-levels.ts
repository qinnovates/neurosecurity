/**
 * How strongly a technique is evidenced, as the interface draws it. The catalog writes
 * evidence as a free string; four values are known and ranked. Anything else is kept
 * under its own word and drawn as "other", so a new status is shown and never hidden.
 */

import { EVIDENCE_STATUS_RANK } from './catalog-types';

export const EVIDENCE_LEVELS = ['confirmed', 'demonstrated', 'emerging', 'theoretical', 'other'] as const;
export type EvidenceLevel = typeof EVIDENCE_LEVELS[number];

const LEVEL_BY_STATUS: Readonly<Record<typeof EVIDENCE_STATUS_RANK[number], EvidenceLevel>> = {
  CONFIRMED: 'confirmed',
  DEMONSTRATED: 'demonstrated',
  EMERGING: 'emerging',
  THEORETICAL: 'theoretical',
};

function isRankedStatus(status: string): status is typeof EVIDENCE_STATUS_RANK[number] {
  return (EVIDENCE_STATUS_RANK as readonly string[]).includes(status);
}

export function evidenceLevelOf(status: string): EvidenceLevel {
  const normalised = status.trim().toUpperCase();
  return isRankedStatus(normalised) ? LEVEL_BY_STATUS[normalised] : 'other';
}

/** The status as the catalog wrote it, in sentence case: "CONFIRMED" becomes "Confirmed". */
export function evidenceLabel(status: string): string {
  const trimmed = status.trim();
  if (trimmed === '') return 'Not stated';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export interface EvidenceLevelCount {
  level: EvidenceLevel;
  count: number;
  /** The catalog's own words for this level; more than one only for "other". */
  statuses: string[];
}

/** One entry per level, strongest first, including levels with a count of zero. */
export function countByEvidenceLevel(items: readonly { evidenceStatus: string }[]): EvidenceLevelCount[] {
  const counts = new Map<EvidenceLevel, { count: number; statuses: Set<string> }>(
    EVIDENCE_LEVELS.map((level) => [level, { count: 0, statuses: new Set<string>() }]),
  );
  for (const item of items) {
    const entry = counts.get(evidenceLevelOf(item.evidenceStatus));
    if (entry === undefined) continue;
    entry.count += 1;
    entry.statuses.add(evidenceLabel(item.evidenceStatus));
  }
  return EVIDENCE_LEVELS.map((level) => {
    const entry = counts.get(level);
    return { level, count: entry?.count ?? 0, statuses: [...(entry?.statuses ?? [])].sort() };
  });
}
