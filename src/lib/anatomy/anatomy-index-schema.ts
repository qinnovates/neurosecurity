/**
 * The anatomy index as a shape: every field of every entry with the type it
 * must have. It mirrors anatomy-index-types.ts; a test fuzzes each field of a
 * real built index against it, so the two cannot drift apart unnoticed.
 */

import { ANATOMY_INDEX_SCHEMA_VERSION, GEOMETRY_STATES, INDEX_TECHNIQUE_SCOPES, OWNER_VIAS, VISUAL_CHECK_STATES } from './anatomy-index-types';
import { EXTENT_MATCHES, HEMISPHERES, SUBJECT_KINDS } from './anatomy-types';
import { CHECK_STATUSES, CLAIM_BASES } from './evidence';
import { UNBUILDABLE_REASONS } from './licence-rules';
import { ASSET_KINDS, HEMISPHERE_RECORDS, POSITION_CHECKS, SIZE_CLASSES } from './manifest-types';
import { FIDUCIAL_IDS, SPACING_MEASURES } from './parse-device-geometry';
import { REVIEWER_ROLES } from './parse-review-ledger';
import { RESOLUTIONS } from './resolve-region-term';
import { shapes, type Shape } from './shape-check';
import { SOURCE_REF_STATES } from './source-ref';
import { GRANTS, LAYER_IDS, LICENCE_IDS, ROUTE_KINDS, ROUTE_STATUSES, VERDICTS } from './source-types';

const MAX_ID_LENGTH = 120;
const MAX_TEXT_LENGTH = 1200;
export const REVIEW_STATES = ['ai_drafted_unreviewed', 'reviewed'] as const;

const id = shapes.text(MAX_ID_LENGTH);
const text = shapes.text(MAX_TEXT_LENGTH);
const ids = shapes.list(id);

/** `reviewer_role` and `reviewed_on` are present exactly when the state is `reviewed`; the parser checks that and the mark. */
const reviewState = shapes.record(
  { state: shapes.word(REVIEW_STATES), mark: text, reviewer_role: shapes.word(REVIEWER_ROLES), reviewed_on: shapes.date },
  ['reviewer_role', 'reviewed_on'],
);
const checkStatus = shapes.word(CHECK_STATUSES);
const pinFields = { path: text, bytes: shapes.integer(1), sha256: shapes.sha256 };

const layer = shapes.record({ id: shapes.word(LAYER_IDS), available: shapes.boolean, reason: shapes.nullable(text), source_ids: ids, asset_ids: ids });

const source = shapes.record({
  id, name: text, license_id: shapes.word(LICENCE_IDS), stated_license_id: shapes.word(LICENCE_IDS), verdict: shapes.word(VERDICTS),
  grant: shapes.word(GRANTS), route_kind: shapes.word(ROUTE_KINDS), route_status: shapes.word(ROUTE_STATUSES), buildable: shapes.boolean, pipeline_only: shapes.boolean,
  blockers: shapes.list(shapes.word(UNBUILDABLE_REASONS)), clearance_reason: text, human_confirmed: shapes.alwaysFalse,
});

const asset = shapes.record({
  ...pinFields, id, kind: shapes.word(ASSET_KINDS), layer: shapes.word(LAYER_IDS), license_id: shapes.word(LICENCE_IDS), source_ids: ids,
  position_check: shapes.word(POSITION_CHECKS), modification_note: text,
  visual_check: shapes.record({ state: shapes.word(VISUAL_CHECK_STATES), role: shapes.nullable(shapes.word(REVIEWER_ROLES)), reviewed_on: shapes.nullable(shapes.date) }),
});

const owner = shapes.record({
  subject_kind: shapes.word(SUBJECT_KINDS), subject_id: id, via: shapes.word(OWNER_VIAS), extent_match: shapes.nullable(shapes.word(EXTENT_MATCHES)),
  review_state: reviewState, check_status: checkStatus,
});

const node = shapes.record({
  asset_id: id, hemisphere: shapes.word(HEMISPHERES), hemispheres_drawn: shapes.word(HEMISPHERE_RECORDS), size_class: shapes.word(SIZE_CLASSES), centroid_mm: shapes.point, vertex_count: shapes.integer(0),
});

const structure = shapes.record({
  key: text, atlas: id, label_id: id, name: shapes.nullable(text), nodes: shapes.list(node), owners: shapes.list(owner),
  review_state: reviewState, check_status: checkStatus,
});

const subject = shapes.record({
  kind: shapes.word(SUBJECT_KINDS), id, name: text, band_ids: ids,
  geometry: shapes.record({ state: shapes.word(GEOMETRY_STATES), reason: shapes.nullable(text), reason_source: shapes.nullable(text) }),
  structure_keys: shapes.list(text), declared_children: ids, review_state: reviewState, check_status: checkStatus,
});

const link = shapes.record({
  term: id, resolved_region_id: shapes.nullable(id), resolution: shapes.word(RESOLUTIONS), band_agrees: shapes.boolean,
  valid_for_current_addressing: shapes.boolean, quote_state: shapes.word(Object.values(SOURCE_REF_STATES)), lit: shapes.boolean,
  claim_basis: shapes.word(CLAIM_BASES), review_state: reviewState, check_status: checkStatus,
});

const technique = shapes.record({
  id, name: text, band_ids: ids, severity: id, niss_severity: shapes.nullable(id), dsm_cluster: shapes.nullable(id),
  scope: shapes.word(INDEX_TECHNIQUE_SCOPES), links: shapes.list(link),
});

const devices = shapes.record({
  fiducial_space: shapes.nullable(id),
  fiducials: shapes.list(shapes.record({ id: shapes.word(FIDUCIAL_IDS), position_mm: shapes.point, review_state: reviewState })),
  leads: shapes.list(shapes.record({
    id, name: text, contacts: shapes.integer(1), contact_length_mm: shapes.number(0), contact_spacing_mm: shapes.number(0),
    spacing_measure: shapes.word(SPACING_MEASURES), diameter_mm: shapes.number(0), drawable: shapes.boolean, review_state: reviewState,
  })),
  stated_targets: shapes.list(shapes.record({ device_id: id, region_ids: ids })),
});

export const ANATOMY_INDEX_SHAPE: Shape = shapes.record({
  schema_version: shapes.integer(ANATOMY_INDEX_SCHEMA_VERSION),
  status: text,
  addressing_version: shapes.integer(1),
  template_space: id,
  evidence: shapes.record(pinFields),
  layers: shapes.list(layer),
  sources: shapes.list(source),
  assets: shapes.list(asset),
  structures: shapes.list(structure),
  subjects: shapes.list(subject),
  techniques: shapes.list(technique),
  tracts: shapes.record({ index_asset_id: shapes.nullable(id), proximity_asset_id: shapes.nullable(id), group_asset_ids: ids }),
  devices,
  stale_evidence_keys: shapes.list(text),
});
