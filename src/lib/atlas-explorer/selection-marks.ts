/**
 * The selection's one mark, as arithmetic with no three.js in it: where a
 * selected box falls on the canvas, the corner brackets drawn around it, how
 * far the filled shapes around it dim, and the timing of all of that.
 *
 * Selection is a mark and never a fill. A lens decides how every shape is
 * filled; the brackets stand on the canvas in pixels, around whatever the lens
 * drew, so they read the same under a filled shape, a wireframe or a marker
 * ring, and the dim changes how strongly a shape is shown and never what it says.
 */

import type { OrbitPose } from './camera-views';
import { cameraBasis, dot, subtract, type Box } from './scene-drawing';

export interface ViewSize {
  widthPx: number;
  heightPx: number;
  fieldOfViewDegrees: number;
}

/** A rectangle on the canvas, in CSS pixels from its bottom left corner, y up. */
export interface ScreenRect {
  left: number;
  right: number;
  bottom: number;
  top: number;
}

/** How far the brackets stand off the box of what they mark. */
export const BRACKET_PAD_PX = 6;
export const BRACKET_ARM_PX = 16;
export const BRACKET_WEIGHT_PX = 2;
/** The contrasting edge around the ink, so the brackets hold over any fill and on either surface. */
export const BRACKET_HALO_PX = 1;
const ARMS_PER_CORNER = 2;
const CORNERS = 4;
const VERTICES_PER_QUAD = 6;
/** Four corners of two arms, each arm two triangles. */
export const BRACKET_VERTEX_COUNT = CORNERS * ARMS_PER_CORNER * VERTICES_PER_QUAD;
/** The opacity of a filled shape that is not selected, while something is. */
export const DIMMED_OPACITY = 0.35;
/** The same shape under the pointer: lifted enough to find, and short of full strength, so the selection stays the strongest mark. */
export const DIMMED_HOVER_OPACITY = 0.55;

/** Nearer than this a corner is at or behind the camera, and has no place on the canvas. */
const MIN_DEPTH_MM = 1;

/**
 * Where a box falls on the canvas: the rectangle around its eight projected
 * corners, from the same pose the camera is given.
 *
 * @returns null for a canvas with no size yet, or a box wholly behind the camera
 */
export function projectBox(box: Box, pose: OrbitPose, view: ViewSize): ScreenRect | null {
  if (view.widthPx <= 0 || view.heightPx <= 0) return null;
  const { eye, forward, right, up } = cameraBasis(pose);
  const focal = 1 / Math.tan((view.fieldOfViewDegrees * Math.PI) / 360);
  const aspect = view.widthPx / view.heightPx;
  const xs: number[] = [];
  const ys: number[] = [];
  for (const corner of [0, 1, 2, 3, 4, 5, 6, 7]) {
    const point = subtract([box[corner & 1 ? 'max' : 'min'][0], box[corner & 2 ? 'max' : 'min'][1], box[corner & 4 ? 'max' : 'min'][2]], eye);
    const depth = dot(point, forward);
    if (depth < MIN_DEPTH_MM) continue;
    xs.push((((dot(point, right) * focal) / (depth * aspect) + 1) / 2) * view.widthPx);
    ys.push((((dot(point, up) * focal) / depth + 1) / 2) * view.heightPx);
  }
  if (xs.length === 0) return null;
  return { left: Math.min(...xs), right: Math.max(...xs), bottom: Math.min(...ys), top: Math.max(...ys) };
}

/** The rectangle the brackets stand on: the box's, padded, and held on the canvas so a selection larger than the picture is still marked. */
export function padRect(rect: ScreenRect, padPx: number, view: ViewSize): ScreenRect {
  const inset = BRACKET_WEIGHT_PX + BRACKET_HALO_PX;
  const clamp = (value: number, size: number): number => Math.min(size - inset, Math.max(inset, value));
  return { left: clamp(rect.left - padPx, view.widthPx), right: clamp(rect.right + padPx, view.widthPx), bottom: clamp(rect.bottom - padPx, view.heightPx), top: clamp(rect.top + padPx, view.heightPx) };
}

function writeQuad(out: number[], left: number, bottom: number, right: number, top: number): void {
  out.push(left, bottom, 0, right, bottom, 0, right, top, 0, left, bottom, 0, right, top, 0, left, top, 0);
}

