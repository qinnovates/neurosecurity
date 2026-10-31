/**
 * The files beside the index that load only when a visitor opens something
 * that needs them: the quotes behind the drafted rows, the literature
 * statements, the H01 card, the curated threat models and the region dossier's
 * records. Each is the exact file the index pins, and none is used before its
 * parser has accepted it.
 */

import { parseAnatomyEvidence, type ShownAnatomyEvidence } from '@/lib/anatomy/parse-anatomy-evidence';
import { H01_CARD_PATH, parseH01Card, type H01Card } from '@/lib/anatomy/parse-h01-card';
import { parseRegionEvidence } from '@/lib/anatomy/parse-region-evidence';
import { REGION_EVIDENCE_PATH, type RegionEvidence } from '@/lib/anatomy/region-evidence-types';
import { ATLAS_CHAINS_PATH, parseAtlasChains, type AtlasChains } from '@/lib/atlas-explorer/chain-file';
import { REGION_DOSSIER_PATH, parseRegionDossier, type RegionDossierFile } from '@/lib/atlas-explorer/dossier-file';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { OutOfStepError, companionPin } from './explorer-data';
import { fetchPinnedJson } from './fetch-atlas-json';

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

async function fetchRegionDossier(model: ExplorerModel): Promise<RegionDossierFile> {
  return parseRegionDossier(await fetchPinnedJson(companionPin(model.index, REGION_DOSSIER_PATH), new AbortController().signal));
}

interface DossierLoad {
  promise: Promise<RegionDossierFile>;
  file: RegionDossierFile | null;
}

/**
 * One load per model. The inspector is keyed by region, so a dossier mounts anew for every region it shows and has no
 * state that outlives the choice; held here, the next region reads the file at once instead of showing a loading line.
 * The fetch is therefore not tied to the component that started it. A model never changes, so nothing here goes stale.
 */
const dossierLoads = new WeakMap<ExplorerModel, DossierLoad>();

/** The dossier's file if it has already arrived, for a first render that should not flash a loading line. */
export function peekRegionDossier(model: ExplorerModel): RegionDossierFile | null {
  return dossierLoads.get(model)?.file ?? null;
}

/** The dossier's file, fetched the first time a region is opened. A failed load is forgotten, so "Try again" fetches again. */
export function loadRegionDossier(model: ExplorerModel): Promise<RegionDossierFile> {
  const held = dossierLoads.get(model);
  if (held !== undefined) return held.promise;
  const load: DossierLoad = {
    file: null,
    promise: fetchRegionDossier(model).then((file) => {
      load.file = file;
      return file;
    }, (error: unknown) => {
      dossierLoads.delete(model);
      throw error;
    }),
  };
  dossierLoads.set(model, load);
  return load.promise;
}
