/**
 * What one region reads under a lens, in words. With no 3D view the list is
 * the whole experience, so everything a colour would say is said here: the
 * value, why, whether an AI-drafted link stands behind it, and how each shape
 * the region is drawn through would be marked.
 *
 * "No data" is its own standing. It never reads as "low".
 */

import type { IndexReviewState, IndexSubject, IndexTechniqueLink } from '@/lib/anatomy/anatomy-index-types';
import { NISS_STEPS, type ColourMode, type OwnershipMark } from '@/lib/anatomy/colour-modes';
import type { ClaimBasis } from '@/lib/anatomy/evidence';
import { listLitLinks, weakestReviewState, type ExplorerModel, type RegionLink } from './explorer-model';
import { describeBands } from './limit-selection';

export const LENS_STANDINGS = ['value', 'named_not_counted', 'no_data', 'awaiting_subject'] as const;
/**
 * `value`: the lens holds a fact for the region. `named_not_counted`: the catalog names the region but the link may
 * not count. `no_data`: nothing is linked. `awaiting_subject`: the lens has no subject chosen yet.
 */
export type LensStanding = typeof LENS_STANDINGS[number];

/** How a row's shapes would be marked, as one word for the row. `no_shape`: nothing is drawn. `varies`: its shapes differ. */
export type RowMark = OwnershipMark | 'no_shape' | 'varies';

export interface ShapeUnderLens {
  structureKey: string;
  mark: OwnershipMark;
  words: string;
}

export interface RegionLensFact {
  standing: LensStanding;
  value: string;
  reason: string;
  /** The review state of the AI-drafted links the value rests on, shown as a mark beside it. Null when no drafted link is involved. */
  reviewState: IndexReviewState | null;
  /** Catalog entries behind the value. Shown as a count of entries; nothing is ranked by it. */
  entryCount: number;
  shapes: ShapeUnderLens[];
  mark: RowMark;
}

export const NO_DATA_VALUE = 'no data';
const AWAITING_VALUE = 'choose above';
const LINKED_VALUE = 'linked';
const NAMED_NOT_COUNTED_VALUE = 'named, not counted';

const BASIS_REASONS: Readonly<Record<ClaimBasis, string>> = {
  catalog_text: 'named in the catalog\'s text',
  catalog_parameter: 'named in the catalog\'s parameters',
  analyst_inference: 'inferred by the AI drafter; the catalog does not name it',
  atlas_label: 'named by an atlas label',
  literature: 'named in a cited paper',
};

type Fact = Pick<RegionLensFact, 'standing' | 'value' | 'reason' | 'reviewState' | 'entryCount'>;

function reviewOf(links: readonly RegionLink[]): IndexReviewState | null {
  return weakestReviewState(links.map((regionLink) => regionLink.link.review_state));
}

function noData(reason: string): Fact {
  return { standing: 'no_data', value: NO_DATA_VALUE, reason, reviewState: null, entryCount: 0 };
}

/** Why a link that names the region is not counted, most basic reason first. */
export function describeUncountedLink(link: IndexTechniqueLink): string {
  if (!link.valid_for_current_addressing) return 'drafted for an older version of the region list';
  if (link.quote_state !== 'quote_found') return 'the quoted words are no longer in the catalog entry';
  if (link.resolution === 'whole_to_part') return 'the catalog names a larger structure, of which this region is one part';
  if (link.resolution === 'part_to_whole') return 'the catalog names a part of this region, not the region';
  if (link.resolution === 'unclassified') return 'the catalog\'s word is not one the atlas file classifies';
  return 'the technique\'s own band tags do not include this region\'s band';
}

function describeBand(model: ExplorerModel, region: IndexSubject): Fact {
  const [bandId] = region.band_ids;
  const band = bandId === undefined ? undefined : model.bandsById.get(bandId);
  if (bandId === undefined) return noData('the atlas file gives this region no band');
  return { standing: 'value', value: band === undefined ? bandId : `${bandId} ${band.name}`, reason: 'QIF\'s own grouping, from its atlas file; not reviewed by an expert', reviewState: null, entryCount: 0 };
}

function describeTechnique(model: ExplorerModel, region: IndexSubject, techniqueId: string): Fact {
  const technique = model.techniquesById.get(techniqueId);
  if (technique === undefined) return noData(model.deviceOnlyTechniquesById.has(techniqueId) ? 'tagged with device stages only' : 'no data for this technique in this build');
  const links = technique.links.filter((link) => link.resolved_region_id === region.id);
  const litLink = links.find((link) => link.lit);
  if (litLink !== undefined) return { standing: 'value', value: LINKED_VALUE, reason: BASIS_REASONS[litLink.claim_basis], reviewState: litLink.review_state, entryCount: 1 };
  if (links.length > 0) return { standing: 'named_not_counted', value: NAMED_NOT_COUNTED_VALUE, reason: describeUncountedLink(links[0]), reviewState: links[0].review_state, entryCount: 1 };
  if (technique.scope === 'not_drafted') return noData('no region link has been drafted for this technique');
  const sharedBands = technique.band_ids.filter((bandId) => region.band_ids.includes(bandId));
  if (technique.scope === 'band_level' && sharedBands.length > 0) return noData(`tagged to ${describeBands(sharedBands)} only; no region assessed`);
  return noData('the catalog\'s text does not name this region');
}

