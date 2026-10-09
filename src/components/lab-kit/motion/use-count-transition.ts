import { useEffect, useRef, useState, type RefObject } from 'react';
import { CHANGED_FLAG_MS } from './motion-tokens';

export interface CountTransition {
  /** The value to print. Always the true one: it swaps at once and never counts through others. */
  value: number;
  /** True for a moment after the value changes, so the element can be highlighted. False when first shown. */
  hasChanged: boolean;
}

/** True when any part of the element is inside the window. With no element to ask about, the answer is yes. */
function isOnScreen(element: Element | null | undefined): boolean {
  if (element === null || element === undefined) return true;
  const box = element.getBoundingClientRect();
  return box.bottom >= 0 && box.top <= window.innerHeight && box.right >= 0 && box.left <= window.innerWidth;
}

/**
 * A number that changed is swapped at once and flagged for a moment. It does not run from
 * the old value to the new one, because every figure in between would be one that was never true.
 * Pass the element that prints the figure and it is flagged only while on screen, so a filter
 * does not set off marks nobody can see.
 */
export function useCountTransition(value: number, figureRef?: RefObject<Element | null>): CountTransition {
  const previousValue = useRef(value);
  const [hasChanged, setChanged] = useState(false);

  useEffect(() => {
    if (previousValue.current === value) return undefined;
    previousValue.current = value;
    if (!isOnScreen(figureRef?.current)) return undefined;
    setChanged(true);
    const timer = window.setTimeout(() => setChanged(false), CHANGED_FLAG_MS);
    return () => window.clearTimeout(timer);
  }, [value, figureRef]);

  return { value, hasChanged };
}
