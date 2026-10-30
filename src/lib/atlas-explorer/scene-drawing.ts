/**
 * Every decision the drawing code makes, as plain data and arithmetic with no
 * three.js in it, so each can be tested: what material a shape gets, what may
 * be picked, which of several shapes under the pointer a pick means, where the
 * pointer is, which way each anatomical direction points on screen, and the
 * selection mark.
 *
 * The selection is drawn on the selected shapes themselves: lit from within,
 * in white light at a level below the pointer's lift, and a see-through shape
 * drawn denser. Nothing is drawn around a selection and no hue is added, so a
 * selected shape keeps its own colour and never reads as holding a value it
 * does not hold.
 */

import type { Point3 } from '@/lib/anatomy/ras-to-scene';
import { positionOfPose, type OrbitPose } from './camera-views';
import { NEUTRAL_COLOUR, type FillKind, type SceneShape, type SceneTheme } from './scene-shapes';

/**
 * The selection role's ink: neutral, because selection is a state and not a
 * category. A hue could read as a band (the previous orange shared a hue family
 * with bands N3-N1), and no band is neutral. Shapes no longer wear it -- a
 * selected shape is lit from within instead -- but the picked electrode dot
 * does (device-objects.ts), and the palette tests hold the role apart from
 * every band on both surfaces.
 */
export const SELECTION_COLOUR = '#1a1a19';
/** The same role stepped for the dark surface. */
export const SELECTION_COLOUR_DARK = '#fcfcfb';
/** Pale shapes are darker and denser than context shapes, so "somewhere inside this shape" is legible across the whole brain. */
export const INSIDE_COLOUR = '#5b6170';
/**
 * The same ink lifted for the dark surface: the light one's channels raised by
 * 76 each, so it is the same cool slate at the same chroma, not a different colour.
 *
 * It is lifted because the relationship, not the colour, is what the pale fill
 * means: a pale shape has to be *denser* than the context shapes it sits among,
 * or "the lens holds this somewhere inside here" reads as less than "the lens
 * holds nothing here". On the light surface that held -- 5.07:1 for the pale ink
 * against 2.61:1 for the context neutral. Drawn on the dark surface the same ink
 * inverted it: 3.09:1 against the neutral's 6.01:1, so the shapes with no record
 * were the denser ones. This step lands at 8.54:1, about the geometric mean
 * between the context neutral (6.01) and the loudest NISS step (11.70), so it is
 * clearly denser than context and clearly quieter than a filled step.
 */
export const INSIDE_COLOUR_DARK = '#a7adbd';

/**
 * The ink that belongs to the surface rather than to a shape.
 *
 * A shape arrives with its own colour already resolved for the surface (see
 * `SceneTheme` in scene-shapes.ts). The pale fill cannot: it stands for the
 * lens holding no colour at all, so it has no step to read a palette with. It
 * is the drawing layer's own ink, and this is the only place it is chosen.
 */
export interface SurfaceInk {
  /** The "inside or mixed" fill. */
  inside: string;
}
export const SURFACE_INK: Readonly<Record<SceneTheme, SurfaceInk>> = {
  light: { inside: INSIDE_COLOUR },
  dark: { inside: INSIDE_COLOUR_DARK },
};

const OUTLINE_LAYER = 'outline';
/** The head surface the electrode layout sits on. Context, like the brain outline, and fainter. */
const DEVICES_LAYER = 'devices';

export interface MaterialParams {
  /** `lit`: shaded by the scene's lights. `flat`: one colour, unshaded. */
  shading: 'lit' | 'flat';
  colour: string;
  opacity: number;
  isWireframe: boolean;
  /** Whether both faces of each triangle are drawn. */
  isDoubleSided: boolean;
  writesDepth: boolean;
  drawOrder: number;
}

/** Fills first, then see-through things, then the brain outline, then the marker rings, then the marks over all of it. */
export const DRAW_ORDER = { fill: 0, seeThrough: 1, brainOutline: 2, marker: 3, mark: 4 } as const;
export const FILL_OPACITY: Readonly<Record<FillKind, number>> = { solid: 1, translucent: 0.4, lines: 0.2, neutral: 0.14 };
export const BRAIN_OUTLINE_OPACITY = 0.1;
export const HEAD_SURFACE_OPACITY = 0.07;

/**
 * @param isCut with a cut open, a filled shape shows its own inside in its own colour, not what lies behind it
 * @param theme the surface the canvas is drawn on, for the one ink here that is not the shape's own
 */
