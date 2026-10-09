import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from 'react';

/** Where the chosen item sits inside its container, in the container's own pixels. */
export interface MarkerBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

function isSameBox(first: MarkerBox | null, second: MarkerBox | null): boolean {
  if (first === null || second === null) return first === second;
  return first.left === second.left && first.top === second.top && first.width === second.width && first.height === second.height;
}

function measureTarget(container: HTMLElement | null, targetSelector: string): MarkerBox | null {
  const target = container?.querySelector<HTMLElement>(targetSelector) ?? null;
  // Nothing chosen, or nowhere layout is computed: the caller falls back to styling the chosen item itself.
  if (target === null || target.offsetWidth === 0) return null;
  return { left: target.offsetLeft, top: target.offsetTop, width: target.offsetWidth, height: target.offsetHeight };
}

/**
 * The box of the one chosen item among several, so a single marker (a segmented control's thumb,
 * the line under the current tab) can be moved to it instead of each item restyling itself.
 * The container must be the items' positioned ancestor. Measured again when `signature` changes
 * (pass the chosen value and anything that changes the labels) and when the container resizes.
 */
export function useSlideMarker<Container extends HTMLElement>(containerRef: RefObject<Container | null>, targetSelector: string, signature: string): MarkerBox | null {
  const [box, setBox] = useState<MarkerBox | null>(null);
  const measure = useCallback((): void => {
    const next = measureTarget(containerRef.current, targetSelector);
    setBox((current) => (isSameBox(current, next) ? current : next));
  }, [containerRef, targetSelector]);

  useLayoutEffect(measure, [measure, signature]);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null || typeof ResizeObserver !== 'function') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, measure]);

  return box;
}
