/**
 * The explorer's address parameters on `/atlas/anatomy/`: `?region=<id>`
 * selects that region as the page opens, and `&lens=<kind>` opens it on that
 * lens. Another page writes them (the homepage hero's "See its details"); the
 * explorer reads them once, as the model is ready. Only an id the index holds
 * becomes a selection, and only a lens that is whole without a subject becomes
 * the lens. Anything else is nothing at all: the page then opens as it does
 * from a bare address.
 */

import { ATLAS_EXPLORER_PATH } from '@/components/brain/AtlasExplorerLink';
import { SUBJECT_FREE_LENS_KINDS, emptyLens, type Lens, type LensKind } from '@/lib/atlas-explorer/lens-state';
import type { Target } from './atlas-state';

export const REGION_QUERY_PARAM = 'region';
export const LENS_QUERY_PARAM = 'lens';

function isArrivalLensKind(value: string): value is LensKind {
  return (SUBJECT_FREE_LENS_KINDS as readonly string[]).includes(value);
}

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

/** The lens an address asks to open on, or null. Untrusted: only a subject-free kind, spelt exactly, is a lens. */
export function readLensDeepLink(search: string): Lens | null {
  const kind = new URLSearchParams(search).get(LENS_QUERY_PARAM);
  return kind !== null && isArrivalLensKind(kind) ? emptyLens(kind) : null;
}

/** The explorer's address with one region selected on arrival and, when given a lens the explorer can open on, that lens. */
export function buildRegionDeepLink(regionId: string, lens?: Lens): string {
  const query = new URLSearchParams({ [REGION_QUERY_PARAM]: regionId });
  if (lens !== undefined && isArrivalLensKind(lens.kind)) query.set(LENS_QUERY_PARAM, lens.kind);
  return `${ATLAS_EXPLORER_PATH}?${query.toString()}`;
}
