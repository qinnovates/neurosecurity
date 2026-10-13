/**
 * The named views of the 3D scene and how the camera gets to one. Directions
 * are in scene axes (x right, y up, z towards the viewer), so "from behind"
 * keeps the brain's left on the viewer's left.
 */

import type { Point3 } from '@/lib/anatomy/ras-to-scene';

export const CAMERA_VIEW_IDS = ['behind_above', 'left', 'right', 'front', 'back', 'top'] as const;
export type CameraViewId = typeof CAMERA_VIEW_IDS[number];

export const DEFAULT_CAMERA_VIEW: CameraViewId = 'behind_above';

export const CAMERA_VIEW_LABELS: Readonly<Record<CameraViewId, string>> = {
  behind_above: 'From behind and above',
  left: 'Left side',
  right: 'Right side',
  front: 'Front',
  back: 'Back',
  top: 'Top',
};

/** Where the camera sits, as a direction from the brain's centre. The top view tilts a hair back so "up" stays defined. */
const VIEW_DIRECTIONS: Readonly<Record<CameraViewId, Point3>> = {
  behind_above: [0, 0.45, 1],
  left: [-1, 0, 0],
  right: [1, 0, 0],
  front: [0, 0, -1],
  back: [0, 0, 1],
  top: [0, 1, 0.001],
};

export const CAMERA_MOVE_MS = 450;
export const ZOOM_STEP = 1.25;
export const MIN_DISTANCE_MM = 60;
export const MAX_DISTANCE_MM = 600;
export const DEFAULT_DISTANCE_MM = 330;

function normalise([x, y, z]: Point3): [number, number, number] {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
}

/** The camera's position for a view: `distance` millimetres from `centre` along the view's direction. */
export function cameraPositionFor(viewId: CameraViewId, centre: Point3, distance: number): [number, number, number] {
  const direction = normalise(VIEW_DIRECTIONS[viewId]);
  return [centre[0] + direction[0] * distance, centre[1] + direction[1] * distance, centre[2] + direction[2] * distance];
}

/** How long a camera move takes. With reduced motion the view changes at once. */
export function planCameraMove(prefersLessMotion: boolean): { durationMs: number } {
  return { durationMs: prefersLessMotion ? 0 : CAMERA_MOVE_MS };
}

export function clampDistance(distance: number): number {
  return Math.min(MAX_DISTANCE_MM, Math.max(MIN_DISTANCE_MM, distance));
}

/** One zoom step in or out, kept inside the range where the brain is neither a dot nor behind the camera. */
export function zoomDistance(distance: number, direction: 'in' | 'out'): number {
  return clampDistance(direction === 'in' ? distance / ZOOM_STEP : distance * ZOOM_STEP);
}
