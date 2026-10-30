// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DecodedNode } from '@/lib/anatomy/decode-glb';
import type { DeviceDrawing } from '@/lib/atlas-explorer/device-drawing';
import {
  DRAW_ORDER, FILL_OPACITY, HOVER_EMISSIVE_INTENSITY, HOVER_OPACITY, INSIDE_COLOUR, OWN_COLOUR_HOVER_EMISSIVE_INTENSITY, OWN_COLOUR_SELECTED_EMISSIVE_INTENSITY,
  SELECTED_EMISSIVE_INTENSITY, SELECTION_COLOUR, STEP_EASE_MS, SURFACE_INK, ringParamsFor, stepEaseDuration,
} from '@/lib/atlas-explorer/scene-drawing';
import { NEUTRAL_COLOUR, NISS_COLOURS, NISS_COLOURS_DARK, type SceneShape } from '@/lib/atlas-explorer/scene-shapes';
import { toIndexReviewState, UNREVIEWED } from '@/lib/anatomy/review-state';
import { listSceneObjects, resetStandIn, standIn, type StandInLitMaterial, type StandInObject } from './three-stand-in';

vi.mock('three', async () => (await import('./three-stand-in')).createThreeStandIn());

const { createSceneRenderer } = await import('../scene-renderer');

/** A box of triangles around a centre, in the atlas's millimetres: enough for a bounding box. */
function nodeAt(labelId: string, centre: readonly [number, number, number], half = 5): DecodedNode {
  const [x, y, z] = centre;
  const positionsMm = new Float32Array([x - half, y - half, z - half, x + half, y - half, z - half, x + half, y + half, z + half, x - half, y + half, z + half]);
  return { atlas: 'a', labelId, hemisphere: 'left', positionsMm, indices: new Uint32Array([0, 1, 2, 0, 2, 3]), boundsMm: { min: [x - half, y - half, z - half], max: [x + half, y + half, z + half] } };
}
function shapeAt(labelId: string, centroidMm: readonly [number, number, number], overrides: Partial<SceneShape> = {}): SceneShape {
  const base: SceneShape = {
    id: `a:${labelId}:left`, structureKey: `a:${labelId}`, assetId: 'asset', layer: 'cortical', hemisphere: 'left', fill: 'translucent', colour: '#8a90a0', step: null, words: '',
    highlightColour: null, sizeMark: 'mesh', centroidMm, mirrored: false,
  };
  return Object.assign(base, overrides);
}

/** Three regions far apart, each one shape, and one region drawn as two shapes. */
const CENTRES: Record<string, readonly [number, number, number]> = { front: [0, 60, 0], back: [0, -60, 0], left: [-50, 0, 0], twinA: [40, 0, 20], twinB: [40, 0, -20] };
const SHAPES = Object.entries(CENTRES).map(([labelId, centre]) => shapeAt(labelId, centre));
const NODES = new Map(Object.entries(CENTRES).map(([labelId, centre]) => [`a:${labelId}:left`, nodeAt(labelId, centre)]));
const REGION_KEYS: Record<string, string[]> = { front: ['a:front'], back: ['a:back'], left: ['a:left'], twin: ['a:twinA', 'a:twinB'] };
const DEVICES: DeviceDrawing = {
  layoutId: '10-20', layoutName: 'Fixture layout', reviewState: toIndexReviewState(UNREVIEWED),
  electrodes: [{ id: 'Cz', positionScene: [0, 90, 0], alsoCalled: null }, { id: 'Oz', positionScene: [0, 10, 95], alsoCalled: null }],
};

const kindsOf = (kind: string): StandInObject[] => listSceneObjects().filter((object) => object.kind === kind);
const positionsOf = (object: StandInObject): number[] => Array.from(object.geometry?.attributes.position?.array ?? []);
const withinBox = (point: number[], min: number[], max: number[], slack: number): boolean => point.every((value, axis) => value >= min[axis] - slack && value <= max[axis] + slack);