export function materialParamsFor(shape: Pick<SceneShape, 'layer' | 'fill' | 'colour'>, isCut: boolean, theme: SceneTheme): MaterialParams {
  if (shape.layer === OUTLINE_LAYER) {
    return { shading: 'lit', colour: NEUTRAL_COLOUR, opacity: BRAIN_OUTLINE_OPACITY, isWireframe: false, isDoubleSided: true, writesDepth: false, drawOrder: DRAW_ORDER.brainOutline };
  }
  if (shape.layer === DEVICES_LAYER) {
    return { shading: 'lit', colour: NEUTRAL_COLOUR, opacity: HEAD_SURFACE_OPACITY, isWireframe: false, isDoubleSided: false, writesDepth: false, drawOrder: DRAW_ORDER.brainOutline };
  }
  if (shape.fill === 'solid') return { shading: 'lit', colour: shape.colour, opacity: FILL_OPACITY.solid, isWireframe: false, isDoubleSided: isCut, writesDepth: true, drawOrder: DRAW_ORDER.fill };
  if (shape.fill === 'lines') return { shading: 'flat', colour: NEUTRAL_COLOUR, opacity: FILL_OPACITY.lines, isWireframe: true, isDoubleSided: false, writesDepth: false, drawOrder: DRAW_ORDER.seeThrough };
  const colour = shape.fill === 'translucent' ? SURFACE_INK[theme].inside : NEUTRAL_COLOUR;
  return { shading: 'lit', colour, opacity: FILL_OPACITY[shape.fill], isWireframe: false, isDoubleSided: false, writesDepth: false, drawOrder: DRAW_ORDER.seeThrough };
}

/**
 * How a shape under the pointer is lifted, so the visitor sees which shape a
 * click would pick. The lift keeps the fill kind: a see-through shape grows
 * denser and a filled one brighter. Nothing changes hue, so a hovered shape
 * never reads as holding a value it does not hold.
 */
export const HOVER_OPACITY: Readonly<Record<FillKind, number>> = { solid: 1, translucent: 0.7, lines: 0.55, neutral: 0.4 };
/** White light added to a filled shape under the pointer: brighter, not another colour. */
export const HOVER_EMISSIVE = '#ffffff';
export const HOVER_EMISSIVE_INTENSITY = 0.7;
/**
 * The selection: the same white light, held, at a lower level than the pointer's lift, so a selected shape stays
 * recognisably its own colour and the one under the pointer still stands out over it. Nothing is drawn around a
 * selection; its name stands beside the picture.
 */
export const SELECTED_EMISSIVE_INTENSITY = 0.35;

export interface HoverParams {
  opacity: number;
  /** Zero for every see-through fill, which is lifted by opacity alone. */
  emissiveIntensity: number;
}

export function hoverParamsFor(shape: Pick<SceneShape, 'fill'>): HoverParams {
  return { opacity: HOVER_OPACITY[shape.fill], emissiveIntensity: shape.fill === 'solid' ? HOVER_EMISSIVE_INTENSITY : 0 };
}

/* The marker ring: the mark that says how well the atlas resolves a structure. */

export const RING_REASONS = ['coarse_outline', 'place_only'] as const;
/** `coarse_outline`: a mesh is drawn but only a few scan pixels wide. `place_only`: no outline exists at all, just a point. */
export type RingReason = typeof RING_REASONS[number];

/**
 * Nominal sizes in millimetres. Both cases use the same radius: a ring marks a
 * place, so its size must say nothing about the structure's, and the two cases
 * are told apart by the centre, not by how big the ring is.
 */
export const RING_OUTER_MM = 3.2;
/** The band of a ring the lens fills, and of one it does not: weight is a channel, like the mesh's opacity. */
const RING_BAND_MM = 0.8;
const RING_HAIRLINE_MM = 0.5;
/** The filled centre of a place-only marker. Small enough to stay inside the ring at any distance. */
const RING_DOT_MM = 1.1;

export interface RingParams {
  colour: string;
  opacity: number;
  innerMm: number;
  outerMm: number;
  /** The pieces the ring is drawn in, each `[start, length]` in radians. One whole turn only where the lens fills the shape. */
  arcs: ReadonlyArray<readonly [number, number]>;
  /** The radius of the filled centre, or 0 for none. Drawn only where the atlas has no outline at all. */
  dotMm: number;
  reason: RingReason;
}

