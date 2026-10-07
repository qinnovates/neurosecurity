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
  // The frame loop reads and writes the position here, so it never works from a stale render.
  const position = useRef(time);

  const moveTo = useCallback((target: number): void => {
    position.current = Math.max(0, Math.min(durationSeconds, target));
    setTime(position.current);
  }, [durationSeconds]);

  // A different recording starts from its own first full picture.
  useEffect(() => {
    moveTo(startAt);
    setPlaying(!isReduced && durationSeconds > 0);
  }, [durationSeconds, startAt, isReduced, moveTo]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    let frame = 0;
    let lastFrameAt: number | null = null;
    const tick = (now: number): void => {
      const elapsedSeconds = lastFrameAt === null ? 0 : (now - lastFrameAt) / 1000;
      lastFrameAt = now;
      moveTo(position.current + elapsedSeconds);
      if (position.current >= durationSeconds) {
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, durationSeconds, moveTo]);

  const play = useCallback(() => {
    if (position.current >= durationSeconds) moveTo(0);
    setPlaying(true);
  }, [durationSeconds, moveTo]);
  const pause = useCallback(() => setPlaying(false), []);

  return { time, isPlaying, play, pause, seek: moveTo };
}
