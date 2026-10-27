import { describe, expect, it } from 'vitest';
import { poseForView, turnPose } from '../camera-views';
import {
  BRAIN_OUTLINE_OPACITY, DRAW_ORDER, FILL_OPACITY, IDLE_RADIANS_PER_MS, INSIDE_COLOUR, RING_OUTER_MM, SELECTION_COLOUR, axisDirectionsFor, choosePick, idleTurnSpeed,
  isPickable, materialParamsFor, pointerToNdc, ringParamsFor, selectionBrackets, type PickHit, type RingParams,
} from '../scene-drawing';
import { FILL_KINDS, NEUTRAL_COLOUR, NISS_COLOURS, NISS_COLOURS_DARK, SIZE_MARKS } from '../scene-shapes';

const shape = (fill: (typeof FILL_KINDS)[number], layer = 'cortical', colour = '#123456') => ({ fill, layer: layer as 'cortical', colour });
const hit = (structureKey: string, distance: number, overrides: Partial<PickHit> = {}): PickHit => ({ structureKey, distance, fill: 'translucent', isSelected: false, isHiddenByCut: false, ...overrides });

describe('materialParamsFor', () => {
  it('gives a filled shape its step colour, opaque, and every other fill a neutral, see-through look', () => {
    expect(materialParamsFor(shape('solid'), false, 'light')).toMatchObject({ colour: '#123456', opacity: 1, isWireframe: false, writesDepth: true, shading: 'lit' });
    expect(materialParamsFor(shape('translucent'), false, 'light')).toMatchObject({ colour: INSIDE_COLOUR, opacity: FILL_OPACITY.translucent, isWireframe: false, writesDepth: false });
    expect(materialParamsFor(shape('lines'), false, 'light')).toMatchObject({ colour: NEUTRAL_COLOUR, isWireframe: true, shading: 'flat' });
    expect(materialParamsFor(shape('neutral'), false, 'light')).toMatchObject({ colour: NEUTRAL_COLOUR, opacity: FILL_OPACITY.neutral });
  });

  it('never lets a see-through fill reach full opacity or take the lens colour, so only a filled shape reads as filled', () => {
    for (const fill of FILL_KINDS.filter((kind) => kind !== 'solid')) {
      const params = materialParamsFor(shape(fill), false, 'light');
      expect(params.opacity, fill).toBeLessThan(0.5);
      expect(params.colour, fill).not.toBe('#123456');
      expect(params.colour, fill).not.toBe(SELECTION_COLOUR);
    }
    expect(FILL_OPACITY.translucent).toBeGreaterThan(FILL_OPACITY.neutral);
    expect(INSIDE_COLOUR).not.toBe(NEUTRAL_COLOUR);
  });

  it('draws the brain outline faint, two-sided and neutral whatever fill it is given', () => {
    for (const fill of FILL_KINDS) expect(materialParamsFor(shape(fill, 'outline'), false, 'light')).toMatchObject({ colour: NEUTRAL_COLOUR, opacity: BRAIN_OUTLINE_OPACITY, isDoubleSided: true, writesDepth: false });
  });

  it('shows a filled shape\'s own inside under a cut, and only then', () => {
    expect(materialParamsFor(shape('solid'), true, 'light').isDoubleSided).toBe(true);
    expect(materialParamsFor(shape('solid'), false, 'light').isDoubleSided).toBe(false);
  });
});

describe('picking', () => {
  it('never picks the brain outline, and picks every other layer', () => {
    expect(isPickable({ layer: 'outline' })).toBe(false);
    expect(isPickable({ layer: 'cortical' })).toBe(true);
    expect(isPickable({ layer: 'deep' })).toBe(true);
  });

  it('maps the pointer to the canvas with up positive', () => {
    const bounds = { left: 100, top: 50, width: 200, height: 100 };
    expect(pointerToNdc(100, 50, bounds)).toEqual([-1, 1]);
    expect(pointerToNdc(300, 150, bounds)).toEqual([1, -1]);
    expect(pointerToNdc(200, 100, bounds)).toEqual([0, -0]);
    expect(pointerToNdc(200, 60, bounds)[1]).toBeGreaterThan(0);
  });

  it('picks a filled or selected shape through the pale shapes in front of it, and the nearest otherwise', () => {
    expect(choosePick([hit('pale-cortex', 10), hit('deep-filled', 40, { fill: 'solid' })])).toBe('deep-filled');
    expect(choosePick([hit('pale-cortex', 10), hit('selected-pale', 30, { isSelected: true })])).toBe('selected-pale');
    expect(choosePick([hit('far', 50), hit('near', 10, { fill: 'lines' })])).toBe('near');
    expect(choosePick([hit('near-filled', 10, { fill: 'solid' }), hit('far-filled', 40, { fill: 'solid' })])).toBe('near-filled');
    expect(choosePick([])).toBeNull();
  });

  it('never picks through a cut: a hit on the hidden side is ignored', () => {
    expect(choosePick([hit('hidden', 10, { fill: 'solid', isHiddenByCut: true }), hit('shown', 30)])).toBe('shown');
    expect(choosePick([hit('hidden', 10, { isHiddenByCut: true })])).toBeNull();
  });
});

