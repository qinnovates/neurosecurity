import type { PinnedFile } from '@/lib/anatomy/anatomy-index-types';
import { loadAnatomyBundle } from './load-anatomy-data';

/**
 * Build time only. The anatomy index's path, length and digest for this build, and nothing else of the anatomy:
 * a page that mounts the 3D view is built with these three values so the view can refuse an index from any other build.
 * Worked out once for the whole build, however many pages carry it.
 */
export const INDEX_PIN: PinnedFile = loadAnatomyBundle().indexPin;
