/**
 * The validated data the explorer reads, with the lookups every view needs
 * built once. Nothing here decides what is shown; it only makes the index and
 * the catalog cheap to ask questions of.
 */

import type { AnatomyIndex, IndexStructure, IndexSubject, IndexTechnique, IndexTechniqueLink } from '@/lib/anatomy/anatomy-index-types';
import { createStructureStyler, type ColourMode, type Style } from '@/lib/anatomy/colour-modes';
import { BAND_ORDER } from '@/lib/threat-model/catalog-types';
import type { CatalogBand, DeviceStageTechnique, ExplorerCatalog } from './explorer-catalog';

const NEURAL_BAND_PREFIX = 'N';

/** One drafted link from a technique to a region, with the technique it belongs to. */
export interface RegionLink {
  technique: IndexTechnique;
  link: IndexTechniqueLink;
}

export interface ExplorerModel {
  index: AnatomyIndex;
  catalog: ExplorerCatalog;
  /** Neural bands, neocortex first, as the list groups them. */
  neuralBands: CatalogBand[];
  bandsById: ReadonlyMap<string, CatalogBand>;
  /** Every region, in the index's own order. */
  regions: IndexSubject[];
  regionsById: ReadonlyMap<string, IndexSubject>;
  networks: IndexSubject[];
  structuresByKey: ReadonlyMap<string, IndexStructure>;
  techniquesById: ReadonlyMap<string, IndexTechnique>;
  /** Techniques with no neural band: they act on the device and are in no region's links. */
  deviceOnlyTechniquesById: ReadonlyMap<string, DeviceStageTechnique>;
  descriptionsByRegion: ReadonlyMap<string, string>;
  /** Every drafted link that resolves to the region, lit or not. */
  linksByRegion: ReadonlyMap<string, RegionLink[]>;
  styleStructure: (structureKey: string, mode: ColourMode) => Style;
}

export function isNeuralBand(bandId: string): boolean {
  return bandId.startsWith(NEURAL_BAND_PREFIX);
}

function groupLinksByRegion(techniques: readonly IndexTechnique[]): Map<string, RegionLink[]> {
  const linksByRegion = new Map<string, RegionLink[]>();
  for (const technique of techniques) {
    for (const link of technique.links) {
      if (link.resolved_region_id === null) continue;
      linksByRegion.set(link.resolved_region_id, [...(linksByRegion.get(link.resolved_region_id) ?? []), { technique, link }]);
    }
  }
  return linksByRegion;
}

export function createExplorerModel(index: AnatomyIndex, catalog: ExplorerCatalog): ExplorerModel {
  const bandsById = new Map(catalog.bands.map((band) => [band.id, band]));
  const regions = index.subjects.filter((subject) => subject.kind === 'region');
  const neuralTechniqueIds = new Set(index.techniques.map((technique) => technique.id));
  return {
    index,
    catalog,
    neuralBands: [...BAND_ORDER].reverse().filter(isNeuralBand).flatMap((bandId) => bandsById.get(bandId) ?? []),
    bandsById,
    regions,
    regionsById: new Map(regions.map((region) => [region.id, region])),
    networks: index.subjects.filter((subject) => subject.kind === 'network'),
    structuresByKey: new Map(index.structures.map((structure) => [structure.key, structure])),
    techniquesById: new Map(index.techniques.map((technique) => [technique.id, technique])),
    deviceOnlyTechniquesById: new Map(catalog.device_stage_techniques.filter((technique) => !neuralTechniqueIds.has(technique.id)).map((technique) => [technique.id, technique])),
    descriptionsByRegion: new Map(catalog.regions.map((region) => [region.id, region.function])),
    linksByRegion: groupLinksByRegion(index.techniques),
    styleStructure: createStructureStyler(index),
  };
}

/** The lit links of a region: the ones an id or synonym resolution, agreeing band tags and a standing quote allow to count. */
export function listLitLinks(model: ExplorerModel, regionId: string): RegionLink[] {
  return (model.linksByRegion.get(regionId) ?? []).filter((regionLink) => regionLink.link.lit);
}
