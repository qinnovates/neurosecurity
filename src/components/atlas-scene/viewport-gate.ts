/**
 * Whether the 3D view may open, decided before anything 3D is fetched. The
 * probe is synchronous and asked once, at the moment the visitor asks for the
 * view; nothing is loaded on a guess.
 */

export const GATE_STATES = ['closed', 'open', 'no_webgl', 'integrity_unavailable', 'unpinned', 'context_lost'] as const;
/**
 * `closed`: not asked for. `open`: drawing. `no_webgl`: the browser cannot draw it. `integrity_unavailable`: the
 * page's context offers no digest, so files cannot be checked and none is drawn. `unpinned`: the page does not say
 * which index it was built with. `context_lost`: the browser took the drawing surface away.
 */
export type GateState = typeof GATE_STATES[number];

/** What the visitor reads in place of the picture. Each says where the same facts are. */
export const GATE_NOTICES: Readonly<Record<Exclude<GateState, 'closed' | 'open'>, string>> = {
  no_webgl: 'This browser cannot draw the 3D view. Everything it would show is in the region list and the details beside it.',
  integrity_unavailable: 'The 3D view is not drawn here: this page was not served securely, so its files cannot be checked. The region list has everything it would show.',
  unpinned: 'The 3D view is not drawn: this page does not record which data it was built with, so its files cannot be matched to it. The region list has everything it would show.',
  context_lost: 'The browser stopped the 3D view. Nothing is lost: the region list is unchanged, and the view can be started again.',
};

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
/** The renderer needs the second version of WebGL. */
const WEBGL_CONTEXT = 'webgl2';

/** Whether this browser gives a WebGL context right now. Creates one small canvas and lets it go. */
export function probeWebGL(): boolean {
  try {
    return document.createElement('canvas').getContext(WEBGL_CONTEXT) !== null;
  } catch {
    // A browser that throws when asked for a context has none to give.
    return false;
  }
}

export function readPrefersLessMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** The state the view enters when asked for: the first reason it cannot open, or open. */
export function decideGate(isIndexPinned: boolean, hasDigest: boolean, probe: () => boolean): GateState {
  if (!isIndexPinned) return 'unpinned';
  if (!hasDigest) return 'integrity_unavailable';
  return probe() ? 'open' : 'no_webgl';
}
