import { useCallback, useEffect, useState } from 'react';
import { DURATION_MOVE_MS } from './motion-tokens';
import { useReducedMotion } from './use-reduced-motion';

/** If the browser never reports the end of the exit animation, the layer is removed this long after it should have finished. */
const EXIT_GRACE_MS = 120;

export interface ExitPresence {
  /** True while the layer should be in the document: open, or still leaving. */
  isMounted: boolean;
  /** True while the layer plays its one move out. It must not take input in this time. */
  isClosing: boolean;
  /** Call when the exit animation has ended. */
  finishClosing: () => void;
}

/** Whether an exit can be seen at all. Where it cannot (no animations, or less motion asked for), the layer goes at once. */
function canAnimateExit(isReduced: boolean): boolean {
  return !isReduced && typeof document !== 'undefined' && typeof document.getAnimations === 'function';
}

/**
 * Keeps a floating layer in the document for one exit animation after it is closed, so it
 * leaves instead of vanishing. The layer's stylesheet draws the move under `[data-closing]`;
 * its `animationend` calls `finishClosing`. Reopening while it leaves cancels the exit.
 */
export function useExitPresence(isOpen: boolean): ExitPresence {
  const isReduced = useReducedMotion();
  const [wasOpen, setWasOpen] = useState(isOpen);
  const [isClosing, setClosing] = useState(false);

  // State derived from the previous render: a change of `isOpen` starts or cancels the exit before anything is drawn.
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    setClosing(!isOpen && canAnimateExit(isReduced));
  }

  const finishClosing = useCallback((): void => setClosing(false), []);

  useEffect(() => {
    if (!isClosing) return undefined;
    const timer = window.setTimeout(finishClosing, DURATION_MOVE_MS + EXIT_GRACE_MS);
    return () => window.clearTimeout(timer);
  }, [isClosing, finishClosing]);

  return { isMounted: isOpen || isClosing, isClosing, finishClosing };
}
