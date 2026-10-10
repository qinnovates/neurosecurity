/**
 * The `anatomy_crosswalk` table: every drafted statement about what stands for
 * a QIF record in an atlas. One row per crosswalk row that is valid for the
 * current addressing, and one per record saying no buildable atlas has
 * geometry. A record absent from the table has nothing drafted for it.
 *
 * A row says an atlas label was read as corresponding to a record, and how
 * loosely (`extent_match`); it never says the label is the structure.
 */

import type { AnatomyData } from './anatomy-inputs';
import type { IndexSubject } from './anatomy-index-types';
import type { AtlasLabel, CrosswalkRow } from './anatomy-types';
import type { ReviewedRow } from './build-owner-map';
import { buildSubjects } from './build-index-structures';
import { subjectKey } from './crosswalk-rules';
import type { CheckedEvidence, ReviewedCrosswalk, ReviewedNoGeometry } from './review-rows';
import { draftColumns, evidenceColumns, joinIds, joinText, type AnatomyRow, type EvidenceColumns } from './table-columns';

export const CROSSWALK_ROW_KINDS = { CORRESPONDENCE: 'atlas_correspondence', NO_GEOMETRY: 'no_geometry' } as const;

const NOT_APPLICABLE = '';
const UNKNOWN_SUBJECT_NAME = '';
/** A no-geometry record quotes nothing, so its evidence columns are empty. It states its reason and where the reason comes from. */
const NO_EVIDENCE_COLUMNS: EvidenceColumns = {
  claim_basis: NOT_APPLICABLE, quoted_text: NOT_APPLICABLE, quoted_file: NOT_APPLICABLE, quoted_pointer: NOT_APPLICABLE,
  quote_state: NOT_APPLICABLE, rationale: NOT_APPLICABLE, check_status: NOT_APPLICABLE,
};
/** A no-geometry record points at no atlas. Null says the column does not apply; false would read as a finding. */
const NO_ATLAS_COLUMNS: AnatomyRow = {
  part: NOT_APPLICABLE, atlas: NOT_APPLICABLE, atlas_label_ids: NOT_APPLICABLE, atlas_label_names: NOT_APPLICABLE, atlas_label_count: 0,
  name_match: NOT_APPLICABLE, extent_match: NOT_APPLICABLE, definition_contested: null, draws: false, delineation_basis: NOT_APPLICABLE,
};

interface CrosswalkTableContext {
  data: AnatomyData;
  subjectsByKey: ReadonlyMap<string, IndexSubject>;
}

/** The subject's current name and what the index says stands for it. Repeated on each of the subject's rows. */
function subjectColumns(subject: Pick<CrosswalkRow, 'subject_kind' | 'subject_id'>, context: CrosswalkTableContext): AnatomyRow {
  const indexed = context.subjectsByKey.get(subjectKey(subject));
  return {
    subject_kind: subject.subject_kind,
    subject_id: subject.subject_id,
    subject_name: context.data.subjectNames[subject.subject_kind].get(subject.subject_id) ?? UNKNOWN_SUBJECT_NAME,
    subject_geometry_state: indexed?.geometry.state ?? NOT_APPLICABLE,
    subject_geometry_reason: indexed?.geometry.reason ?? NOT_APPLICABLE,
    subject_geometry_reason_source: indexed?.geometry.reason_source ?? NOT_APPLICABLE,
  };
}

function listLabels(row: CrosswalkRow, data: AnatomyData): AtlasLabel[] {
  const labels = data.labelTables.get(row.atlas)?.labels ?? [];
  return row.atlas_ids.flatMap((labelId) => labels.filter((label) => label.id === labelId));
}

function atlasColumns(row: CrosswalkRow, data: AnatomyData): AnatomyRow {
  return {
    part: row.part ?? NOT_APPLICABLE,
    atlas: row.atlas,
    atlas_label_ids: joinIds(row.atlas_ids),
    atlas_label_names: joinText(listLabels(row, data).map((label) => label.name)),
    atlas_label_count: row.atlas_ids.length,
    name_match: row.name_match,
    extent_match: row.extent_match,
    definition_contested: row.definition_contested,
    draws: row.draws,
    delineation_basis: row.delineation_basis,
  };
}

function toCorrespondenceRow(reviewed: ReviewedRow & CheckedEvidence, context: CrosswalkTableContext): AnatomyRow {
  const { row } = reviewed;
  return {
    row_kind: CROSSWALK_ROW_KINDS.CORRESPONDENCE,
    review_key: reviewed.key,
    ...subjectColumns(row, context),
    subject_name_at_draft: row.subject_name_at_draft,
    ...atlasColumns(row, context.data),
    ...evidenceColumns(row.evidence, reviewed),
    addressing_version: context.data.addressingVersion,
    ...draftColumns(row.drafted_by, reviewed.review_state, context.data.crosswalk.status),
  };
}

function toNoGeometryRow(reviewed: ReviewedNoGeometry, context: CrosswalkTableContext): AnatomyRow {
  const { record } = reviewed;
  return {
    row_kind: CROSSWALK_ROW_KINDS.NO_GEOMETRY,
    review_key: reviewed.key,
    ...subjectColumns(record, context),
    subject_name_at_draft: NOT_APPLICABLE,
    ...NO_ATLAS_COLUMNS,
    ...NO_EVIDENCE_COLUMNS,
    addressing_version: context.data.addressingVersion,
    ...draftColumns(record.drafted_by, reviewed.review_state, context.data.crosswalk.status),
  };
}

/**
 * @param crosswalk the reviewed rows the index is built from
 * @param noGeometry the reviewed no-geometry records the index is built from
 */
export function buildCrosswalkTable(data: AnatomyData, crosswalk: ReviewedCrosswalk, noGeometry: readonly ReviewedNoGeometry[]): AnatomyRow[] {
  const subjects = buildSubjects(data, crosswalk, noGeometry);
  const context: CrosswalkTableContext = { data, subjectsByKey: new Map(subjects.map((subject) => [subjectKey({ subject_kind: subject.kind, subject_id: subject.id }), subject])) };
  return [
    ...crosswalk.current.map((reviewed) => toCorrespondenceRow(reviewed, context)),
    ...noGeometry.map((reviewed) => toNoGeometryRow(reviewed, context)),
  ];
}
