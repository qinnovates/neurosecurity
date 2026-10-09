import type { IndexReviewState } from '@/lib/anatomy/anatomy-index-types';
import { UNREVIEWED, toIndexReviewState } from '@/lib/anatomy/review-state';

/** The mark for literature rows and card facts: their files record that no person has reviewed them. */
export const UNREVIEWED_MARK: IndexReviewState = toIndexReviewState(UNREVIEWED);

interface Props {
  state: IndexReviewState;
}

/**
 * The review mark that sits beside every AI-drafted mapping. Its words come
 * from the index, and its shape differs by state, so it does not rest on colour.
 */
export default function ReviewMark({ state }: Props) {
  const isReviewed = state.state === 'reviewed';
  return (
    <span className="atlas-mark" data-review-state={state.state} data-ai-drafted={isReviewed ? undefined : 'true'}>
      <svg className="atlas-mark-glyph" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        {isReviewed ? <path d="M2 6.5 5 9.5 10 3" /> : <path d="M6 1 11 10H1Z" />}
      </svg>
      {state.mark}
    </span>
  );
}
