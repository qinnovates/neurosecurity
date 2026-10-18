/**
 * The caption that sits inside the 3D view, so any picture of the view carries
 * it: the review state of what is drawn, the lens and its limit, whether each
 * layer's position was checked, and the limits of the marks on screen. Built
 * from the shapes actually drawn, so it never describes a layer that is off.
 */

import type { IndexReviewState } from '@/lib/anatomy/anatomy-index-types';
import { limitSentence, type LimitSentence } from '@/lib/anatomy/limits-copy';
import type { PositionCheck } from '@/lib/anatomy/manifest-types';
import type { LayerId } from '@/lib/anatomy/source-types';
import { weakestReviewState, type ExplorerModel } from './explorer-model';
import { LENS_LABELS, lensSubjectId, type Lens } from './lens-state';
import { limitsForLens } from './limit-selection';
import type { SceneShape } from './scene-shapes';
import { limitsForUncolouredTechnique } from './technique-colouring';

export interface ViewportCaption {
  /** The weakest review state among the shapes drawn. Null only when nothing is drawn. */
  reviewState: IndexReviewState | null;
  /** The lens and what it is on: "Technique lens: QIF-T0103, SSVEP Frequency Hijack." */
  lensLabel: string;
  templateSpace: string;
  /** The lens's own limit first, then, for a technique that colours nothing, the sentence saying so, then the whole-scene limit. */
  lensLimits: LimitSentence[];
  /** One sentence per layer drawn, about its position. */
  positionLimits: LimitSentence[];
  /** One sentence for each kind of mark on screen. */
  markLimits: LimitSentence[];
}

/** How each layer is named inside a sentence. */
export const LAYER_NOUNS: Readonly<Record<LayerId, string>> = {
  outline: 'brain outline', cortical: 'cortical shapes', deep: 'deep structures', tracts: 'tracts', networks: 'networks', devices: 'head surface',
};

/** Worst first: one failed asset makes its layer read as failed. */
const POSITION_RANK: readonly PositionCheck[] = ['failed', 'not independently checked', 'checked in aggregate', 'independently checked'];
const POSITION_LIMIT_IDS = {
  failed: 'position_failed', 'not independently checked': 'position_not_checked', 'checked in aggregate': 'position_checked_in_aggregate', 'independently checked': 'position_checked',
} as const;

function positionLimitFor(model: ExplorerModel, layer: LayerId, assetIds: ReadonlySet<string>): LimitSentence {
  const assets = model.index.assets.filter((asset) => assetIds.has(asset.id) && asset.layer === layer);
  const checks = assets.map((asset) => asset.position_check);
  const worst = POSITION_RANK.find((check) => checks.includes(check)) ?? 'not independently checked';
  const range = worst === 'not independently checked' ? readDisagreementRange(assets.map((asset) => asset.modification_note)) : null;
  if (range !== null) return limitSentence('position_not_checked_with_range', { layer: LAYER_NOUNS[layer], range });
  return limitSentence(POSITION_LIMIT_IDS[worst], { layer: LAYER_NOUNS[layer] });
}

/** A range in millimetres as a file's own note states it ("0.7 to 2.5 mm"). The figure is read from the note, never typed here. */
const RANGE_PATTERN = /(\d+(?:\.\d+)? to \d+(?:\.\d+)?) mm/;

/** The disagreement between atlases that the files' notes record, or null when no note gives one. */
export function readDisagreementRange(notes: readonly string[]): string | null {
  return notes.map((note) => RANGE_PATTERN.exec(note)?.[1]).find((range) => range !== undefined) ?? null;
}

/** The lens and its subject in words. */
export function describeLens(model: ExplorerModel, lens: Lens): string {
  const subjectId = lensSubjectId(lens);
  const label = `${LENS_LABELS[lens.kind]} lens`;
  if (subjectId === null) return `${label}.`;
  if (lens.kind !== 'technique') return `${label}: ${subjectId.replaceAll('_', ' ')}.`;
  const name = model.techniquesById.get(subjectId)?.name ?? model.deviceOnlyTechniquesById.get(subjectId)?.name;
  return name === undefined ? `${label}: ${subjectId}.` : `${label}: ${subjectId}, ${name}.`;
}

function markLimitsFor(shapes: readonly SceneShape[]): LimitSentence[] {
  const has = (predicate: (shape: SceneShape) => boolean): boolean => shapes.some(predicate);
  return [
    ...(has((shape) => shape.layer === 'outline') ? [limitSentence('outline_shape')] : []),
    ...(has((shape) => shape.layer === 'devices') ? [limitSentence('device_head_surface')] : []),
    ...(has((shape) => shape.fill === 'lines') ? [limitSentence('unfilled_shape')] : []),
    ...(has((shape) => shape.fill === 'translucent') ? [limitSentence('inside_shape')] : []),
    ...(has((shape) => shape.fill === 'translucent') && !has((shape) => shape.fill === 'solid') ? [limitSentence('lens_fills_nothing')] : []),
    ...(has((shape) => shape.sizeMark === 'ring_only') ? [limitSentence('marker_ring')] : []),
    ...(has((shape) => shape.sizeMark === 'mesh_and_ring') ? [limitSentence('coarse_ring')] : []),
  ];
}

/** The sentence naming the sources whose shapes were drawn on one side and mirrored, when any such shape is drawn. */
function mirroredLimitFor(model: ExplorerModel, shapes: readonly SceneShape[]): LimitSentence[] {
  const atlasIds = new Set(shapes.filter((shape) => shape.mirrored).map((shape) => model.structuresByKey.get(shape.structureKey)?.atlas));
  const names = model.index.sources.filter((source) => atlasIds.has(source.id)).map((source) => source.name);
  return names.length === 0 ? [] : [limitSentence('mirrored_scene', { source: names.join(' and ') })];
}

export function buildViewportCaption(model: ExplorerModel, lens: Lens, shapes: readonly SceneShape[]): ViewportCaption {
  const layers = [...new Set(shapes.map((shape) => shape.layer))];
  const assetIds = new Set(shapes.map((shape) => shape.assetId));
  const drawnKeys = new Set(shapes.map((shape) => shape.structureKey));
  // The lens's own limit: the first of its sentences that limits the lens, not one that only explains a term.
  const lensLimits = limitsForLens(model, lens);
  const lensLimit = lensLimits.find((limit) => limit.id.startsWith('lens_')) ?? lensLimits[0];
  const states = [...drawnKeys].flatMap((key) => model.structuresByKey.get(key)?.review_state ?? []);
  return {
    reviewState: weakestReviewState(states),
    lensLabel: describeLens(model, lens),
    templateSpace: model.index.template_space,
    lensLimits: [lensLimit, ...limitsForUncolouredTechnique(model, lens), limitSentence('whole_scene')],
    positionLimits: [...layers.map((layer) => positionLimitFor(model, layer, assetIds)), ...mirroredLimitFor(model, shapes)],
    markLimits: markLimitsFor(shapes),
  };
}
