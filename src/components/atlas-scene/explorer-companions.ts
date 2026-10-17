/**
 * The files beside the index that load only when a visitor opens something
 * that needs them: the quotes behind the drafted rows, the literature
 * statements, the H01 card and the curated threat models. Each is the exact
 * file the index pins, and none is used before its parser has accepted it.
 */

import { parseAnatomyEvidence, type ShownAnatomyEvidence } from '@/lib/anatomy/parse-anatomy-evidence';
import { H01_CARD_PATH, parseH01Card, type H01Card } from '@/lib/anatomy/parse-h01-card';
import { parseRegionEvidence } from '@/lib/anatomy/parse-region-evidence';
import { REGION_EVIDENCE_PATH, type RegionEvidence } from '@/lib/anatomy/region-evidence-types';
import { ATLAS_CHAINS_PATH, parseAtlasChains, type AtlasChains } from '@/lib/atlas-explorer/chain-file';
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
