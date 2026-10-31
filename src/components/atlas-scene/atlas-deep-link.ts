/**
 * The explorer's address parameters on `/atlas/anatomy/`: `?region=<id>`
 * selects that region as the page opens, `&lens=<kind>` opens it on that lens,
 * and `&highlight=<id>` on that technique or device. Another page writes them
 * (the homepage hero's "See its details"); the explorer reads them once, as
 * the model is ready, and from then on keeps them in step with what the visitor
 * has chosen, so the address can be copied at any moment. Only an id the index
 * holds becomes a selection or a highlight, and only a lens that is whole
 * without a subject becomes the lens. Anything else is nothing at all: the page
 * then opens as it does from a bare address.
 */

import { ATLAS_EXPLORER_PATH } from '@/components/brain/AtlasExplorerLink';
import { DEFAULT_LENS, HIGHLIGHT_LENS_KINDS, SUBJECT_FREE_LENS_KINDS, emptyLens, lensSubjectId, withLensSubject, type Lens, type LensKind } from '@/lib/atlas-explorer/lens-state';
import type { Target } from './atlas-state';

export const REGION_QUERY_PARAM = 'region';
export const LENS_QUERY_PARAM = 'lens';
export const HIGHLIGHT_QUERY_PARAM = 'highlight';

/** What the address holds of the explorer's state. */
export interface ExplorerAddress {
  regionId: string | null;
  lens: Lens;
}

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

/**
 * The technique or device an address asks to pick out, as the lens that shows it, or null. Untrusted: only an id the
 * page holds is a highlight.
 *
 * @param kindById the lens kind of each technique and device the page offers
 */
export function readHighlightDeepLink(search: string, kindById: { get: (subjectId: string) => LensKind | undefined }): Lens | null {
  const subjectId = new URLSearchParams(search).get(HIGHLIGHT_QUERY_PARAM);
  const kind = subjectId === null ? undefined : kindById.get(subjectId);
  return subjectId === null || kind === undefined ? null : withLensSubject(kind, subjectId);
}

/**
 * The query string for the explorer's state, its own three parameters replaced and every other one kept. The default
 * lens is left out, so a page that has changed nothing keeps a bare address. A lens with a subject that is not a
 * highlight (one DSM cluster tag) has no parameter, because none could be read back.
 */
export function buildExplorerSearch(currentSearch: string, { regionId, lens }: ExplorerAddress): string {
  const query = new URLSearchParams(currentSearch);
  for (const param of [REGION_QUERY_PARAM, LENS_QUERY_PARAM, HIGHLIGHT_QUERY_PARAM]) query.delete(param);
  if (regionId !== null) query.set(REGION_QUERY_PARAM, regionId);
  if (lens.kind !== DEFAULT_LENS.kind && isArrivalLensKind(lens.kind)) query.set(LENS_QUERY_PARAM, lens.kind);
  const subjectId = lensSubjectId(lens);
  if (subjectId !== null && HIGHLIGHT_LENS_KINDS.includes(lens.kind)) query.set(HIGHLIGHT_QUERY_PARAM, subjectId);
  const search = query.toString();
  return search === '' ? '' : `?${search}`;
}

/** Keeps the address in step with the state, replacing the entry so the back button still leaves the page. Whatever the router keeps in the history entry stays there. */
export function writeExplorerAddress(address: ExplorerAddress): void {
  const { pathname, search, hash } = window.location;
  const nextSearch = buildExplorerSearch(search, address);
  if (nextSearch !== search) window.history.replaceState(window.history.state, '', `${pathname}${nextSearch}${hash}`);
}

/** The explorer's address with one region selected on arrival and, when given a lens the explorer can open on, that lens. */
export function buildRegionDeepLink(regionId: string, lens?: Lens): string {
  const query = new URLSearchParams({ [REGION_QUERY_PARAM]: regionId });
  if (lens !== undefined && isArrivalLensKind(lens.kind)) query.set(LENS_QUERY_PARAM, lens.kind);
  return `${ATLAS_EXPLORER_PATH}?${query.toString()}`;
}
