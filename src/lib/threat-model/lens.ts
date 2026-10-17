/**
 * The lenses a person looks at a device's risks through: which part of the device, how a
 * technique gets in, what it does, and the catalog facets of the technique behind a row.
 * Lenses narrow what is shown; they never change what the engine found.
 */

import type { CatalogSeverity, CatalogTechnique } from './catalog-types';
import type { DeviceModel } from './device-model';
import { describeEvidence } from './evidence-levels';
import { PLACED_ENTRY_PATHS, type PlacedEntryPath } from './reference-data-types';
import { THREAT_GOALS, type RiskRow, type StrideCategory, type ThreatGoal } from './report-types';
import { isRiskAddressed } from './risk-register';

export interface Lens {
  /** A component or link id, or null for the whole device. */
  elementId: string | null;
  /** False, the default, shows a selected part together with every connection it is an end of. True shows the part alone. */
  isElementOnly: boolean;
  /** Empty means every entry path. */
  entryPaths: readonly PlacedEntryPath[];
  /** Empty means every goal. */
  goals: readonly ThreatGoal[];
  /** One catalog technique, or null for all. */
  techniqueId: string | null;
  /** Empty means every catalog severity. */
  severities: readonly CatalogSeverity[];
  /** Evidence values by label, as `describeEvidence` words them (the same values the catalog filter uses). Empty means all. */
  evidenceLevels: readonly string[];
  /** Hourglass band ids; a row passes when its technique lists any of them. Empty means all. */
  bandIds: readonly string[];
}

export const EMPTY_LENS: Lens = {
  elementId: null, isElementOnly: false, entryPaths: [], goals: [], techniqueId: null, severities: [], evidenceLevels: [], bandIds: [],
};

/** What a lens needs beyond the rows: the model, for a part's connections, and the catalog, for bands. */
export interface LensContext {
  model: Pick<DeviceModel, 'links'>;
  techniques: readonly Pick<CatalogTechnique, 'id' | 'bandIds'>[];
}

export function isLensActive(lens: Lens): boolean {
  return lens.elementId !== null || lens.techniqueId !== null
    || [lens.entryPaths, lens.goals, lens.severities, lens.evidenceLevels, lens.bandIds].some((values) => values.length > 0);
}

/** The baseline category that is itself a goal: a denial-of-service row is a Deny row. */
const GOAL_BY_BASELINE_CATEGORY: Readonly<Partial<Record<StrideCategory, ThreatGoal>>> = { denial_of_service: 'deny' };

/** The goal a row counts under: the technique's own, or Deny for a baseline denial-of-service row. */
export function lensGoalOf(row: RiskRow): ThreatGoal | null {
  if (row.goal !== null || row.source !== 'stride') return row.goal;
  return row.strideCategories.map((category) => GOAL_BY_BASELINE_CATEGORY[category]).find((goal) => goal !== undefined) ?? null;
}

/** The selected element and, unless the lens says otherwise, every connection a selected part is an end of. */
export function listLensElementIds(lens: Pick<Lens, 'elementId' | 'isElementOnly'>, model: Pick<DeviceModel, 'links'> | undefined): string[] {
  if (lens.elementId === null) return [];
  if (lens.isElementOnly || model === undefined) return [lens.elementId];
  const connectionIds = model.links
    .filter((link) => link.fromComponentId === lens.elementId || link.toComponentId === lens.elementId)
    .map((link) => link.id);
  return [lens.elementId, ...connectionIds];
}

interface ResolvedLens {
  lens: Lens;
  /** Null when no element is selected. */
  elementIds: ReadonlySet<string> | null;
  bandIdsByTechnique: ReadonlyMap<string, readonly string[]>;
}

function resolveLens(lens: Lens, context: LensContext | undefined): ResolvedLens {
  return {
    lens,
    elementIds: lens.elementId === null ? null : new Set(listLensElementIds(lens, context?.model)),
    bandIdsByTechnique: new Map((context?.techniques ?? []).map((technique) => [technique.id, technique.bandIds])),
  };
}

function matchesCatalogFacets(row: RiskRow, { lens, bandIdsByTechnique }: ResolvedLens): boolean {
  if (lens.techniqueId !== null && row.techniqueId !== lens.techniqueId) return false;
  if (lens.severities.length > 0 && (row.catalogSeverity === null || !lens.severities.includes(row.catalogSeverity))) return false;
  if (lens.evidenceLevels.length > 0 && (row.source !== 'catalog' || !lens.evidenceLevels.includes(describeEvidence(row).label))) return false;
  if (lens.bandIds.length === 0) return true;
  const rowBandIds = row.techniqueId === null ? [] : bandIdsByTechnique.get(row.techniqueId) ?? [];
  return rowBandIds.some((bandId) => lens.bandIds.includes(bandId));
}

function matchesLens(row: RiskRow, resolved: ResolvedLens): boolean {
  const { lens, elementIds } = resolved;
  if (elementIds !== null && !elementIds.has(row.elementId)) return false;
  if (lens.entryPaths.length > 0 && (row.entryPath === null || !lens.entryPaths.includes(row.entryPath))) return false;
  const goal = lensGoalOf(row);
  if (lens.goals.length > 0 && (goal === null || !lens.goals.includes(goal))) return false;
  return matchesCatalogFacets(row, resolved);
}

/**
 * Rows the lens lets through. A baseline row has no entry path, technique, severity, evidence or
 * band, so those lenses hide it; the Deny goal keeps the baseline denial-of-service rows.
 */
export function applyLens(rows: readonly RiskRow[], lens: Lens, context: LensContext): RiskRow[] {
  const resolved = resolveLens(lens, context);
  return rows.filter((row) => matchesLens(row, resolved));
}

export interface LensCounts {
  /** Open catalog rows by entry path. */
  byEntryPath: Record<PlacedEntryPath, number>;
  /** Open rows by goal: catalog rows, and the baseline rows that count under a goal. */
  byGoal: Record<ThreatGoal, number>;
  /** The part of `byGoal` that is baseline rows, so a screen can say how much of a number is the generic baseline. */
  baselineByGoal: Record<ThreatGoal, number>;
}

/**
 * Open risks under each lens value, counted with the other lenses applied, so a number
 * always says what choosing that value would show. Without a context, a selected part
 * cannot bring its connections and the band lens matches nothing.
 */
export function countOpenRisks(rows: readonly RiskRow[], lens: Lens, context?: LensContext): LensCounts {
  const openRows = rows.filter((row) => !isRiskAddressed(row));
  const under = (cleared: Partial<Lens>): RiskRow[] => {
    const resolved = resolveLens({ ...lens, ...cleared }, context);
    return openRows.filter((row) => matchesLens(row, resolved));
  };
  const withoutEntryPath = under({ entryPaths: [] }).filter((row) => row.source === 'catalog');
  const withoutGoal = under({ goals: [] });
  const tally = <Key extends string>(keys: readonly Key[], pool: readonly RiskRow[], read: (row: RiskRow) => Key | null): Record<Key, number> =>
    Object.fromEntries(keys.map((key) => [key, pool.filter((row) => read(row) === key).length])) as Record<Key, number>;
  return {
    byEntryPath: tally(PLACED_ENTRY_PATHS, withoutEntryPath, (row) => row.entryPath),
    byGoal: tally(THREAT_GOALS, withoutGoal, lensGoalOf),
    baselineByGoal: tally(THREAT_GOALS, withoutGoal.filter((row) => row.source === 'stride'), lensGoalOf),
  };
}
