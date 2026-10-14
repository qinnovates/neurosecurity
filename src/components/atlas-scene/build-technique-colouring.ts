import { createStructureStyler } from '@/lib/anatomy/colour-modes';
import type { LimitSentence } from '@/lib/anatomy/limits-copy';
import { limitsForUncolouredTechnique, type ColouringSource } from '@/lib/atlas-explorer/technique-colouring';
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
 * technique the index does not hold names no region, which is also what the view says of it.
 */
export function readUncolouredLimit(techniqueId: string): LimitSentence | null {
  return limitsForUncolouredTechnique(COLOURING_SOURCE, { kind: 'technique', techniqueId })[0] ?? null;
}
