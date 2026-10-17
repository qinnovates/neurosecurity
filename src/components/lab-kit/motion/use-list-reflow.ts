import { useLayoutEffect, useRef, type RefObject } from 'react';
import { DURATION_MOVE_MS, DURATION_QUICK_MS, EASE } from './motion-tokens';
import { useReducedMotion } from './use-reduced-motion';

/** Above this many items the move is not animated: it would cost more than it explains. */
const MAX_ANIMATED_ITEMS = 120;
const KEY_ATTRIBUTE = 'data-reflow-key';

/**
 * When the items inside the container change, items that stay slide from where they were
 * to where they are now, and new items fade in. Each item must carry a `data-reflow-key`.
 */
export function useListReflow<Container extends HTMLElement>(containerRef: RefObject<Container | null>, orderSignature: string): void {
  const previousTops = useRef(new Map<string, number>());
  const isReduced = useReducedMotion();

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    const items = Array.from(container.querySelectorAll<HTMLElement>(`[${KEY_ATTRIBUTE}]`));
    const currentTops = new Map<string, number>();
    for (const item of items) currentTops.set(item.getAttribute(KEY_ATTRIBUTE) ?? '', item.offsetTop);

    const hadItems = previousTops.current.size > 0;
    const canAnimate = !isReduced && hadItems && items.length <= MAX_ANIMATED_ITEMS;
    if (canAnimate) {
      for (const item of items) {
        if (typeof item.animate !== 'function') continue;
        const key = item.getAttribute(KEY_ATTRIBUTE) ?? '';
        const previousTop = previousTops.current.get(key);
        const currentTop = currentTops.get(key) ?? 0;
        if (previousTop === undefined) {
          item.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DURATION_QUICK_MS, easing: EASE });
        } else if (previousTop !== currentTop) {
          item.animate([{ transform: `translateY(${previousTop - currentTop}px)` }, { transform: 'none' }], { duration: DURATION_MOVE_MS, easing: EASE });
        }
      }
    }
    previousTops.current = currentTops;
  }, [containerRef, orderSignature, isReduced]);
}
