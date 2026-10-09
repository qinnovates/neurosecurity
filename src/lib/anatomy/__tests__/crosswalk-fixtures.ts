/** Fixtures for the crosswalk parser. Region ids are QIF's; the atlases and label ids are invented. */

import type { ContainsRelation, CrosswalkContext, CrosswalkRow, LabelTable } from '../anatomy-types';
import { CROSSWALK_STATUS } from '../status-sentences';
import { FIXTURE_ATLAS_ID, FIXTURE_DRAWN_ATLAS_ID, buildEvidence } from './anatomy-fixtures';

export const UNREAD_ATLAS_ID = 'unread_atlas';
export const UNCLEARED_ATLAS_ID = 'uncleared_atlas';

function buildLabelTable(atlas: string, ids: string[]): LabelTable {
  return { schema_version: 1, atlas, labels: ids.map((id) => ({ id, name: `Label ${id}`, hemisphere: 'both' })) };
}

export function buildCrosswalkContext(overrides: Partial<CrosswalkContext> = {}): CrosswalkContext {
  return {
    subjectNames: {
      region: new Map([
        ['stn', 'Subthalamic Nucleus'], ['thalamus', 'Thalamus'], ['vim', 'Ventral Intermediate Nucleus (Thalamus)'],
        ['m1', 'Primary Motor Cortex'], ['pmc', 'Premotor Cortex'], ['cervical_cord', 'Cervical Spinal Cord'],
        ['cingulate', 'Cingulate Gyrus (Posterior)'],
      ]),
      pathway: new Map([['corticospinal', 'Corticospinal Tract']]),
      network: new Map([['default_mode_network', 'Default Mode Network']]),
    },
    regionAliases: new Set(['subthalamic_nucleus']),
    delineationBasisByAtlas: new Map([
      [FIXTURE_ATLAS_ID, 'manual_mri'], [FIXTURE_DRAWN_ATLAS_ID, 'expert_drawing_on_template'],
      [UNREAD_ATLAS_ID, null], [UNCLEARED_ATLAS_ID, 'manual_mri'],
    ]),
    buildableAtlasIds: new Set([FIXTURE_ATLAS_ID, FIXTURE_DRAWN_ATLAS_ID, UNREAD_ATLAS_ID]),
    labelTables: new Map([
      [FIXTURE_ATLAS_ID, buildLabelTable(FIXTURE_ATLAS_ID, ['7', '8', '9'])],
      [FIXTURE_DRAWN_ATLAS_ID, buildLabelTable(FIXTURE_DRAWN_ATLAS_ID, ['20', '21'])],
      [UNREAD_ATLAS_ID, buildLabelTable(UNREAD_ATLAS_ID, ['30'])],
      [UNCLEARED_ATLAS_ID, buildLabelTable(UNCLEARED_ATLAS_ID, ['40'])],
    ]),
    ...overrides,
  };
}

export function buildRow(overrides: Partial<CrosswalkRow> = {}): CrosswalkRow {
  return {
    subject_kind: 'region',
    subject_id: 'stn',
    subject_name_at_draft: 'Subthalamic Nucleus',
    valid_for_addressing: [1],
    part: null,
    atlas: FIXTURE_ATLAS_ID,
    atlas_ids: ['7'],
    name_match: 'same',
    extent_match: 'same',
    definition_contested: false,
    draws: true,
    delineation_basis: 'manual_mri',
    evidence: buildEvidence(),
    drafted_by: 'ai',
    ...overrides,
  };
}

/** A row on the expert-drawn fixture atlas, graded as such a row must be. */
export function buildDrawnRow(overrides: Partial<CrosswalkRow> = {}): CrosswalkRow {
  return buildRow({ atlas: FIXTURE_DRAWN_ATLAS_ID, atlas_ids: ['20'], extent_match: 'approximate', delineation_basis: 'expert_drawing_on_template', ...overrides });
}

export interface CrosswalkFileParts {
  rows?: unknown[];
  contains?: ContainsRelation[];
  no_geometry?: unknown[];
  parts?: unknown[];
}

export function buildCrosswalkFile(fileParts: CrosswalkFileParts = {}): Record<string, unknown> {
  return {
    schema_version: 2,
    status: CROSSWALK_STATUS,
    parts: fileParts.parts ?? [
      { id: 'posterior_cingulate', expected_v2_id: 'posterior_cingulate' },
      { id: 'precuneus', expected_v2_id: 'undecided' },
    ],
    contains: fileParts.contains ?? [],
    no_geometry: fileParts.no_geometry ?? [],
    rows: fileParts.rows ?? [buildRow()],
  };
}

export const NO_GEOMETRY_RECORD = {
  subject_kind: 'region',
  subject_id: 'cervical_cord',
  reason: 'The only spinal cord template found states no licence.',
  reason_source: 'datalake/qif-anatomy-sources.json considered_and_refused: pam50',
  drafted_by: 'ai',
} as const;
