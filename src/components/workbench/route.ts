/**
 * The Lab's address. It holds only where you are: "#model" or "#explore/catalog". Device
 * details never go in it. Anything unrecognised falls back to a default instead of failing.
 */

import { DEFAULT_MODE_ID, WORKBENCH_MODES, isModeId, type ModeId } from './mode-registry';
import { defaultViewId, findView } from './view-registry';

export interface Route {
  modeId: ModeId;
  viewId: string;
}

export interface Address {
  route: Route;
  /** False when the address named a mode or view the Lab does not have, and the route is a fallback. */
  isRecognised: boolean;
  /** False when the address named a real screen with something after it ("?x=1", a trailing "/"), which the Lab drops. */
  isCanonical: boolean;
}

const PRODUCT_TITLE = 'TARA Lab | Qinnovate';
const TITLE_SEPARATOR = ' · ';

/** What may follow a screen's address and is ignored: a query ("?x=1") and trailing slashes. Nothing in it is read. */
const ADDRESS_SUFFIX_PATTERN = /(\?.*)?$/;
const TRAILING_SLASHES_PATTERN = /\/+$/;

/** Reads an address and says whether it named a real screen. An empty address is the default screen. */
export function parseAddress(hash: string): Address {
  const written = hash.replace(/^#/, '');
  const path = written.replace(ADDRESS_SUFFIX_PATTERN, '').replace(TRAILING_SLASHES_PATTERN, '');
  const isCanonical = path === written;
  const segments = path.split('/');
  const [modeCandidate = '', viewCandidate] = segments;
  if (path === '') {
    return { route: { modeId: DEFAULT_MODE_ID, viewId: defaultViewId(DEFAULT_MODE_ID) }, isRecognised: true, isCanonical };
  }
  const isKnownMode = isModeId(modeCandidate);
  const modeId = isKnownMode ? modeCandidate : DEFAULT_MODE_ID;
  const hasKnownView = isKnownMode && viewCandidate !== undefined && findView(modeId, viewCandidate) !== null;
  const isRecognised = isKnownMode && segments.length <= 2 && (viewCandidate === undefined || hasKnownView);
  return { route: { modeId, viewId: hasKnownView ? viewCandidate : defaultViewId(modeId) }, isRecognised, isCanonical };
}

export function parseRoute(hash: string): Route {
  return parseAddress(hash).route;
}

/** Writes mode and view, and nothing else: a mode or view that is not in the registries is replaced by the default. */
export function toHash(route: Route): string {
  const modeId = isModeId(route.modeId) ? route.modeId : DEFAULT_MODE_ID;
  const isDefaultView = route.viewId === defaultViewId(modeId) || findView(modeId, route.viewId) === null;
  return isDefaultView ? `#${modeId}` : `#${modeId}/${route.viewId}`;
}

/** The mode and view in words, as the registries name them: "Model, Report". */
export function describeRoute(route: Route): string {
  const modeLabel = WORKBENCH_MODES.find((mode) => mode.id === route.modeId)?.label ?? route.modeId;
  const viewLabel = findView(route.modeId, route.viewId)?.label;
  return viewLabel === undefined || viewLabel === modeLabel ? modeLabel : `${modeLabel}, ${viewLabel}`;
}

/** The browser tab's title for a screen, so history entries and tabs can be told apart. */
export function titleFor(route: Route): string {
  const modeLabel = WORKBENCH_MODES.find((mode) => mode.id === route.modeId)?.label;
  const viewLabel = findView(route.modeId, route.viewId)?.label;
  return [viewLabel, modeLabel === viewLabel ? undefined : modeLabel, PRODUCT_TITLE]
    .filter((part): part is string => part !== undefined)
    .join(TITLE_SEPARATOR);
}
