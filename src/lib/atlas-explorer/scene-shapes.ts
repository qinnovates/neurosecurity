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
  /** Set only while a threat model's steps are shown: the steps whose technique marks this shape. See chain-steps.ts. */
  stepNumbers?: readonly number[];
}

/**
 * Colours for the bands, neocortex to spinal cord.
 *
 * Two ordinal ramps, not seven categories. Seven mutually distinguishable
 * categorical hues do not exist: all seven bands can be on screen at once, so
 * they need all-pairs separation, and one hue carries at most five ordinal
 * steps before adjacent steps fall under the lightness-gap floor. The earlier
 * seven-hue set failed on that -- N7 and N3 measured 5.3 deltaE under
 * deuteranopia and 11.3 with full colour vision, below the 15 floor.
 *
 * So lightness carries depth within a hue family, and the hue family carries
 * the forebrain boundary: N7-N4 (telencephalon and diencephalon) on blue,
 * N3-N1 (cerebellum, brainstem, cord) on orange. Each family validates as an
 * ordinal ramp in both modes, and every cross-family pair clears the CVD
 * floor. Colour is never the only channel: the band is always labelled, since
 * within a family only position distinguishes the steps.
 */
export const BAND_COLOURS: Readonly<Record<string, string>> = {
  N7: '#82b8fb', N6: '#5598e7', N5: '#2a78d6', N4: '#1c5cab', N3: '#ef8a55', N2: '#d9541f', N1: '#9c3c16',
};
/** The same two families stepped for the dark surface, not an automatic flip. */
export const BAND_COLOURS_DARK: Readonly<Record<string, string>> = {
  N7: '#9ec5f4', N6: '#6da7ec', N5: '#3987e5', N4: '#256abf', N3: '#f6b08c', N2: '#ef8a55', N1: '#d9541f',
};
/** NISS steps, lightest to darkest. Five separate steps, never a ramp between them. */
export const NISS_COLOURS: Readonly<Record<string, string>> = {
  none: '#d6d0f0', low: '#b0a2e6', medium: '#8a74d8', high: '#5f45c2', critical: '#33207a',
};
/**
 * The same five steps restepped for the dark surface, not an automatic flip.
 *
 * On a light surface severity reads as *darker*; on a dark surface that ordering
 * inverts the meaning, because the darkest swatch is then the one nearest the
 * background. Using the light ramp on dark put `critical` at 1.49:1 — effectively
 * invisible — while `none` sat at 12.91:1, the loudest thing on screen. That is the
 * absence channel shouting over the severity channel, which is the one reading this
 * palette must never produce.
 *
 * Here visibility rises with severity: 1.65 / 2.62 / 4.28 / 7.09 / 11.70 against
 * `#0e0f11`, strictly ascending, with roughly 1.6:1 between adjacent steps so the
 * five stay distinguishable from each other and not just from the surface.
 *
 * `none` is quiet, never absent. Quiet is not "safe": the step is always labelled,
 * and the no-data sentence carries that meaning in words, not in colour.
 */
export const NISS_COLOURS_DARK: Readonly<Record<string, string>> = {
  none: '#3b3550', low: '#584f85', medium: '#7a6cba', high: '#a492e0', critical: '#cfc2ff',
};

/**
 * Which surface the canvas is drawn on. The palettes are authored per surface, never derived.
 *
 * ## Where the theme lives
 *
 * In one value, read in one place, passed on as data.
 *
 * `useSceneTheme` is the only thing in the explorer that asks the document which
 * surface the page is on. Everything below it is handed the answer, and there are
 * exactly two things that need it:
 *
 *   - the shape builder here, which turns a lens step into the ink for that
 *     surface (`colourOfStep`), so a shape carries its own already-resolved colour;
 *   - the renderer, for the inks that are not any one shape's -- the selection
 *     brackets and the "inside or mixed" fill -- which come from the one table in
 *     `scene-drawing.ts` (`SURFACE_INK`).
 *
 * No drawing function reads the document, holds a theme of its own, or chooses
 * between two palettes by any other route. A colour in the scene is either
 * resolved at one of those two seams or it is the same on both surfaces, and the
 * ones that are the same say so where they are declared.
 *
 * ## Why the argument is required
 *
 * The theme is a required parameter of every function that resolves an ink, with
 * no default. The first half of this fix defaulted it to `'light'`, and the
 * default was the bug: `buildChainShapes` never passed a theme at all, so while a
 * threat model was on screen nothing on that path could follow the surface, and
 * no type error said so. A required argument makes the omission a compile error.
 * Where a caller asks about fills rather than inks, it names a surface explicitly
 * and says at the call site why either would do.
 */