/** `count` equal arcs around the ring, each followed by a gap of `gapShare` of the pitch. */
function brokenRing(count: number, gapShare: number): ReadonlyArray<readonly [number, number]> {
  const pitch = (Math.PI * 2) / count;
  return Array.from({ length: count }, (_unused, at) => [at * pitch, pitch * (1 - gapShare)] as const);
}
const WHOLE_TURN: ReadonlyArray<readonly [number, number]> = [[0, Math.PI * 2]];

/**
 * How much of the ring is drawn, and how heavily, for each lens state. The ring
 * carries the lens on the channels a ring has, so it is never a silent
 * exception to it: a closed, full-weight band means the lens fills this shape,
 * and the broken forms mean it does not, each break pattern standing for a
 * different reason the way the mesh's wireframe and pale fills do.
 *
 * Colour is never the only channel: every pair of states here differs in how
 * the ring is drawn as well, which `scene-drawing.test.ts` pins. Only a shape
 * the lens fills takes a step colour, so a ring is grey exactly when the lens
 * holds nothing for it -- the same rule the mesh follows.
 *
 * Weights are set from what a reader actually meets. Measured on the shipped
 * index, all 25 ring-bearing shapes are `solid` under the band lens, `lines`
 * under NISS and `neutral` with no lens chosen: so the broken hairline forms
 * are the common case, and they are weighted to stay legible as an annotation
 * rather than to read as 25 circles standing inside the brain, which is what a
 * full-weight opaque ring in every state looked like.
 */
const RING_BY_FILL: Readonly<Record<FillKind, { arcs: ReadonlyArray<readonly [number, number]>; weightMm: number; opacity: number; isLensColoured: boolean }>> = {
  solid: { arcs: WHOLE_TURN, weightMm: RING_BAND_MM, opacity: 1, isLensColoured: true },
  translucent: { arcs: brokenRing(2, 0.3), weightMm: RING_BAND_MM, opacity: 0.8, isLensColoured: false },
  lines: { arcs: brokenRing(6, 0.45), weightMm: RING_HAIRLINE_MM, opacity: 0.7, isLensColoured: false },
  neutral: { arcs: brokenRing(3, 0.45), weightMm: RING_HAIRLINE_MM, opacity: 0.5, isLensColoured: false },
};

/**
 * The ring for a shape, or null for one the atlas resolves well enough to need none.
 *
 * The colour arrives already chosen for the surface the canvas is drawn on
 * (`describeFill` reads the palette for that surface), so this adds no palette
 * of its own and the ring follows the theme the fills follow.
 */
export function ringParamsFor(shape: Pick<SceneShape, 'fill' | 'colour' | 'sizeMark'>): RingParams | null {
  if (shape.sizeMark === 'mesh') return null;
  const look = RING_BY_FILL[shape.fill];
  const isPlaceOnly = shape.sizeMark === 'ring_only';
  return {
    colour: look.isLensColoured ? shape.colour : NEUTRAL_COLOUR,
    opacity: look.opacity,
    innerMm: RING_OUTER_MM - look.weightMm,
    outerMm: RING_OUTER_MM,
    arcs: look.arcs,
    dotMm: isPlaceOnly ? RING_DOT_MM : 0,
    reason: isPlaceOnly ? 'place_only' : 'coarse_outline',
  };
}

/** The brain outline and the head surface are context: they are never picked, so neither stands between the pointer and a shape inside it. */
export function isPickable(shape: Pick<SceneShape, 'layer'>): boolean {
  return shape.layer !== OUTLINE_LAYER && shape.layer !== DEVICES_LAYER;
}

/** Where the pointer is on the canvas, from -1 to 1 on each axis, with up positive. */
export function pointerToNdc(clientX: number, clientY: number, bounds: { left: number; top: number; width: number; height: number }): [number, number] {
  return [((clientX - bounds.left) / bounds.width) * 2 - 1, -(((clientY - bounds.top) / bounds.height) * 2 - 1)];
}

export interface PickHit {
  structureKey: string;
  /** Distance from the camera. */
  distance: number;
  fill: FillKind;
  isSelected: boolean;
  /** The hit lies on the hidden side of an open cut. */
  isHiddenByCut: boolean;
  /** Set when the hit is an electrode dot and not an atlas shape. */
  electrodeId?: string;
}

/** What a click landed on: an atlas shape, or an electrode dot, which is not a shape and selects no region. */
export type PickTarget = { kind: 'structure'; structureKey: string } | { kind: 'electrode'; electrodeId: string };

