// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DecodedNode } from '@/lib/anatomy/decode-glb';
import type { SceneShape } from '@/lib/atlas-explorer/scene-shapes';

/** What the stand-in three.js recorded: enough to see what the renderer built, tested and released. */
const three = vi.hoisted(() => ({ disposed: [] as string[], rendered: 0, contextLosses: 0, pickTargets: [] as unknown[], hits: [] as unknown[], renderers: [] as Array<{ clippingPlanes: unknown[] }> }));

vi.mock('three', () => {
  class Object3D {
    children: Object3D[] = [];
    userData: Record<string, unknown> = {};
    renderOrder = 0;
    position = { set: () => undefined };
    quaternion = { copy: () => undefined };
    add(...objects: Object3D[]): void { this.children.push(...objects); }
    remove(object: Object3D): void { this.children = this.children.filter((child) => child !== object); }
    traverse(visit: (object: Object3D) => void): void { visit(this); for (const child of this.children) child.traverse(visit); }
  }
  class Drawn extends Object3D {
    constructor(public kind: string, public geometry: BufferGeometry, public material: Material) { super(); }
  }
  class Mesh extends Drawn { constructor(geometry: BufferGeometry, material: Material) { super('mesh', geometry, material); } }
  class LineSegments extends Drawn { constructor(geometry: BufferGeometry, material: Material) { super('lines', geometry, material); } }
  class BufferGeometry {
    boundingBox: { min: { toArray: () => number[] }; max: { toArray: () => number[] } } | null = null;
    setAttribute(): void { /* positions are not inspected here */ }
    setIndex(): void { /* indices are not inspected here */ }
    computeVertexNormals(): void { /* no shading in the stand-in */ }
    computeBoundingBox(): void { this.boundingBox = { min: { toArray: () => [0, 0, 0] }, max: { toArray: () => [10, 10, 10] } }; }
    dispose(): void { three.disposed.push('geometry'); }
  }
  class Material {
    constructor(public params: Record<string, unknown> = {}) {}
    dispose(): void { three.disposed.push('material'); }
  }
  class PerspectiveCamera extends Object3D {
    aspect = 1;
    lookAt(): void { /* the pose arithmetic is tested on its own */ }
    updateProjectionMatrix(): void { /* nothing to project in the stand-in */ }
  }
  class WebGLRenderer {
    clippingPlanes: unknown[] = [];
    constructor() { three.renderers.push(this); }
    setPixelRatio(): void { /* no pixels */ }
    setSize(): void { /* no pixels */ }
    render(): void { three.rendered += 1; }
    dispose(): void { three.disposed.push('renderer'); }
    forceContextLoss(): void { three.contextLosses += 1; }
  }
  class Raycaster {
    setFromCamera(): void { /* the pointer mapping is tested on its own */ }
    intersectObjects(targets: unknown[]): unknown[] { three.pickTargets = targets; return three.hits; }
  }
  class Plane { distanceToPoint(point: { hidden?: boolean }): number { return point.hidden === true ? -1 : 1; } }
  class Vector { constructor(public x = 0, public y = 0, public z = 0) {} }
  return {
    BufferAttribute: class {}, Float32BufferAttribute: class {}, BufferGeometry, RingGeometry: BufferGeometry, SphereGeometry: BufferGeometry, DoubleSide: 2, FrontSide: 0, BackSide: 1,
    Sprite: Object3D, SpriteMaterial: Material, CanvasTexture: class {},
    Group: Object3D, Scene: Object3D, DirectionalLight: Object3D, HemisphereLight: Object3D, PerspectiveCamera, Mesh, LineSegments,
    MeshBasicMaterial: Material, MeshLambertMaterial: Material, LineBasicMaterial: Material, WebGLRenderer, Raycaster, Plane, Vector2: Vector, Vector3: Vector,
  };
});

const { createSceneRenderer } = await import('../scene-renderer');

