import { useEffect, type RefObject } from 'react';

/**
 * Calls `onExited` when the element's own exit animation ends. Listened for on the element
 * itself, not through React: a layer that is leaving is inert, and React delivers no events
 * to an inert element.
 */
export function useExitEnd<Layer extends HTMLElement>(layerRef: RefObject<Layer | null>, isClosing: boolean, onExited: (() => void) | undefined): void {
  useEffect(() => {
    const layer = layerRef.current;
    if (!isClosing || layer === null || onExited === undefined) return undefined;
    // An animation ending on something inside the layer is not the layer's exit.
    const handleEnd = (event: AnimationEvent): void => { if (event.target === layer) onExited(); };
    layer.addEventListener('animationend', handleEnd);
    return () => layer.removeEventListener('animationend', handleEnd);
  }, [layerRef, isClosing, onExited]);
}
