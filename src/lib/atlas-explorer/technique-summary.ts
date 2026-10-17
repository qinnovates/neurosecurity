/**
 * What the catalog and the drafted links say about one technique, for the
 * panel beside the technique lens: which regions it is linked to, which it
 * names without the link counting, and which of its words resolve to nothing.
 */

import type { IndexReviewState } from '@/lib/anatomy/anatomy-index-types';
import { nameBands, weakestReviewState, type ExplorerModel } from './explorer-model';
import { describeUncountedLink } from './region-lens';
import type { TechniqueOptionKind } from './subject-options';

export interface TechniqueSummary {
  id: string;
  name: string;
  /** The technique's bands with their names, as shown. */
  bandNames: string;
  kind: TechniqueOptionKind;
  linkedRegions: Array<{ id: string; name: string }>;
  namedNotCounted: Array<{ id: string; name: string; term: string; reason: string }>;
  /** The catalog's own words for structures the atlas file has no region for. */
  unresolvedTerms: string[];
  reviewState: IndexReviewState | null;
}

/** @returns null for an id the catalog does not hold */
export function summariseTechnique(model: ExplorerModel, techniqueId: string): TechniqueSummary | null {
  const deviceOnly = model.deviceOnlyTechniquesById.get(techniqueId);
  if (deviceOnly !== undefined) {
    return { id: deviceOnly.id, name: deviceOnly.name, bandNames: nameBands(model, deviceOnly.band_ids), kind: 'device_only', linkedRegions: [], namedNotCounted: [], unresolvedTerms: [], reviewState: null };
  }
  const technique = model.techniquesById.get(techniqueId);
  if (technique === undefined) return null;
  const nameOf = (regionId: string): string => model.regionsById.get(regionId)?.name ?? regionId;
  const resolved = technique.links.flatMap((link) => (link.resolved_region_id === null ? [] : [{ link, regionId: link.resolved_region_id }]));
  const litIds = [...new Set(resolved.filter(({ link }) => link.lit).map(({ regionId }) => regionId))];
  return {
    id: technique.id,
    name: technique.name,
    bandNames: nameBands(model, technique.band_ids),
    kind: technique.scope,
    linkedRegions: litIds.map((regionId) => ({ id: regionId, name: nameOf(regionId) })),
    namedNotCounted: resolved.filter(({ link }) => !link.lit).map(({ link, regionId }) => ({ id: regionId, name: nameOf(regionId), term: link.term, reason: describeUncountedLink(link) })),
    unresolvedTerms: technique.links.filter((link) => link.resolved_region_id === null).map((link) => link.term),
    reviewState: weakestReviewState(technique.links.map((link) => link.review_state)),
  };
}
