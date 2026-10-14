import { createStructureStyler } from '@/lib/anatomy/colour-modes';
import type { LimitSentence } from '@/lib/anatomy/limits-copy';
import { limitsForUncolouredTechnique, type ColouringSource } from '@/lib/atlas-explorer/technique-colouring';
import type { IndexReviewState } from '@/lib/anatomy/anatomy-index-types';
import { weakestReviewState } from '@/lib/atlas-explorer/explorer-model';
import { UNREVIEWED_MARK } from './unreviewed-mark';
import { loadAnatomyBundle } from './load-anatomy-data';

function loadColouringSource(): ColouringSource {
  const { index } = loadAnatomyBundle();
  return { index, styleStructure: createStructureStyler(index) };
}

/** Loaded once for the whole build, however many technique pages ask. */
const COLOURING_SOURCE = loadColouringSource();

/**
 * Build time only. The sentence for a technique whose drafted links colour no shape in the 3D view, or null for one
 * that colours a shape; nothing else of the anatomy leaves this module. A technique page is built with its sentence so
 * the button that asks for the view can say, before anything is fetched, that the picture will have nothing coloured.
 * It is chosen by the same function, from the same index, as the view's own caption (technique-colouring.ts). A
 * technique the index does not hold has no neural band, and the sentence says that.
 */
export function readUncolouredLimit(techniqueId: string): LimitSentence | null {
  return limitsForUncolouredTechnique(COLOURING_SOURCE, { kind: 'technique', techniqueId })[0] ?? null;
}

/**
 * Build time only. The review state of the region links drafted for a technique the index holds: the weakest of its
 * links', and unreviewed when it has none, since the sentence beside the button still speaks of drafted links. Null for
 * a technique the index does not hold (no neural band): nothing was drafted for it, so there is nothing to mark.
 */
export function readLinksReview(techniqueId: string): IndexReviewState | null {
  const technique = COLOURING_SOURCE.index.techniques.find((candidate) => candidate.id === techniqueId);
  if (technique === undefined) return null;
  return weakestReviewState(technique.links.map((link) => link.review_state)) ?? UNREVIEWED_MARK;
}
