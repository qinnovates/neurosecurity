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

/** Where the camera is, as angles around a point: turning left or right is `azimuth`, tilting is `polar` (0 is straight above). */
export interface OrbitPose {
  azimuth: number;
  polar: number;
  distance: number;
  target: Point3;
}

/** The camera never reaches straight above or below, where "up" would flip. */
const MIN_POLAR = 0.05;
const MAX_POLAR = Math.PI - MIN_POLAR;
const FULL_TURN = Math.PI * 2;
export const ORBIT_STEP_RADIANS = Math.PI / 12;

export function poseForView(viewId: CameraViewId, target: Point3, distance: number): OrbitPose {
  const [x, y, z] = normalise(VIEW_DIRECTIONS[viewId]);
  return { azimuth: Math.atan2(x, z), polar: Math.min(MAX_POLAR, Math.max(MIN_POLAR, Math.acos(y))), distance: clampDistance(distance), target };
}

export function positionOfPose(pose: OrbitPose): [number, number, number] {
  const ring = Math.sin(pose.polar) * pose.distance;
  return [pose.target[0] + ring * Math.sin(pose.azimuth), pose.target[1] + Math.cos(pose.polar) * pose.distance, pose.target[2] + ring * Math.cos(pose.azimuth)];
}

export function turnPose(pose: OrbitPose, azimuthBy: number, polarBy: number): OrbitPose {
  return { ...pose, azimuth: pose.azimuth + azimuthBy, polar: Math.min(MAX_POLAR, Math.max(MIN_POLAR, pose.polar + polarBy)) };
}

/** The pose a share `progress` (0 to 1) of the way from one to another, turning the shorter way round. */
export function blendPoses(from: OrbitPose, to: OrbitPose, progress: number): OrbitPose {
  const turn = ((to.azimuth - from.azimuth + Math.PI) % FULL_TURN + FULL_TURN) % FULL_TURN - Math.PI;
  const mix = (start: number, end: number): number => start + (end - start) * progress;
  return {
    azimuth: from.azimuth + turn * progress,
    polar: mix(from.polar, to.polar),
    distance: mix(from.distance, to.distance),
    target: [mix(from.target[0], to.target[0]), mix(from.target[1], to.target[1]), mix(from.target[2], to.target[2])],
  };
}
