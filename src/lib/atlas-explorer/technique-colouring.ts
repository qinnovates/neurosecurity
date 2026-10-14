/**
 * Whether a technique's drafted links colour any shape in the picture, worked
 * out one way for both who needs it: a technique page, at build time, for the
 * sentence beside the button that asks for the 3D view; and the view, for its
 * caption. The page is built with the sentence itself, so the button shows it
 * before the limit table has loaded.
 *
 * It asks the style function, the same one that fills the shapes, so it can
 * never say "coloured" of a picture in which nothing is filled, or the reverse.
 */

import { limitSentence, type LimitSentence } from '@/lib/anatomy/limits-copy';
import type { IndexTechnique } from '@/lib/anatomy/anatomy-index-types';
import { LAYER_IDS, type LayerId } from '@/lib/anatomy/source-types';
import type { ExplorerModel } from './explorer-model';
import type { Lens } from './lens-state';
import { buildSceneShapes } from './scene-shapes';

/**
 * `coloured`: at least one shape is filled. `named_none_coloured`: the links name regions, and none of them has a
 * shape of its own to fill. `none_named`: the links name no region at all (a band-level, undrafted or unknown technique).
 */
export const TECHNIQUE_COLOURINGS = ['coloured', 'named_none_coloured', 'none_named'] as const;
export type TechniqueColouring = typeof TECHNIQUE_COLOURINGS[number];

/** What the classification reads: the index, and the function that fills its shapes. */
export type ColouringSource = Pick<ExplorerModel, 'index' | 'styleStructure'>;

const EVERY_LAYER = Object.fromEntries(LAYER_IDS.map((layerId) => [layerId, true])) as Record<LayerId, boolean>;
const NOTHING_COLOURED_LIMITS = { named_none_coloured: 'view_nothing_coloured_no_own_shape', none_named: 'view_nothing_coloured_none_named' } as const;

/** The regions a technique's drafted links name and count, in the order the links name them. Empty for a band-level or unknown technique. */
export function listNamedRegionIds(technique: Pick<IndexTechnique, 'links'> | undefined): string[] {
  return [...new Set((technique?.links ?? []).flatMap((link) => (link.lit && link.resolved_region_id !== null ? [link.resolved_region_id] : [])))];
}

export function classifyTechniqueColouring(source: ColouringSource, techniqueId: string): TechniqueColouring {
  const regionIds = new Set(source.index.subjects.filter((subject) => subject.kind === 'region').map((subject) => subject.id));
  const named = listNamedRegionIds(source.index.techniques.find((technique) => technique.id === techniqueId)).filter((regionId) => regionIds.has(regionId));
  if (named.length === 0) return 'none_named';
  const isFilled = buildSceneShapes(source, { kind: 'technique', techniqueId }, EVERY_LAYER).some((shape) => shape.fill === 'solid');
  return isFilled ? 'coloured' : 'named_none_coloured';
}

/** The sentence that stands where a picture with nothing coloured would otherwise pass for a result. Empty when something is coloured, or the lens is not one technique. */
export function limitsForUncolouredTechnique(source: ColouringSource, lens: Lens): LimitSentence[] {
  if (lens.kind !== 'technique' || lens.techniqueId === null) return [];
  const colouring = classifyTechniqueColouring(source, lens.techniqueId);
  return colouring === 'coloured' ? [] : [limitSentence(NOTHING_COLOURED_LIMITS[colouring])];
}
