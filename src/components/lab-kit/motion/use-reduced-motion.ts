import { useMediaQuery } from '../use-media-query';

/** True when the viewer has asked for less motion. Follows the setting if it changes while the page is open. */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