/** The box of each region in scene axes, read back from the meshes the renderer built for it. */
function regionBoxes(): Array<{ region: string; min: number[]; max: number[] }> {
  const meshes = kindsOf('mesh').filter((mesh) => typeof mesh.userData.structureKey === 'string');
  return Object.entries(REGION_KEYS).map(([region, keys]) => {
    const points = meshes.filter((mesh) => keys.includes(String(mesh.userData.structureKey))).flatMap(positionsOf);
    const along = (axis: number): number[] => points.filter((_value, at) => at % 3 === axis);
    return { region, min: [0, 1, 2].map((axis) => Math.min(...along(axis))), max: [0, 1, 2].map((axis) => Math.max(...along(axis))) };
  });
}

/** Every line piece in the scene whose two ends lie in two different regions. There must never be one. */
function listLinesJoiningRegions(): string[] {
  const boxes = regionBoxes();
  const regionAt = (point: number[]): string | null => boxes.find((box) => withinBox(point, box.min, box.max, 0.5))?.region ?? null;
  return kindsOf('lines').flatMap((lines) => {
    const positions = positionsOf(lines);
    return Array.from({ length: positions.length / 6 }, (_unused, at) => [regionAt(positions.slice(at * 6, at * 6 + 3)), regionAt(positions.slice(at * 6 + 3, at * 6 + 6))])
      .filter(([from, to]) => from !== null && to !== null && from !== to).map(([from, to]) => `${from} to ${to}`);
  });
}

let frames: FrameRequestCallback[] = [];
let canvas: HTMLCanvasElement;
const callbacks = { onPick: vi.fn(), onPickElectrode: vi.fn(), onHover: vi.fn(), onCameraTurn: vi.fn(), onContextLost: vi.fn() };
const runFrame = (now: number): void => { frames.shift()?.(now); };
const click = (): void => { canvas.dispatchEvent(new MouseEvent('pointerdown', { clientX: 5, clientY: 5 })); canvas.dispatchEvent(new MouseEvent('pointerup', { clientX: 5, clientY: 5 })); };
/** A pen that accepts every call a label makes. jsdom has no 2D canvas of its own. */
const pen = new Proxy({ measureText: () => ({ width: 40 }) }, { get: (target, name) => (name in target ? target[name as keyof typeof target] : () => undefined), set: () => true });

