/**
 * Parser for datalake/qif-anatomy-crosswalk.json: which atlas labels stand for
 * which QIF region, pathway or network. Every row is AI-drafted. A row carries
 * no review field and no band; both are derived.
 */

import { readValidForAddressing } from './addressing-version';
import {
  DELINEATION_BASES, DRAFTERS, EXPERT_DRAWN_BASIS, EXTENT_MATCHES, NAME_MATCHES, SUBJECT_KINDS, UNDECIDED_PART,
  type ContainsRelation, type Crosswalk, type CrosswalkContext, type CrosswalkPart, type CrosswalkRow, type NoGeometryRecord, type SubjectKind,
} from './anatomy-types';
import { rejectBandKeys } from './band-key-scan';
import { rejectCrossRowProblems, subjectKey } from './crosswalk-rules';
import { parseEvidence } from './evidence';
import {
  childOf, failAt, itemOf, readBoolean, readEnum, readList, readNullable, readRecord, readString, readStringList,
  rejectDuplicates, rootOf, show, type FieldLocation,
} from './field-readers';
import { readId, readSchemaVersion } from './format-readers';
import { crosswalkRowKey } from './row-digest';
import { CROSSWALK_STATUS, readStatus } from './status-sentences';

export const CROSSWALK_FILE = 'datalake/qif-anatomy-crosswalk.json';
const CROSSWALK_SCHEMA_VERSION = 2;
const MAX_NAME_LENGTH = 200;
const MAX_REASON_LENGTH = 400;
const MAX_LABEL_ID_LENGTH = 40;
const ROW_KEYS = [
  'subject_kind', 'subject_id', 'subject_name_at_draft', 'valid_for_addressing', 'part', 'atlas', 'atlas_ids', 'name_match',
  'extent_match', 'definition_contested', 'draws', 'delineation_basis', 'evidence', 'drafted_by',
] as const;

/** A canonical id of the stated kind. An alias gets its own message, because it is the likeliest mistake. */
function readSubjectId(record: Record<string, unknown>, key: string, kind: SubjectKind, location: FieldLocation, context: CrosswalkContext): string {
  const subjectId = readString(record, key, location, MAX_NAME_LENGTH);
  if (context.subjectNames[kind].has(subjectId)) return subjectId;
  if (kind === 'region' && context.regionAliases.has(subjectId)) {
    return failAt(childOf(location, key), `"${subjectId}" is an alias, not a canonical region id`, 'Use the id from brain_regions[].id that the alias points at.');
  }
  return failAt(childOf(location, key), `"${subjectId}" is not a ${kind} id`, `Use a canonical ${kind} id from the QIF data files.`);
}

function rejectNameDrift(record: Record<string, unknown>, kind: SubjectKind, subjectId: string, location: FieldLocation, context: CrosswalkContext): string {
  const nameAtDraft = readString(record, 'subject_name_at_draft', location, MAX_NAME_LENGTH);
  const currentName = context.subjectNames[kind].get(subjectId);
  if (nameAtDraft !== currentName) {
    failAt(childOf(location, 'subject_name_at_draft'), `the row was drafted for "${nameAtDraft}" but ${kind} "${subjectId}" is now named "${show(currentName)}"`,
      'The record may mean something else now. Re-draft the row against the current record; do not just copy the new name.');
  }
  return nameAtDraft;
}

