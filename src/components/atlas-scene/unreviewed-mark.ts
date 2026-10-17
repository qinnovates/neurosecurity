import type { IndexReviewState } from '@/lib/anatomy/anatomy-index-types';
import { UNREVIEWED, toIndexReviewState } from '@/lib/anatomy/review-state';

/** The mark for literature rows and card facts: their files record that no person has reviewed them. Build time and the explorer only: review-state.ts is not for a page's first load. */
export const UNREVIEWED_MARK: IndexReviewState = toIndexReviewState(UNREVIEWED);
