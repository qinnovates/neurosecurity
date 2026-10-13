/**
 * Loads and validates what the explorer reads. The index and the catalog load
 * first, together; the evidence files load only when a visitor opens something
 * that needs them. Nothing is used before its parser has accepted it.
 */

import { ANATOMY_INDEX_PATH, type PinnedFile } from '@/lib/anatomy/anatomy-index-types';
import { AnatomyDataError } from '@/lib/anatomy/errors';
import { parseAnatomyEvidence, type ShownAnatomyEvidence } from '@/lib/anatomy/parse-anatomy-evidence';
import { parseAnatomyIndex } from '@/lib/anatomy/parse-anatomy-index';
import { H01_CARD_PATH, parseH01Card, type H01Card } from '@/lib/anatomy/parse-h01-card';
import { parseRegionEvidence } from '@/lib/anatomy/parse-region-evidence';
import { REGION_EVIDENCE_PATH, type RegionEvidence } from '@/lib/anatomy/region-evidence-types';
import { EXPLORER_CATALOG_PATH, parseExplorerCatalog } from '@/lib/atlas-explorer/explorer-catalog';
import { createExplorerModel, type ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { AtlasFetchError, fetchAtlasJson, fetchPinnedJson } from './fetch-atlas-json';

/**
 * `unavailable`: the file could not be fetched. `invalid`: it arrived and failed its checks, so none of it is shown.
 * `stale`: it is not the file this page was built with, which means a newer page has been published.
 */
export type LoadFailureKind = 'unavailable' | 'invalid' | 'stale';

export interface LoadFailure {
  kind: LoadFailureKind;
  /** The site path of the file, or a short name for it. */
  file: string;
  /** For a person who maintains the site; the visitor sees a plain sentence. */
  detail: string;
}

export type Loaded<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'failed'; failure: LoadFailure };

/** A load that was abandoned because its component went away. Not a failure to report. */
export function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * Turns whatever a load threw into a failure the explorer can show. An error
 * that is neither a fetch failure nor a data problem is unexpected; it is shown
 * as "could not be loaded" with its own message, never swallowed.
 */
export function toLoadFailure(error: unknown, file: string): LoadFailure {
  if (error instanceof AnatomyDataError) return { kind: 'invalid', file: error.dataFile, detail: error.message };
  if (error instanceof AtlasFetchError) return { kind: error.failure === 'pin_mismatch' ? 'stale' : 'unavailable', file: error.path, detail: error.message };
  return { kind: 'unavailable', file, detail: error instanceof Error ? error.message : String(error) };
}

/**
 * The list groups regions by band. A region whose band the catalog does not name would be left out of every group,
 * so a model that cannot place each of its regions is refused whole: nothing is ever dropped from the list in silence.
 */
function requireListableRegions(model: ExplorerModel): ExplorerModel {
  if (model.regions.length === 0) {
    throw new AnatomyDataError(ANATOMY_INDEX_PATH, 'subjects', 'the index lists no region', 'Rebuild the site; an index without regions cannot be explored.');
  }
  const listedBandIds = new Set(model.neuralBands.map((band) => band.id));
  const unplaced = model.regions.find((region) => !region.band_ids.some((bandId) => listedBandIds.has(bandId)));
  if (unplaced !== undefined) {
    throw new AnatomyDataError(ANATOMY_INDEX_PATH, `subjects (region "${unplaced.id}")`, 'the region has no band the catalog names, so the list could not show it',
      'Rebuild the site so the index and the catalog come from the same data.');
  }
  return model;
}

/**
 * @param indexPin the index's length and digest as the page was built with them. With it, an index from any other
 *   build is refused; without it, the index is only held to its shape, and the 3D view draws nothing.
 */
export async function loadExplorerModel(signal: AbortSignal, indexPin: PinnedFile | null): Promise<ExplorerModel> {
  const fetchIndex = indexPin === null ? fetchAtlasJson(ANATOMY_INDEX_PATH, signal) : fetchPinnedJson(indexPin, signal);
  const [rawIndex, rawCatalog] = await Promise.all([fetchIndex, fetchAtlasJson(EXPLORER_CATALOG_PATH, signal)]);
  return requireListableRegions(createExplorerModel(parseAnatomyIndex(rawIndex), parseExplorerCatalog(rawCatalog)));
}

/** The quotes and rationales behind the index's drafted rows, checked against the index's own pin. */
export async function loadAnatomyEvidence(model: ExplorerModel, signal: AbortSignal): Promise<ShownAnatomyEvidence> {
  return parseAnatomyEvidence(await fetchPinnedJson(model.index.evidence, signal));
}

export async function loadRegionEvidence(model: ExplorerModel, signal: AbortSignal): Promise<RegionEvidence> {
  return parseRegionEvidence(await fetchAtlasJson(REGION_EVIDENCE_PATH, signal), new Set(model.regions.map((region) => region.id)));
}

export async function loadH01Card(signal: AbortSignal): Promise<H01Card> {
  return parseH01Card(await fetchAtlasJson(H01_CARD_PATH, signal));
}