const node = (labelId: string): DecodedNode => ({ atlas: 'a', labelId, hemisphere: 'left', positionsMm: new Float32Array(9), indices: new Uint32Array([0, 1, 2]), boundsMm: { min: [0, 0, 0], max: [1, 1, 1] } });
const shape = (labelId: string, overrides: Partial<SceneShape> = {}): SceneShape => ({
  id: `a:${labelId}:left`, structureKey: `a:${labelId}`, assetId: 'asset', layer: 'cortical', hemisphere: 'left', fill: 'translucent', colour: '#8a90a0', step: null, words: '',
  sizeMark: 'mesh', centroidMm: [0, 0, 0], mirrored: false, ...overrides,
});
const SHAPES = [shape('brain', { layer: 'outline' }), shape('pale'), shape('filled', { fill: 'solid', colour: '#5b3fd0' })];
const NODES = new Map(SHAPES.map((entry) => [entry.id, node(entry.id)]));

let frames: FrameRequestCallback[] = [];
let canvas: HTMLCanvasElement;
let listeners: Array<[string, EventListenerOrEventListenerObject]>;
const callbacks = { onPick: vi.fn(), onPickElectrode: vi.fn(), onHover: vi.fn(), onCameraTurn: vi.fn(), onContextLost: vi.fn() };
const runFrames = (count: number): void => { for (let frame = 0; frame < count; frame += 1) frames.shift()?.(1000 + frame * 16); };
const click = (x: number, y: number): void => { canvas.dispatchEvent(new MouseEvent('pointerdown', { clientX: x, clientY: y })); canvas.dispatchEvent(new MouseEvent('pointerup', { clientX: x, clientY: y })); };

beforeEach(() => {
  frames = [];
  Object.assign(three, { disposed: [], rendered: 0, contextLosses: 0, pickTargets: [], hits: [], renderers: [] });
  for (const callback of Object.values(callbacks)) callback.mockClear();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
  vi.stubGlobal('cancelAnimationFrame', () => { frames = []; });
  canvas = document.createElement('canvas');
  canvas.setPointerCapture = () => undefined;
  listeners = [];
  const add = canvas.addEventListener.bind(canvas);
  canvas.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions) => { listeners.push([type, listener]); add(type, listener, options); }) as typeof canvas.addEventListener;
});
afterEach(() => vi.unstubAllGlobals());

