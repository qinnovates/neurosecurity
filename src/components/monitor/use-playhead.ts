import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/components/lab-kit/motion/use-reduced-motion';

export interface Playhead {
  /** Seconds from the start of the sample. */
  time: number;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
}

/**
 * A position in a recording that advances in real time while playing. It starts at
 * `startAt` so the first picture is already full, stops at the end, and never loops.
 * With reduced motion it starts paused.
 */
export function usePlayhead(durationSeconds: number, startAt: number): Playhead {
  const isReduced = useReducedMotion();
  const [time, setTime] = useState(Math.min(startAt, durationSeconds));
  const [isPlaying, setPlaying] = useState(!isReduced);
  const lastFrameAt = useRef<number | null>(null);

  // A different recording starts from its own first full picture.
  useEffect(() => {
    setTime(Math.min(startAt, durationSeconds));
    setPlaying(!isReduced && durationSeconds > 0);
  }, [durationSeconds, startAt, isReduced]);

  useEffect(() => {
    if (!isPlaying) { lastFrameAt.current = null; return undefined; }
    let frame = 0;
    const tick = (now: number): void => {
      const elapsedSeconds = lastFrameAt.current === null ? 0 : (now - lastFrameAt.current) / 1000;
      lastFrameAt.current = now;
      setTime((current) => {
        const next = current + elapsedSeconds;
        if (next < durationSeconds) return next;
        setPlaying(false);
        return durationSeconds;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, durationSeconds]);

  const play = useCallback(() => {
    setTime((current) => (current >= durationSeconds ? 0 : current));
    setPlaying(true);
  }, [durationSeconds]);
  const pause = useCallback(() => setPlaying(false), []);
  const seek = useCallback((target: number) => setTime(Math.max(0, Math.min(durationSeconds, target))), [durationSeconds]);

  return { time, isPlaying, play, pause, seek };
}