beforeEach(() => {
  frames = [];
  resetStandIn();
  for (const callback of Object.values(callbacks)) callback.mockClear();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
  vi.stubGlobal('cancelAnimationFrame', () => { frames = []; });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => pen as unknown as CanvasRenderingContext2D);
  vi.spyOn(performance, 'now').mockReturnValue(1000);
  canvas = document.createElement('canvas');
  canvas.setPointerCapture = () => undefined;
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

/** The lit material of the shape with this key: the fill mesh the renderer built for it. */
const litMaterialOf = (structureKey: string): StandInLitMaterial => {
  const material = kindsOf('mesh').find((mesh) => mesh.userData.structureKey === structureKey)?.material as StandInLitMaterial | undefined;
  if (material === undefined) throw new Error(`No lit mesh for ${structureKey}.`);
  return material;
};
const WHITE = 'ffffff';
const NO_GLOW = '000000';

describe('the selection', () => {
  /**
   * The selection used to be corner brackets around the shapes' box and a name
   * plate above it, both drawn over everything. Both are gone: they read as a
   * box the data does not hold, and the plate as a patch over the brain. A
   * selected shape is now lit from within, and nothing is drawn around it.
   */
  /**
   * The twin region filled, as under a lens that holds a value for it, with a colour of its own; the left region
   * see-through but with a colour of its own; the rest see-through and shared or unowned, so with none.
   */
  const TWIN_OWN = '#aa3366';
  const LEFT_OWN = '#3366aa';
  /** What a filled shape rests in: the lens colour the fixture gives it. */
  const LENS_COLOUR = '8a90a0';
  /** What a see-through shape rests in: the surface's pale ink, not the lens colour (materialParamsFor). */
  const PALE_COLOUR = INSIDE_COLOUR.slice(1);
  const LIT_SHAPES = SHAPES.map((shape) => {
    if (REGION_KEYS.twin.includes(shape.structureKey)) return { ...shape, fill: 'solid' as const, highlightColour: TWIN_OWN };
    return shape.structureKey === 'a:left' ? { ...shape, highlightColour: LEFT_OWN } : shape;
  });

  it('shows a selected region in its own colour, lit from within where it is filled, draws nothing around it, and puts it back when it is unselected', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes(LIT_SHAPES, NODES, new Set(REGION_KEYS.twin));
    expect(kindsOf('lines')).toHaveLength(0);
    expect(kindsOf('sprite')).toHaveLength(0);
    for (const key of REGION_KEYS.twin) {
      const material = litMaterialOf(key);
      expect(material.color.getHexString(), key).toBe(TWIN_OWN.slice(1));
      // Lit in its own colour, not in white: white light at this level on a lit material washed the hue out.
      expect(material.emissive.getHexString(), key).toBe(TWIN_OWN.slice(1));
      expect(material.emissiveIntensity, key).toBe(OWN_COLOUR_SELECTED_EMISSIVE_INTENSITY);
      expect(material.opacity, key).toBe(FILL_OPACITY.solid);
    }
    const front = litMaterialOf('a:front');
    expect(front.color.getHexString()).toBe(PALE_COLOUR);
    expect(front.emissive.getHexString()).toBe(NO_GLOW);
    expect(front.opacity).toBe(FILL_OPACITY.translucent);
    renderer.setShapes(LIT_SHAPES, NODES, new Set());
    for (const key of REGION_KEYS.twin) {
      expect(litMaterialOf(key).color.getHexString(), key).toBe(LENS_COLOUR);
      expect(litMaterialOf(key).emissive.getHexString(), key).toBe(NO_GLOW);
    }
  });

  it('shows a see-through shape under the pointer in its own colour and denser, with no light, and puts both back when the pointer leaves', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes(LIT_SHAPES, NODES, new Set());
    const left = kindsOf('mesh').find((mesh) => mesh.userData.structureKey === 'a:left') as StandInObject;
    standIn.hits = [{ object: left, distance: 1, point: {} }];
    canvas.dispatchEvent(new MouseEvent('pointermove', { clientX: 5, clientY: 5 }));
    runFrame(1016);
    expect(litMaterialOf('a:left').color.getHexString()).toBe(LEFT_OWN.slice(1));
    expect(litMaterialOf('a:left').opacity).toBe(HOVER_OPACITY.translucent);
    expect(litMaterialOf('a:left').emissive.getHexString()).toBe(NO_GLOW);
    standIn.hits = [];
    canvas.dispatchEvent(new MouseEvent('pointermove', { clientX: 300, clientY: 300 }));
    runFrame(1032);
    expect(litMaterialOf('a:left').color.getHexString()).toBe(PALE_COLOUR);
    expect(litMaterialOf('a:left').opacity).toBe(FILL_OPACITY.translucent);
  });

  it('leaves the colour of a shape with no colour of its own alone under the pointer, and only lifts it', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes(LIT_SHAPES, NODES, new Set());
    const front = kindsOf('mesh').find((mesh) => mesh.userData.structureKey === 'a:front') as StandInObject;
    standIn.hits = [{ object: front, distance: 1, point: {} }];
    canvas.dispatchEvent(new MouseEvent('pointermove', { clientX: 5, clientY: 5 }));
    runFrame(1016);
    expect(litMaterialOf('a:front').color.getHexString()).toBe(PALE_COLOUR);
    expect(litMaterialOf('a:front').opacity).toBe(HOVER_OPACITY.translucent);
  });

  it('draws a selected see-through shape denser and adds no light to it, by the same rule as hover, so it never reads as holding a value', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes(SHAPES, NODES, new Set(REGION_KEYS.front));
    const front = litMaterialOf('a:front');
    expect(front.opacity).toBe(HOVER_OPACITY.translucent);
    expect(front.emissive.getHexString()).toBe(NO_GLOW);
    expect(litMaterialOf('a:back').opacity).toBe(FILL_OPACITY.translucent);
  });

  it('lifts the shape under the pointer over its own glow, and puts the glow back, not darkness, when the pointer leaves', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes(LIT_SHAPES, NODES, new Set(REGION_KEYS.twin));
    const twinA = kindsOf('mesh').find((mesh) => mesh.userData.structureKey === 'a:twinA') as StandInObject;
    standIn.hits = [{ object: twinA, distance: 1, point: {} }];
    canvas.dispatchEvent(new MouseEvent('pointermove', { clientX: 5, clientY: 5 }));
    runFrame(1016);
    expect(litMaterialOf('a:twinA').emissive.getHexString()).toBe(TWIN_OWN.slice(1));
    expect(litMaterialOf('a:twinA').emissiveIntensity).toBe(OWN_COLOUR_HOVER_EMISSIVE_INTENSITY);
    expect(callbacks.onHover).toHaveBeenLastCalledWith('a:twinA');
    standIn.hits = [];
    canvas.dispatchEvent(new MouseEvent('pointermove', { clientX: 300, clientY: 300 }));
    runFrame(1032);
    expect(callbacks.onHover).toHaveBeenLastCalledWith(null);
    // Back to the selection's own state: its colour, its glow, its opacity.
    expect(litMaterialOf('a:twinA').color.getHexString()).toBe(TWIN_OWN.slice(1));
    expect(litMaterialOf('a:twinA').emissive.getHexString()).toBe(TWIN_OWN.slice(1));
    expect(litMaterialOf('a:twinA').emissiveIntensity).toBe(OWN_COLOUR_SELECTED_EMISSIVE_INTENSITY);
    expect(litMaterialOf('a:twinA').opacity).toBe(FILL_OPACITY.solid);
  });

  it('lights a filled shape with no colour of its own in white, under the pointer and when selected, and puts the darkness back', () => {
    // The back region filled under a lens, but shared or unowned, so with no region colour: white is the only lift left to it.
    const sharedFilled = SHAPES.map((shape) => (REGION_KEYS.back.includes(shape.structureKey) ? { ...shape, fill: 'solid' as const } : shape));
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes(sharedFilled, NODES, new Set(REGION_KEYS.back));
    expect(litMaterialOf('a:back').color.getHexString()).toBe(LENS_COLOUR);
    expect(litMaterialOf('a:back').emissive.getHexString()).toBe(WHITE);
    expect(litMaterialOf('a:back').emissiveIntensity).toBe(SELECTED_EMISSIVE_INTENSITY);
    const back = kindsOf('mesh').find((mesh) => mesh.userData.structureKey === 'a:back') as StandInObject;
    standIn.hits = [{ object: back, distance: 1, point: {} }];
    canvas.dispatchEvent(new MouseEvent('pointermove', { clientX: 5, clientY: 5 }));
    runFrame(1016);
    expect(litMaterialOf('a:back').color.getHexString()).toBe(LENS_COLOUR);
    expect(litMaterialOf('a:back').emissive.getHexString()).toBe(WHITE);
    expect(litMaterialOf('a:back').emissiveIntensity).toBe(HOVER_EMISSIVE_INTENSITY);
    renderer.setShapes(sharedFilled, NODES, new Set());
    standIn.hits = [];
    canvas.dispatchEvent(new MouseEvent('pointermove', { clientX: 300, clientY: 300 }));
    runFrame(1032);
    expect(litMaterialOf('a:back').emissive.getHexString()).toBe(NO_GLOW);
  });

  /**
   * The pale fill is the one ink the drawing layer chooses itself, so it is the
   * one that can be drawn for the wrong surface. It was: it had no dark step at
   * all and so was fainter there than the shapes with no record. It is checked
   * at the renderer, because that is where the surface arrives; the selection's
   * glow is the shape's own colour, which arrives already resolved for the surface
   * (highlight-colour.ts), or white, so the renderer owes the surface nothing for it.
   */
  it('inks the pale fills for the surface it was given, redraws them when the surface changes, and keeps the glow through it', () => {
    const inkOfPaleFill = (): unknown => kindsOf('mesh').find((mesh) => mesh.userData.structureKey === 'a:front')?.material?.params.color;
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    // The pale front and the filled twin selected together: the one shows the surface ink, the other the glow.
    renderer.setShapes(LIT_SHAPES, NODES, new Set([...REGION_KEYS.front, ...REGION_KEYS.twin]));
    expect(inkOfPaleFill()).toBe(SURFACE_INK.light.inside);
    expect(litMaterialOf('a:twinA').emissiveIntensity).toBe(OWN_COLOUR_SELECTED_EMISSIVE_INTENSITY);

    renderer.setTheme('dark');
    expect(inkOfPaleFill()).toBe(SURFACE_INK.dark.inside);
    expect(litMaterialOf('a:twinA').emissiveIntensity).toBe(OWN_COLOUR_SELECTED_EMISSIVE_INTENSITY);
    // The same shapes still, and nothing drawn around them: the surface changes the ink, never what is drawn.
    expect(kindsOf('lines')).toHaveLength(0);

    renderer.setTheme('light');
    expect(inkOfPaleFill()).toBe(SURFACE_INK.light.inside);
  });

  it('starts on the surface it was made for, without waiting to be told again', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'dark');
    renderer.setShapes(SHAPES, NODES, new Set(REGION_KEYS.front));
    expect(kindsOf('mesh').find((mesh) => mesh.userData.structureKey === 'a:front')?.material?.params.color).toBe(SURFACE_INK.dark.inside);
  });
});

