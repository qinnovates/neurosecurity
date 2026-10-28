/**
 * The explorer's one address parameter: `?region=<id>` on `/atlas/anatomy/`
 * selects that region as the page opens. Another page writes it (the homepage
 * hero's "See its details"); the explorer reads it once, as the model is
 * ready, and only an id the index holds becomes a selection. Anything else is
 * no selection at all: the page then opens as it does from a bare address.
 */

import { ATLAS_EXPLORER_PATH } from '@/components/brain/AtlasExplorerLink';
import type { Target } from './atlas-state';

export const REGION_QUERY_PARAM = 'region';

/**
 * The selection an address asks for, or null. The id is untrusted navigation state: it is matched against the
 * regions the index names and used only when it is one of them.
 *
 * @param search the address's query string, with or without its leading "?"
 * @param knownRegionIds the region ids the loaded index holds
 */
export function readRegionDeepLink(search: string, knownRegionIds: { has: (regionId: string) => boolean }): Target | null {
  const regionId = new URLSearchParams(search).get(REGION_QUERY_PARAM);
  if (regionId === null || regionId === '' || !knownRegionIds.has(regionId)) return null;
  return { kind: 'region', id: regionId };
}

/** The explorer's address with one region selected on arrival. */
export function buildRegionDeepLink(regionId: string): string {
  const query = new URLSearchParams({ [REGION_QUERY_PARAM]: regionId });
  return `${ATLAS_EXPLORER_PATH}?${query.toString()}`;
}