/**
 * Which shape a click means. A filled or selected shape under the pointer wins
 * over any see-through shape in front of it, so a deep structure can be picked
 * through the pale cortex; among see-through shapes the nearest wins. Nothing
 * on the hidden side of a cut can be picked.
 */
export function choosePick(hits: readonly PickHit[]): string | null {
  const visible = hits.filter((hit) => !hit.isHiddenByCut).sort((first, second) => first.distance - second.distance);
  const opaque = visible.find((hit) => hit.fill === 'solid' || hit.isSelected);
  return (opaque ?? visible[0])?.structureKey ?? null;
}

/**
 * What a click means once electrode dots are drawn. A dot is picked only when
 * it is the nearest thing under the pointer, so a dot on the far side of the
 * head is never picked through the brain. Otherwise the shapes decide, as before.
 */
export function choosePickTarget(hits: readonly PickHit[]): PickTarget | null {
  const visible = hits.filter((hit) => !hit.isHiddenByCut).sort((first, second) => first.distance - second.distance);
  const nearest = visible[0];
  if (nearest?.electrodeId !== undefined) return { kind: 'electrode', electrodeId: nearest.electrodeId };
  const structureKey = choosePick(hits.filter((hit) => hit.electrodeId === undefined));
  return structureKey === null ? null : { kind: 'structure', structureKey };
}

export interface Box { min: Point3; max: Point3 }

/** The one box around several boxes, or null for none: a region made of many shapes gets one selection mark around all of them. */
export function unionBoxes(boxes: readonly Box[]): Box | null {
  if (boxes.length === 0) return null;
  const pick = (side: 'min' | 'max', axis: number): number => Math[side](...boxes.map((box) => box[side][axis]));
  return { min: [pick('min', 0), pick('min', 1), pick('min', 2)], max: [pick('max', 0), pick('max', 1), pick('max', 2)] };
}

const subtract = (a: Point3, b: Point3): [number, number, number] => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Point3, b: Point3): [number, number, number] => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: Point3, b: Point3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a: Point3): [number, number, number] => { const length = Math.hypot(a[0], a[1], a[2]); return [a[0] / length, a[1] / length, a[2] / length]; };

export const ANATOMICAL_DIRECTIONS = ['left', 'right', 'front', 'back', 'top', 'bottom'] as const;
export type AnatomicalDirection = typeof ANATOMICAL_DIRECTIONS[number];
/** Where each anatomical direction points on screen: x to the right, y up, z towards the viewer, each from -1 to 1. */
export type AxisDirections = Readonly<Record<AnatomicalDirection, readonly [number, number, number]>>;

/** Each direction in scene axes: the brain's left is scene -x, its front is scene -z. */
const SCENE_AXES: Readonly<Record<AnatomicalDirection, Point3>> = { left: [-1, 0, 0], right: [1, 0, 0], front: [0, 0, -1], back: [0, 0, 1], top: [0, 1, 0], bottom: [0, -1, 0] };

/** Which way each anatomical direction points on screen for a camera pose, for the orientation marker. */
export function axisDirectionsFor(pose: OrbitPose): AxisDirections {
  const forward = unit(subtract(pose.target, positionOfPose(pose)));
  const right = unit(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  const project = (axis: Point3): [number, number, number] => [dot(axis, right), dot(axis, up), -dot(axis, forward)];
  return { left: project(SCENE_AXES.left), right: project(SCENE_AXES.right), front: project(SCENE_AXES.front), back: project(SCENE_AXES.back), top: project(SCENE_AXES.top), bottom: project(SCENE_AXES.bottom) };
}

/** How long a threat-model step's own marks take to appear, in place. Nothing moves, and under reduced motion nothing fades. */
export const STEP_EASE_MS = 450;
export function stepEaseDuration(prefersLessMotion: boolean): number {
  return prefersLessMotion ? 0 : STEP_EASE_MS;
}

/** The speed of the idle turn, in radians per millisecond: nothing under reduced motion. */
export function idleTurnSpeed(prefersLessMotion: boolean): number {
  return prefersLessMotion ? 0 : IDLE_RADIANS_PER_MS;
}
/** One slow turn takes about a minute: fast enough that the picture is seen to be a solid thing with depth, slow enough not to read as activity. */
export const IDLE_RADIANS_PER_MS = (Math.PI * 2) / 60_000;
