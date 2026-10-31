/**
 * Everything the inspector shows for one region that the index and the catalog
 * hold: what stands for it, the techniques linked to it and the ones that only
 * share its band, and the NISS, DSM and device facts with their counts.
 * Quotes and literature statements arrive later, from the lazy evidence files.
 *
 * The dossier adds what its own file holds. Those fields read null until that
 * file has arrived: null is "not loaded", never "none recorded".
 */

import type { IndexReviewState, IndexStructure, IndexSubject } from '@/lib/anatomy/anatomy-index-types';
import { NISS_STEPS } from '@/lib/anatomy/colour-modes';
import type { LimitSentence } from '@/lib/anatomy/limits-copy';
import { SILICON_BANDS } from '@/lib/threat-model/catalog-types';
import type { RegionDossierFile } from './dossier-file';
import type { CatalogBand } from './explorer-catalog';
import { listLitLinks, nameBands, type ExplorerModel, type RegionLink } from './explorer-model';
import { limitForGeometry, limitForSource } from './limit-selection';
import { joinDossierRecords, listTechniqueRights, readPathways, readTechniqueFacts, type DossierRecords, type DetailNeuroright, type DetailPathway, type TechniqueFacts } from './region-dossier';
import { buildRegionKqlQuery } from './region-kql';
import { describeUncountedLink } from './region-lens';

const LINK_KEY_SEPARATOR = ':';
const MIRRORED = 'mirrored';
/** The bands of the classical stack. A technique tagged with these alone colours no region. */
const CLASSICAL_BAND_IDS: readonly string[] = SILICON_BANDS;

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
  /** What ships for it in this build: a drawn shape, a location marker with no shape, or nothing yet. */
  shipped: 'shape' | 'marker' | 'nothing';
  mirrored: boolean;
  /** Other QIF regions whose records point at the same shape. */
  sharedWith: string[];
  reviewState: IndexReviewState;
}

export interface DetailTechnique {
  id: string;
  name: string;
  /** The technique's bands with their names, as shown. */
  bandNames: string;
  nissSeverity: string | null;
  dsmCluster: string | null;
  /** The catalog's own word for the structure. */
  term: string;
  evidenceKey: string;
  reviewState: IndexReviewState;
  /** Why the link is not counted. Null for a counted link. */
  uncountedReason: string | null;
  /** The technique's evidence tier and recorded control. Null until the dossier's file has arrived. */
  facts: TechniqueFacts | null;
}

export interface RegionDetail extends DossierRecords {
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
  /** Techniques tagged with the region's band that name no link to it. A count of catalog entries, never a score. */
  bandInheritedCount: number;
  /** Catalog techniques with classical-stack bands only. They colour no region and are listed on none. */
  classicalOnlyCount: number;
  pathways: DetailPathway[];
  /** The rights each technique shown is scored against, one row per technique and code. */
  neurorights: DetailNeuroright[];
  /** A query over this region for the data studio. */
  kqlQuery: string;
}

function describeShipped(structure: IndexStructure): DetailShape['shipped'] {
  if (structure.nodes.some((node) => node.vertex_count > 0)) return 'shape';
  return structure.nodes.length > 0 ? 'marker' : 'nothing';
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
    shipped: describeShipped(structure),
    mirrored: structure.nodes.some((node) => node.hemispheres_drawn === MIRRORED),
    sharedWith: [...new Set(sharedWith)],
    reviewState: structure.review_state,
  };
}

function toDetailTechnique(model: ExplorerModel, { technique, link }: RegionLink, file: RegionDossierFile | null): DetailTechnique {
  return {
    id: technique.id,
    name: technique.name,
    bandNames: nameBands(model, technique.band_ids),
    nissSeverity: technique.niss_severity,
    dsmCluster: technique.dsm_cluster,
    term: link.term,
    evidenceKey: evidenceKeyOfLink(technique.id, link.term),
    reviewState: link.review_state,
    uncountedReason: link.lit ? null : describeUncountedLink(link),
    facts: readTechniqueFacts(file, technique.id),
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

function countBandInherited(model: ExplorerModel, region: IndexSubject, links: readonly RegionLink[]): number {
  const linkedIds = new Set(links.map((regionLink) => regionLink.technique.id));
  return model.index.techniques.filter((technique) => !linkedIds.has(technique.id) && technique.band_ids.some((bandId) => region.band_ids.includes(bandId))).length;
}

function countClassicalOnly(model: ExplorerModel): number {
  return model.catalog.device_stage_techniques.filter((technique) => technique.band_ids.every((bandId) => CLASSICAL_BAND_IDS.includes(bandId))).length;
}

/**
 * @param file the dossier's file, or null while it has not arrived
 * @returns null when the index holds no region with this id
 */
export function buildRegionDetail(model: ExplorerModel, regionId: string, file: RegionDossierFile | null = null): RegionDetail | null {
  const region = model.regionsById.get(regionId);
  if (region === undefined) return null;
  const links = model.linksByRegion.get(regionId) ?? [];
  const litLinks = listLitLinks(model, regionId);
  const shownTechniques = [...new Map(links.map((regionLink) => [regionLink.technique.id, regionLink.technique])).values()];
  return {
    region,
    band: model.bandsById.get(region.band_ids[0] ?? '') ?? null,
    description: model.descriptionsByRegion.get(regionId) ?? null,
    geometryLimit: limitForGeometry(region),
    shapes: region.structure_keys.flatMap((key) => model.structuresByKey.get(key) ?? []).map((structure) => toDetailShape(model, region, structure)),
    linked: litLinks.map((regionLink) => toDetailTechnique(model, regionLink, file)),
    namedNotCounted: links.filter((regionLink) => !regionLink.link.lit).map((regionLink) => toDetailTechnique(model, regionLink, file)),
    bandLevel: model.index.techniques
      .filter((technique) => technique.scope === 'band_level' && technique.band_ids.some((bandId) => region.band_ids.includes(bandId)))
      .map((technique) => ({ id: technique.id, name: technique.name })),
    nissStep: highestStep(litLinks.flatMap((regionLink) => regionLink.technique.niss_severity ?? [])),
    clusters: tallyClusters(litLinks),
    deviceIds: model.index.devices.stated_targets.filter((device) => device.region_ids.includes(regionId)).map((device) => device.device_id),
    bandInheritedCount: countBandInherited(model, region, links),
    classicalOnlyCount: countClassicalOnly(model),
    pathways: readPathways(model.pathwaysByRegion.get(regionId) ?? [], regionId, file),
    neurorights: listTechniqueRights(shownTechniques, model.index.neurorights_taxonomy),
    kqlQuery: buildRegionKqlQuery(regionId, litLinks.length > 0),
    ...joinDossierRecords(file, region, shownTechniques.map((technique) => technique.id), (model.pathwaysByRegion.get(regionId) ?? []).map((pathway) => pathway.id)),
  };
}
