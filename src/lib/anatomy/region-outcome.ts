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
  const outcome: RegionOutcome = { own: [], contained: [], none: [], unaccounted: [], withoutShippedNode: [] };
  for (const regionId of regionIds) {
    const rows = crosswalk.rows.filter((row) => row.subject_kind === 'region' && row.subject_id === regionId && row.draws);
    const hasRecord = crosswalk.no_geometry.some((record) => record.subject_kind === 'region' && record.subject_id === regionId);
    if (rows.length === 0) {
      (hasRecord ? outcome.none : outcome.unaccounted).push(regionId);
      continue;
    }
    if (!rows.some((row) => row.atlas_ids.some((labelId) => shippedNodes.has(`${row.atlas}:${labelId}`)))) outcome.withoutShippedNode.push(regionId);
    (rows.every((row) => row.extent_match === CONTAINED) ? outcome.contained : outcome.own).push(regionId);
  }
  return outcome;
}
