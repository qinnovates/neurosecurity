import { useEffect, useRef, useState } from 'react';
import { CHANGED_FLAG_MS } from './motion-tokens';

export interface CountTransition {
  /** The value to print. Always the true one: it swaps at once and never counts through others. */
  value: number;
  /** True for a moment after the value changes, so the element can be highlighted. False when first shown. */
  hasChanged: boolean;
}

/**
 * A number that changed is swapped at once and flagged for a moment. It does not run from
 * the old value to the new one, because every figure in between would be one that was never true.
 */
export function useCountTransition(value: number): CountTransition {
  const previousValue = useRef(value);
  const [hasChanged, setChanged] = useState(false);

  useEffect(() => {
    if (previousValue.current === value) return undefined;
    previousValue.current = value;
    setChanged(true);
    const timer = window.setTimeout(() => setChanged(false), CHANGED_FLAG_MS);
    return () => window.clearTimeout(timer);
  }, [value]);

  return { value, hasChanged };
}