describe('no line joins two regions', () => {
  const stepShapes = (numbers: Record<string, number[]>): SceneShape[] => SHAPES.map((shape) => ({ ...shape, stepNumbers: numbers[shape.structureKey] ?? [], fill: numbers[shape.structureKey] === undefined ? shape.fill : 'solid' as const }));

  it('finds a line between two regions when one is planted, so the check below means something', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes(SHAPES, NODES, new Set());
    const three = standIn.scenes[0];
    const planted = Object.assign(Object.create(Object.getPrototypeOf(kindsOf('mesh')[0])), { kind: 'lines', children: [], userData: {}, geometry: { attributes: { position: { array: [0, 0, -60, 0, 0, 60] } } } });
    three.add(planted);
    expect(listLinesJoiningRegions()).toEqual(['front to back']);
  });

  it('draws none for a selection, a stepped threat model, a whole threat model, the electrode layout, or all of them at once', () => {
    const renderer = createSceneRenderer(canvas, callbacks, false, 'light');
    const everyRegion = Object.values(REGION_KEYS);
    const states: Array<() => void> = [
      () => renderer.setShapes(SHAPES, NODES, new Set(everyRegion.flat())),
      () => renderer.setShapes(stepShapes({ 'a:front': [1] }), NODES, new Set()),
      () => renderer.setShapes(stepShapes({ 'a:back': [2] }), NODES, new Set()),
      () => renderer.setShapes(stepShapes({ 'a:front': [1], 'a:back': [2], 'a:left': [3], 'a:twinA': [4], 'a:twinB': [4, 5] }), NODES, new Set()),
      () => renderer.setDevices(DEVICES, 'Cz'),
      () => renderer.setShapes(stepShapes({ 'a:front': [1], 'a:back': [2] }), NODES, new Set(everyRegion.flat())),
    ];
    for (const enter of states) {
      enter();
      runFrame(1000);
      runFrame(1000 + STEP_EASE_MS);
      expect(listLinesJoiningRegions()).toEqual([]);
      // The only lines ever in the scene are selection brackets: short pieces, each far shorter than the gap between two regions.
      for (const lines of kindsOf('lines')) {
        const positions = positionsOf(lines);
        for (let at = 0; at < positions.length; at += 6) expect(Math.hypot(positions[at + 3] - positions[at], positions[at + 4] - positions[at + 1], positions[at + 5] - positions[at + 2])).toBeLessThan(30);
      }
    }
    expect(kindsOf('lines').every((lines) => Object.keys(lines.geometry?.attributes ?? {}).join() === 'position')).toBe(true);
  });
});

