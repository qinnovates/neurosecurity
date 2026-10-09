import { useEffect, useState, type RefObject } from 'react';

/**
 * The rendered height of an element in pixels, kept current as it wraps or resizes.
 * Null until it has been measured, and wherever the browser cannot observe size.
 */
export function useElementHeight(elementRef: RefObject<HTMLElement | null>): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (element === null || typeof ResizeObserver !== 'function') return undefined;
    const observer = new ResizeObserver(() => setHeight(Math.ceil(element.getBoundingClientRect().height)));
    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef]);

  return height;
}
