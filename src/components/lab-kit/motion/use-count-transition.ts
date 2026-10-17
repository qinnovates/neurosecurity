import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './use-reduced-motion';

const COUNT_TRANSITION_MS = 240;

/**
 * A number that runs from its previous value to its new one, so a change the reader caused
 * is seen as well as read. It never counts up from zero when first shown: the first value
 * appears as it is.
 */
export function useCountTransition(value: number): number {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  const isReduced = useReducedMotion();

  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return undefined;
    if (isReduced) {
      shownRef.current = value;
      setShown(value);
      return undefined;
    }
    const startedAt = performance.now();
    let frame = 0;
    const step = (now: number): void => {
      const progress = Math.min(1, (now - startedAt) / COUNT_TRANSITION_MS);
      shownRef.current = Math.round(from + (value - from) * progress);
      setShown(shownRef.current);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, isReduced]);

  return shown;
}