function readAtlasLabels(record: Record<string, unknown>, location: FieldLocation, context: CrosswalkContext): Pick<CrosswalkRow, 'atlas' | 'atlas_ids'> {
  const atlas = readId(record, 'atlas', location);
  if (!context.delineationBasisByAtlas.has(atlas)) failAt(childOf(location, 'atlas'), `"${atlas}" is not a source in the registry`, 'Add the source to qif-anatomy-sources.json first.');
  const atlasIds = readStringList(record, 'atlas_ids', location, MAX_LABEL_ID_LENGTH);
  const isNoneRow = record.extent_match === 'none';
  if (isNoneRow && atlasIds.length > 0) {
    return failAt(childOf(location, 'atlas_ids'), 'a row graded "none" says no shape stands for the subject, so it must list no label',
      'Empty atlas_ids, or grade the row for what the shape is. A row with labels owns them.');
  }
  if (isNoneRow) return { atlas, atlas_ids: [] };
  const labelTable = context.labelTables.get(atlas);
  if (labelTable === undefined) {
    return failAt(childOf(location, 'atlas'), `"${atlas}" has no label table yet`, 'A row may only name label ids read from the atlas\'s own table; add the row once the pipeline has written it.');
  }
  if (atlasIds.length === 0) return failAt(childOf(location, 'atlas_ids'), 'a row must name at least one label', 'List the label ids, grade the row "none", or write a no_geometry record instead.');
  const unknownLabel = atlasIds.find((labelId) => !labelTable.labels.some((label) => label.id === labelId));
  if (unknownLabel !== undefined) failAt(childOf(location, 'atlas_ids'), `"${unknownLabel}" is not a label of "${atlas}"`, 'Use an id from the atlas\'s label table.');
  rejectDuplicates(atlasIds, childOf(location, 'atlas_ids'), 'label id');
  return { atlas, atlas_ids: atlasIds };
}

/** `same` is reserved for a label from a measured group atlas, and a row's basis must be the registry's. */
function rejectGradeProblems(row: CrosswalkRow, location: FieldLocation, context: CrosswalkContext): void {
  const registryBasis = context.delineationBasisByAtlas.get(row.atlas) ?? null;
  if (registryBasis === null) {
    failAt(childOf(location, 'delineation_basis'), `the registry does not yet record how "${row.atlas}" was delineated`, 'Read the publisher\'s description and set delineation.basis on the source first.');
  }
  if (row.delineation_basis !== registryBasis) {
    failAt(childOf(location, 'delineation_basis'), `"${row.delineation_basis}" is not the basis "${registryBasis}" the registry records for "${row.atlas}"`, 'Copy the basis from the source row.');
  }
  if (registryBasis === EXPERT_DRAWN_BASIS && row.extent_match === 'same') {
    failAt(childOf(location, 'extent_match'), `"${row.atlas}" is an expert drawing on a template, so no row on it may be "same"`, 'Grade the row "approximate" or "contained".');
  }
}

function rejectDrawingProblems(row: CrosswalkRow, parts: readonly CrosswalkPart[], location: FieldLocation, context: CrosswalkContext): void {
  if (!row.draws) return;
  const drawsLocation = childOf(location, 'draws');
  if (row.extent_match === 'none') failAt(drawsLocation, 'a row whose extent_match is "none" has nothing to draw', 'Set draws to false.');
  if (!context.buildableAtlasIds.has(row.atlas)) failAt(drawsLocation, `"${row.atlas}" is not buildable, so nothing may be drawn from it`, 'Set draws to false until the source is cleared and its route settled.');
  const part = parts.find((candidate) => candidate.id === row.part);
  if (part?.expected_v2_id === UNDECIDED_PART) failAt(drawsLocation, `part "${part.id}" is undecided, so no row on it may draw`, 'Decide what the part becomes first, or set draws to false.');
}

