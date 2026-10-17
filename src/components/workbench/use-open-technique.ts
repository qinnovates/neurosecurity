/**
 * Opening a technique from any screen. The id is handed over through view state and the
 * address changes to the screen that shows it, so the address itself never carries the id.
 */

import { useCallback } from 'react';
import { toHash, type Route } from './route';
import { MODEL_TECHNIQUE_TARGET, TECHNIQUE_TARGET, VIEW_STATE_KEYS } from './shell-targets';
import { useViewStateStore } from './ViewStateContext';

export type OpenTechnique = (techniqueId: string) => void;

function useTechniqueHandOver(key: string, target: Route): OpenTechnique {
  const store = useViewStateStore();
  return useCallback((techniqueId: string): void => {
    store?.write(key, techniqueId);
    // The shell listens for the address change; a screen needs no navigation prop to call this.
    window.location.hash = toHash(target);
  }, [store, key, target]);
}

/** Opens the technique in the catalog (Explore, Techniques). */
export function useOpenTechnique(): OpenTechnique {
  return useTechniqueHandOver(VIEW_STATE_KEYS.catalogOpenedTechniqueId, TECHNIQUE_TARGET);
}

/** Narrows the Model mode's register to the technique (Model, Risks). */
export function useShowTechniqueInModel(): OpenTechnique {
  return useTechniqueHandOver(VIEW_STATE_KEYS.modelLensTechniqueId, MODEL_TECHNIQUE_TARGET);
}