describe('threat-model steps in the picture', () => {
  const marked = (numbers: number[]): SceneShape[] => SHAPES.map((shape) => (shape.structureKey === 'a:front' ? { ...shape, fill: 'solid' as const, stepNumbers: numbers } : { ...shape, stepNumbers: [] }));
  const labels = (): string[] => kindsOf('sprite').map((sprite) => String(sprite.userData.labelText));

  it('numbers the shapes a step marks, in place at the middle of each, and nothing else', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes(marked([4]), NODES, new Set());
    expect(labels()).toEqual(['Step 4']);
    const [label] = kindsOf('sprite');
    // The atlas's front (y = 60 mm) is scene -z.
    expect([label.position.x, label.position.y, label.position.z]).toEqual([0, 0, -60]);
    renderer.setShapes(marked([1, 3]), NODES, new Set());
    expect(labels()).toEqual(['Steps 1, 3']);
    renderer.setShapes(SHAPES, NODES, new Set());
    expect(labels()).toEqual([]);
  });

  it('eases a step\'s own marks in where they stand, once, and leaves every other shape alone', () => {
    const renderer = createSceneRenderer(canvas, callbacks, false, 'light');
    renderer.setShapes(marked([4]), NODES, new Set());
    const meshOf = (key: string): StandInObject => kindsOf('mesh').find((mesh) => mesh.userData.structureKey === key) as StandInObject;
    const before = [meshOf('a:front').position.x, meshOf('a:front').position.y, meshOf('a:front').position.z];
    expect(meshOf('a:front').material?.opacity).toBe(0);
    expect(kindsOf('sprite')[0].material?.opacity).toBe(0);
    expect(meshOf('a:back').material?.opacity).toBeGreaterThan(0);
    runFrame(1000 + STEP_EASE_MS / 2);
    expect(meshOf('a:front').material?.opacity).toBeCloseTo(0.5);
    expect(frames.length).toBe(1);
    runFrame(1000 + STEP_EASE_MS);
    expect(meshOf('a:front').material?.opacity).toBe(1);
    expect(meshOf('a:front').material?.transparent).toBe(false);
    expect([meshOf('a:front').position.x, meshOf('a:front').position.y, meshOf('a:front').position.z]).toEqual(before);
    // A redraw for another reason (a selection) does not fade the same step in again.
    renderer.setShapes(marked([4]), NODES, new Set(['a:back']));
    expect(meshOf('a:front').material?.opacity).toBe(1);
  });

  it('shows every numbered step at once under reduced motion, with no fade', () => {
    expect(stepEaseDuration(true)).toBe(0);
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    const whole = SHAPES.map((shape, at) => ({ ...shape, fill: 'solid' as const, stepNumbers: [at + 1] }));
    renderer.setShapes(whole, NODES, new Set());
    expect(kindsOf('sprite').map((sprite) => sprite.userData.labelText)).toEqual(['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5']);
    expect(listSceneObjects().filter((object) => object.material !== undefined).every((object) => (object.material?.opacity ?? 1) > 0)).toBe(true);
    runFrame(1000);
    expect(frames).toEqual([]);
  });
});