describe('createSceneRenderer', () => {
  it('removes every listener it added and releases its WebGL context, geometry and materials on dispose', () => {
    const removed: Array<[string, EventListenerOrEventListenerObject]> = [];
    const remove = canvas.removeEventListener.bind(canvas);
    canvas.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject) => { removed.push([type, listener]); remove(type, listener); }) as typeof canvas.removeEventListener;
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes(SHAPES, NODES, new Set());
    expect(listeners.map(([type]) => type).sort()).toEqual(['pointercancel', 'pointerdown', 'pointermove', 'pointerup', 'webglcontextlost', 'wheel']);
    renderer.dispose();
    expect(removed).toEqual(listeners);
    expect(three.contextLosses).toBe(1);
    expect(three.disposed.filter((kind) => kind === 'renderer')).toHaveLength(1);
    expect(three.disposed.filter((kind) => kind === 'material')).toHaveLength(SHAPES.length);
    expect(three.disposed.filter((kind) => kind === 'geometry')).toHaveLength(SHAPES.length);
    canvas.dispatchEvent(new Event('webglcontextlost'));
    expect(callbacks.onContextLost).not.toHaveBeenCalled();
  });

  it('tells the page when the browser takes the context away, and keeps the browser from discarding it for good', () => {
    createSceneRenderer(canvas, callbacks, true, 'light');
    const lost = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(lost);
    expect(callbacks.onContextLost).toHaveBeenCalledTimes(1);
    expect(lost.defaultPrevented).toBe(true);
  });

  it('turns idly until touched, and never under reduced motion', () => {
    const still = createSceneRenderer(canvas, callbacks, true, 'light');
    still.setShapes(SHAPES, NODES, new Set());
    runFrames(1);
    expect(frames).toHaveLength(0);
    expect(three.rendered).toBe(1);
    const turning = createSceneRenderer(document.createElement('canvas'), callbacks, false, 'light');
    turning.setShapes(SHAPES, NODES, new Set());
    runFrames(3);
    expect(frames).toHaveLength(1);
    expect(three.rendered).toBe(4);
  });

  it('never tests the brain outline for a pick, and picks a filled shape through a pale one in front of it', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes(SHAPES, NODES, new Set());
    const [, pale, filled] = SHAPES;
    three.hits = [
      { distance: 10, point: {}, object: { userData: { structureKey: pale.structureKey, fill: 'translucent', isSelected: false } } },
      { distance: 40, point: {}, object: { userData: { structureKey: filled.structureKey, fill: 'solid', isSelected: false } } },
    ];
    click(20, 20);
    expect(callbacks.onPick).toHaveBeenCalledWith(filled.structureKey);
    expect(three.pickTargets).toHaveLength(2);
    expect(three.pickTargets.map((target) => (target as { userData: { structureKey: string } }).userData.structureKey)).not.toContain(SHAPES[0].structureKey);
  });

  it('does not pick through an open cut, and treats a drag as a drag', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes(SHAPES, NODES, new Set());
    renderer.setSlice({ axis: 'back_front', positionMm: 0 });
    expect(three.renderers[0].clippingPlanes).toHaveLength(1);
    three.hits = [{ distance: 10, point: { hidden: true }, object: { userData: { structureKey: 'a:filled', fill: 'solid', isSelected: false } } }];
    click(20, 20);
    expect(callbacks.onPick).toHaveBeenLastCalledWith(null);
    canvas.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0, clientY: 0 }));
    canvas.dispatchEvent(new MouseEvent('pointerup', { clientX: 60, clientY: 0 }));
    expect(callbacks.onPick).toHaveBeenCalledTimes(1);
    renderer.setSlice(null);
    expect(three.renderers[0].clippingPlanes).toHaveLength(0);
  });

  it('leaves an ordinary wheel to the page, zooms with Ctrl or Command, and lets go at the end of the range', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    const wheel = (init: WheelEventInit): WheelEvent => { const event = new WheelEvent('wheel', { cancelable: true, ...init }); canvas.dispatchEvent(event); return event; };
    expect(wheel({ deltaY: 100 }).defaultPrevented).toBe(false);
    const before = renderer.distance();
    expect(wheel({ deltaY: 100, ctrlKey: true }).defaultPrevented).toBe(true);
    expect(renderer.distance()).toBeGreaterThan(before);
    expect(wheel({ deltaY: -100, metaKey: true }).defaultPrevented).toBe(true);
    for (let step = 0; step < 80; step += 1) wheel({ deltaY: 400, ctrlKey: true });
    expect(wheel({ deltaY: 400, ctrlKey: true }).defaultPrevented).toBe(false);
  });

  it('marks a selected shape with line brackets and adds no second surface to it', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes(SHAPES, NODES, new Set([SHAPES[1].structureKey]), [[SHAPES[1].structureKey]]);
    three.hits = [];
    click(5, 5);
    const drawn = three.pickTargets as Array<{ kind: string }>;
    expect(drawn.every((target) => target.kind === 'mesh')).toBe(true);
    renderer.dispose();
    // Three shapes, one of them selected: its brackets add one line geometry and one line material, and no mesh.
    expect(three.disposed.filter((kind) => kind === 'material')).toHaveLength(SHAPES.length + 1);
  });

  it('draws one bracket set around a region made of many shapes, not one per shape', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    const regionKeys = [SHAPES[1].structureKey, SHAPES[2].structureKey];
    renderer.setShapes(SHAPES, NODES, new Set(regionKeys), [regionKeys]);
    renderer.dispose();
    // Two selected shapes in one region: one line material for the one bracket set, beside the three fills.
    expect(three.disposed.filter((kind) => kind === 'material')).toHaveLength(SHAPES.length + 1);
  });

  it('reports which way is left as the camera turns', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes(SHAPES, NODES, new Set());
    runFrames(1);
    const first = callbacks.onCameraTurn.mock.calls.at(-1)?.[0];
    expect(first.left[0]).toBeLessThan(0);
    renderer.setView('front');
    runFrames(1);
    expect(callbacks.onCameraTurn.mock.calls.at(-1)?.[0].left[0]).toBeGreaterThan(0);
  });
});