describe('axisDirectionsFor', () => {
  const centre = [0, 0, 0] as const;

  it('puts the brain\'s left on the viewer\'s left from behind, and on the right from the front', () => {
    const behind = axisDirectionsFor(poseForView('back', centre, 300));
    expect(behind.left[0]).toBeCloseTo(-1);
    expect(behind.right[0]).toBeCloseTo(1);
    expect(behind.top[1]).toBeCloseTo(1);
    expect(behind.back[2]).toBeCloseTo(1);
    const front = axisDirectionsFor(poseForView('front', centre, 300));
    expect(front.left[0]).toBeCloseTo(1);
    expect(front.right[0]).toBeCloseTo(-1);
  });

  it('turns with the camera and keeps opposite directions opposite', () => {
    const turned = axisDirectionsFor(turnPose(poseForView('back', centre, 300), Math.PI / 2, 0));
    expect(Math.abs(turned.left[0])).toBeLessThan(1e-6);
    for (const [one, other] of [['left', 'right'], ['front', 'back'], ['top', 'bottom']] as const) {
      expect(turned[one].map((value) => -value).map((value) => Number(value.toFixed(6)))).toEqual(turned[other].map((value) => Number(value.toFixed(6))));
    }
  });
});

describe('the selection mark', () => {
  it('is corner brackets: 24 short lines outside the shape\'s box, the same for every fill, with nothing inside it', () => {
    const segments = selectionBrackets([0, 0, 0], [10, 20, 30]);
    expect(segments).toHaveLength(24 * 6);
    const points = Array.from({ length: segments.length / 3 }, (_unused, index) => segments.slice(index * 3, index * 3 + 3));
    // Every end point lies on the surface of the padded box: no line crosses the inside of the shape.
    const onFace = (point: number[]): boolean => point.some((value, axis) => value === -1.5 || value === [10, 20, 30][axis] + 1.5);
    expect(points.every(onFace)).toBe(true);
    // Lines only: each segment runs along one axis, so the mark has no area to fill.
    for (let line = 0; line < points.length; line += 2) expect(points[line].filter((value, axis) => value !== points[line + 1][axis])).toHaveLength(1);
  });

  it('uses a colour no fill uses', () => {
    expect([NEUTRAL_COLOUR, INSIDE_COLOUR]).not.toContain(SELECTION_COLOUR);
  });
});

