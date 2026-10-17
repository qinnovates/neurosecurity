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

/** Each row's distance from the top of the list, so scrolling the page between two renders moves nothing. */
function measureRows(container: HTMLElement): Map<string, { row: HTMLElement; top: number }> {
  const containerTop = container.getBoundingClientRect().top;
  const rows = [...container.querySelectorAll<HTMLElement>(ROW_SELECTOR)];
  return new Map(rows.map((row) => [row.dataset.rowId ?? '', { row, top: row.getBoundingClientRect().top - containerTop }]));
}

/**
 * When the set of rows changes, rows that stay slide from where they were to
 * where they are, so the eye can follow what was kept. Only position is
 * animated. With reduced motion, or where the browser cannot animate an
 * element, rows simply appear in place.
 *
 * @param order changes whenever the rows on screen change
 */
export function useRowFlip(containerRef: RefObject<HTMLElement | null>, order: string): void {
  const previous = useRef({ order, tops: new Map<string, number>() });

  // Measured after every render, so the starting positions are never stale; animated only when the rows changed.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    const current = measureRows(container);
    const orderChanged = previous.current.order !== order;
    for (const [rowId, { row, top }] of current) {
      const moved = (previous.current.tops.get(rowId) ?? top) - top;
      if (!orderChanged || Math.abs(moved) < MIN_MOVE_PX || typeof row.animate !== 'function' || prefersLessMotion()) continue;
      row.animate([{ transform: `translateY(${moved}px)` }, { transform: 'none' }], { duration: MOVE_DURATION_MS, easing: MOVE_EASING });
    }
    previous.current = { order, tops: new Map([...current].map(([rowId, { top }]) => [rowId, top])) };
  });
}
