/**
 * The Lab's address. It holds only where you are: "#model" or "#explore/catalog". Device
 * details never go in it. Anything unrecognised falls back to a default instead of failing.
 */

import { DEFAULT_MODE_ID, isModeId, type ModeId } from './mode-registry';
import { defaultViewId, findView } from './view-registry';

export interface Route {
  modeId: ModeId;
  viewId: string;
}

export function parseRoute(hash: string): Route {
  const [modeCandidate = '', viewCandidate] = hash.replace('#', '').split('/');
  const modeId = isModeId(modeCandidate) ? modeCandidate : DEFAULT_MODE_ID;
  const hasKnownView = viewCandidate !== undefined && findView(modeId, viewCandidate) !== null;
  return { modeId, viewId: hasKnownView ? viewCandidate : defaultViewId(modeId) };
}

export function toHash(route: Route): string {
  return route.viewId === defaultViewId(route.modeId) ? `#${route.modeId}` : `#${route.modeId}/${route.viewId}`;
}
