/**
 * How Explore hands the reader to another screen. The address holds only mode and view;
 * anything else (a technique id) is handed over through view state by the shell's own hooks
 * in `workbench/use-open-technique`.
 */

import { toHash } from '@/components/workbench/route';
import { MODEL_OVERVIEW_TARGET, VIEW_STATE_KEYS } from '@/components/workbench/shell-targets';
import { useViewState } from '@/components/workbench/ViewStateContext';

/** Explore's own views, as the view registry names them. */
export const START_VIEW_ID = 'device-classes';
export const CATALOG_VIEW_ID = 'catalog';
export const AUTHORED_CHAINS_VIEW_ID = 'curated-chains';
export const SPECIFICATIONS_VIEW_ID = 'specifications';

const MAX_TECHNIQUE_ID_LENGTH = 64;

/** Opens the Model mode at its overview of the device in focus. The shell follows the address. */
export function openModelOverview(): void {
  window.location.hash = toHash(MODEL_OVERVIEW_TARGET);
}

function isOpenedTechniqueId(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && value.length <= MAX_TECHNIQUE_ID_LENGTH);
}

/** The technique open in the catalog. The command palette and every technique link write the same key. An id the catalog lacks opens nothing. */
export function useOpenedTechniqueId(): [string | null, (techniqueId: string | null) => void] {
  return useViewState<string | null>(VIEW_STATE_KEYS.catalogOpenedTechniqueId, null, isOpenedTechniqueId);
}
