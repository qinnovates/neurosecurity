/**
 * The lenses a person looks at a device's risks through: which part of the device,
 * how a technique gets in, and what it does. Lenses narrow what is shown; they never
 * change what the engine found.
 */

import { PLACED_ENTRY_PATHS, type PlacedEntryPath } from './reference-data-types';
import { THREAT_GOALS, type RiskRow, type ThreatGoal } from './report-types';
import { isRiskAddressed } from './risk-register';

export interface Lens {
  /** A component or link id, or null for the whole device. */
  elementId: string | null;
  /** Empty means every entry path. */
  entryPaths: readonly PlacedEntryPath[];
  /** Empty means every goal. */
  goals: readonly ThreatGoal[];
}

export const EMPTY_LENS: Lens = { elementId: null, entryPaths: [], goals: [] };

export function isLensActive(lens: Lens): boolean {
  return lens.elementId !== null || lens.entryPaths.length > 0 || lens.goals.length > 0;
}

function matchesLens(row: RiskRow, lens: Lens): boolean {
  if (lens.elementId !== null && row.elementId !== lens.elementId) return false;
  if (lens.entryPaths.length > 0 && (row.entryPath === null || !lens.entryPaths.includes(row.entryPath))) return false;
  return lens.goals.length === 0 || (row.goal !== null && lens.goals.includes(row.goal));
}

/** Rows the lens lets through. Baseline rows carry no entry path or goal, so those two lenses hide them. */
export function applyLens(rows: readonly RiskRow[], lens: Lens): RiskRow[] {
  return rows.filter((row) => matchesLens(row, lens));
}

export interface LensCounts {
  byEntryPath: Record<PlacedEntryPath, number>;
  byGoal: Record<ThreatGoal, number>;
}

/**
 * Open catalog risks under each lens value, counted with the other lenses applied, so a
 * number always says what choosing that value would show.
 */
export function countOpenRisks(rows: readonly RiskRow[], lens: Lens, controlsInPlace: readonly string[]): LensCounts {
  const openRows = rows.filter((row) => row.source === 'catalog' && !isRiskAddressed(row, controlsInPlace));
  const withoutEntryPath = applyLens(openRows, { ...lens, entryPaths: [] });
  const withoutGoal = applyLens(openRows, { ...lens, goals: [] });
  const tally = <Key extends string>(keys: readonly Key[], pool: readonly RiskRow[], read: (row: RiskRow) => Key | null): Record<Key, number> =>
    Object.fromEntries(keys.map((key) => [key, pool.filter((row) => read(row) === key).length])) as Record<Key, number>;
  return {
    byEntryPath: tally(PLACED_ENTRY_PATHS, withoutEntryPath, (row) => row.entryPath),
    byGoal: tally(THREAT_GOALS, withoutGoal, (row) => row.goal),
  };
}
