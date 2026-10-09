import { useLayoutEffect, useState } from 'react';

/**
 * True when the children of the row no longer share one line: the last one starts at or below
 * the foot of the first. A row with no height has not been laid out, and is not called wrapped.
 */
export function hasWrapped(row: Element): boolean {
  const first = row.firstElementChild;
  const last = row.lastElementChild;
  if (!(first instanceof HTMLElement) || !(last instanceof HTMLElement) || first === last || first.offsetHeight === 0) return false;
  return last.offsetTop >= first.offsetTop + first.offsetHeight;
}

/**
 * How many items a row can hold before it wraps, found by laying it out: it starts at `most`
 * and gives one up at a time while the row, or the block around it, has wrapped. It starts
 * over whenever `layoutKey` changes (the width, or what the row holds). All of this happens
 * before the browser paints, so the reader never sees the row at two heights.
 * @param container the wrapping block that holds the rows to check, or null before it is drawn
 * @param rowSelector the rows inside the container that must each stay on one line
 */
export function useFittingCount(container: HTMLElement | null, rowSelector: string, most: number, layoutKey: string): number {
  const [fit, setFit] = useState({ key: layoutKey, count: most });
  const count = fit.key === layoutKey ? Math.min(fit.count, most) : most;

  useLayoutEffect(() => {
    if (container === null || count <= 1) return;
    const rows = [container, ...container.querySelectorAll(rowSelector)];
    if (rows.some(hasWrapped)) setFit({ key: layoutKey, count: count - 1 });
  }, [container, rowSelector, count, layoutKey]);

  return count;
}