describe('the marker ring', () => {
  const rings = (): StandInObject[] => listSceneObjects().filter((object) => object.userData.ringReason !== undefined);
  const ringFor = (reason: string): StandInObject | undefined => rings().find((group) => group.userData.ringReason === reason);
  const inkOf = (ring: StandInObject | undefined): unknown[] => [...new Set((ring?.children ?? []).map((part) => part.material?.params.color))];
  /** A structure the atlas marks with a ring alone: no file, no mesh, only a place. */
  const placeOnly = (overrides: Partial<SceneShape> = {}): SceneShape[] => [shapeAt('front', CENTRES.front, { sizeMark: 'ring_only', fill: 'solid', colour: NISS_COLOURS.critical, step: 'critical', ...overrides })];

  it('carries the lens it is under: the step\'s own colour where the lens fills the shape, on either surface', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes(placeOnly(), new Map(), new Set());
    expect(inkOf(ringFor('place_only'))).toEqual([NISS_COLOURS.critical]);
    renderer.setShapes(placeOnly({ colour: NISS_COLOURS.none, step: 'none' }), new Map(), new Set());
    expect(inkOf(ringFor('place_only'))).toEqual([NISS_COLOURS.none]);
    renderer.setShapes(placeOnly({ colour: NISS_COLOURS_DARK.critical }), new Map(), new Set());
    expect(inkOf(ringFor('place_only'))).toEqual([NISS_COLOURS_DARK.critical]);
    // The ring was the one mark that stayed neutral under every lens; it must never read as neutral while the lens fills its shape.
    expect(inkOf(ringFor('place_only'))).not.toContain(NEUTRAL_COLOUR);
  });

  it('changes how much of itself it draws when the lens state changes, so colour is not the only channel', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    const drawn = (shapes: SceneShape[]): { ink: unknown[]; parts: number } => {
      renderer.setShapes(shapes, new Map(), new Set());
      const ring = ringFor('place_only');
      return { ink: inkOf(ring), parts: ring?.children.length ?? 0 };
    };
    const filled = drawn(placeOnly());
    const noData = drawn(placeOnly({ fill: 'lines', colour: NEUTRAL_COLOUR, step: null }));
    const inside = drawn(placeOnly({ fill: 'translucent', colour: NEUTRAL_COLOUR, step: null }));
    expect(noData.ink).toEqual([NEUTRAL_COLOUR]);
    expect(new Set([filled.parts, noData.parts, inside.parts]).size).toBe(3);
    // Each ring is one material for all its pieces, so no piece can drift from the rest.
    expect(filled.ink).toHaveLength(1);
  });

  it('marks a structure with no outline at all with a centre, and a coarse outline with a ring alone', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes([
      ...placeOnly(),
      shapeAt('back', CENTRES.back, { sizeMark: 'mesh_and_ring', fill: 'solid', colour: NISS_COLOURS.high, step: 'high' }),
    ], NODES, new Set());
    const place = ringFor('place_only');
    const coarse = ringFor('coarse_outline');
    expect(place?.children).toHaveLength((ringParamsFor({ fill: 'solid', sizeMark: 'ring_only', colour: '#000000' })?.arcs.length ?? 0) + 1);
    expect(coarse?.children).toHaveLength(ringParamsFor({ fill: 'solid', sizeMark: 'mesh_and_ring', colour: '#000000' })?.arcs.length ?? 0);
    expect(place?.children.length).toBeGreaterThan(coarse?.children.length ?? 0);
    // The mesh of the coarse shape is still drawn: the ring annotates it, it does not replace it.
    expect(kindsOf('mesh').some((mesh) => mesh.userData.structureKey === 'a:back')).toBe(true);
  });

  it('draws over the shapes on purpose, with nothing drawn over it for a selection, and turns with the camera as one piece', () => {
    const renderer = createSceneRenderer(canvas, callbacks, false, 'light');
    renderer.setShapes(placeOnly(), new Map(), new Set(['a:front']));
    const ring = ringFor('place_only');
    // A mark that says the outline here is approximate, or absent, is worthless if the drawing can hide it.
    expect(ring?.children.every((part) => part.material?.params.depthTest === false)).toBe(true);
    expect(ring?.children.every((part) => part.renderOrder === DRAW_ORDER.marker)).toBe(true);
    // The selection adds no line over the ring: a selected ring-only structure is not lifted, and nothing is drawn around it.
    expect(kindsOf('lines')).toHaveLength(0);
    // Nothing about the ring moves on its own: it is billboarded, which is a camera turn, not an animation.
    runFrame(1000);
    expect([ring?.position.x, ring?.position.y, ring?.position.z]).toEqual([0, 0, -60]);
    expect(ring?.children.every((part) => (part.material?.opacity ?? 0) > 0)).toBe(true);
  });
});

