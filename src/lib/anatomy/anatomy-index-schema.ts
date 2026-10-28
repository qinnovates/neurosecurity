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
import { DIMENSION_SOURCE_KINDS, FIDUCIAL_IDS, LEAD_DIMENSION_FIELDS, SPACING_MEASURES } from './parse-device-geometry';
import { READ_DEPTHS } from './parse-electrode-layouts';
import { REVIEWER_ROLES } from './parse-review-ledger';
import { RESOLUTIONS } from './resolve-region-term';
import { shapes, type Shape } from './shape-check';
import { SOURCE_REF_STATES } from './source-ref';
import { GRANTS, LAYER_IDS, LICENCE_IDS, ROUTE_KINDS, ROUTE_STATUSES, VERDICTS } from './source-types';
import {
  MAX_NISS_SCORE, MAX_NISS_VECTOR_LENGTH, NEURORIGHT_CODES, NISS_SCORING_STATES, NISS_VECTOR_FORMAT, NISS_VECTOR_PATTERN,
} from './technique-tags';

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
  blockers: shapes.list(shapes.word(UNBUILDABLE_REASONS)), clearance_reason: text, human_confirmed: shapes.boolean,
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

/**
 * The registrar's NISS block. Every field but the scoring state is nullable,
 * because the registrar scores only some techniques; which nulls are allowed
 * beside which state is a rule between fields, so parse-anatomy-index.ts holds
 * them to it. The vector is held to its format, not merely to a length: a
 * malformed one would reach whatever takes the six metrics apart.
 */
const niss = shapes.record({
  scoring_state: shapes.nullable(shapes.word(NISS_SCORING_STATES)),
  vector: shapes.nullable(shapes.pattern(NISS_VECTOR_PATTERN, MAX_NISS_VECTOR_LENGTH, NISS_VECTOR_FORMAT)),
  score: shapes.nullable(shapes.number(0, MAX_NISS_SCORE)),
  pins: shapes.nullable(shapes.boolean),
});

/** The raw codes, held to the glossary's own set. A record naming no right is an empty list; a technique with no record carries null instead. */
const neurorights = shapes.nullable(shapes.record({ affected: shapes.list(shapes.word(NEURORIGHT_CODES)) }));

const neurorightCode = shapes.record({
  code: shapes.word(NEURORIGHT_CODES), name: text, folds_into: shapes.nullable(shapes.word(NEURORIGHT_CODES)),
});

const technique = shapes.record({
  id, name: text, band_ids: ids, severity: id, niss_severity: shapes.nullable(id), dsm_cluster: shapes.nullable(id), niss, neurorights,
  scope: shapes.word(INDEX_TECHNIQUE_SCOPES), links: shapes.list(link),
});

const devices = shapes.record({
  fiducial_space: shapes.nullable(id),
  fiducials: shapes.list(shapes.record({ id: shapes.word(FIDUCIAL_IDS), position_mm: shapes.point, confidence_note: shapes.nullable(text), review_state: reviewState })),
  fiducial_method: shapes.nullable(text),
  electrode_layouts: shapes.list(shapes.record({
    id: text, name: text, scalp_asset_id: id, construction: text, shown_by_default: shapes.boolean,
    electrodes: shapes.list(shapes.record({ id: text, position_mm: shapes.point, also_called: shapes.nullable(text) })),
    drawable: shapes.boolean, review_state: reviewState,
  })),
  facts: shapes.list(shapes.record({ id, statement: text, citation: text, url: text, read_depth: shapes.word(READ_DEPTHS) })),
  leads: shapes.list(shapes.record({
    id, name: text, contacts: shapes.integer(1), contact_length_mm: shapes.number(0), contact_spacing_mm: shapes.number(0),
    spacing_measure: shapes.word(SPACING_MEASURES), diameter_mm: shapes.number(0), drawable: shapes.boolean,
    sources: shapes.list(shapes.record({ citation: text, url: text, kind: shapes.word(DIMENSION_SOURCE_KINDS), supports: shapes.list(shapes.word(LEAD_DIMENSION_FIELDS)) })),
    review_state: reviewState,
  })),
  stated_targets: shapes.list(shapes.record({ device_id: id, region_ids: ids })),
});

export const ANATOMY_INDEX_SHAPE: Shape = shapes.record({
  schema_version: shapes.integer(ANATOMY_INDEX_SCHEMA_VERSION),
  status: text,
  addressing_version: shapes.integer(1),
  template_space: id,
  evidence: shapes.record(pinFields),
  companions: shapes.list(shapes.record(pinFields)),
  layers: shapes.list(layer),
  sources: shapes.list(source),
  assets: shapes.list(asset),
  structures: shapes.list(structure),
  subjects: shapes.list(subject),
  techniques: shapes.list(technique),
  neurorights_taxonomy: shapes.list(neurorightCode),
  tracts: shapes.record({ index_asset_id: shapes.nullable(id), proximity_asset_id: shapes.nullable(id), group_asset_ids: ids }),
  devices,
  stale_evidence_keys: shapes.list(text),
});
