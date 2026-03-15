import { useState, useEffect, useCallback } from 'react';
import {
  type Lens,
  LENS_EVENT,
  getLens,
  setLens as setLensCore,
  toggleLens as toggleLensCore,
} from '../../lib/lens';

/**
 * React hook for the dual lens system.
 *
 * Reads initial lens from localStorage on mount and subscribes to
 * LENS_EVENT CustomEvents so all Astro islands stay in sync.
 */
export function useLens() {
  const [lens, setLensState] = useState<Lens>('both');

  // Hydrate from localStorage on mount
  useEffect(() => {
    setLensState(getLens());
  }, []);

  // Subscribe to cross-island sync events
  useEffect(() => {
    function handleLensChange(e: Event) {
      const detail = (e as CustomEvent<{ lens: Lens }>).detail;
      setLensState(detail.lens);
    }

    window.addEventListener(LENS_EVENT, handleLensChange);
    return () => window.removeEventListener(LENS_EVENT, handleLensChange);
  }, []);

  const setLens = useCallback((next: Lens) => {
    setLensCore(next);
    setLensState(next);
  }, []);

  const toggleLens = useCallback(() => {
    const next = toggleLensCore();
    setLensState(next);
    return next;
  }, []);

  return { lens, setLens, toggleLens } as const;
}