function highestNissStep(severities: readonly string[]): string | undefined {
  const rank = (severity: string): number => (NISS_STEPS as readonly string[]).indexOf(severity);
  return [...severities].sort((first, second) => rank(second) - rank(first))[0];
}

function countEntries(count: number): string {
  return count === 1 ? '1 linked catalog entry' : `${count} linked catalog entries`;
}

function describeNiss(model: ExplorerModel, region: IndexSubject): Fact {
  const litLinks = listLitLinks(model, region.id);
  if (litLinks.length === 0) return noData('no technique is linked to this region');
  const step = highestNissStep(litLinks.flatMap((regionLink) => regionLink.technique.niss_severity ?? []));
  if (step === undefined) return noData('the linked techniques carry no NISS step');
  return { standing: 'value', value: step, reason: `highest NISS step among ${countEntries(litLinks.length)}`, reviewState: reviewOf(litLinks), entryCount: litLinks.length };
}

function describeCluster(model: ExplorerModel, region: IndexSubject, cluster: string): Fact {
  const tagged = listLitLinks(model, region.id).filter((regionLink) => regionLink.technique.dsm_cluster === cluster);
  if (tagged.length === 0) return noData('no linked technique carries this cluster');
  return { standing: 'value', value: LINKED_VALUE, reason: `${countEntries(tagged.length)} with this cluster tag`, reviewState: reviewOf(tagged), entryCount: tagged.length };
}

function describeDevice(model: ExplorerModel, region: IndexSubject, deviceId: string): Fact {
  const isNamed = model.index.devices.stated_targets.some((device) => device.device_id === deviceId && device.region_ids.includes(region.id));
  if (!isNamed) return noData('QIF\'s atlas file does not list this region for the device');
  return { standing: 'value', value: 'listed', reason: 'QIF\'s atlas file lists this region for the device; no expert has reviewed the list', reviewState: null, entryCount: 0 };
}

function describeFact(model: ExplorerModel, region: IndexSubject, mode: ColourMode): Fact {
  switch (mode.kind) {
    case 'evidence': {
      const links = listLitLinks(model, region.id);
      const tiers = [...new Set(links.flatMap(({ technique }) => mode.tiersByTechnique?.[technique.id] ?? []))];
      return tiers.length ? { standing: 'value', value: tiers.join(', '), reason: 'evidence tiers recorded for mapped techniques', reviewState: reviewOf(links), entryCount: links.length } : noData('no evidence tier recorded for mapped techniques');
    }
    case 'band': return describeBand(model, region);
    case 'technique': return describeTechnique(model, region, mode.techniqueId);
    case 'niss': return describeNiss(model, region);
    case 'dsm': return describeCluster(model, region, mode.cluster);
    case 'stated_targets': return describeDevice(model, region, mode.deviceId);
  }
}

function combineMarks(shapes: readonly ShapeUnderLens[]): RowMark {
  if (shapes.length === 0) return 'no_shape';
  return shapes.every((shape) => shape.mark === shapes[0].mark) ? shapes[0].mark : 'varies';
}

/** The style functions do not know device-only techniques; for those the region's own reason is the truthful one. */
function describeShapes(model: ExplorerModel, region: IndexSubject, mode: ColourMode, fact: Fact): ShapeUnderLens[] {
  const isDeviceOnly = mode.kind === 'technique' && !model.techniquesById.has(mode.techniqueId);
  return region.structure_keys.filter((key) => model.structuresByKey.has(key)).map((structureKey) => {
    const style = model.styleStructure(structureKey, mode);
    return { structureKey, mark: style.mark, words: isDeviceOnly ? fact.reason : style.words };
  });
}

/** @param mode null while the lens waits for its subject: the region then reads "choose above" and no shape is marked */
export function describeRegionUnderLens(model: ExplorerModel, region: IndexSubject, mode: ColourMode | null): RegionLensFact {
  if (mode === null) {
    return { standing: 'awaiting_subject', value: AWAITING_VALUE, reason: 'this lens needs a subject', reviewState: null, entryCount: 0, shapes: [], mark: 'no_shape' };
  }
  const fact = describeFact(model, region, mode);
  const shapes = describeShapes(model, region, mode, fact);
  return { ...fact, shapes, mark: combineMarks(shapes) };
}
