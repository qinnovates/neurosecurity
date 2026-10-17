/**
 * The slice view: one flat cut through everything drawn, along one of the
 * atlas's three axes. Positions are millimetres in the atlas's own axes; the
 * plane handed to the renderer is in scene axes.
 */

import { rasToScene, type Point3 } from '@/lib/anatomy/ras-to-scene';

export const SLICE_AXES = ['left_right', 'back_front', 'bottom_top'] as const;
export type SliceAxis = typeof SLICE_AXES[number];

export const SLICE_AXIS_LABELS: Readonly<Record<SliceAxis, string>> = {
  left_right: 'Left to right',
  back_front: 'Back to front',
  bottom_top: 'Bottom to top',
};

export interface BoundsMm {
  min: Point3;
  max: Point3;
}

export interface SliceState {
  axis: SliceAxis;
  positionMm: number;
}

export const SLICE_STEP_MM = 5;
const AXIS_INDEX: Readonly<Record<SliceAxis, number>> = { left_right: 0, back_front: 1, bottom_top: 2 };
const AXIS_UNIT: Readonly<Record<SliceAxis, Point3>> = { left_right: [1, 0, 0], back_front: [0, 1, 0], bottom_top: [0, 0, 1] };

/** A position kept inside what is drawn, so the cut can never leave the brain and show nothing. */
export function clampSlice(axis: SliceAxis, positionMm: number, bounds: BoundsMm): number {
  const index = AXIS_INDEX[axis];
  return Math.min(bounds.max[index], Math.max(bounds.min[index], positionMm));
}

export function stepSlice(slice: SliceState, direction: -1 | 1, bounds: BoundsMm): SliceState {
  return { axis: slice.axis, positionMm: clampSlice(slice.axis, slice.positionMm + direction * SLICE_STEP_MM, bounds) };
}

/** The middle of the drawn volume along an axis: where a newly opened slice starts. */
export function middleOf(axis: SliceAxis, bounds: BoundsMm): number {
  const index = AXIS_INDEX[axis];
  return Math.round((bounds.min[index] + bounds.max[index]) / 2);
}

/**
 * The cut as a plane in scene axes: everything on the far side of `positionMm`
 * along the axis is hidden. A point p is kept when dot(normal, p) + constant >= 0.
 */
export function slicePlane(slice: SliceState): { normal: [number, number, number]; constant: number } {
  const [x, y, z] = rasToScene(AXIS_UNIT[slice.axis]);
  return { normal: [-x || 0, -y || 0, -z || 0], constant: slice.positionMm };
}

/** The shapes the cut passes through, so the slice has a text equivalent. */
export function listShapesCutAt<Shape extends { boundsMm: BoundsMm }>(slice: SliceState, shapes: readonly Shape[]): Shape[] {
  const index = AXIS_INDEX[slice.axis];
  return shapes.filter((shape) => shape.boundsMm.min[index] <= slice.positionMm && shape.boundsMm.max[index] >= slice.positionMm);
}
