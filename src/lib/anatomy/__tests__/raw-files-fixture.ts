/**
 * A complete, small set of raw anatomy files for index tests. Region ids are
 * QIF's; the atlas, its labels, the techniques and every number are invented.
 */

import type { EngineData } from '@/lib/threat-model/catalog-types';
import type { RawAnatomyFiles } from '../anatomy-inputs';
import { REGISTRAR_FILE } from '../parse-technique-regions';
import type { LedgerEntry } from '../parse-review-ledger';
import { DEVICE_GEOMETRY_STATUS, REVIEW_LEDGER_STATUS, TECHNIQUE_REGIONS_STATUS } from '../status-sentences';
import { FIXTURE_ATLAS_ID, buildSource, buildSourcesFile, buildVerdict, buildVerdictsFile } from './anatomy-fixtures';
import { buildCrosswalkFile, buildRow, NO_GEOMETRY_RECORD } from './crosswalk-fixtures';
import { buildAsset, buildManifest, buildNode } from './manifest-fixtures';

export const TRACTS_SOURCE_ID = 'fixture_tracts';
export const LABEL_TABLE_PATH = `src/site/atlas-assets/open/labels-${FIXTURE_ATLAS_ID}.json`;
export const TECHNIQUE_ID = 'QIF-T9001';
export const PATHWAY_TEXT = 'stn, then thalamus and motor_strip';
const POINTER = `/techniques/${TECHNIQUE_ID}/tara/dsm5/pathway`;

const REGIONS = [
  ['stn', 'Subthalamic Nucleus', 'N5'], ['thalamus', 'Thalamus', 'N4'], ['vim', 'Ventral Intermediate Nucleus (Thalamus)', 'N4'],
  ['m1', 'Primary Motor Cortex', 'N7'], ['pmc', 'Premotor Cortex', 'N7'], ['cervical_cord', 'Cervical Spinal Cord', 'N1'],
  ['cingulate', 'Cingulate Gyrus (Posterior)', 'N6'], ['insula', 'Insular Cortex', 'N6'],
] as const;

function buildTechnique(id: string, bandIds: string[]): EngineData['techniques'][number] {
  return {
    id, name: `Fixture technique ${id}`, tactic: 'QIF-N.IJ', bandIds, evidenceStatus: 'THEORETICAL', severity: 'high', mode: null, domain: null,
    coupling: null, cvssBaseVector: null, nissScore: null, nissVector: null, alias: null, relatedTechniqueIds: [], detection: null, fdaRequirementCodes: [],
  };
}

const ENGINE_DATA: EngineData = {
  registrarVersion: 'fixture',
  techniques: [buildTechnique(TECHNIQUE_ID, ['N5', 'N7']), buildTechnique('QIF-T9002', ['N7']), buildTechnique('QIF-T9005', ['S1'])],
  regions: REGIONS.map(([id, name, bandId]) => ({ id, name, bandId, depthClass: 'unspecified' })),
  precedentCves: [],
  precedentCvesAsOf: '2026-10-09',
  controlsByBand: {},
};

const ATLAS = {
  brain_regions: REGIONS.map(([id, name, band]) => ({ id, name, qif_band: band })),
  region_aliases: { subthalamic_nucleus: 'stn', motor_strip: 'm1' },
  region_alias_relations: { synonym: ['subthalamic_nucleus'], whole_to_part: ['motor_strip'], part_to_whole: [] },
  device_region_mappings: [{ device_id: 'fixture-device', target_regions: ['m1'] }],
};

function buildLink(term: string): Record<string, unknown> {
  return {
    term,
    valid_for_addressing: [1],
    evidence: { claim_basis: 'catalog_text', source_ref: { file: REGISTRAR_FILE, pointer: POINTER, quote: PATHWAY_TEXT }, check_status: 'partial', rationale: 'Named in the pathway text.' },
    drafted_by: 'ai',
  };
}

