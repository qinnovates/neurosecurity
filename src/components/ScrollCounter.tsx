import { useEffect, useRef, useState } from 'react';

interface Props {
  end: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

export default function ScrollCounter({ end, suffix = '', duration = 1500, className = '' }: Props) {
  // Starts at the final value, not 0 -- a visitor who sees this before the scroll
  // trigger fires (first paint, a screenshot, a quick glance) sees the real number.
  // The count-up animation still runs in full once the observer fires.
  const [count, setCount] = useState(end);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setCount(end);
      return;
    }

    const startTime = performance.now();
    let raf: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [started, end, duration]);

  return (
    <span ref={ref} className={className}>
      {count}{suffix}
    </span>
  );
}