describe('the electrode layout in the picture', () => {
  it('draws a named dot per electrode only when asked, and removes them all when the layer goes off', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes(SHAPES, NODES, new Set());
    expect(kindsOf('sprite')).toEqual([]);
    renderer.setDevices(DEVICES, null);
    expect(kindsOf('sprite').map((sprite) => sprite.userData.labelText)).toEqual(['Cz', 'Oz']);
    const dots = kindsOf('mesh').filter((mesh) => mesh.userData.electrodeDot !== undefined);
    expect(dots.map((dot) => [dot.userData.electrodeDot, dot.position.x, dot.position.y, dot.position.z])).toEqual([['Cz', 0, 90, 0], ['Oz', 0, 10, 95]]);
    renderer.setDevices(null, null);
    expect(kindsOf('sprite')).toEqual([]);
    expect(dots.every((dot) => dot.material?.isDisposed === true)).toBe(true);
  });

  it('stands the camera back far enough to hold the whole head while the head surface is drawn, and returns when it is not', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    const brainDistance = renderer.distance();
    renderer.setDevices(DEVICES, null);
    expect(renderer.distance()).toBeGreaterThan(brainDistance * 1.2);
    renderer.setView('behind_above');
    expect(renderer.distance()).toBeGreaterThan(brainDistance * 1.2);
    renderer.setDevices(null, null);
    renderer.setView('behind_above');
    expect(renderer.distance()).toBe(brainDistance);
  });

  it('reports a click on a dot as an electrode pick and never as a shape, so it can select no region', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes(SHAPES, NODES, new Set());
    renderer.setDevices(DEVICES, null);
    const dot = kindsOf('mesh').find((mesh) => mesh.userData.electrodeId === 'Cz');
    const shape = kindsOf('mesh').find((mesh) => mesh.userData.structureKey === 'a:front');
    standIn.hits = [{ object: dot, distance: 5, point: {} }, { object: shape, distance: 40, point: {} }];
    click();
    expect(standIn.pickTargets).toContain(dot);
    expect(callbacks.onPickElectrode).toHaveBeenCalledWith('Cz');
    expect(callbacks.onPick).not.toHaveBeenCalled();
    standIn.hits = [{ object: shape, distance: 5, point: {} }, { object: dot, distance: 40, point: {} }];
    click();
    expect(callbacks.onPick).toHaveBeenCalledWith('a:front');
    expect(callbacks.onPickElectrode).toHaveBeenCalledTimes(1);
  });

  it('marks the picked dot with the selection colour and draws nothing from a dot to the brain', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes(SHAPES, NODES, new Set());
    renderer.setDevices(DEVICES, 'Oz');
    const colourOf = (electrodeId: string): unknown => kindsOf('mesh').find((mesh) => mesh.userData.electrodeDot === electrodeId)?.material?.params.color;
    expect(colourOf('Oz')).toBe(SELECTION_COLOUR);
    expect(colourOf('Cz')).toBe('#ffffff');
    expect(kindsOf('lines')).toEqual([]);
  });
});
