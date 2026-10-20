/**
 * Every decision the drawing code makes, as plain data and arithmetic with no
 * three.js in it, so each can be tested: what material a shape gets, what may
 * be picked, which of several shapes under the pointer a pick means, where the
 * pointer is, which way each anatomical direction points on screen, and the
 * selection mark.
 *
 * The selection mark is corner brackets around the shape's box: line segments
 * only. It paints nothing inside the shape, whatever the shape's fill, so a
 * selected shape can never read as filled.
 */

import type { Point3 } from '@/lib/anatomy/ras-to-scene';
import { positionOfPose, type OrbitPose } from './camera-views';
import { NEUTRAL_COLOUR, type FillKind, type SceneShape } from './scene-shapes';

/**
 * Selection is a state, not a category, so it wears neutral ink rather than a
 * hue. The previous orange sat at 2:1 against the light surface, under the 3:1
 * floor, and it now shares a hue family with bands N3-N1, where it could read
 * as a band rather than as "this one is selected". No band is neutral, so this
 * cannot be mistaken for one.
 */
export const SELECTION_COLOUR = '#1a1a19';
/** The same role stepped for the dark surface. */
export const SELECTION_COLOUR_DARK = '#fcfcfb';
/** Pale shapes are darker and denser than context shapes, so "somewhere inside this shape" is legible across the whole brain. */
export const INSIDE_COLOUR = '#5b6170';
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

/** Fills first, then see-through things, then the brain outline over them. */
export const DRAW_ORDER = { fill: 0, seeThrough: 1, brainOutline: 2, mark: 3 } as const;
export const FILL_OPACITY: Readonly<Record<FillKind, number>> = { solid: 1, translucent: 0.4, lines: 0.2, neutral: 0.14 };
export const BRAIN_OUTLINE_OPACITY = 0.1;
export const HEAD_SURFACE_OPACITY = 0.07;

/** @param isCut with a cut open, a filled shape shows its own inside in its own colour, not what lies behind it */
export function materialParamsFor(shape: Pick<SceneShape, 'layer' | 'fill' | 'colour'>, isCut: boolean): MaterialParams {
  if (shape.layer === OUTLINE_LAYER) {
    return { shading: 'lit', colour: NEUTRAL_COLOUR, opacity: BRAIN_OUTLINE_OPACITY, isWireframe: false, isDoubleSided: true, writesDepth: false, drawOrder: DRAW_ORDER.brainOutline };
  }
  if (shape.layer === DEVICES_LAYER) {
    return { shading: 'lit', colour: NEUTRAL_COLOUR, opacity: HEAD_SURFACE_OPACITY, isWireframe: false, isDoubleSided: false, writesDepth: false, drawOrder: DRAW_ORDER.brainOutline };
  }
  if (shape.fill === 'solid') return { shading: 'lit', colour: shape.colour, opacity: FILL_OPACITY.solid, isWireframe: false, isDoubleSided: isCut, writesDepth: true, drawOrder: DRAW_ORDER.fill };
  if (shape.fill === 'lines') return { shading: 'flat', colour: NEUTRAL_COLOUR, opacity: FILL_OPACITY.lines, isWireframe: true, isDoubleSided: false, writesDepth: false, drawOrder: DRAW_ORDER.seeThrough };
  const colour = shape.fill === 'translucent' ? INSIDE_COLOUR : NEUTRAL_COLOUR;
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

export interface HoverParams {
  opacity: number;
  /** Zero for every see-through fill, which is lifted by opacity alone. */
  emissiveIntensity: number;
}

export function hoverParamsFor(shape: Pick<SceneShape, 'fill'>): HoverParams {
  return { opacity: HOVER_OPACITY[shape.fill], emissiveIntensity: shape.fill === 'solid' ? HOVER_EMISSIVE_INTENSITY : 0 };
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

/** The share of each box edge a corner bracket runs along. */
const BRACKET_SHARE = 0.22;
/** How far outside the shape's box the brackets stand, in millimetres, so they never touch its surface. */
const BRACKET_MARGIN_MM = 1.5;

/**
 * The selection mark: three short lines at each corner of the shape's box, as
 * pairs of end points (x, y, z, x, y, z per line). Lines only, for every fill.
 */
export function selectionBrackets(min: Point3, max: Point3): number[] {
  const low = [min[0] - BRACKET_MARGIN_MM, min[1] - BRACKET_MARGIN_MM, min[2] - BRACKET_MARGIN_MM];
  const high = [max[0] + BRACKET_MARGIN_MM, max[1] + BRACKET_MARGIN_MM, max[2] + BRACKET_MARGIN_MM];
  const segments: number[] = [];
  for (const corner of [0, 1, 2, 3, 4, 5, 6, 7]) {
    const at = [0, 1, 2].map((axis) => ((corner >> axis) & 1) === 1 ? high[axis] : low[axis]);
    for (const axis of [0, 1, 2]) {
      const end = [...at];
      const reach = (high[axis] - low[axis]) * BRACKET_SHARE;
      end[axis] += at[axis] === low[axis] ? reach : -reach;
      segments.push(...at, ...end);
    }
  }
  return segments;
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
/** One slow turn takes about two minutes: enough to show depth, too slow to suggest activity. */
export const IDLE_RADIANS_PER_MS = (Math.PI * 2) / 120_000;
