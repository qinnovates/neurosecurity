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

/** With reduced motion the playhead does not travel: it steps once per this many seconds. */
const REDUCED_MOTION_STEP_SECONDS = 1;

/**
 * A position in a sample that advances in real time once the reader presses play. It always
 * starts paused, at `startAt`; it stops at the end and never loops.
 */
export function usePlayhead(durationSeconds: number, startAt: number): Playhead {
  const isReduced = useReducedMotion();
  const [time, setTime] = useState(Math.max(0, Math.min(durationSeconds, startAt)));
  const [isPlaying, setPlaying] = useState(false);
  // The frame loop reads and writes the position here, so it never works from a stale render.
  const position = useRef(time);

  const moveTo = useCallback((target: number): void => {
    position.current = Math.max(0, Math.min(durationSeconds, target));
    setTime(position.current);
  }, [durationSeconds]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    let frame = 0;
    let lastFrameAt: number | null = null;
    const tick = (now: number): void => {
      const elapsedSeconds = lastFrameAt === null ? 0 : (now - lastFrameAt) / 1000;
      lastFrameAt = now;
      position.current = Math.min(durationSeconds, position.current + elapsedSeconds);
      const hasEnded = position.current >= durationSeconds;
      // Reduced motion keeps the state change and drops the travel: the shown time moves in whole steps.
      setTime(isReduced && !hasEnded ? Math.floor(position.current / REDUCED_MOTION_STEP_SECONDS) * REDUCED_MOTION_STEP_SECONDS : position.current);
      if (hasEnded) {
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, durationSeconds, isReduced]);

  const play = useCallback(() => {
    if (position.current >= durationSeconds) moveTo(0);
    setPlaying(true);
  }, [durationSeconds, moveTo]);
  const pause = useCallback(() => setPlaying(false), []);

  return { time, isPlaying, play, pause, seek: moveTo };
}
