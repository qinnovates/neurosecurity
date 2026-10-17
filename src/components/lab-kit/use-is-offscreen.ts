import { useEffect, useState, type RefObject } from 'react';

/** True once the element has scrolled fully out of view, so a stand-in for it can be shown. */
export function useIsOffscreen<Target extends Element>(targetRef: RefObject<Target | null>): boolean {
  const [isOffscreen, setOffscreen] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (target === null || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetRef]);

  return isOffscreen;
}
