import { useEffect, useState } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * The element's border-box size, followed as the layout changes. The element is passed as a
 * value (from a callback ref kept in state), so a different element is followed at once.
 * Null until it has been measured, and where the browser cannot observe sizes, so a caller
 * can tell "not known" from zero.
 */
export function useElementSize(target: Element | null): ElementSize | null {
  const [size, setSize] = useState<ElementSize | null>(null);

  useEffect(() => {
    if (target === null || typeof ResizeObserver === 'undefined') {
      setSize(null);
      return undefined;
    }
    const observer = new ResizeObserver(() => {
      const box = target.getBoundingClientRect();
      setSize((current) => (current !== null && current.width === box.width && current.height === box.height ? current : { width: box.width, height: box.height }));
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [target]);

  return size;
}

/**
 * True once the element has scrolled fully out of view, so a stand-in for it can be shown.
 * False while there is no element, or where the browser cannot observe it.
 */
export function useIsOutOfView(target: Element | null): boolean {
  const [isOutOfView, setOutOfView] = useState(false);

  useEffect(() => {
    if (target === null || typeof IntersectionObserver === 'undefined') {
      setOutOfView(false);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => setOutOfView(!entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, [target]);

  return isOutOfView;
}