describe('ringParamsFor', () => {
  const ring = (fill: (typeof FILL_KINDS)[number], sizeMark: (typeof SIZE_MARKS)[number], colour = NISS_COLOURS.critical): RingParams => {
    const params = ringParamsFor({ fill, sizeMark, colour });
    if (params === null) throw new Error(`no ring for ${fill} ${sizeMark}`);
    return params;
  };
  /** Everything about a ring except its colour: how much of it is drawn, how heavily, and whether it has a centre. */
  const shapeOf = (params: RingParams): string =>
    [params.arcs.length, params.arcs.reduce((total, [, length]) => total + length, 0).toFixed(3), (params.outerMm - params.innerMm).toFixed(3), params.dotMm].join('/');

  it('draws no ring for a structure the atlas resolves well enough', () => {
    for (const fill of FILL_KINDS) expect(ringParamsFor({ fill, sizeMark: 'mesh', colour: NISS_COLOURS.high }), fill).toBeNull();
    for (const sizeMark of SIZE_MARKS.filter((mark) => mark !== 'mesh')) expect(ringParamsFor({ fill: 'solid', sizeMark, colour: NISS_COLOURS.high })).not.toBeNull();
  });

  it('gives a ring on a filled shape the lens\'s own step colour, on either surface, and a whole closed band', () => {
    for (const sizeMark of ['mesh_and_ring', 'ring_only'] as const) {
      for (const colour of [NISS_COLOURS.critical, NISS_COLOURS_DARK.critical, NISS_COLOURS.none, NISS_COLOURS_DARK.none]) {
        const params = ring('solid', sizeMark, colour);
        expect(params.colour, `${sizeMark} ${colour}`).toBe(colour);
        expect(params.opacity).toBe(1);
        expect(params.arcs).toEqual([[0, Math.PI * 2]]);
      }
    }
  });

  it('is neutral exactly when the lens holds nothing for the shape, like the mesh, and never carries a step colour then', () => {
    for (const fill of FILL_KINDS.filter((kind) => kind !== 'solid')) {
      const params = ring(fill, 'ring_only');
      expect(params.colour, fill).toBe(NEUTRAL_COLOUR);
      expect(params.colour, fill).not.toBe(NISS_COLOURS.critical);
      expect(params.colour, fill).not.toBe(INSIDE_COLOUR);
      expect(params.colour, fill).not.toBe(SELECTION_COLOUR);
    }
  });

  it('tells every lens state apart without colour: no two states differ in colour alone', () => {
    const shapes = FILL_KINDS.map((fill) => ({ fill, drawn: shapeOf(ring(fill, 'ring_only')) }));
    expect(new Set(shapes.map((entry) => entry.drawn)).size, JSON.stringify(shapes)).toBe(FILL_KINDS.length);
    // Only a shape the lens fills gets the whole turn: a broken ring is the mark of a lens that holds nothing.
    for (const fill of FILL_KINDS) expect(ring(fill, 'ring_only').arcs.length === 1, fill).toBe(fill === 'solid');
  });

  it('keeps the ring\'s weight in the order the mesh\'s fills are, and never lets it fade out of sight', () => {
    const opacity = (fill: (typeof FILL_KINDS)[number]): number => ring(fill, 'ring_only').opacity;
    expect(opacity('solid')).toBeGreaterThan(opacity('translucent'));
    expect(opacity('translucent')).toBeGreaterThan(opacity('lines'));
    expect(opacity('lines')).toBeGreaterThan(opacity('neutral'));
    // A hairline needs more of its colour than a filled surface to carry the same weight, so the floor is above the mesh's.
    for (const fill of FILL_KINDS) expect(opacity(fill), fill).toBeGreaterThanOrEqual(FILL_OPACITY[fill]);
    expect(FILL_OPACITY.translucent).toBeGreaterThan(FILL_OPACITY.neutral);
  });

  it('tells a coarse outline from no outline at all by the centre, not by the ring\'s size', () => {
    const coarse = ring('solid', 'mesh_and_ring');
    const place = ring('solid', 'ring_only');
    expect(coarse.reason).toBe('coarse_outline');
    expect(place.reason).toBe('place_only');
    expect(coarse.dotMm).toBe(0);
    expect(place.dotMm).toBeGreaterThan(0);
    expect(place.dotMm).toBeLessThan(place.innerMm);
    // The same radius in both cases: a ring marks a place, so its size must say nothing about the structure's.
    expect([place.innerMm, place.outerMm]).toEqual([coarse.innerMm, coarse.outerMm]);
    expect(place.outerMm).toBe(RING_OUTER_MM);
  });

  it('lays the arcs out in one turn, in order, with a gap after each and no overlap', () => {
    for (const fill of FILL_KINDS) {
      const { arcs } = ring(fill, 'ring_only');
      for (const [at, [start, length]] of arcs.entries()) {
        expect(length, fill).toBeGreaterThan(0);
        expect(start + length).toBeLessThanOrEqual(Math.PI * 2 + 1e-9);
        const next = arcs[at + 1];
        if (next !== undefined) expect(start + length, `${fill} arc ${at}`).toBeLessThanOrEqual(next[0] + 1e-9);
      }
    }
  });

  it('draws the ring over the shapes but under the selection mark and the step labels', () => {
    expect(DRAW_ORDER.marker).toBeGreaterThan(DRAW_ORDER.brainOutline);
    expect(DRAW_ORDER.marker).toBeLessThan(DRAW_ORDER.mark);
  });
});

describe('idleTurnSpeed', () => {
  it('is zero under reduced motion and one slow turn in two minutes otherwise', () => {
    expect(idleTurnSpeed(true)).toBe(0);
    expect(idleTurnSpeed(false)).toBe(IDLE_RADIANS_PER_MS);
    expect((Math.PI * 2) / IDLE_RADIANS_PER_MS).toBeCloseTo(120_000);
  });
});
