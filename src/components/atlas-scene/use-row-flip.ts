import { useLayoutEffect, useRef, type RefObject } from 'react';

const ROW_SELECTOR = '[data-row-id]';
const MOVE_DURATION_MS = 280;
const MOVE_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
/** A move shorter than this is not worth animating. */
const MIN_MOVE_PX = 2;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function prefersLessMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * When the list is filtered, rows that stay slide from where they were to
 * where they are, so the eye can follow what was kept. Only position is
 * animated. With reduced motion, or where the browser cannot animate an
 * element, rows simply appear in place.
 *
 * @param order changes whenever the rows on screen change
 */
export function useRowFlip(containerRef: RefObject<HTMLElement | null>, order: string): void {
  const topsByRow = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    const previous = topsByRow.current;
    const current = new Map<string, number>();
    for (const row of container.querySelectorAll<HTMLElement>(ROW_SELECTOR)) {
      const rowId = row.dataset.rowId ?? '';
      const top = row.getBoundingClientRect().top;
      current.set(rowId, top);
      const moved = (previous.get(rowId) ?? top) - top;
      if (Math.abs(moved) < MIN_MOVE_PX || typeof row.animate !== 'function' || prefersLessMotion()) continue;
      row.animate([{ transform: `translateY(${moved}px)` }, { transform: 'none' }], { duration: MOVE_DURATION_MS, easing: MOVE_EASING });
    }
    topsByRow.current = current;
  }, [containerRef, order]);
}
