/**
 * Derives the state of every drafted row: its ledger key, the digest of what a
 * reviewer would be looking at, whether a review covers it, and whether its
 * quoted words still stand. A stale quote demotes the row to unchecked.
 *
 * Build time only (digests use node:crypto).
 */

import { isValidForAddressing } from './addressing-version';
import type { AnatomyData } from './anatomy-inputs';
import type { IndexReviewState } from './anatomy-index-types';
import { NO_GEOMETRY_TOKEN, type AtlasLabel, type ContainsRelation, type CrosswalkRow, type NoGeometryRecord } from './anatomy-types';
import type { ReviewedRow } from './build-owner-map';
import { UNCHECKED, type CheckStatus, type EvidenceBlock } from './evidence';
import { canonicalJson, crosswalkRowKey, digestCrosswalkRow, sha256Hex } from './row-digest';
import { findReview, toIndexReviewState } from './review-state';
import { SOURCE_REF_STATES, checkSourceRef, type SourceRefState } from './source-ref';


export interface CheckedEvidence {
  quote_state: SourceRefState;
  check_status: CheckStatus;
}

/**
 * The check status a claim may show. A file's own `check_status` is only a
 * claim: it counts once a review covers the row as it is now, and only while
 * the quoted words still appear at their pointer. Otherwise it reads unchecked.
 */
export function checkEvidence(evidence: EvidenceBlock, reviewState: IndexReviewState, data: AnatomyData): CheckedEvidence {
  const quoteState = checkSourceRef(evidence.source_ref, data.documentsByFile);
  const isVouchedFor = reviewState.state === 'reviewed' && quoteState === SOURCE_REF_STATES.QUOTE_FOUND;
  return { quote_state: quoteState, check_status: isVouchedFor ? evidence.check_status : UNCHECKED };
}

export function reviewOf(data: AnatomyData, key: string, digest: string): IndexReviewState {
  return toIndexReviewState(findReview(data.ledger, 'row_review', key, digest));
}

function listPointedLabels(row: CrosswalkRow, data: AnatomyData): AtlasLabel[] {
  const labels = data.labelTables.get(row.atlas)?.labels ?? [];
  return labels.filter((label) => row.atlas_ids.includes(label.id));
}

/** The sha256 of every asset that draws one of the row's labels. Rebuilding a mesh changes it, and so un-reviews the row. */
function listDrawingMeshes(row: CrosswalkRow, data: AnatomyData): string[] {
  const assets = data.manifest?.assets ?? [];
  return assets
    .filter((asset) => asset.nodes.some((node) => node.extras.atlas === row.atlas && row.atlas_ids.includes(node.extras.label_id)))
    .map((asset) => asset.sha256);
}

/** A declared containment gives the row's shapes another owner, so the row's review must cover it. */
function listContainment(row: CrosswalkRow, data: AnatomyData): ContainsRelation[] {
  if (row.subject_kind !== 'region') return [];
  return data.crosswalk.contains.filter((relation) => relation.parent === row.subject_id || relation.child === row.subject_id);
}

export interface ReviewedCrosswalk {
  /** Rows valid for the current addressing. Only these own structures. */
  current: Array<ReviewedRow & CheckedEvidence>;
  /** Rows that predate the current addressing. They draw nothing. */
  outdated: CrosswalkRow[];
}

export function reviewCrosswalkRows(data: AnatomyData): ReviewedCrosswalk {
  const isCurrent = (row: CrosswalkRow): boolean => isValidForAddressing(row, data.addressingVersion);
  const current = data.crosswalk.rows.filter(isCurrent).map((row) => {
    const key = crosswalkRowKey(row);
    const digest = digestCrosswalkRow(row, { labels: listPointedLabels(row, data), meshSha256s: listDrawingMeshes(row, data), containment: listContainment(row, data) });
    const reviewState = reviewOf(data, key, digest);
    return { row, key, digest, review_state: reviewState, ...checkEvidence(row.evidence, reviewState, data) };
  });
  return { current, outdated: data.crosswalk.rows.filter((row) => !isCurrent(row)) };
}

export interface ReviewedNoGeometry {
  record: NoGeometryRecord;
  key: string;
  digest: string;
  review_state: IndexReviewState;
}

export function reviewNoGeometry(data: AnatomyData): ReviewedNoGeometry[] {
  return data.crosswalk.no_geometry.map((record) => {
    const key = crosswalkRowKey({ ...record, atlas: NO_GEOMETRY_TOKEN, part: null });
    const digest = sha256Hex(canonicalJson(record));
    return { record, key, digest, review_state: reviewOf(data, key, digest) };
  });
}
