/**
 * The cells and columns every exported anatomy table shares. A table is a flat
 * copy of AI-drafted data that leaves the page that explains it, so each row
 * carries who drafted it, its review state with the mark's words, and the
 * status sentence of what it was drafted in. No builder writes those columns
 * by hand: they come from `draftColumns`, which has no way to leave one out.
 */

import type { IndexReviewState } from './anatomy-index-types';
import type { Drafter } from './anatomy-types';
import type { EvidenceBlock } from './evidence';
import type { CheckedEvidence } from './review-rows';

/** Null only where a column does not apply to the row. A drafted row's state is never null. */
export type AnatomyCell = string | number | boolean | null;
export type AnatomyRow = Record<string, AnatomyCell>;

/** The columns no anatomy table may lack. A test holds every table to this list. */
export const DRAFT_COLUMNS = ['drafted_by', 'review_state', 'review_mark', 'reviewed_by_role', 'reviewed_on', 'status_sentence'] as const;
export type DraftColumns = Record<typeof DRAFT_COLUMNS[number], string>;

/** The columns of a row that rests on quoted words. */
export const EVIDENCE_COLUMNS = ['claim_basis', 'quoted_text', 'quoted_file', 'quoted_pointer', 'quote_state', 'rationale', 'check_status'] as const;
export type EvidenceColumns = Record<typeof EVIDENCE_COLUMNS[number], string>;

const ID_SEPARATOR = ', ';
/** Atlas label names and licence terms hold commas, so text lists are joined with this. */
const TEXT_SEPARATOR = ' | ';
const NOT_REVIEWED = '';

/** Ids joined the way the other query tables join lists. */
export function joinIds(ids: readonly string[]): string {
  return ids.join(ID_SEPARATOR);
}

export function joinText(parts: readonly string[]): string {
  return parts.join(TEXT_SEPARATOR);
}

/**
 * @param draftedBy who drafted the row, from the row itself or from its file
 * @param reviewState the state the index derived for the row; it has no empty value
 * @param statusSentence the status sentence of the file or index the row comes from
 */
export function draftColumns(draftedBy: Drafter, reviewState: IndexReviewState, statusSentence: string): DraftColumns {
  const isReviewed = reviewState.state === 'reviewed';
  return {
    drafted_by: draftedBy,
    review_state: reviewState.state,
    review_mark: reviewState.mark,
    reviewed_by_role: isReviewed ? reviewState.reviewer_role : NOT_REVIEWED,
    reviewed_on: isReviewed ? reviewState.reviewed_on : NOT_REVIEWED,
    status_sentence: statusSentence,
  };
}

/**
 * The quoted words a row rests on, with the check status the build derived for
 * them. The file's own `check_status` is only a claim and is never exported.
 */
export function evidenceColumns(evidence: EvidenceBlock, checked: CheckedEvidence): EvidenceColumns {
  return {
    claim_basis: evidence.claim_basis,
    quoted_text: evidence.source_ref.quote,
    quoted_file: evidence.source_ref.file,
    quoted_pointer: evidence.source_ref.pointer,
    quote_state: checked.quote_state,
    rationale: evidence.rationale,
    check_status: checked.check_status,
  };
}
