/**
 * What stands in words beside the 3D view when it is shown on another page:
 * the regions the visitor chose there, the regions a technique's links name, which of
 * them have no shape of their own, and the sentences that limit all of it.
 *
 * Two things are kept apart here, as they are in the picture. The lens decides
 * every fill, from the data. The visitor's own choice (regions ticked or
 * picked on the page, or one band) is a selection: it is marked with corner
 * brackets, carries no fill, and is always worded as the visitor's choice.
 */

import type { IndexReviewState, IndexSubject } from '@/lib/anatomy/anatomy-index-types';
import { limitSentence, type LimitSentence } from '@/lib/anatomy/limits-copy';
import { isNeuralBand, nameBands, weakestReviewState, type ExplorerModel } from './explorer-model';
import type { Lens } from './lens-state';
import { describeBands, limitForGeometry, limitsForLens } from './limit-selection';
import { GEOMETRY_LABELS } from './region-rows';
import { limitsForUncolouredTechnique, listNamedRegionIds } from './technique-colouring';
import type { ViewportCaption } from './viewport-caption';

/** What the visitor chose on the page. Never a claim of the data's. */
export interface VisitorSelection {
  /** Regions ticked or picked on the page, in the page's order. */
  regionIds: readonly string[];
  /** One band picked on the page, or null. Its regions are read from the index, never passed in. */
  bandId: string | null;
}

export const NO_SELECTION: VisitorSelection = { regionIds: [], bandId: null };

export interface NotedRegion {
  id: string;
  name: string;
  /** Its bands with their names: "N7 Neocortex". */
  bandNames: string;
  /** "own shape", "inside a larger shape", "no shape" and so on. */
  geometryLabel: string;
  /** False for a region that lies inside a larger shape, has only a marker, or has no shape at all. */
  hasOwnShape: boolean;
  /** The sentence for its geometry state. */
  geometryLimit: LimitSentence;
  reviewState: IndexReviewState;
}

export interface NotedList {
  /** "Regions you chose", "Regions QIF places in band N7 Neocortex", "Regions this technique's drafted links name". */
  heading: string;
  regions: NotedRegion[];
}

export interface RegionViewNotes {
  /** One list per thing the view marks or fills. The same regions, in the same order and number, as the page's own list. */
  lists: NotedList[];
  /** Region ids, each group bracketed as one: one group per chosen region, one group for a chosen band. */
  bracketGroups: string[][];
  /** In reading order: what the brackets mean, what the fill means, what the shapes are, and what is not drawn. */
  limits: LimitSentence[];
  /** The weakest review state among the drafted mappings that decide what is shown. */
  reviewState: IndexReviewState | null;
}

const OWN_SHAPE_STATE = 'drawn';

export function noteRegion(model: ExplorerModel, region: IndexSubject): NotedRegion {
  return {
    id: region.id, name: region.name, bandNames: nameBands(model, region.band_ids), geometryLabel: GEOMETRY_LABELS[region.geometry.state],
    hasOwnShape: region.geometry.state === OWN_SHAPE_STATE, geometryLimit: limitForGeometry(region), reviewState: region.review_state,
  };
}

/** The region as the notes show it, or null for an id this build does not hold. */
export function noteRegionById(model: ExplorerModel, regionId: string): NotedRegion | null {
  const region = model.regionsById.get(regionId);
  return region === undefined ? null : noteRegion(model, region);
}

/** The heading over the regions a technique's drafted links name. "Name", not "light": a named region may have no shape of its own to colour. */
export const NAMED_REGIONS_HEADING = 'Regions this technique\'s drafted links name';

/** The regions a technique's drafted links name, in the order the links name them. Empty for a band-level or unknown technique. */
function listNamedRegions(model: ExplorerModel, techniqueId: string): IndexSubject[] {
  return listNamedRegionIds(model.techniquesById.get(techniqueId)).flatMap((regionId) => model.regionsById.get(regionId) ?? []);
}

/** A technique that has lit links also carries band tags. They are said as band tags, apart from the links. */
function bandReachLimit(model: ExplorerModel, lens: Lens): LimitSentence[] {
  if (lens.kind !== 'technique' || lens.techniqueId === null) return [];
  const technique = model.techniquesById.get(lens.techniqueId);
  const neuralBandIds = technique?.band_ids.filter(isNeuralBand) ?? [];
  // A band-level technique's own lens sentence already says exactly this.
  if (technique === undefined || technique.scope === 'band_level' || neuralBandIds.length === 0) return [];
  return [limitSentence('view_technique_band_reach', { bands: describeBands(neuralBandIds) })];
}

