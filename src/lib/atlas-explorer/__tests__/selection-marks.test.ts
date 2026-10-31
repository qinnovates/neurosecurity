import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { positionOfPose, type OrbitPose } from '../camera-views';
import type { Box } from '../scene-drawing';
import {
  BRACKET_ARM_PX, BRACKET_ENTRANCE_EASE, BRACKET_ENTRANCE_MS, BRACKET_PAD_PX, BRACKET_VERTEX_COUNT, BRACKET_WEIGHT_PX, DIMMED_HOVER_OPACITY, DIMMED_OPACITY, DIM_MS, LENS_RECOLOUR_EASE, LENS_RECOLOUR_MS,
  buildBracketPositions, cubicBezierEase, entrancePadPx, mixColours, motionMs, padRect, projectBox, type ScreenRect, type ViewSize,
} from '../selection-marks';

const VIEW: ViewSize = { widthPx: 800, heightPx: 500, fieldOfViewDegrees: 32 };
const POSE: OrbitPose = { azimuth: 0.7, polar: 1.1, distance: 420, target: [4, -6, 12] };
const BOX: Box = { min: [-30, -10, 5], max: [12, 25, 44] };

function cornersOf(box: Box): Array<[number, number, number]> {
  return [0, 1, 2, 3, 4, 5, 6, 7].map((bits) => [box[bits & 1 ? 'max' : 'min'][0], box[bits & 2 ? 'max' : 'min'][1], box[bits & 4 ? 'max' : 'min'][2]]);
}

/** Where three.js itself puts the box, in pixels with y up, from the same pose the renderer gives its camera. */
function projectWithThree(box: Box, pose: OrbitPose, view: ViewSize): ScreenRect {
  const camera = new PerspectiveCamera(view.fieldOfViewDegrees, view.widthPx / view.heightPx, 5, 2000);
  const [x, y, z] = positionOfPose(pose);
  camera.position.set(x, y, z);
  camera.lookAt(pose.target[0], pose.target[1], pose.target[2]);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  const points = cornersOf(box).map(([px, py, pz]) => new Vector3(px, py, pz).project(camera));
  const toX = (ndc: number): number => ((ndc + 1) / 2) * view.widthPx;
  const toY = (ndc: number): number => ((ndc + 1) / 2) * view.heightPx;
  return { left: toX(Math.min(...points.map((point) => point.x))), right: toX(Math.max(...points.map((point) => point.x))), bottom: toY(Math.min(...points.map((point) => point.y))), top: toY(Math.max(...points.map((point) => point.y))) };
}

describe('projectBox', () => {
  it('lands exactly where three.js projects the same box from the same pose, so the brackets frame what is drawn', () => {
    for (const pose of [POSE, { ...POSE, azimuth: -2.2, polar: 0.4 }, { ...POSE, distance: 180, target: [0, 0, 0] as const }]) {
      const ours = projectBox(BOX, pose, VIEW);
      const theirs = projectWithThree(BOX, pose, VIEW);
      expect(ours?.left).toBeCloseTo(theirs.left, 3);
      expect(ours?.right).toBeCloseTo(theirs.right, 3);
      expect(ours?.bottom).toBeCloseTo(theirs.bottom, 3);
      expect(ours?.top).toBeCloseTo(theirs.top, 3);
    }
  });

  it('gives nothing for a box wholly behind the camera, or for a canvas with no size yet', () => {
    const [x, y, z] = positionOfPose(POSE);
    const behind: Box = { min: [x * 2, y * 2, z * 2], max: [x * 2 + 1, y * 2 + 1, z * 2 + 1] };
    expect(projectBox(behind, POSE, VIEW)).toBeNull();
    expect(projectBox(BOX, POSE, { ...VIEW, widthPx: 0 })).toBeNull();
  });
});

describe('padRect', () => {
  it('stands six pixels off the projected box on every side', () => {
    expect(BRACKET_PAD_PX).toBe(6);
    expect(padRect({ left: 100, right: 200, bottom: 100, top: 180 }, BRACKET_PAD_PX, VIEW)).toEqual({ left: 94, right: 206, bottom: 94, top: 186 });
  });

  it('stays on the canvas, so a selection larger than the picture is still marked', () => {
    const rect = padRect({ left: -300, right: 2000, bottom: -40, top: 900 }, BRACKET_PAD_PX, VIEW);
    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.bottom).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(VIEW.widthPx);
    expect(rect.top).toBeLessThanOrEqual(VIEW.heightPx);
  });
});