const ROWS = [
  buildRow(),
  buildRow({ subject_id: 'thalamus', subject_name_at_draft: 'Thalamus', atlas_ids: ['8'], extent_match: 'approximate' }),
  buildRow({ subject_id: 'vim', subject_name_at_draft: 'Ventral Intermediate Nucleus (Thalamus)', atlas_ids: ['9'], extent_match: 'contained' }),
  buildRow({ subject_id: 'm1', subject_name_at_draft: 'Primary Motor Cortex', atlas_ids: ['10'], extent_match: 'contained' }),
  buildRow({ subject_id: 'pmc', subject_name_at_draft: 'Premotor Cortex', atlas_ids: ['10'], extent_match: 'contained' }),
  buildRow({ subject_id: 'cingulate', subject_name_at_draft: 'Cingulate Gyrus (Posterior)', atlas_ids: ['11'], extent_match: 'approximate', valid_for_addressing: [2] }),
];

const UNCLEARED = { cleared: false, reason: 'The text cannot settle whether further terms pass through.', unlocks_when: ['A written confirmation.'], drafted_by: 'ai' as const };

export function buildLedgerFile(entries: LedgerEntry[] = []): Record<string, unknown> {
  return { schema_version: 1, status: REVIEW_LEDGER_STATUS, reviewers: [{ id: 'owner-1', role: 'owner' }, { id: 'neuroanatomist-1', role: 'neuroanatomist' }], entries };
}

export function buildRawFiles(overrides: Partial<RawAnatomyFiles> = {}): RawAnatomyFiles {
  const tractsSource = buildSource({ id: TRACTS_SOURCE_ID, name: 'Fixture tracts', layers: ['tracts'], license_id: 'cc-by-sa-4.0' });
  return {
    engineData: ENGINE_DATA,
    registrar: { techniques: [{ id: TECHNIQUE_ID, niss: { severity: 'high' }, tara: { dsm5: { cluster: 'mood_trauma', pathway: PATHWAY_TEXT } } }] },
    atlas: ATLAS,
    pathways: { pathways: [{ id: 'corticospinal', name: 'Corticospinal Tract', type: 'motor_descending' }, { id: 'default_mode_network', name: 'Default Mode Network', type: 'cortical_network' }] },
    sources: buildSourcesFile([buildSource(), tractsSource]),
    verdicts: buildVerdictsFile([buildVerdict(), buildVerdict({ source_id: TRACTS_SOURCE_ID, grant: 'interpretation', clearance: UNCLEARED })]),
    reviewLedger: buildLedgerFile(),
    crosswalk: buildCrosswalkFile({ rows: ROWS, contains: [{ parent: 'thalamus', child: 'vim' }], no_geometry: [NO_GEOMETRY_RECORD], parts: [] }),
    techniqueRegions: {
      schema_version: 2,
      status: TECHNIQUE_REGIONS_STATUS,
      techniques: { [TECHNIQUE_ID]: { scope: 'regions', rationale: 'The pathway text names three structures.', links: ['stn', 'thalamus', 'motor_strip'].map(buildLink) } },
    },
    deviceGeometry: { schema_version: 1, status: DEVICE_GEOMETRY_STATUS, fiducial_space: null, fiducials: [], leads: [] },
    manifest: buildManifest([buildAsset({ nodes: [buildNode(), buildNode({ extras: { atlas: FIXTURE_ATLAS_ID, label_id: '12', hemisphere: 'left' } })] })]),
    labelTablesByPath: {
      [LABEL_TABLE_PATH]: {
        schema_version: 1,
        atlas: FIXTURE_ATLAS_ID,
        labels: ['7', '8', '9', '10', '11', '12'].map((id) => ({ id, name: id === '7' ? 'Fixture Nucleus' : `Label ${id}`, hemisphere: 'both' })),
      },
    },
    ...overrides,
  };
}
