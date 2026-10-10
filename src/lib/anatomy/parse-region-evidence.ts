/**
 * Parses the region evidence file. The build runs it on the datalake file and
 * the page runs it again on what it fetched, so a row reaches the screen only
 * after every field of it has been read by name.
 *
 * The file's own tallies are recomputed and must agree, so a row cannot be
 * added, dropped or re-graded without the header saying so.
 */

import { childOf, failAt, itemOf, readInteger, readList, readRecord, readString, rejectDuplicates, rootOf, type FieldLocation } from './field-readers';
import { readDate, readId } from './format-readers';
import { readRegionEvidenceRow } from './parse-region-evidence-row';
import {
  EVIDENCE_KINDS, REGION_EVIDENCE_DISPLAY_RULE, REGION_EVIDENCE_FILE, REGION_EVIDENCE_STATUS, VERIFIER_VERDICTS,
  type EmptyRegion, type RegionEvidence, type RegionEvidenceRow,
} from './region-evidence-types';

const FILE_KEYS = [
  'schema_note', 'status', 'display_rule', 'rows_by_kind', 'rows_by_verifier_verdict', 'date_checked', 'regions_total', 'regions_with_rows',
  'rows_attempted', 'rows_surviving', 'rows', 'empty_regions',
] as const;
const MAX_NOTE_LENGTH = 400;
const MAX_NAME_LENGTH = 120;

/** A sentence the file must carry word for word, so softening it takes a reviewed code change as well as a data edit. */
function readExactSentence(record: Record<string, unknown>, key: string, location: FieldLocation, expected: string): string {
  if (record[key] !== expected) failAt(childOf(location, key), 'the sentence differs from the one this file must carry', `Restore it to: "${expected}"`);
  return expected;
}

function readTally<Key extends string>(value: unknown, location: FieldLocation, keys: readonly Key[]): Record<Key, number> {
  const record = readRecord(value, location, { required: keys });
  return Object.fromEntries(keys.map((key) => [key, readInteger(record, key, location, 0)])) as Record<Key, number>;
}

function readEmptyRegion(value: unknown, location: FieldLocation): EmptyRegion {
  const record = readRecord(value, location, { required: ['region_id', 'reason', 'name'] });
  return { region_id: readId(record, 'region_id', location), reason: readString(record, 'reason', location, MAX_NOTE_LENGTH), name: readString(record, 'name', location, MAX_NAME_LENGTH) };
}

function countBy<Key extends string>(rows: readonly RegionEvidenceRow[], keys: readonly Key[], keyOf: (row: RegionEvidenceRow) => Key): Record<Key, number> {
  return Object.fromEntries(keys.map((key) => [key, rows.filter((row) => keyOf(row) === key).length])) as Record<Key, number>;
}

function requireEqualTally<Key extends string>(stated: Record<Key, number>, counted: Record<Key, number>, location: FieldLocation): void {
  const differing = (Object.keys(counted) as Key[]).find((key) => stated[key] !== counted[key]);
  if (differing === undefined) return;
  failAt(childOf(location, differing), `the file says ${stated[differing]} but its rows count ${counted[differing]}`, 'Regenerate the file so its tallies match its rows.');
}

function requireCount(stated: number, counted: number, location: FieldLocation): void {
  if (stated !== counted) failAt(location, `the file says ${stated} but its contents count ${counted}`, 'Regenerate the file so its tallies match its rows.');
}

/** Every region has rows or a stated reason for having none, never both and never neither. */
function checkRegionCoverage(evidence: RegionEvidence, regionIds: ReadonlySet<string>, root: FieldLocation): void {
  const withRows = new Set(evidence.rows.map((row) => row.region_id));
  const empty = new Set(evidence.empty_regions.map((region) => region.region_id));
  const strayId = [...withRows, ...empty].find((regionId) => !regionIds.has(regionId));
  if (strayId !== undefined) failAt(root, `"${strayId}" is not a QIF region id`, 'Use a canonical id from the atlas file\'s brain_regions.');
  const uncovered = [...regionIds].find((regionId) => withRows.has(regionId) === empty.has(regionId));
  if (uncovered !== undefined) {
    failAt(childOf(root, 'empty_regions'), `region "${uncovered}" must have rows or a reason for having none, and not both`, 'Add a row for it, or list it once under empty_regions.');
  }
  requireCount(evidence.regions_total, regionIds.size, childOf(root, 'regions_total'));
  requireCount(evidence.regions_with_rows, withRows.size, childOf(root, 'regions_with_rows'));
}

function checkTallies(evidence: RegionEvidence, root: FieldLocation): void {
  requireEqualTally(evidence.rows_by_kind, countBy(evidence.rows, EVIDENCE_KINDS, (row) => row.kind), childOf(root, 'rows_by_kind'));
  requireEqualTally(evidence.rows_by_verifier_verdict, countBy(evidence.rows, VERIFIER_VERDICTS, (row) => row.verifier_verdict), childOf(root, 'rows_by_verifier_verdict'));
  requireCount(evidence.rows_surviving, evidence.rows.length, childOf(root, 'rows_surviving'));
  if (evidence.rows_attempted < evidence.rows_surviving) failAt(childOf(root, 'rows_attempted'), 'fewer rows were attempted than survive', 'Correct the tally.');
}

/**
 * @param regionIds every QIF region id; a row filed under anything else is refused
 * @throws AnatomyDataError naming the first field that is wrong
 */
export function parseRegionEvidence(raw: unknown, regionIds: ReadonlySet<string>): RegionEvidence {
  const root = rootOf(REGION_EVIDENCE_FILE);
  const record = readRecord(raw, root, { required: FILE_KEYS });
  const evidence: RegionEvidence = {
    schema_note: readString(record, 'schema_note', root, MAX_NOTE_LENGTH),
    status: readExactSentence(record, 'status', root, REGION_EVIDENCE_STATUS),
    display_rule: readExactSentence(record, 'display_rule', root, REGION_EVIDENCE_DISPLAY_RULE),
    rows_by_kind: readTally(record.rows_by_kind, childOf(root, 'rows_by_kind'), EVIDENCE_KINDS),
    rows_by_verifier_verdict: readTally(record.rows_by_verifier_verdict, childOf(root, 'rows_by_verifier_verdict'), VERIFIER_VERDICTS),
    date_checked: readDate(record, 'date_checked', root),
    regions_total: readInteger(record, 'regions_total', root, 1),
    regions_with_rows: readInteger(record, 'regions_with_rows', root, 0),
    rows_attempted: readInteger(record, 'rows_attempted', root, 0),
    rows_surviving: readInteger(record, 'rows_surviving', root, 0),
    rows: readList(record, 'rows', root).map((row, index) => readRegionEvidenceRow(row, itemOf(root, 'rows', index))),
    empty_regions: readList(record, 'empty_regions', root).map((region, index) => readEmptyRegion(region, itemOf(root, 'empty_regions', index))),
  };
  // One paper may back two statements under a region, each with its own quote. The same quote twice is a duplicate row.
  rejectDuplicates(evidence.rows.map((row) => `${row.region_id}:${row.pmid}:${row.quote}`), childOf(root, 'rows'), 'statement (region, paper and quote)');
  checkTallies(evidence, root);
  checkRegionCoverage(evidence, regionIds, root);
  return evidence;
}
