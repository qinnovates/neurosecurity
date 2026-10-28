/**
 * Builds each region's geometry set: the atlas structure keys a region's
 * highlight, pin or trace anchor may use. This is the machine stage of G6
 * §5.19 (R1, asymmetric containment) — it fixes the bug where a container's
 * rows leaked onto the parts it declares, so a part's highlight painted the
 * whole container instead of its own structure.
 *
 * R1: geometry_set(region) = region's own direct rows, union the direct rows
 * of every region `contains` names as its child. A region's rows never flow
 * up to its declared parent — `contains` is read one direction only. The
 * owner map in build-owner-map.ts stays symmetric on purpose: it drives
 * picking and the structure chooser, where "also reachable via X" is useful.
 * This file drives what a region is allowed to paint or anchor on, where the
 * leak is a correctness bug, not a feature.
 */

import type { ContainsRelation, CrosswalkRow } from './anatomy-types';
import { structureKey } from './crosswalk-rules';

export interface RegionGeometrySet {
  regionId: string;
  /** Structure keys ("atlas:labelId") this region's geometry set may paint or anchor on. */
  structureKeys: string[];
  /** Declared children (G6's `contains` child) whose direct rows were folded in. Empty for a region with none. */
  includesChildren: string[];
}

function directStructureKeys(rows: readonly CrosswalkRow[], regionId: string): string[] {
  return rows
    .filter((row) => row.subject_kind === 'region' && row.subject_id === regionId)
    .flatMap((row) => row.atlas_ids.map((labelId) => structureKey(row.atlas, labelId)));
}

/**
 * One region's R1 geometry set. `regionId` need not own a row itself (a
 * region can be declared as a parent purely to fold its children's rows in).
 */
export function buildRegionGeometrySet(
  rows: readonly CrosswalkRow[],
  contains: readonly ContainsRelation[],
  regionId: string,
): RegionGeometrySet {
  const own = directStructureKeys(rows, regionId);
  const children = contains.filter((relation) => relation.parent === regionId).map((relation) => relation.child);
  const childKeys = children.flatMap((childId) => directStructureKeys(rows, childId));
  const structureKeys = [...new Set([...own, ...childKeys])];
  return { regionId, structureKeys, includesChildren: children };
}

/** Every subject named as a region, or named on either side of a `contains` relation, with its R1 geometry set. */
export function buildAllRegionGeometrySets(
  rows: readonly CrosswalkRow[],
  contains: readonly ContainsRelation[],
): Map<string, RegionGeometrySet> {
  const regionIds = new Set<string>();
  for (const row of rows) if (row.subject_kind === 'region') regionIds.add(row.subject_id);
  for (const relation of contains) {
    regionIds.add(relation.parent);
    regionIds.add(relation.child);
  }
  return new Map([...regionIds].map((regionId) => [regionId, buildRegionGeometrySet(rows, contains, regionId)]));
}
