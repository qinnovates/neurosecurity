/**
 * Checks the shape of an anatomy index. The build runs it on the index it is
 * about to emit: an index that has lost its status, a review state, a check
 * status, a layer's reason or any field later work depends on never ships.
 *
 * At run time the page does not need this: it checks the index's bytes against
 * the length and digest it was built with, and those bytes passed here.
 */

import { ANATOMY_INDEX_SCHEMA_VERSION, type AnatomyIndex } from './anatomy-index-types';
import { CHECK_STATUSES } from './evidence';
import {
  childOf, failAt, itemOf, readBoolean, readEnum, readInteger, readList, readRecord, readString, rootOf, type FieldLocation,
} from './field-readers';
import { readDate, readSchemaVersion, readSha256 } from './format-readers';
import { REVIEWER_ROLES } from './parse-review-ledger';
import { describeReviewState, type ReviewState } from './review-state';
import { ANATOMY_INDEX_STATUS, readStatus } from './status-sentences';

const INDEX_NAME = 'anatomy index';
const MAX_TEXT_LENGTH = 400;
const REVIEW_STATES = ['ai_drafted_unreviewed', 'reviewed'] as const;

const INDEX_KEYS = [
  'schema_version', 'status', 'addressing_version', 'template_space', 'evidence', 'layers', 'sources', 'assets',
  'structures', 'subjects', 'techniques', 'tracts', 'devices', 'stale_evidence_keys',
] as const;
const PIN_KEYS = ['path', 'bytes', 'sha256'] as const;
const LAYER_KEYS = ['id', 'available', 'reason', 'source_ids', 'asset_ids'] as const;
const SOURCE_KEYS = [
  'id', 'name', 'licence_id', 'stated_licence_id', 'verdict', 'grant', 'route_kind', 'route_status', 'buildable', 'blockers', 'clearance_reason', 'human_confirmed',
] as const;
const ASSET_KEYS = [...PIN_KEYS, 'id', 'kind', 'layer', 'licence_id', 'source_ids', 'position_check', 'visual_check'] as const;
const STRUCTURE_KEYS = ['key', 'atlas', 'label_id', 'name', 'nodes', 'owners', 'review_state', 'check_status'] as const;
const NODE_KEYS = ['asset_id', 'hemisphere', 'size_class', 'centroid_mm', 'vertex_count'] as const;
const OWNER_KEYS = ['subject_kind', 'subject_id', 'via', 'extent_match', 'review_state', 'check_status'] as const;
const SUBJECT_KEYS = ['kind', 'id', 'name', 'band_ids', 'geometry', 'structure_keys', 'declared_children', 'review_state', 'check_status'] as const;
const TECHNIQUE_KEYS = ['id', 'name', 'band_ids', 'severity', 'niss_severity', 'dsm_cluster', 'scope', 'links'] as const;
const LINK_KEYS = [
  'term', 'resolved_region_id', 'resolution', 'band_agrees', 'valid_for_current_addressing', 'quote_state', 'lit', 'claim_basis', 'review_state', 'check_status',
] as const;
const TRACT_KEYS = ['index_asset_id', 'proximity_asset_id', 'group_asset_ids'] as const;
const DEVICE_KEYS = ['fiducial_space', 'fiducials', 'leads', 'stated_targets'] as const;
const FIDUCIAL_KEYS = ['id', 'position_mm', 'review_state'] as const;
const LEAD_KEYS = ['id', 'name', 'contacts', 'contact_length_mm', 'contact_spacing_mm', 'spacing_measure', 'diameter_mm', 'drawable', 'review_state'] as const;

