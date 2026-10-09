import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useReducedMotion } from './use-reduced-motion';

type StateUpdate = () => void;

function canTransition(): boolean {
  return typeof document !== 'undefined' && typeof document.startViewTransition === 'function';
}

/**
 * Runs a state update as one view transition: the old picture cross-fades to the new one.
 * Where the browser has no view transitions, or the viewer asked for less motion, the
 * update is applied with no animation.
 */
export function useViewTransition(): (update: StateUpdate) => void {
  const isReduced = useReducedMotion();
  return useCallback((update: StateUpdate): void => {
    if (isReduced || !canTransition()) {
      update();
      return;
    }
    // The browser pictures the page before and after this callback, so React must finish inside it.
    document.startViewTransition(() => flushSync(update));
  }, [isReduced]);
}
