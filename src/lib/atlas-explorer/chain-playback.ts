/**
 * Where a visitor is in a threat model's steps, and whether the steps are
 * advancing on their own. Plain data and one reducer: play, pause, previous,
 * next and a position. Playing only ever moves from one step to the next in
 * the model's order, and stops at the last.
 */

export interface Playback {
  /** The step on screen, from 1. */
  position: number;
  isPlaying: boolean;
}

export type PlaybackAction =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'previous' }
  | { type: 'next' }
  | { type: 'seek'; position: number }
  /** The dwell on a step has passed while playing. */
  | { type: 'tick' }
  /** Another threat model was chosen. */
  | { type: 'reset' };

export const FIRST_STEP = 1;
export const INITIAL_PLAYBACK: Playback = { position: FIRST_STEP, isPlaying: false };
/** How long a step stays on screen while playing: long enough to read its line. */
export const STEP_DWELL_MS = 4000;

function clampPosition(position: number, stepCount: number): number {
  return Math.min(Math.max(Math.round(position), FIRST_STEP), Math.max(stepCount, FIRST_STEP));
}

/** @param stepCount how many steps the threat model has; every position stays within 1 and this */
export function playbackReducer(state: Playback, action: PlaybackAction, stepCount: number): Playback {
  switch (action.type) {
    // Play from the last step starts the model again from its first.
    case 'play': return { position: state.position >= stepCount ? FIRST_STEP : state.position, isPlaying: stepCount > FIRST_STEP };
    case 'pause': return { ...state, isPlaying: false };
    case 'previous': return { position: clampPosition(state.position - 1, stepCount), isPlaying: false };
    case 'next': return { position: clampPosition(state.position + 1, stepCount), isPlaying: false };
    case 'seek': return { position: clampPosition(action.position, stepCount), isPlaying: false };
    case 'tick': {
      if (!state.isPlaying) return state;
      const position = clampPosition(state.position + 1, stepCount);
      return { position, isPlaying: position < stepCount };
    }
    case 'reset': return INITIAL_PLAYBACK;
  }
}