function parseRow(value: unknown, location: FieldLocation, parts: readonly CrosswalkPart[], context: CrosswalkContext): CrosswalkRow {
  const record = readRecord(value, location, { required: ROW_KEYS });
  const subjectKind = readEnum(record, 'subject_kind', location, SUBJECT_KINDS);
  const subjectId = readSubjectId(record, 'subject_id', subjectKind, location, context);
  const part = readNullable(record, 'part', () => readString(record, 'part', location, MAX_NAME_LENGTH));
  if (part !== null && !parts.some((candidate) => candidate.id === part)) {
    failAt(childOf(location, 'part'), `"${part}" is not in this file's parts list`, 'Add the part to "parts" with the v2 id it is expected to become, or "undecided".');
  }
  const row: CrosswalkRow = {
    subject_kind: subjectKind,
    subject_id: subjectId,
    subject_name_at_draft: rejectNameDrift(record, subjectKind, subjectId, location, context),
    valid_for_addressing: readValidForAddressing(record, location),
    part,
    ...readAtlasLabels(record, location, context),
    name_match: readEnum(record, 'name_match', location, NAME_MATCHES),
    extent_match: readEnum(record, 'extent_match', location, EXTENT_MATCHES),
    definition_contested: readBoolean(record, 'definition_contested', location),
    draws: readBoolean(record, 'draws', location),
    delineation_basis: readEnum(record, 'delineation_basis', location, DELINEATION_BASES),
    evidence: parseEvidence(record.evidence, childOf(location, 'evidence')),
    drafted_by: readEnum(record, 'drafted_by', location, DRAFTERS),
  };
  rejectGradeProblems(row, location, context);
  rejectDrawingProblems(row, parts, location, context);
  return row;
}

function parsePart(value: unknown, location: FieldLocation): CrosswalkPart {
  const record = readRecord(value, location, { required: ['id', 'expected_v2_id'] });
  return { id: readId(record, 'id', location), expected_v2_id: readId(record, 'expected_v2_id', location) };
}

function parseContains(value: unknown, location: FieldLocation, context: CrosswalkContext): ContainsRelation {
  const record = readRecord(value, location, { required: ['parent', 'child'] });
  return {
    parent: readSubjectId(record, 'parent', 'region', location, context),
    child: readSubjectId(record, 'child', 'region', location, context),
  };
}

function parseNoGeometry(value: unknown, location: FieldLocation, context: CrosswalkContext): NoGeometryRecord {
  const record = readRecord(value, location, { required: ['subject_kind', 'subject_id', 'reason', 'reason_source', 'drafted_by'] });
  const subjectKind = readEnum(record, 'subject_kind', location, SUBJECT_KINDS);
  return {
    subject_kind: subjectKind,
    subject_id: readSubjectId(record, 'subject_id', subjectKind, location, context),
    reason: readString(record, 'reason', location, MAX_REASON_LENGTH),
    reason_source: readString(record, 'reason_source', location, MAX_REASON_LENGTH),
    drafted_by: readEnum(record, 'drafted_by', location, DRAFTERS),
  };
}

export function parseCrosswalk(raw: unknown, context: CrosswalkContext): Crosswalk {
  const root = rootOf(CROSSWALK_FILE);
  rejectBandKeys(raw, CROSSWALK_FILE);
  const record = readRecord(raw, root, { required: ['schema_version', 'status', 'parts', 'contains', 'no_geometry', 'rows'] });
  const parts = readList(record, 'parts', root).map((part, index) => parsePart(part, itemOf(root, 'parts', index)));
  rejectDuplicates(parts.map((part) => part.id), childOf(root, 'parts'), 'part id');
  const crosswalk: Crosswalk = {
    schema_version: readSchemaVersion(record, root, CROSSWALK_SCHEMA_VERSION),
    status: readStatus(record, root, CROSSWALK_STATUS),
    parts,
    contains: readList(record, 'contains', root).map((relation, index) => parseContains(relation, itemOf(root, 'contains', index), context)),
    no_geometry: readList(record, 'no_geometry', root).map((entry, index) => parseNoGeometry(entry, itemOf(root, 'no_geometry', index), context)),
    rows: readList(record, 'rows', root).map((row, index) => parseRow(row, itemOf(root, 'rows', index), parts, context)),
  };
  rejectDuplicates(crosswalk.rows.map(crosswalkRowKey), childOf(root, 'rows'), 'row');
  rejectDuplicates(crosswalk.no_geometry.map(subjectKey), childOf(root, 'no_geometry'), 'no_geometry record for');
  rejectCrossRowProblems(crosswalk, root);
  return crosswalk;
}
