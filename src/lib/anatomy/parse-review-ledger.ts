/**
 * Parser for datalake/qif-anatomy-review-ledger.json, the only place a review
 * is recorded. No drafted row has a review field: a row reads as reviewed only
 * while a ledger entry's digest matches it. Only the repository owner adds
 * entries; an agent never writes this file.
 */

import { rejectBandKeys } from './band-key-scan';
import { childOf, failAt, itemOf, readEnum, readList, readRecord, readString, rejectDuplicates, rootOf, type FieldLocation } from './field-readers';
import { readDate, readSchemaVersion, readSha256 } from './format-readers';
import { REVIEW_LEDGER_STATUS, readStatus } from './status-sentences';

export const REVIEW_LEDGER_FILE = 'datalake/qif-anatomy-review-ledger.json';

/** Roles, never personal names. A review by the owner is shown as the owner's, not a specialist's. */
export const REVIEWER_ROLES = ['neuroanatomist', 'clinician', 'owner', 'other'] as const;
export type ReviewerRole = typeof REVIEWER_ROLES[number];

export const LEDGER_ENTRY_KINDS = ['row_review', 'visual_check', 'agreement'] as const;
export type LedgerEntryKind = typeof LEDGER_ENTRY_KINDS[number];

export interface Reviewer {
  id: string;
  role: ReviewerRole;
}

export interface LedgerEntry {
  kind: LedgerEntryKind;
  /** Unique within its kind. A crosswalk row key, a technique link key, a device row key, an asset id or a source id. */
  key: string;
  /** sha256 of exactly what was looked at. */
  digest: string;
  reviewer_id: string;
  reviewed_on: string;
}

export interface ReviewLedger {
  schema_version: number;
  status: string;
  reviewers: Reviewer[];
  entries: LedgerEntry[];
}

const LEDGER_SCHEMA_VERSION = 1;
const MAX_KEY_LENGTH = 300;
const REVIEWER_ID_PATTERN = /^([a-z]+)-[1-9]\d*$/;
const CROSSWALK_ROW_KEY = /^(region|pathway|network):[a-z0-9_]+:[a-z0-9_]+:[a-z0-9_]*$/;
const TECHNIQUE_LINK_KEY = /^QIF-T\d{4}:.+$/;
const DEVICE_ROW_KEY = /^(fiducial|lead):[a-z0-9_]+$/;
const KEY_PATTERNS: Readonly<Record<LedgerEntryKind, readonly RegExp[]>> = {
  row_review: [CROSSWALK_ROW_KEY, TECHNIQUE_LINK_KEY, DEVICE_ROW_KEY],
  visual_check: [/^[a-z0-9][a-z0-9_-]*$/],
  agreement: [/^[a-z0-9][a-z0-9_]*$/],
};

function parseReviewer(value: unknown, location: FieldLocation): Reviewer {
  const record = readRecord(value, location, { required: ['id', 'role'] });
  const id = readString(record, 'id', location, MAX_KEY_LENGTH);
  const role = readEnum(record, 'role', location, REVIEWER_ROLES);
  const rolePrefix = REVIEWER_ID_PATTERN.exec(id)?.[1];
  if (rolePrefix !== role) {
    failAt(childOf(location, 'id'), `"${id}" does not match the role "${role}"`,
      `Write the id as the role and a number, for example "${role}-1". Personal names are never recorded.`);
  }
  return { id, role };
}

function parseEntry(value: unknown, location: FieldLocation, reviewerIds: ReadonlySet<string>): LedgerEntry {
  const record = readRecord(value, location, { required: ['kind', 'key', 'digest', 'reviewer_id', 'reviewed_on'] });
  const kind = readEnum(record, 'kind', location, LEDGER_ENTRY_KINDS);
  const key = readString(record, 'key', location, MAX_KEY_LENGTH);
  if (!KEY_PATTERNS[kind].some((pattern) => pattern.test(key))) {
    failAt(childOf(location, 'key'), `"${key}" is not a ${kind} key`, 'Copy the key the build prints for the item that was reviewed.');
  }
  const reviewerId = readString(record, 'reviewer_id', location, MAX_KEY_LENGTH);
  if (!reviewerIds.has(reviewerId)) {
    failAt(childOf(location, 'reviewer_id'), `"${reviewerId}" is not in this file's reviewers list`, 'Add the reviewer, with a role, to reviewers first.');
  }
  return { kind, key, digest: readSha256(record, 'digest', location), reviewer_id: reviewerId, reviewed_on: readDate(record, 'reviewed_on', location) };
}

export function parseReviewLedger(raw: unknown): ReviewLedger {
  const root = rootOf(REVIEW_LEDGER_FILE);
  rejectBandKeys(raw, REVIEW_LEDGER_FILE);
  const record = readRecord(raw, root, { required: ['schema_version', 'status', 'reviewers', 'entries'] });
  const reviewers = readList(record, 'reviewers', root).map((reviewer, index) => parseReviewer(reviewer, itemOf(root, 'reviewers', index)));
  rejectDuplicates(reviewers.map((reviewer) => reviewer.id), childOf(root, 'reviewers'), 'reviewer id');
  const reviewerIds = new Set(reviewers.map((reviewer) => reviewer.id));
  const entries = readList(record, 'entries', root).map((entry, index) => parseEntry(entry, itemOf(root, 'entries', index), reviewerIds));
  for (const kind of LEDGER_ENTRY_KINDS) {
    rejectDuplicates(entries.filter((entry) => entry.kind === kind).map((entry) => entry.key), childOf(root, 'entries'), `${kind} entry`);
  }
  return {
    schema_version: readSchemaVersion(record, root, LEDGER_SCHEMA_VERSION),
    status: readStatus(record, root, REVIEW_LEDGER_STATUS),
    reviewers,
    entries,
  };
}