export type SceneTheme = 'light' | 'dark';
/**
 * The technique lens's one colour. It has no per-surface step because it needs
 * none: measured against the surfaces the palette tests use, it reads 3.62:1 on
 * the light one and 4.34:1 on the dark one, so it clears the 3:1 floor on both.
 */
export const LINKED_COLOUR = '#2a78d6';
/**
 * The colour of a shape the lens holds nothing for, and the ink of the context
 * layers. One value for both surfaces, deliberately: it is read as data as well
 * as drawn (it is a shape's `colour` wherever no step applies), and it sits
 * between the two surfaces at 2.61:1 on the light one and 6.01:1 on the dark one.
 * It is always drawn at a context opacity, never as a mark that must be found.
 */
export const NEUTRAL_COLOUR = '#8a90a0';

const FILL_BY_MARK: Readonly<Record<OwnershipMark, FillKind>> = { solid: 'solid', inside_or_mixed: 'translucent', no_data: 'lines', context: 'neutral' };
const MESHLESS: readonly SizeClass[] = ['unresolved', 'not_drawn'];

function colourOfStep(mode: ColourMode, step: string | null, isKnown: boolean, theme: SceneTheme): string {
  if (step === null || !isKnown) return NEUTRAL_COLOUR;
  const isDark = theme === 'dark';
  if (mode.kind === 'band') return (isDark ? BAND_COLOURS_DARK : BAND_COLOURS)[step] ?? NEUTRAL_COLOUR;
  if (mode.kind === 'niss') return (isDark ? NISS_COLOURS_DARK : NISS_COLOURS)[step] ?? NEUTRAL_COLOUR;
  return LINKED_COLOUR;
}

function sizeMarkOf(sizeClass: SizeClass, vertexCount: number): SizeMark {
  if (vertexCount === 0 || MESHLESS.includes(sizeClass)) return 'ring_only';
  return sizeClass === 'coarse' ? 'mesh_and_ring' : 'mesh';
}

/** The fill and colour of one structure under a lens. With no lens subject chosen, nothing is coloured. */
export function describeFill(model: Pick<ExplorerModel, 'styleStructure'>, structureKey: string, mode: ColourMode | null, theme: SceneTheme): Pick<SceneShape, 'fill' | 'colour' | 'step' | 'words'> {
  if (mode === null) return { fill: 'neutral', colour: NEUTRAL_COLOUR, step: null, words: 'no lens subject chosen' };
  const style = model.styleStructure(structureKey, mode);
  const fill = FILL_BY_MARK[style.mark];
  return { fill, colour: fill === 'solid' ? colourOfStep(mode, style.step, style.step_known, theme) : NEUTRAL_COLOUR, step: fill === 'solid' ? style.step : null, words: style.words };
}

/** Every shipped shape and marker, with its three marks, for the layers the visitor has asked to see. */
export function buildSceneShapes(model: Pick<ExplorerModel, 'index' | 'styleStructure'>, mode: ColourMode | null, requested: Readonly<Record<LayerId, boolean>>, theme: SceneTheme): SceneShape[] {
  const assetsById = new Map(model.index.assets.map((asset) => [asset.id, asset]));
  const availableLayers = new Set(model.index.layers.filter((layer) => layer.available && requested[layer.id]).map((layer) => layer.id));
  return model.index.structures.flatMap((structure) => {
    const look = describeFill(model, structure.key, mode, theme);
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
