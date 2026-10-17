import { describe, expect, it } from 'vitest';
import { rasToScene } from '@/lib/anatomy/ras-to-scene';
import {
  CAMERA_MOVE_MS, CAMERA_VIEW_IDS, CAMERA_VIEW_LABELS, DEFAULT_CAMERA_VIEW, MAX_DISTANCE_MM, MIN_DISTANCE_MM, blendPoses, planCameraMove, poseForView, positionOfPose,
  turnPose, zoomDistance,
} from '../camera-views';
import { clampSlice, listShapesCutAt, middleOf, slicePlane, stepSlice, type BoundsMm } from '../slice-plane';

const CENTRE = [0, 10, 20] as const;
const at = (viewId: Parameters<typeof poseForView>[0]) => positionOfPose(poseForView(viewId, CENTRE, 300));
const keeps = (plane: ReturnType<typeof slicePlane>, pointMm: readonly [number, number, number]): boolean => {
  const [x, y, z] = rasToScene(pointMm);
  return plane.normal[0] * x + plane.normal[1] * y + plane.normal[2] * z + plane.constant >= 0;
};

describe('camera views', () => {
  it('names every view and starts from behind and above, where the brain\'s left is on the viewer\'s left', () => {
    expect(CAMERA_VIEW_IDS.every((viewId) => CAMERA_VIEW_LABELS[viewId].length > 0)).toBe(true);
    expect(DEFAULT_CAMERA_VIEW).toBe('behind_above');
    const [x, y, z] = at('behind_above');
    expect(Math.abs(x - CENTRE[0])).toBeLessThan(1e-6);
    expect(y).toBeGreaterThan(CENTRE[1]);
    expect(z).toBeGreaterThan(CENTRE[2]);
  });

  it('puts the camera on the side each view is named for, at the distance asked', () => {
    expect(at('left')[0]).toBeLessThan(CENTRE[0] - 290);
    expect(at('right')[0]).toBeGreaterThan(CENTRE[0] + 290);
    expect(at('front')[2]).toBeLessThan(CENTRE[2] - 290);
    expect(at('back')[2]).toBeGreaterThan(CENTRE[2] + 290);
    expect(at('top')[1]).toBeGreaterThan(CENTRE[1] + 290);
    for (const viewId of CAMERA_VIEW_IDS) expect(Math.hypot(...at(viewId).map((value, axis) => value - CENTRE[axis]))).toBeCloseTo(300, 3);
  });

  it('moves at once under reduced motion and takes a moment otherwise', () => {
    expect(planCameraMove(true)).toEqual({ durationMs: 0 });
    expect(planCameraMove(false)).toEqual({ durationMs: CAMERA_MOVE_MS });
  });

  it('keeps zoom inside its range and never tilts through straight up or down', () => {
    expect(zoomDistance(MIN_DISTANCE_MM, 'in')).toBe(MIN_DISTANCE_MM);
    expect(zoomDistance(MAX_DISTANCE_MM, 'out')).toBe(MAX_DISTANCE_MM);
    expect(zoomDistance(200, 'in')).toBeLessThan(200);
    expect(zoomDistance(200, 'out')).toBeGreaterThan(200);
    const pose = poseForView('back', CENTRE, 300);
    expect(turnPose(pose, 0, -10).polar).toBeGreaterThan(0);
    expect(turnPose(pose, 0, 10).polar).toBeLessThan(Math.PI);
    expect(turnPose(pose, 0.5, 0).azimuth).toBeCloseTo(pose.azimuth + 0.5);
  });

  it('blends between two poses the shorter way round, ending exactly on the target', () => {
    const from = { ...poseForView('back', CENTRE, 300), azimuth: 3 };
    const to = { ...poseForView('back', CENTRE, 200), azimuth: -3 };
    expect(blendPoses(from, to, 0)).toMatchObject({ azimuth: 3, distance: 300 });
    expect(blendPoses(from, to, 0.5).azimuth).toBeGreaterThan(3);
    expect(blendPoses(from, to, 1).distance).toBe(200);
    expect(Math.cos(blendPoses(from, to, 1).azimuth)).toBeCloseTo(Math.cos(-3));
  });
});

describe('slice plane', () => {
  const bounds: BoundsMm = { min: [-70, -105, -70], max: [70, 72, 80] };

  it('keeps what lies before the cut and hides what lies beyond it, on each axis', () => {
    const frontCut = slicePlane({ axis: 'back_front', positionMm: 10 });
    expect(keeps(frontCut, [0, -40, 0])).toBe(true);
    expect(keeps(frontCut, [0, 40, 0])).toBe(false);
    const sideCut = slicePlane({ axis: 'left_right', positionMm: 0 });
    expect(keeps(sideCut, [-30, 0, 0])).toBe(true);
    expect(keeps(sideCut, [30, 0, 0])).toBe(false);
    const topCut = slicePlane({ axis: 'bottom_top', positionMm: -5 });
    expect(keeps(topCut, [0, 0, -20])).toBe(true);
    expect(keeps(topCut, [0, 0, 20])).toBe(false);
  });

  it('never leaves what is drawn', () => {
    expect(clampSlice('back_front', 500, bounds)).toBe(72);
    expect(clampSlice('left_right', -500, bounds)).toBe(-70);
    expect(stepSlice({ axis: 'bottom_top', positionMm: 78 }, 1, bounds)).toEqual({ axis: 'bottom_top', positionMm: 80 });
    expect(stepSlice({ axis: 'bottom_top', positionMm: 0 }, -1, bounds)).toEqual({ axis: 'bottom_top', positionMm: -5 });
    expect(middleOf('bottom_top', bounds)).toBe(5);
  });

  it('lists the shapes the cut passes through, so the slice can be read as text', () => {
    const shapes = [{ name: 'front', boundsMm: { min: [0, 20, 0], max: [5, 40, 5] } }, { name: 'back', boundsMm: { min: [0, -60, 0], max: [5, -30, 5] } }] as const;
    expect(listShapesCutAt({ axis: 'back_front', positionMm: 30 }, shapes).map((shape) => shape.name)).toEqual(['front']);
    expect(listShapesCutAt({ axis: 'back_front', positionMm: 0 }, shapes)).toEqual([]);
    expect(listShapesCutAt({ axis: 'left_right', positionMm: 2 }, shapes)).toHaveLength(2);
  });
});
