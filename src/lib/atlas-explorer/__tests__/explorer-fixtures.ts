/**
 * Models for the explorer tests. `loadRealModel` is the data the site serves.
 * `buildFixtureModel` is small and hand-built, with one of each case the view
 * model has to tell apart; its atlas and label ids are invented.
 */

import { loadAnatomyBundle, loadCompanionJson } from '@/components/atlas-scene/load-anatomy-data';
import type { AnatomyIndex, IndexSubject } from '@/lib/anatomy/anatomy-index-types';
import { parseAnatomyIndex } from '@/lib/anatomy/parse-anatomy-index';
import { buildIndex, buildIndexLink, buildOwner, buildStructure, buildSubject, buildTechnique } from '@/lib/anatomy/__tests__/index-fixtures';
import { BAND_ORDER } from '@/lib/threat-model/catalog-types';
import { EXPLORER_CATALOG_PATH, parseExplorerCatalog, type ExplorerCatalog } from '../explorer-catalog';
import { createExplorerModel, type ExplorerModel } from '../explorer-model';

export function loadRealCatalog(): ExplorerCatalog {
  return parseExplorerCatalog(JSON.parse(loadCompanionJson(EXPLORER_CATALOG_PATH)));
}

export function loadRealModel(): ExplorerModel {
  return createExplorerModel(loadAnatomyBundle().index, loadRealCatalog());
}

export const FIXTURE_IDS = {
  linkedTechnique: 'QIF-T9001',
  bandLevelTechnique: 'QIF-T9002',
  notDraftedTechnique: 'QIF-T9003',
  secondLinkedTechnique: 'QIF-T9004',
  deviceOnlyTechnique: 'QIF-T9005',
  device: 'fixture-implant',
} as const;

function withGeometry(subject: IndexSubject, state: IndexSubject['geometry']['state'], reason: string | null, structureKeys: string[]): IndexSubject {
  return { ...subject, geometry: { state, reason, reason_source: reason === null ? null : 'fixture source' }, structure_keys: structureKeys };
}

/**
 * pfc: own shape, linked by two techniques. m1: inside a shape it shares with pfc's neighbour. hippocampus: named by a
 * technique whose band tags exclude it. cord: no shape, nothing linked.
 */
export function buildFixtureIndex(overrides: Partial<AnatomyIndex> = {}): AnatomyIndex {
  const pfcShape = buildStructure('10', [buildOwner('pfc')]);
  const sharedShape = buildStructure('20', [buildOwner('m1', 'row', 'contained'), buildOwner('sma', 'row', 'contained')]);
  const unlitLink = { ...buildIndexLink('hippocampus', false), resolution: 'id' as const, band_agrees: false };
  const unresolvedLink = { ...buildIndexLink('cochlea', false), resolved_region_id: null, resolution: 'unclassified' as const, band_agrees: false };
  return parseAnatomyIndex(JSON.parse(JSON.stringify(buildIndex({
    layers: [
      { id: 'cortical', available: true, reason: null, source_ids: [pfcShape.atlas], asset_ids: ['fixture_asset'] },
      { id: 'tracts', available: false, reason: 'The publisher has not confirmed the terms.', source_ids: [], asset_ids: [] },
    ],
    structures: [pfcShape, sharedShape],
    subjects: [
      withGeometry(buildSubject('pfc', ['N7']), 'drawn', null, [pfcShape.key]),
      withGeometry(buildSubject('m1', ['N7']), 'contained', null, [sharedShape.key]),
      withGeometry(buildSubject('sma', ['N7']), 'contained', null, [sharedShape.key]),
      withGeometry(buildSubject('hippocampus', ['N6']), 'not_mapped', 'No correspondence to an atlas has been drafted for this record yet.', []),
      withGeometry(buildSubject('cord', ['N1']), 'no_geometry', 'No cleared atlas draws the cord.', []),
      { ...buildSubject('default_mode', []), kind: 'network', name: 'Default Mode Network', geometry: { state: 'not_mapped', reason: 'Not mapped.', reason_source: null } },
    ],
    techniques: [
      buildTechnique(FIXTURE_IDS.linkedTechnique, { name: 'Fixture injection', band_ids: ['S1', 'N7'], niss_severity: 'low', links: [buildIndexLink('pfc', true), unlitLink, unresolvedLink] }),
      buildTechnique(FIXTURE_IDS.bandLevelTechnique, { name: 'Fixture band-level', band_ids: ['I0', 'N6'], scope: 'band_level', dsm_cluster: null }),
      buildTechnique(FIXTURE_IDS.notDraftedTechnique, { name: 'Fixture undrafted', band_ids: ['N7'], scope: 'not_drafted' }),
      buildTechnique(FIXTURE_IDS.secondLinkedTechnique, { name: 'Fixture entrainment', band_ids: ['N7'], niss_severity: 'high', dsm_cluster: 'cognitive_psychotic', links: [buildIndexLink('pfc', true)] }),
    ],
    devices: { fiducial_space: null, fiducials: [], leads: [], stated_targets: [{ device_id: FIXTURE_IDS.device, region_ids: ['m1'] }] },
    ...overrides,
  }))));
}

export function buildFixtureCatalog(): ExplorerCatalog {
  return {
    schema_version: 1,
    registrar_version: 'fixture',
    bands: BAND_ORDER.map((bandId) => ({ id: bandId, name: `Band ${bandId}`, description: `Fixture band ${bandId}.` })),
    regions: [{ id: 'pfc', function: 'Fixture description of the prefrontal cortex.' }],
    device_stage_techniques: [
      { id: FIXTURE_IDS.linkedTechnique, name: 'Fixture injection', band_ids: ['S1', 'N7'], severity: 'high' },
      { id: FIXTURE_IDS.deviceOnlyTechnique, name: 'Fixture firmware attack', band_ids: ['S2', 'S3'], severity: 'medium' },
    ],
  };
}

export function buildFixtureModel(overrides: Partial<AnatomyIndex> = {}): ExplorerModel {
  return createExplorerModel(buildFixtureIndex(overrides), buildFixtureCatalog());
}

export function regionOf(model: ExplorerModel, regionId: string): IndexSubject {
  const region = model.regionsById.get(regionId);
  if (region === undefined) throw new Error(`Fixture has no region "${regionId}".`);
  return region;
}
