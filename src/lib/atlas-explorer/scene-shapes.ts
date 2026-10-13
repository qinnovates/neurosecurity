/**
 * What the 3D view draws, decided here and nowhere in the drawing code. Each
 * shipped shape gets three marks that never share a channel:
 *   fill        what the lens says (the ownership mark, from the style functions)
 *   size mark   how well the atlas resolves the structure (mesh, mesh with a ring, ring alone)
 *   outline     whether it is selected
 * The fill comes only from `model.styleStructure`, so a shape that holds
 * several records, or holds one only somewhere inside it, is never filled as
 * one owner. Colours are keyed by the lens's step, never by region.
 */

import type { ColourMode, OwnershipMark } from '@/lib/anatomy/colour-modes';
import type { SizeClass } from '@/lib/anatomy/manifest-types';
import type { LayerId } from '@/lib/anatomy/source-types';
import type { ExplorerModel } from './explorer-model';

export const FILL_KINDS = ['solid', 'translucent', 'lines', 'neutral'] as const;
/** `solid`: opaque, in the step's colour. `translucent`: pale and neutral. `lines`: no fill. `neutral`: a quiet fill no lens colours. */
export type FillKind = typeof FILL_KINDS[number];

export const SIZE_MARKS = ['mesh', 'mesh_and_ring', 'ring_only'] as const;
export type SizeMark = typeof SIZE_MARKS[number];

export interface SceneShape {
  /** Unique per drawn thing: the structure and its side. */
  id: string;
  structureKey: string;
  assetId: string;
  layer: LayerId;
  hemisphere: string;
  fill: FillKind;
  colour: string;
  /** The lens step the colour stands for, or null when the shape carries no step. */
  step: string | null;
  /** The style function's own words for the mark. */
  words: string;
  sizeMark: SizeMark;
  centroidMm: readonly [number, number, number];
  /** One side was drawn and the other is its mirror image. */
  mirrored: boolean;
}

/** Colours for the bands, neocortex to spinal cord. Categories, not a scale. */
export const BAND_COLOURS: Readonly<Record<string, string>> = {
  N7: '#5b3fd0', N6: '#0b8a7d', N5: '#c2255c', N4: '#b86a00', N3: '#2b6fd6', N2: '#5d7f16', N1: '#7a5c99',
};
/** NISS steps, lightest to darkest. Five separate steps, never a ramp between them. */
export const NISS_COLOURS: Readonly<Record<string, string>> = {
  none: '#d6d0f0', low: '#b0a2e6', medium: '#8a74d8', high: '#5f45c2', critical: '#33207a',
};
export const LINKED_COLOUR = '#5b3fd0';
export const NEUTRAL_COLOUR = '#8a90a0';

const FILL_BY_MARK: Readonly<Record<OwnershipMark, FillKind>> = { solid: 'solid', inside_or_mixed: 'translucent', no_data: 'lines', context: 'neutral' };
const MESHLESS: readonly SizeClass[] = ['unresolved', 'not_drawn'];

function colourOfStep(mode: ColourMode, step: string | null, isKnown: boolean): string {
  if (step === null || !isKnown) return NEUTRAL_COLOUR;
  if (mode.kind === 'band') return BAND_COLOURS[step] ?? NEUTRAL_COLOUR;
  if (mode.kind === 'niss') return NISS_COLOURS[step] ?? NEUTRAL_COLOUR;
  return LINKED_COLOUR;
}

function sizeMarkOf(sizeClass: SizeClass, vertexCount: number): SizeMark {
  if (vertexCount === 0 || MESHLESS.includes(sizeClass)) return 'ring_only';
  return sizeClass === 'coarse' ? 'mesh_and_ring' : 'mesh';
}

/** The fill and colour of one structure under a lens. With no lens subject chosen, nothing is coloured. */
export function describeFill(model: ExplorerModel, structureKey: string, mode: ColourMode | null): Pick<SceneShape, 'fill' | 'colour' | 'step' | 'words'> {
  if (mode === null) return { fill: 'neutral', colour: NEUTRAL_COLOUR, step: null, words: 'no lens subject chosen' };
  const style = model.styleStructure(structureKey, mode);
  const fill = FILL_BY_MARK[style.mark];
  return { fill, colour: fill === 'solid' ? colourOfStep(mode, style.step, style.step_known) : NEUTRAL_COLOUR, step: fill === 'solid' ? style.step : null, words: style.words };
}

/** Every shipped shape and marker, with its three marks, for the layers the visitor has asked to see. */
export function buildSceneShapes(model: ExplorerModel, mode: ColourMode | null, requested: Readonly<Record<LayerId, boolean>>): SceneShape[] {
  const assetsById = new Map(model.index.assets.map((asset) => [asset.id, asset]));
  const availableLayers = new Set(model.index.layers.filter((layer) => layer.available && requested[layer.id]).map((layer) => layer.id));
  return model.index.structures.flatMap((structure) => {
    const look = describeFill(model, structure.key, mode);
    return structure.nodes.flatMap((node) => {
      const asset = assetsById.get(node.asset_id);
      if (asset === undefined || !availableLayers.has(asset.layer)) return [];
      return [{
        ...look, id: `${structure.key}:${node.hemisphere}`, structureKey: structure.key, assetId: asset.id, layer: asset.layer, hemisphere: node.hemisphere,
        sizeMark: sizeMarkOf(node.size_class, node.vertex_count), centroidMm: node.centroid_mm, mirrored: node.hemispheres_drawn === 'mirrored',
      }];
    });
  });
}

/** The steps and colours on screen, for the legend. Empty when no shape is filled. */
export function listLegendSteps(shapes: readonly SceneShape[]): Array<{ step: string; colour: string }> {
  const steps = new Map(shapes.filter((shape) => shape.fill === 'solid' && shape.step !== null).map((shape) => [shape.step as string, shape.colour]));
  // NISS steps in order of severity, bands from the neocortex down; anything else by name.
  const order = [...Object.keys(NISS_COLOURS), ...Object.keys(BAND_COLOURS)];
  const rank = (step: string): number => (order.includes(step) ? order.indexOf(step) : order.length);
  return [...steps].map(([step, colour]) => ({ step, colour })).sort((first, second) => rank(first.step) - rank(second.step) || first.step.localeCompare(second.step));
}
