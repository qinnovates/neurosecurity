import { useEffect, useRef, useState } from 'react';

const TWEEN_MS = 420;

/** A number that runs to its new value when it changes, so a filter's effect is seen as well as read. */
export default function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);

  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return undefined;
    const prefersLessMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startedAt = performance.now();
    let frame = 0;
    const step = (now: number): void => {
      const progress = prefersLessMotion ? 1 : Math.min(1, (now - startedAt) / TWEEN_MS);
      shownRef.current = Math.round(from + (value - from) * progress);
      setShown(shownRef.current);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className="tm-count">{shown}</span>;
}
