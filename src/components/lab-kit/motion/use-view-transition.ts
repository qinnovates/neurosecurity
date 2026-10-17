import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useReducedMotion } from './use-reduced-motion';

type StateUpdate = () => void;

function canTransition(): boolean {
  return typeof document !== 'undefined' && typeof document.startViewTransition === 'function';
}

/**
 * Runs a state update as one view transition: the old picture cross-fades to the new one, and
 * anything carrying a view-transition name (`lab-vt-diagram`, `lab-vt-identity`, the bars) moves to its new place.
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
    const transition = document.startViewTransition(() => flushSync(update));
    // A transition the browser skips (the tab is hidden, or two elements share a transition name) still applies
    // the update; only the animation is lost. That is the no-animation fallback, so the rejection is not an error.
    transition.ready.catch(() => undefined);
  }, [isReduced]);
}
