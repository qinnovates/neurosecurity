/**
 * The outcome for each QIF region: does it have a shape of its own, is it only
 * somewhere inside a larger shape, or is there no geometry for it. Computed
 * from the crosswalk and the manifest, never stored, so the committed counts
 * are a statement about the data and a test can hold them.
 */

import type { Crosswalk } from './anatomy-types';
import type { AssetManifest } from './manifest-types';

export interface RegionOutcome {
  /** A drawing row whose shape is the region, part of it, or an approximation of it. */
  own: string[];
  /** Only a larger shape with no boundary for the region. */
  contained: string[];
  /** Of the contained: a larger structure with its own name stands in (a gyrus for a cortical area). */
  containedWithNamedStandIn: string[];
  /** Of the contained: somewhere inside shapes that have no boundary for it at all. */
  containedWithNoBoundary: string[];
  /** Of the contained: a row that does not say which of the two it is. */
  containedUnexplained: string[];
  /** A record says no buildable atlas has geometry for it. */
  none: string[];
  /** Neither a drawing row nor a no-geometry record: a hole in the crosswalk. */
  unaccounted: string[];
  /** A drawing row none of whose labels is a node of any shipped asset. */
  withoutShippedNode: string[];
}

const CONTAINED = 'contained';

export function summariseRegionOutcome(regionIds: readonly string[], crosswalk: Crosswalk, manifest: AssetManifest | null): RegionOutcome {
  const shippedNodes = new Set((manifest?.assets ?? []).flatMap((asset) => asset.nodes.map((node) => `${node.extras.atlas}:${node.extras.label_id}`)));
  const outcome: RegionOutcome = {
    own: [], contained: [], containedWithNamedStandIn: [], containedWithNoBoundary: [], containedUnexplained: [], none: [], unaccounted: [], withoutShippedNode: [],
  };
  for (const regionId of regionIds) {
    const rows = crosswalk.rows.filter((row) => row.subject_kind === 'region' && row.subject_id === regionId && row.draws);
    const hasRecord = crosswalk.no_geometry.some((record) => record.subject_kind === 'region' && record.subject_id === regionId);
    if (rows.length === 0) {
      (hasRecord ? outcome.none : outcome.unaccounted).push(regionId);
      continue;
    }
    if (!rows.some((row) => row.atlas_ids.some((labelId) => shippedNodes.has(`${row.atlas}:${labelId}`)))) outcome.withoutShippedNode.push(regionId);
    if (!rows.every((row) => row.extent_match === CONTAINED)) {
      outcome.own.push(regionId);
      continue;
    }
    outcome.contained.push(regionId);
    const kinds = new Set(rows.map((row) => row.contained_kind));
    if (kinds.size !== 1 || kinds.has(undefined)) outcome.containedUnexplained.push(regionId);
    else (kinds.has('named_stand_in') ? outcome.containedWithNamedStandIn : outcome.containedWithNoBoundary).push(regionId);
  }
  return outcome;
}

const SAME = 'same';
const NO_NAME_MATCH = 'none';

/** Atlases whose shipped shapes are a probability map cut at a threshold: their volume depends on the cut. */
function listProbabilityCutAtlases(manifest: AssetManifest | null): Set<string> {
  const atlases = new Set<string>();
  for (const node of (manifest?.assets ?? []).flatMap((asset) => asset.nodes)) {
    if (node.volume_mm3_at['0.25'] !== node.volume_mm3_at['0.75']) atlases.add(node.extras.atlas);
  }
  return atlases;
}

/**
 * Grades that say more than the data supports:
 * - a contained row whose larger named structure stands in for the subject cannot claim that structure's
 *   name is the subject's name (a gyrus is not a synonym for a cortical area);
 * - a row on a probability map cut at a threshold cannot be graded `same`: the shape is where a share of a
 *   population's structures overlap, not the structure.
 */
export function findGradeRuleProblems(crosswalk: Crosswalk, manifest: AssetManifest | null): string[] {
  const probabilityCut = listProbabilityCutAtlases(manifest);
  return crosswalk.rows.flatMap((row) => {
    const problems: string[] = [];
    if (row.extent_match === CONTAINED && row.contained_kind === 'named_stand_in' && row.name_match !== NO_NAME_MATCH) {
      problems.push(`${row.subject_id}: a larger structure standing in for the subject is graded name_match "${row.name_match}"; it must be "none"`);
    }
    if (row.extent_match === SAME && probabilityCut.has(row.atlas)) {
      problems.push(`${row.subject_id}: graded extent "same" on "${row.atlas}", whose shapes are a probability map cut at a threshold`);
    }
    return problems;
  });
}