/** A review state must be one of the two states and must carry exactly the mark that state shows. */
function checkReviewState(value: unknown, location: FieldLocation): void {
  const state = readEnum(readRecord(value, location, { required: ['state', 'mark'], optional: ['reviewer_role', 'reviewed_on'] }), 'state', location, REVIEW_STATES);
  const isReviewed = state === 'reviewed';
  const record = readRecord(value, location, { required: isReviewed ? ['state', 'mark', 'reviewer_role', 'reviewed_on'] : ['state', 'mark'] });
  const reviewState: ReviewState = isReviewed
    ? { state, reviewer_role: readEnum(record, 'reviewer_role', location, REVIEWER_ROLES), reviewed_on: readDate(record, 'reviewed_on', location) }
    : { state };
  const mark = readString(record, 'mark', location, MAX_TEXT_LENGTH);
  if (mark !== describeReviewState(reviewState)) {
    failAt(childOf(location, 'mark'), `the mark must read "${describeReviewState(reviewState)}"`, 'Build the state with toIndexReviewState; never write a mark by hand.');
  }
}

/** An object with the given keys; when it is a drafted thing, a valid review state and check status too. */
function checkEntry(value: unknown, location: FieldLocation, keys: readonly string[]): Record<string, unknown> {
  const record = readRecord(value, location, { required: keys });
  if (keys.includes('review_state')) checkReviewState(record.review_state, childOf(location, 'review_state'));
  if (keys.includes('check_status')) readEnum(record, 'check_status', location, CHECK_STATUSES);
  return record;
}

function checkEntries(
  parent: Record<string, unknown>, key: string, location: FieldLocation, keys: readonly string[],
  checkChildren?: (entry: Record<string, unknown>, entryLocation: FieldLocation) => void,
): void {
  readList(parent, key, location).forEach((entry, index) => {
    const entryLocation = itemOf(location, key, index);
    const record = checkEntry(entry, entryLocation, keys);
    if (checkChildren !== undefined) checkChildren(record, entryLocation);
  });
}

function checkPin(value: unknown, location: FieldLocation): void {
  const record = readRecord(value, location, { required: PIN_KEYS });
  readString(record, 'path', location, MAX_TEXT_LENGTH);
  readInteger(record, 'bytes', location, 1);
  readSha256(record, 'sha256', location);
}

function checkLayer(layer: Record<string, unknown>, location: FieldLocation): void {
  const isAvailable = readBoolean(layer, 'available', location);
  const hasReason = typeof layer.reason === 'string' && layer.reason.trim() !== '';
  if (!isAvailable && !hasReason) {
    failAt(childOf(location, 'reason'), 'an unavailable layer must say why', 'Carry the reason from the source\'s clearance record.');
  }
}

function checkDevices(value: unknown, location: FieldLocation): void {
  const devices = readRecord(value, location, { required: DEVICE_KEYS });
  checkEntries(devices, 'fiducials', location, FIDUCIAL_KEYS);
  checkEntries(devices, 'leads', location, LEAD_KEYS);
  checkEntries(devices, 'stated_targets', location, ['device_id', 'region_ids']);
}

/** Throws AnatomyDataError unless `raw` has the whole index shape with a state on every drafted thing. */
export function parseAnatomyIndex(raw: unknown): AnatomyIndex {
  const root = rootOf(INDEX_NAME);
  const index = readRecord(raw, root, { required: INDEX_KEYS });
  readSchemaVersion(index, root, ANATOMY_INDEX_SCHEMA_VERSION);
  readStatus(index, root, ANATOMY_INDEX_STATUS);
  readInteger(index, 'addressing_version', root, 1);
  checkPin(index.evidence, childOf(root, 'evidence'));
  checkEntries(index, 'layers', root, LAYER_KEYS, checkLayer);
  checkEntries(index, 'sources', root, SOURCE_KEYS);
  checkEntries(index, 'assets', root, ASSET_KEYS);
  checkEntries(index, 'structures', root, STRUCTURE_KEYS, (structure, location) => {
    checkEntries(structure, 'owners', location, OWNER_KEYS);
    checkEntries(structure, 'nodes', location, NODE_KEYS);
  });
  checkEntries(index, 'subjects', root, SUBJECT_KEYS);
  checkEntries(index, 'techniques', root, TECHNIQUE_KEYS, (technique, location) => checkEntries(technique, 'links', location, LINK_KEYS));
  readRecord(index.tracts, childOf(root, 'tracts'), { required: TRACT_KEYS });
  checkDevices(index.devices, childOf(root, 'devices'));
  readList(index, 'stale_evidence_keys', root);
  return raw as AnatomyIndex;
}