describe('buildBracketPositions', () => {
  const RECT: ScreenRect = { left: 100, right: 300, bottom: 100, top: 260 };
  const extent = (positions: Float32Array, axis: number): [number, number] => {
    const values = Array.from(positions).filter((_value, at) => at % 3 === axis);
    return [Math.min(...values), Math.max(...values)];
  };

  it('draws four corners of two arms each, one group of triangles per rectangle', () => {
    expect(BRACKET_VERTEX_COUNT).toBe(48);
    expect(buildBracketPositions([RECT], 0)).toHaveLength(BRACKET_VERTEX_COUNT * 3);
    expect(buildBracketPositions([RECT, RECT], 0)).toHaveLength(BRACKET_VERTEX_COUNT * 6);
    expect(buildBracketPositions([], 0)).toHaveLength(0);
  });

  it('marks the corners and leaves the sides open: nothing in the middle of an edge', () => {
    const positions = buildBracketPositions([RECT], 0);
    expect(extent(positions, 0)).toEqual([100, 300]);
    expect(extent(positions, 1)).toEqual([100, 260]);
    const xs = Array.from(positions).filter((_value, at) => at % 3 === 0);
    expect(xs.filter((x) => x > 100 + BRACKET_ARM_PX && x < 300 - BRACKET_ARM_PX)).toEqual([]);
  });

  it('grows by the halo on every side and along every arm, so the halo stands one pixel proud of the ink all round', () => {
    const halo = buildBracketPositions([RECT], 1);
    expect(extent(halo, 0)).toEqual([99, 301]);
    expect(extent(halo, 1)).toEqual([99, 261]);
    const ink = Array.from(buildBracketPositions([RECT], 0)).filter((_value, at) => at % 3 === 0);
    expect(new Set(ink).has(100 + BRACKET_WEIGHT_PX)).toBe(true);
  });

  it('keeps the arms of a small box from crossing', () => {
    const tiny: ScreenRect = { left: 50, right: 60, bottom: 50, top: 58 };
    const positions = buildBracketPositions([tiny], 0);
    const xs = Array.from(positions).filter((_value, at) => at % 3 === 0);
    expect(Math.max(...xs.filter((x) => x < 55))).toBeLessThanOrEqual(55);
  });
});

describe('the motion of a selection', () => {
  it('runs for the stated times, and for no time at all under reduced motion', () => {
    expect([LENS_RECOLOUR_MS, BRACKET_ENTRANCE_MS, DIM_MS]).toEqual([280, 220, 180]);
    for (const duration of [LENS_RECOLOUR_MS, BRACKET_ENTRANCE_MS, DIM_MS]) {
      expect(motionMs(duration, false)).toBe(duration);
      expect(motionMs(duration, true)).toBe(0);
    }
  });

  it('starts and ends where a CSS cubic-bezier does', () => {
    const ease = cubicBezierEase(0.25, 0.1, 0.25, 1);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    // Published value of the CSS "ease" curve at the midpoint of time.
    expect(ease(0.5)).toBeCloseTo(0.8024, 3);
  });

  it('lets the lens ease settle without overshoot, and the bracket ease overshoot and come back', () => {
    const samples = (ease: (progress: number) => number): number[] => Array.from({ length: 101 }, (_unused, at) => ease(at / 100));
    expect(Math.max(...samples(LENS_RECOLOUR_EASE))).toBeLessThanOrEqual(1);
    expect(Math.max(...samples(BRACKET_ENTRANCE_EASE))).toBeGreaterThan(1.02);
    expect(BRACKET_ENTRANCE_EASE(1)).toBe(1);
  });

  it('closes the brackets on the box from further out, ending at the stated pad', () => {
    expect(entrancePadPx(1)).toBe(BRACKET_PAD_PX);
    expect(entrancePadPx(0)).toBeGreaterThan(BRACKET_PAD_PX);
  });

  it('mixes two inks channel by channel', () => {
    expect(mixColours('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixColours('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mixColours('#000000', '#ff8000', 0.5)).toBe('#804000');
  });

  it('dims to the stated level, and lets the pointer lift a dimmed shape without reaching full strength', () => {
    expect(DIMMED_OPACITY).toBe(0.35);
    expect(DIMMED_HOVER_OPACITY).toBeGreaterThan(DIMMED_OPACITY);
    expect(DIMMED_HOVER_OPACITY).toBeLessThan(1);
  });
});
