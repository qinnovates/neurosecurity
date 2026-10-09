/**
 * Review state, derived and never stored on a row. A drafted item is
 * "AI-drafted, unreviewed" unless a ledger entry of the right kind and key
 * carries the digest of the item as it is now. The state has no empty value,
 * so nothing built from it can drop the mark.
 */

import type { IndexReviewState } from './anatomy-index-types';
import { AnatomyDataError } from './errors';
import type { CheckStatus } from './evidence';
import {
  LEDGER_ENTRY_KINDS, REVIEW_LEDGER_FILE, type LedgerEntryKind, type ReviewLedger, type ReviewerRole,
} from './parse-review-ledger';

export type ReviewState =
  | { state: 'ai_drafted_unreviewed' }
  | { state: 'reviewed'; reviewer_role: ReviewerRole; reviewed_on: string };

export const UNREVIEWED: ReviewState = { state: 'ai_drafted_unreviewed' };

/**
 * How many ledger entries of each kind the build expects. Marking anything
 * reviewed therefore takes two deliberate edits: the ledger entry, and this
 * number. Both belong to the repository owner.
 */
export const REVIEWED_ENTRY_COUNTS: Readonly<Record<LedgerEntryKind, number>> = { row_review: 0, visual_check: 0, agreement: 0 };

/** Least able to vouch for anatomy first. An owner's review is not a specialist's. */
const ROLE_RANK: readonly ReviewerRole[] = ['other', 'owner', 'clinician', 'neuroanatomist'];
/** Worst first. */
const CHECK_STATUS_RANK: readonly CheckStatus[] = ['contradicts', 'unchecked', 'partial', 'supports'];
const UNREVIEWED_RANK = -1;

/** Reviewed when an entry of this kind and key carries this digest; anything else is unreviewed, with no error. */
export function findReview(ledger: ReviewLedger, kind: LedgerEntryKind, key: string, digest: string): ReviewState {
  const entry = ledger.entries.find((candidate) => candidate.kind === kind && candidate.key === key && candidate.digest === digest);
  const reviewer = ledger.reviewers.find((candidate) => candidate.id === entry?.reviewer_id);
  if (entry === undefined || reviewer === undefined) return UNREVIEWED;
  return { state: 'reviewed', reviewer_role: reviewer.role, reviewed_on: entry.reviewed_on };
}

function rankOf(state: ReviewState): number {
  return state.state === 'reviewed' ? ROLE_RANK.indexOf(state.reviewer_role) : UNREVIEWED_RANK;
}

function isWorse(candidate: ReviewState, current: ReviewState): boolean {
  if (rankOf(candidate) !== rankOf(current)) return rankOf(candidate) < rankOf(current);
  return candidate.state === 'reviewed' && current.state === 'reviewed' && candidate.reviewed_on < current.reviewed_on;
}

/** The worst state among several items shown as one. With nothing to go on, unreviewed. */
export function worstReviewState(states: readonly ReviewState[]): ReviewState {
  if (states.length === 0) return UNREVIEWED;
  return states.reduce((worst, state) => (isWorse(state, worst) ? state : worst));
}

/** The worst check status among several items shown as one. With nothing to go on, unchecked. */
export function worstCheckStatus(statuses: readonly CheckStatus[]): CheckStatus {
  return CHECK_STATUS_RANK.find((status) => statuses.includes(status)) ?? 'unchecked';
}

/** The mark's words. There is no state for which this is empty. */
export function describeReviewState(state: ReviewState): string {
  return state.state === 'reviewed' ? `Reviewed by ${state.reviewer_role}, ${state.reviewed_on}` : 'AI-drafted, unreviewed';
}

/** The state as the index carries it: with its mark's words attached, so a consumer cannot show the state without them. */
export function toIndexReviewState(state: ReviewState): IndexReviewState {
  return { ...state, mark: describeReviewState(state) };
}

export function countEntriesByKind(ledger: ReviewLedger): Record<LedgerEntryKind, number> {
  const count = (kind: LedgerEntryKind): number => ledger.entries.filter((entry) => entry.kind === kind).length;
  return { row_review: count('row_review'), visual_check: count('visual_check'), agreement: count('agreement') };
}

/** Stops the build when the ledger and REVIEWED_ENTRY_COUNTS disagree. */
export function assertLedgerRatchet(ledger: ReviewLedger): void {
  const counts = countEntriesByKind(ledger);
  const kind = LEDGER_ENTRY_KINDS.find((candidate) => counts[candidate] !== REVIEWED_ENTRY_COUNTS[candidate]);
  if (kind === undefined) return;
  throw new AnatomyDataError(REVIEW_LEDGER_FILE, 'entries',
    `the ledger holds ${counts[kind]} ${kind} entries but REVIEWED_ENTRY_COUNTS expects ${REVIEWED_ENTRY_COUNTS[kind]}`,
    'If the repository owner added or removed a review, change REVIEWED_ENTRY_COUNTS in src/lib/anatomy/review-state.ts in the same change.');
}
