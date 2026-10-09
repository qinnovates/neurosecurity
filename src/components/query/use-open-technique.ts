import { useCallback } from 'react';
import { toHash } from '@/components/workbench/route';
import { TECHNIQUE_TARGET, VIEW_STATE_KEYS } from '@/components/workbench/shell-targets';
import { useViewStateStore } from '@/components/workbench/ViewStateContext';

/**
 * Opens a technique in the catalog, by the shell's contract: the id goes under the shared
 * view-state key and the address moves to the catalog, which reads the key. Only the mode
 * and view are written to the address, never the id.
 */
export function useOpenTechniqueInCatalog(): (techniqueId: string) => void {
  const store = useViewStateStore();
  return useCallback((techniqueId: string): void => {
    store?.write(VIEW_STATE_KEYS.catalogOpenedTechniqueId, techniqueId);
    window.location.hash = toHash(TECHNIQUE_TARGET);
  }, [store]);
}
