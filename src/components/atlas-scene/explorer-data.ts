/**
 * Loads and validates what the explorer reads. The index and the catalog load
 * first, together; the evidence files load only when a visitor opens something
 * that needs them. Nothing is used before its parser has accepted it.
 */

import { ANATOMY_INDEX_PATH, type AnatomyIndex, type PinnedFile } from '@/lib/anatomy/anatomy-index-types';
import { AnatomyDataError } from '@/lib/anatomy/errors';
import { parseAnatomyEvidence, type ShownAnatomyEvidence } from '@/lib/anatomy/parse-anatomy-evidence';
import { parseAnatomyIndex } from '@/lib/anatomy/parse-anatomy-index';
import { H01_CARD_PATH, parseH01Card, type H01Card } from '@/lib/anatomy/parse-h01-card';
import { parseRegionEvidence } from '@/lib/anatomy/parse-region-evidence';
import { REGION_EVIDENCE_PATH, type RegionEvidence } from '@/lib/anatomy/region-evidence-types';
import { ATLAS_CHAINS_PATH, parseAtlasChains, type AtlasChains } from '@/lib/atlas-explorer/chain-file';
import { DEVICE_STAGE_BAND_IDS, EXPLORER_CATALOG_PATH, parseExplorerCatalog } from '@/lib/atlas-explorer/explorer-catalog';
import { createExplorerModel, isNeuralBand, type ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { AtlasFetchError, fetchAtlasJson, fetchPinnedJson } from './fetch-atlas-json';

/**
 * `unavailable`: the file could not be fetched. `invalid`: it arrived and failed its checks, so none of it is shown.
 * `out_of_step`: it is not the file the index pins, so the page's data files do not come from one build.
 */
export type LoadFailureKind = 'unavailable' | 'invalid' | 'out_of_step';

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
  if (error instanceof AtlasFetchError) return { kind: error.failure === 'pin_mismatch' ? 'out_of_step' : 'unavailable', file: error.path, detail: error.message };
  if (error instanceof OutOfStepError) return { kind: 'out_of_step', file, detail: error.message };
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

/** The index and the catalog each hold something the other contradicts, so they cannot be from one build. */
export class OutOfStepError extends Error {
  constructor(detail: string) {
    super(`The index and the catalog disagree: ${detail}. Rebuild the site so both come from one build.`);
    this.name = 'OutOfStepError';
  }
}

const sameBands = (first: readonly string[], second: readonly string[]): boolean => first.length === second.length && first.every((bandId, position) => bandId === second[position]);

/**
 * The two files overlap: a technique with both a brain band and a device band is in each, and every region is. Where
 * they overlap they must agree, or a statement drawn from one could contradict the other.
 */
function requireAgreement(model: ExplorerModel): ExplorerModel {
  const { index, catalog } = model;
  const catalogTechniques = new Map(catalog.device_stage_techniques.map((technique) => [technique.id, technique]));
  if (catalogTechniques.size !== catalog.device_stage_techniques.length) throw new OutOfStepError('the catalog lists a technique twice');
  for (const technique of index.techniques) {
    const listed = catalogTechniques.get(technique.id);
    const hasDeviceBand = technique.band_ids.some((bandId) => DEVICE_STAGE_BAND_IDS.includes(bandId));
    if (hasDeviceBand !== (listed !== undefined) || (listed !== undefined && !sameBands(listed.band_ids, technique.band_ids))) throw new OutOfStepError(`technique ${technique.id} differs between them`);
  }
  const strayTechnique = catalog.device_stage_techniques.find((technique) => technique.band_ids.some(isNeuralBand) && !model.techniquesById.has(technique.id));
  if (strayTechnique !== undefined) throw new OutOfStepError(`technique ${strayTechnique.id} carries a brain band in the catalog and is missing from the index`);
  const regionIds = new Set(catalog.regions.map((region) => region.id));
  if (regionIds.size !== model.regions.length || model.regions.some((region) => !regionIds.has(region.id))) throw new OutOfStepError('the two list different regions');
  return model;
}

/** The pin the index holds for a file served beside it. An index without one cannot vouch for that file, so it is refused. */
function companionPin(index: AnatomyIndex, path: string): PinnedFile {
  const pin = index.companions.find((companion) => companion.path === path);
  if (pin === undefined) throw new AnatomyDataError(ANATOMY_INDEX_PATH, 'companions', `the index does not pin ${path}`, 'Rebuild the site so the index and its companion files come from one build.');
  return pin;
}

/**
 * `pinned`: the index is the one the page was built with. `unpinned`: the page gave no pin. `mismatched`: the page's
 * pin and the index the site now serves differ, so the page and its data are out of step.
 */
export type IndexPinState = 'pinned' | 'unpinned' | 'mismatched';

export interface LoadedExplorer {
  model: ExplorerModel;
  indexPinState: IndexPinState;
}

/**
 * The index as the page pins it. When the served index is not that file, the list can still be read from it, so it is
 * fetched without the pin and the mismatch is reported: the 3D view then draws nothing, and the page says why.
 */
async function fetchIndex(signal: AbortSignal, indexPin: PinnedFile | null): Promise<{ raw: unknown; indexPinState: IndexPinState }> {
  if (indexPin === null) return { raw: await fetchAtlasJson(ANATOMY_INDEX_PATH, signal), indexPinState: 'unpinned' };
  try {
    return { raw: await fetchPinnedJson(indexPin, signal), indexPinState: 'pinned' };
  } catch (error) {
    if (!(error instanceof AtlasFetchError) || error.failure !== 'pin_mismatch') throw error;
    return { raw: await fetchAtlasJson(ANATOMY_INDEX_PATH, signal), indexPinState: 'mismatched' };
  }
}

/**
 * The index first; then the catalog, which must be the exact file that index pins.
 *
 * @param indexPin the index's length and digest as the page was built with them, or null when the page gave none
 */
export async function loadExplorerModel(signal: AbortSignal, indexPin: PinnedFile | null): Promise<LoadedExplorer> {
  const { raw, indexPinState } = await fetchIndex(signal, indexPin);
  const index = parseAnatomyIndex(raw);
  const rawCatalog = await fetchPinnedJson(companionPin(index, EXPLORER_CATALOG_PATH), signal);
  return { model: requireAgreement(requireListableRegions(createExplorerModel(index, parseExplorerCatalog(rawCatalog)))), indexPinState };
}

/** The quotes and rationales behind the index's drafted rows, checked against the index's own pin. */
export async function loadAnatomyEvidence(model: ExplorerModel, signal: AbortSignal): Promise<ShownAnatomyEvidence> {
  return parseAnatomyEvidence(await fetchPinnedJson(model.index.evidence, signal));
}

export async function loadRegionEvidence(model: ExplorerModel, signal: AbortSignal): Promise<RegionEvidence> {
  return parseRegionEvidence(await fetchPinnedJson(companionPin(model.index, REGION_EVIDENCE_PATH), signal), new Set(model.regions.map((region) => region.id)));
}

export async function loadH01Card(model: ExplorerModel, signal: AbortSignal): Promise<H01Card> {
  return parseH01Card(await fetchPinnedJson(companionPin(model.index, H01_CARD_PATH), signal));
}

/** The curated threat models, fetched when a visitor asks for the steps. A step naming a technique this build does not hold is refused. */
export async function loadAtlasChains(model: ExplorerModel, signal: AbortSignal): Promise<AtlasChains> {
  const chains = parseAtlasChains(await fetchPinnedJson(companionPin(model.index, ATLAS_CHAINS_PATH), signal));
  const isKnown = (techniqueId: string): boolean => model.techniquesById.has(techniqueId) || model.deviceOnlyTechniquesById.has(techniqueId);
  const stray = chains.chains.flatMap((chain) => chain.steps).find((step) => !isKnown(step.technique_id));
  if (stray !== undefined) throw new OutOfStepError(`a threat model names technique ${stray.technique_id}, which the index and the catalog do not hold`);
  return chains;
}