function withoutShapeLimit(lists: readonly NotedList[]): LimitSentence[] {
  const names = [...new Set(lists.flatMap((list) => list.regions).filter((region) => !region.hasOwnShape).map((region) => `${region.name} (${region.geometryLabel})`))];
  return names.length === 0 ? [] : [limitSentence('view_regions_without_shape', { count: String(names.length), regions: names.join('; ') })];
}

/**
 * @param lens the data-derived lens that decides every fill
 * @param selection what the visitor chose on the page; bracketed, never filled
 */
export function buildRegionViewNotes(model: ExplorerModel, lens: Lens, selection: VisitorSelection = NO_SELECTION): RegionViewNotes {
  const chosenIds = [...new Set(selection.regionIds)];
  const chosen = chosenIds.flatMap((regionId) => model.regionsById.get(regionId) ?? []);
  const unknownIds = chosenIds.filter((regionId) => !model.regionsById.has(regionId));
  const band = selection.bandId === null ? undefined : model.bandsById.get(selection.bandId);
  const bandRegions = band === undefined ? [] : model.regions.filter((region) => region.band_ids.includes(band.id));
  const named = lens.kind === 'technique' && lens.techniqueId !== null ? listNamedRegions(model, lens.techniqueId) : [];
  const toList = (heading: string, regions: readonly IndexSubject[]): NotedList[] => (regions.length === 0 ? [] : [{ heading, regions: regions.map((region) => noteRegion(model, region)) }]);
  const lists = [
    ...toList('Regions you chose', chosen),
    ...(band === undefined ? [] : toList(`Regions QIF places in band ${nameBands(model, [band.id])}`, bandRegions)),
    ...toList(NAMED_REGIONS_HEADING, named),
  ];
  const linkStates = lens.kind === 'technique' && lens.techniqueId !== null ? (model.techniquesById.get(lens.techniqueId)?.links ?? []).map((link) => link.review_state) : [];
  const shown = lists.flatMap((list) => list.regions.map((region) => region.reviewState));
  return {
    lists,
    bracketGroups: [...chosen.map((region) => [region.id]), ...(bandRegions.length === 0 ? [] : [bandRegions.map((region) => region.id)])],
    limits: [
      ...(chosen.length === 0 ? [] : [limitSentence('view_chosen_regions')]),
      ...(band === undefined ? [] : [limitSentence('view_chosen_band', { band: nameBands(model, [band.id]) })]),
      ...(unknownIds.length === 0 ? [] : [limitSentence('view_region_unknown', { regions: unknownIds.join(', ') })]),
      ...limitsForLens(model, lens),
      ...limitsForUncolouredTechnique(model, lens),
      ...bandReachLimit(model, lens),
      ...withoutShapeLimit(lists),
      limitSentence('region_matching'),
      limitSentence('outline_shape'),
    ],
    // Every shape stands for a region through a drafted matching, so with nothing listed the mark is the regions' own.
    reviewState: weakestReviewState([...linkStates, ...shown, ...model.regions.map((region) => region.review_state)]),
  };
}

const keyOf = (limit: LimitSentence): string => `${limit.id}:${limit.text}`;

/**
 * The notes without what the open picture's caption is already showing: the same sentence, word for word, or the same
 * review mark. Each then stands once, in the caption, which no crop of the picture can lose. With no caption on
 * screen (the view is hidden, still loading, or could not open) nothing is taken out, so no sentence loses its last copy.
 */
export function withoutCaptionCopies(notes: RegionViewNotes, caption: ViewportCaption | null): RegionViewNotes {
  if (caption === null) return notes;
  const captioned = new Set([...caption.lensLimits, ...caption.positionLimits, ...caption.markLimits].map(keyOf));
  const isMarkCaptioned = notes.reviewState !== null && caption.reviewState?.state === notes.reviewState.state && caption.reviewState.mark === notes.reviewState.mark;
  return { ...notes, limits: notes.limits.filter((limit) => !captioned.has(keyOf(limit))), reviewState: isMarkCaptioned ? null : notes.reviewState };
}
