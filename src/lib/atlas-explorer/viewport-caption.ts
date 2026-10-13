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
import { LENS_LABELS, type Lens } from './lens-state';
import { limitsForLens } from './limit-selection';
import type { SceneShape } from './scene-shapes';

export interface ViewportCaption {
  /** The weakest review state among the shapes drawn. Null only when nothing is drawn. */
  reviewState: IndexReviewState | null;
  lensLabel: string;
  templateSpace: string;
  /** The lens's own limit first, then the whole-scene limit. */
  lensLimits: LimitSentence[];
  /** One sentence per layer drawn, about its position. */
  positionLimits: LimitSentence[];
  /** One sentence for each kind of mark on screen. */
  markLimits: LimitSentence[];
}

/** How each layer is named inside a sentence. */
export const LAYER_NOUNS: Readonly<Record<LayerId, string>> = {
  outline: 'brain outline', cortical: 'cortical shapes', deep: 'deep structures', tracts: 'tracts', networks: 'networks', devices: 'devices',
};

/** Worst first: one failed asset makes its layer read as failed. */
const POSITION_RANK: readonly PositionCheck[] = ['failed', 'not independently checked', 'independently checked'];
const POSITION_LIMIT_IDS = { failed: 'position_failed', 'not independently checked': 'position_not_checked', 'independently checked': 'position_checked' } as const;

function positionLimitFor(model: ExplorerModel, layer: LayerId, assetIds: ReadonlySet<string>): LimitSentence {
  const checks = model.index.assets.filter((asset) => assetIds.has(asset.id) && asset.layer === layer).map((asset) => asset.position_check);
  const worst = POSITION_RANK.find((check) => checks.includes(check)) ?? 'not independently checked';
  return limitSentence(POSITION_LIMIT_IDS[worst], { layer: LAYER_NOUNS[layer] });
}

function markLimitsFor(shapes: readonly SceneShape[]): LimitSentence[] {
  const has = (predicate: (shape: SceneShape) => boolean): boolean => shapes.some(predicate);
  return [
    ...(has((shape) => shape.layer === 'outline') ? [limitSentence('outline_shape')] : []),
    ...(has((shape) => shape.fill === 'lines') ? [limitSentence('unfilled_shape')] : []),
    ...(has((shape) => shape.fill === 'translucent') ? [limitSentence('inside_shape')] : []),
    ...(has((shape) => shape.sizeMark === 'ring_only') ? [limitSentence('marker_ring')] : []),
    ...(has((shape) => shape.sizeMark === 'mesh_and_ring') ? [limitSentence('coarse_ring')] : []),
    ...(has((shape) => shape.mirrored) ? [limitSentence('mirrored_scene')] : []),
    ...(has((shape) => shape.layer === 'deep') ? [limitSentence('deep_disagreement')] : []),
  ];
}

export function buildViewportCaption(model: ExplorerModel, lens: Lens, shapes: readonly SceneShape[]): ViewportCaption {
  const layers = [...new Set(shapes.map((shape) => shape.layer))];
  const assetIds = new Set(shapes.map((shape) => shape.assetId));
  const drawnKeys = new Set(shapes.map((shape) => shape.structureKey));
  const states = [...drawnKeys].flatMap((key) => model.structuresByKey.get(key)?.review_state ?? []);
  return {
    reviewState: weakestReviewState(states),
    lensLabel: LENS_LABELS[lens.kind],
    templateSpace: model.index.template_space,
    lensLimits: [limitsForLens(model, lens)[0], limitSentence('whole_scene')],
    positionLimits: layers.map((layer) => positionLimitFor(model, layer, assetIds)),
    markLimits: markLimitsFor(shapes),
  };
}