/**
 * The triangles of the brackets on these rectangles, as x, y, z in canvas
 * pixels. Each corner is two arms along the rectangle's sides, and the sides
 * between them stay open, so a bracket never reads as a box the data holds.
 *
 * @param growPx 0 for the ink; the halo's width for the halo, which then stands that far proud of the ink all round
 */
export function buildBracketPositions(rects: readonly ScreenRect[], growPx: number): Float32Array {
  const out: number[] = [];
  for (const rect of rects) {
    const arm = Math.min(BRACKET_ARM_PX, (rect.right - rect.left) / 2, (rect.top - rect.bottom) / 2) + growPx * 2;
    const weight = BRACKET_WEIGHT_PX + growPx * 2;
    const corners = [[rect.left - growPx, rect.bottom - growPx, 1, 1], [rect.right + growPx, rect.bottom - growPx, -1, 1], [rect.left - growPx, rect.top + growPx, 1, -1], [rect.right + growPx, rect.top + growPx, -1, -1]] as const;
    for (const [x, y, towardsX, towardsY] of corners) {
      writeQuad(out, Math.min(x, x + towardsX * arm), Math.min(y, y + towardsY * weight), Math.max(x, x + towardsX * arm), Math.max(y, y + towardsY * weight));
      writeQuad(out, Math.min(x, x + towardsX * weight), Math.min(y, y + towardsY * arm), Math.max(x, x + towardsX * weight), Math.max(y, y + towardsY * arm));
    }
  }
  return new Float32Array(out);
}

/* Motion. Every one of these follows a visitor's input, and none runs under reduced motion. */

export const LENS_RECOLOUR_MS = 280;
export const BRACKET_ENTRANCE_MS = 220;
export const DIM_MS = 180;
/** How far out the brackets start, beyond their pad, before they close on the box. */
const BRACKET_TRAVEL_PX = 14;
const NEWTON_STEPS = 8;
const NEWTON_TOLERANCE = 1e-5;

export function motionMs(durationMs: number, prefersLessMotion: boolean): number {
  return prefersLessMotion ? 0 : durationMs;
}

/** The CSS `cubic-bezier()` timing function, for the same curve in code that a stylesheet would write. */
export function cubicBezierEase(x1: number, y1: number, x2: number, y2: number): (progress: number) => number {
  const sample = (first: number, second: number, at: number): number => 3 * (1 - at) ** 2 * at * first + 3 * (1 - at) * at ** 2 * second + at ** 3;
  const slope = (first: number, second: number, at: number): number => 3 * (1 - at) ** 2 * first + 6 * (1 - at) * at * (second - first) + 3 * at ** 2 * (1 - second);
  return (progress) => {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    let at = progress;
    for (let step = 0; step < NEWTON_STEPS; step += 1) {
      const error = sample(x1, x2, at) - progress;
      const gradient = slope(x1, x2, at);
      if (Math.abs(error) < NEWTON_TOLERANCE || gradient === 0) break;
      at = Math.min(1, Math.max(0, at - error / gradient));
    }
    return sample(y1, y2, at);
  };
}

export const LENS_RECOLOUR_EASE = cubicBezierEase(0.22, 1, 0.36, 1);
export const BRACKET_ENTRANCE_EASE = cubicBezierEase(0.34, 1.56, 0.64, 1);

/** The pad at this point of the entrance: from further out, past the box a little, and back. */
export function entrancePadPx(progress: number): number {
  return BRACKET_PAD_PX + BRACKET_TRAVEL_PX * (1 - BRACKET_ENTRANCE_EASE(progress));
}

const HEX_RADIX = 16;
const CHANNEL_DIGITS = 2;
const CHANNEL_STARTS = [1, 3, 5] as const;

/** One ink on the way to another, channel by channel. Both are `#rrggbb`. */
export function mixColours(from: string, to: string, progress: number): string {
  const channel = (colour: string, start: number): number => Number.parseInt(colour.slice(start, start + CHANNEL_DIGITS), HEX_RADIX);
  const mixed = CHANNEL_STARTS.map((start) => Math.round(channel(from, start) + (channel(to, start) - channel(from, start)) * progress));
  return `#${mixed.map((value) => value.toString(HEX_RADIX).padStart(CHANNEL_DIGITS, '0')).join('')}`;
}
