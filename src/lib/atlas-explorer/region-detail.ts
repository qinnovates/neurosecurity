/**
 * Everything the inspector shows for one region that the index and the catalog
 * hold: what stands for it, the techniques linked to it and the ones that only
 * share its band, and the NISS, DSM and device facts with their counts.
 * Quotes and literature statements arrive later, from the lazy evidence files.
 */

import type { IndexReviewState, IndexStructure, IndexSubject } from '@/lib/anatomy/anatomy-index-types';
import { NISS_STEPS } from '@/lib/anatomy/colour-modes';
import type { LimitSentence } from '@/lib/anatomy/limits-copy';
import type { CatalogBand } from './explorer-catalog';
import { listLitLinks, type ExplorerModel, type RegionLink } from './explorer-model';
import { limitForGeometry, limitForSource } from './limit-selection';
import { describeUncountedLink } from './region-lens';

const LINK_KEY_SEPARATOR = ':';
const MIRRORED = 'mirrored';

/** The key of a technique link in the evidence file: `technique_id:term`, as the build writes it. */
export function evidenceKeyOfLink(techniqueId: string, term: string): string {
  return `${techniqueId}${LINK_KEY_SEPARATOR}${term}`;
}

export interface DetailShape {
  structureKey: string;
  /** The atlas's own name for the label, or its id when the label table gives none. */
  label: string;
  sourceName: string;
  sourceLimit: LimitSentence;
  /** Whether a mesh or marker ships for it in this build. */
  shipped: boolean;
  mirrored: boolean;
  /** Other QIF regions whose records point at the same shape. */
  sharedWith: string[];
  reviewState: IndexReviewState;
}

export interface DetailTechnique {
  id: string;
  name: string;
  bandIds: string[];
  nissSeverity: string | null;
  dsmCluster: string | null;
  /** The catalog's own word for the structure. */
  term: string;
  evidenceKey: string;
  reviewState: IndexReviewState;
  /** Why the link is not counted. Null for a counted link. */
  uncountedReason: string | null;
}

export interface RegionDetail {
  region: IndexSubject;
  band: CatalogBand | null;
  /** The atlas file's own description, or null when it gives none. */
  description: string | null;
  geometryLimit: LimitSentence;
  shapes: DetailShape[];
  linked: DetailTechnique[];
  namedNotCounted: DetailTechnique[];
  /** Techniques tagged with the region's band whose text names no structure. They are not links to this region. */
  bandLevel: Array<{ id: string; name: string }>;
  /** The highest NISS step among linked techniques, or null: no data, never "low". */
  nissStep: string | null;
  clusters: Array<{ cluster: string; entryCount: number }>;
  deviceIds: string[];
}

function toDetailShape(model: ExplorerModel, region: IndexSubject, structure: IndexStructure): DetailShape {
  const sourceName = model.index.sources.find((source) => source.id === structure.atlas)?.name ?? structure.atlas;
  const sharedWith = structure.owners
    .filter((owner) => owner.subject_kind === 'region' && owner.subject_id !== region.id)
    .map((owner) => model.regionsById.get(owner.subject_id)?.name ?? owner.subject_id);
  return {
    structureKey: structure.key,
    label: structure.name ?? structure.label_id,
    sourceName,
    sourceLimit: limitForSource(structure.atlas, sourceName),
    shipped: structure.nodes.length > 0,
    mirrored: structure.nodes.some((node) => node.hemispheres_drawn === MIRRORED),
    sharedWith: [...new Set(sharedWith)],
    reviewState: structure.review_state,
  };
}

function toDetailTechnique({ technique, link }: RegionLink): DetailTechnique {
  return {
    id: technique.id,
    name: technique.name,
    bandIds: technique.band_ids,
    nissSeverity: technique.niss_severity,
    dsmCluster: technique.dsm_cluster,
    term: link.term,
    evidenceKey: evidenceKeyOfLink(technique.id, link.term),
    reviewState: link.review_state,
    uncountedReason: link.lit ? null : describeUncountedLink(link),
  };
}

function highestStep(severities: readonly string[]): string | null {
  const rank = (severity: string): number => (NISS_STEPS as readonly string[]).indexOf(severity);
  return [...severities].sort((first, second) => rank(second) - rank(first))[0] ?? null;
}

function tallyClusters(litLinks: readonly RegionLink[]): RegionDetail['clusters'] {
  const clusters = [...new Set(litLinks.flatMap((regionLink) => regionLink.technique.dsm_cluster ?? []))].sort();
  return clusters.map((cluster) => ({ cluster, entryCount: litLinks.filter((regionLink) => regionLink.technique.dsm_cluster === cluster).length }));
}

/** @returns null when the index holds no region with this id */
export function buildRegionDetail(model: ExplorerModel, regionId: string): RegionDetail | null {
  const region = model.regionsById.get(regionId);
  if (region === undefined) return null;
  const links = model.linksByRegion.get(regionId) ?? [];
  const litLinks = listLitLinks(model, regionId);
  return {
    region,
    band: model.bandsById.get(region.band_ids[0] ?? '') ?? null,
    description: model.descriptionsByRegion.get(regionId) ?? null,
    geometryLimit: limitForGeometry(region),
    shapes: region.structure_keys.flatMap((key) => model.structuresByKey.get(key) ?? []).map((structure) => toDetailShape(model, region, structure)),
    linked: litLinks.map(toDetailTechnique),
    namedNotCounted: links.filter((regionLink) => !regionLink.link.lit).map(toDetailTechnique),
    bandLevel: model.index.techniques
      .filter((technique) => technique.scope === 'band_level' && technique.band_ids.some((bandId) => region.band_ids.includes(bandId)))
      .map((technique) => ({ id: technique.id, name: technique.name })),
    nissStep: highestStep(litLinks.flatMap((regionLink) => regionLink.technique.niss_severity ?? [])),
    clusters: tallyClusters(litLinks),
    deviceIds: model.index.devices.stated_targets.filter((device) => device.region_ids.includes(regionId)).map((device) => device.device_id),
  };
}
