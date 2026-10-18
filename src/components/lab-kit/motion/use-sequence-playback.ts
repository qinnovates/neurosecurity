import { useCallback, useEffect, useState } from 'react';
import { useReducedMotion } from './use-reduced-motion';

/** Time each step holds before the next is reached: the travel to it, then a pause to read it. */
export const SEQUENCE_STEP_MS = 1600;
const FIRST_STEP_DELAY_MS = 250;

export interface SequencePlayback {
  /** How many steps have been reached, from 0 to the step count. */
  reached: number;
  isPlaying: boolean;
  /** Plays from the current step, or from the start when the end was reached. Never loops. */
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBack: () => void;
  /** Back to the still picture with every step shown. */
  showAll: () => void;
}

/**
 * Plays a sequence of steps in order. It starts with every step shown, so the still
 * picture is complete before anything moves. With reduced motion, play shows the whole
 * sequence at once.
 */
export function useSequencePlayback(stepCount: number): SequencePlayback {
  const [reached, setReached] = useState(stepCount);
  const [isPlaying, setPlaying] = useState(false);
  const isReduced = useReducedMotion();

  // A different sequence starts from its own complete picture.
  useEffect(() => {
    setReached(stepCount);
    setPlaying(false);
  }, [stepCount]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    if (reached >= stepCount) {
      setPlaying(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setReached((current) => current + 1), reached === 0 ? FIRST_STEP_DELAY_MS : SEQUENCE_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [isPlaying, reached, stepCount]);

  const play = useCallback(() => {
    if (isReduced) {
      setReached(stepCount);
      return;
    }
    setReached((current) => (current >= stepCount ? 0 : current));
    setPlaying(true);
  }, [isReduced, stepCount]);
  const pause = useCallback(() => setPlaying(false), []);
  const stepForward = useCallback(() => {
    setPlaying(false);
    setReached((current) => (current >= stepCount ? 1 : current + 1));
  }, [stepCount]);
  const stepBack = useCallback(() => {
    setPlaying(false);
    setReached((current) => Math.max(1, Math.min(current, stepCount) - 1));
  }, [stepCount]);
  const showAll = useCallback(() => {
    setPlaying(false);
    setReached(stepCount);
  }, [stepCount]);

  return { reached, isPlaying, play, pause, stepForward, stepBack, showAll };
}
