// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DecodedNode } from '@/lib/anatomy/decode-glb';
import { BRAIN_OUTLINE_OPACITY, FILL_OPACITY, materialParamsFor } from '@/lib/atlas-explorer/scene-drawing';
import type { SceneShape } from '@/lib/atlas-explorer/scene-shapes';
import { BRACKET_VERTEX_COUNT, DIMMED_OPACITY } from '@/lib/atlas-explorer/selection-marks';

/** What the stand-in three.js recorded: enough to see what the renderer built, tested and released. */
const three = vi.hoisted(() => ({
  disposed: [] as string[], rendered: 0, contextLosses: 0, pickTargets: [] as unknown[], hits: [] as unknown[], renderers: [] as Array<{ clippingPlanes: unknown[] }>,
  scenes: [] as Array<{ traverse: (visit: (object: DrawnObject) => void) => void }>, clipCounts: [] as Array<{ isOverlay: boolean; planes: number }>,
}));

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
  class Scene extends Object3D { constructor() { super(); three.scenes.push(this as never); } }
  class Drawn extends Object3D {
    constructor(public kind: string, public geometry: BufferGeometry, public material: Material) { super(); }
  }
  class Mesh extends Drawn { constructor(geometry: BufferGeometry, material: Material) { super('mesh', geometry, material); } }
  class LineSegments extends Drawn { constructor(geometry: BufferGeometry, material: Material) { super('lines', geometry, material); } }
  class BufferGeometry {
    boundingBox: { min: { toArray: () => number[] }; max: { toArray: () => number[] } } | null = null;
    drawCount = 0;
    setDrawRange(_start: number, count: number): void { this.drawCount = count; }
    setAttribute(): void { /* positions are not inspected here */ }
    setIndex(): void { /* indices are not inspected here */ }
    computeVertexNormals(): void { /* no shading in the stand-in */ }
    computeBoundingBox(): void { this.boundingBox = { min: { toArray: () => [0, 0, 0] }, max: { toArray: () => [10, 10, 10] } }; }
    dispose(): void { three.disposed.push('geometry'); }
  }
  class Colour {
    private hex: string;
    constructor(colour: string) { this.hex = colour.replace('#', '').toLowerCase(); }
    set(colour: string): void { this.hex = colour.replace('#', '').toLowerCase(); }
    getHexString(): string { return this.hex; }
  }
  class Material {
    opacity = 1;
    transparent = false;
    color: Colour;
    constructor(public params: Record<string, unknown> = {}) {
      const { color, ...rest } = params;
      Object.assign(this, rest);
      this.color = new Colour(typeof color === 'string' ? color : '#000000');
    }
    dispose(): void { three.disposed.push('material'); }
  }
  class PerspectiveCamera extends Object3D {
    aspect = 1;
    lookAt(): void { /* the pose arithmetic is tested on its own */ }
    updateProjectionMatrix(): void { /* nothing to project in the stand-in */ }
  }
  class OrthographicCamera extends PerspectiveCamera {
    constructor(public left = 0, public right = 0, public top = 0, public bottom = 0) { super(); }
  }
  class WebGLRenderer {
    clippingPlanes: unknown[] = [];
    autoClear = true;
    constructor() { three.renderers.push(this); }
    setPixelRatio(): void { /* no pixels */ }
    setSize(): void { /* no pixels */ }
    render(scene: Object3D, camera: unknown): void { three.rendered += 1; three.clipCounts.push({ isOverlay: camera instanceof OrthographicCamera, planes: this.clippingPlanes.length }); }
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
    BufferAttribute: class { needsUpdate = false; constructor(public array: Float32Array = new Float32Array(0), public itemSize = 3) {} }, Float32BufferAttribute: class {}, BufferGeometry, RingGeometry: BufferGeometry, SphereGeometry: BufferGeometry, DoubleSide: 2, FrontSide: 0, BackSide: 1,
    Sprite: Object3D, SpriteMaterial: Material, CanvasTexture: class {},
    Group: Object3D, Scene, DirectionalLight: Object3D, HemisphereLight: Object3D, PerspectiveCamera, OrthographicCamera, Mesh, LineSegments,
    MeshBasicMaterial: Material, MeshLambertMaterial: Material, LineBasicMaterial: Material, WebGLRenderer, Raycaster, Plane, Vector2: Vector, Vector3: Vector,
  };
});

const { createSceneRenderer } = await import('../scene-renderer');

/** An object as a test reads it back. */
interface DrawnObject {
  kind?: string;
  visible?: boolean;
  userData: Record<string, unknown>;
  children: DrawnObject[];
  geometry?: { drawCount: number };
  material?: { opacity: number; transparent: boolean; color: { getHexString: () => string } };
}

const node = (labelId: string): DecodedNode => ({ atlas: 'a', labelId, hemisphere: 'left', positionsMm: new Float32Array(9), indices: new Uint32Array([0, 1, 2]), boundsMm: { min: [0, 0, 0], max: [1, 1, 1] } });
const shape = (labelId: string, overrides: Partial<SceneShape> = {}): SceneShape => Object.assign({
  id: `a:${labelId}:left`, structureKey: `a:${labelId}`, assetId: 'asset', layer: 'cortical', hemisphere: 'left', fill: 'translucent', colour: '#8a90a0', step: null, words: '',
  highlightColour: null, sizeMark: 'mesh', centroidMm: [0, 0, 0], mirrored: false,
} as SceneShape, overrides);
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
  Object.assign(three, { disposed: [], rendered: 0, contextLosses: 0, pickTargets: [], hits: [], renderers: [], scenes: [], clipCounts: [] });
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
    expect(listeners.map(([type]) => type).sort()).toEqual(['pointercancel', 'pointerdown', 'pointerleave', 'pointermove', 'pointerup', 'webglcontextlost', 'wheel']);
    renderer.dispose();
    expect(removed).toEqual(listeners);
    expect(three.contextLosses).toBe(1);
    expect(three.disposed.filter((kind) => kind === 'renderer')).toHaveLength(1);
    // Each shape's own, and the brackets' two: their ink and their halo.
    expect(three.disposed.filter((kind) => kind === 'material')).toHaveLength(SHAPES.length + 2);
    expect(three.disposed.filter((kind) => kind === 'geometry')).toHaveLength(SHAPES.length + 2);
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

  it('lifts the shape under the pointer, shows a pick cursor, and puts both back when the pointer leaves', () => {
    const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
    renderer.setShapes(SHAPES, NODES, new Set());
    const [, pale] = SHAPES;
    three.hits = [{ distance: 10, point: {}, object: { userData: { structureKey: pale.structureKey, fill: 'translucent', isSelected: false } } }];
    canvas.dispatchEvent(new MouseEvent('pointermove', { clientX: 20, clientY: 20 }));
    runFrames(1);
    const target = (three.pickTargets as Array<{ userData: { structureKey: string }; material: { opacity?: number; transparent?: boolean } }>).find((entry) => entry.userData.structureKey === pale.structureKey);
    expect(callbacks.onHover).toHaveBeenLastCalledWith(pale.structureKey);
    expect(canvas.getAttribute('data-pick')).toBe('shape');
    expect(target?.material.opacity).toBe(0.7);
    expect(target?.material.transparent).toBe(true);
    three.hits = [];
    canvas.dispatchEvent(new MouseEvent('pointermove', { clientX: 200, clientY: 200 }));
    runFrames(1);
    expect(callbacks.onHover).toHaveBeenLastCalledWith(null);
    expect(canvas.hasAttribute('data-pick')).toBe(false);
    expect(target?.material.opacity).toBe(FILL_OPACITY.translucent);
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

  describe('the one selection mark', () => {
    const LENS_INK = '#5b3fd0';
    const OWN_HUE = '#ff00aa';
    const MARKED = [
      shape('brain', { layer: 'outline' }), shape('empty', { fill: 'lines' }), shape('faint', { fill: 'neutral' }), shape('pale'),
      shape('filled', { fill: 'solid', colour: LENS_INK, highlightColour: OWN_HUE }), shape('other', { fill: 'solid', colour: '#aa3366' }),
    ];
    const PLACE_ONLY = shape('place', { sizeMark: 'ring_only', fill: 'lines', hemisphere: 'left' });
    const MARKED_NODES = new Map(MARKED.map((entry) => [entry.id, node(entry.id)]));
    const objectsInScenes = (): DrawnObject[] => { const found: DrawnObject[] = []; for (const scene of three.scenes) scene.traverse((object) => found.push(object)); return found; };
    const bracketGroup = (): DrawnObject | undefined => objectsInScenes().find((object) => object.userData.selectionBrackets === true);
    const bracketVertices = (): number => { const group = bracketGroup(); return group?.visible === false ? 0 : Math.max(0, ...(group?.children ?? []).map((mesh) => mesh.geometry?.drawCount ?? 0)); };
    const materialOf = (labelId: string): NonNullable<DrawnObject['material']> => {
      const mesh = objectsInScenes().find((object) => object.userData.structureKey === `a:${labelId}` && object.kind === 'mesh');
      if (mesh?.material === undefined) throw new Error(`No mesh for ${labelId}.`);
      return mesh.material;
    };
    const opened = (): ReturnType<typeof createSceneRenderer> => {
      const renderer = createSceneRenderer(canvas, callbacks, true, 'light');
      renderer.resize(800, 500);
      return renderer;
    };

    it.each([['lines', 'empty'], ['neutral', 'faint'], ['translucent', 'pale']] as const)('brackets a selected shape with a %s fill, leaves its lens colour alone, and dims the filled shapes around it', (fill, labelId) => {
      const renderer = opened();
      const entry = MARKED.find((candidate) => candidate.structureKey === `a:${labelId}`) as SceneShape;
      renderer.setShapes(MARKED, MARKED_NODES, new Set([entry.structureKey]));
      runFrames(1);
      expect(bracketGroup()).toBeDefined();
      expect(bracketVertices()).toBe(BRACKET_VERTEX_COUNT);
      const selected = materialOf(labelId);
      expect(`#${selected.color.getHexString()}`).toBe(materialParamsFor(entry, false, 'light').colour);
      expect(selected.opacity).toBe(FILL_OPACITY[fill]);
      for (const other of ['filled', 'other']) expect(materialOf(other).opacity, other).toBe(DIMMED_OPACITY);
      expect(materialOf('filled').transparent).toBe(true);
      // Dimming changes how strongly a shape is shown, never what it says.
      expect(`#${materialOf('filled').color.getHexString()}`).toBe(LENS_INK);
      // Context and see-through shapes are not what the dim is for.
      expect(objectsInScenes().some((object) => object.kind === 'mesh' && object.material?.opacity === BRAIN_OUTLINE_OPACITY)).toBe(true);
      for (const quiet of ['empty', 'faint', 'pale'].filter((name) => name !== labelId)) expect(materialOf(quiet).opacity, quiet).toBe(FILL_OPACITY[quiet === 'empty' ? 'lines' : quiet === 'faint' ? 'neutral' : 'translucent']);
    });

    it('never repaints a selected filled shape in a hue of its own, and leaves it at full strength', () => {
      const renderer = opened();
      renderer.setShapes(MARKED, MARKED_NODES, new Set(['a:filled']));
      expect(`#${materialOf('filled').color.getHexString()}`).toBe(LENS_INK);
      expect(materialOf('filled').opacity).toBe(1);
      expect(materialOf('filled').transparent).toBe(false);
      expect(materialOf('other').opacity).toBe(DIMMED_OPACITY);
    });

    it('brackets a region with no surface at its marker', () => {
      const renderer = opened();
      renderer.setShapes([...MARKED, PLACE_ONLY], MARKED_NODES, new Set([PLACE_ONLY.structureKey]));
      runFrames(1);
      expect(bracketVertices()).toBe(BRACKET_VERTEX_COUNT);
    });

    it('marks nothing and dims nothing while nothing is selected, or while nothing selected is drawn', () => {
      const renderer = opened();
      renderer.setShapes(MARKED, MARKED_NODES, new Set());
      runFrames(1);
      expect(bracketVertices()).toBe(0);
      expect(materialOf('filled').opacity).toBe(1);
      renderer.setShapes(MARKED, MARKED_NODES, new Set(['a:not-drawn']));
      runFrames(1);
      expect(bracketVertices()).toBe(0);
      expect(materialOf('filled').opacity).toBe(1);
    });

    it('draws one bracket around a group of shapes, one per group, and takes them away with the selection', () => {
      const renderer = opened();
      renderer.setShapes(MARKED, MARKED_NODES, new Set(['a:filled', 'a:pale']));
      runFrames(1);
      expect(bracketVertices()).toBe(BRACKET_VERTEX_COUNT);
      renderer.setShapes(MARKED, MARKED_NODES, new Set(['a:filled', 'a:pale']), [['a:filled'], ['a:pale']]);
      runFrames(1);
      expect(bracketVertices()).toBe(BRACKET_VERTEX_COUNT * 2);
      renderer.setShapes(MARKED, MARKED_NODES, new Set());
      runFrames(1);
      expect(bracketVertices()).toBe(0);
      expect(materialOf('other').opacity).toBe(1);
      expect(materialOf('other').transparent).toBe(false);
    });

    it('changes the selection on the objects already drawn, so a click rebuilds nothing', () => {
      const renderer = opened();
      renderer.setShapes(MARKED, MARKED_NODES, new Set());
      const before = materialOf('filled');
      three.disposed = [];
      renderer.setShapes(MARKED, MARKED_NODES, new Set(['a:pale']));
      expect(materialOf('filled')).toBe(before);
      expect(three.disposed).toEqual([]);
      const pale = objectsInScenes().find((object) => object.userData.structureKey === 'a:pale');
      expect(pale?.userData.isSelected).toBe(true);
    });

    it('gives the shape under the pointer no lift while it is selected, and a dimmed one a lift short of full strength', () => {
      const renderer = opened();
      renderer.setShapes(MARKED, MARKED_NODES, new Set(['a:filled']));
      const hover = (labelId: string): void => {
        const mesh = objectsInScenes().find((object) => object.userData.structureKey === `a:${labelId}`);
        three.hits = [{ distance: 10, point: {}, object: mesh }];
        canvas.dispatchEvent(new MouseEvent('pointermove', { clientX: 20, clientY: 20 }));
        runFrames(1);
      };
      hover('filled');
      expect(callbacks.onHover).toHaveBeenLastCalledWith('a:filled');
      expect(materialOf('filled').opacity).toBe(1);
      expect(`#${materialOf('filled').color.getHexString()}`).toBe(LENS_INK);
      hover('other');
      expect(materialOf('other').opacity).toBeGreaterThan(DIMMED_OPACITY);
      expect(materialOf('other').opacity).toBeLessThan(1);
      three.hits = [];
      canvas.dispatchEvent(new MouseEvent('pointermove', { clientX: 200, clientY: 200 }));
      runFrames(1);
      expect(materialOf('other').opacity).toBe(DIMMED_OPACITY);
    });

    it('draws the brackets over an open cut, not through it, and leaves the cut on the shapes', () => {
      const renderer = opened();
      renderer.setShapes(MARKED, MARKED_NODES, new Set(['a:pale']));
      renderer.setSlice({ axis: 'back_front', positionMm: 0 });
      three.clipCounts = [];
      runFrames(1);
      expect(three.clipCounts).toEqual([{ isOverlay: false, planes: 1 }, { isOverlay: true, planes: 0 }]);
      expect(three.renderers[0].clippingPlanes).toHaveLength(1);
    });

    it('frees what it drew once, however many selections it has shown', () => {
      const renderer = opened();
      renderer.setShapes(MARKED, MARKED_NODES, new Set(['a:pale']));
      renderer.setShapes(MARKED, MARKED_NODES, new Set(['a:filled']));
      renderer.setShapes(MARKED, MARKED_NODES, new Set());
      renderer.dispose();
      expect(three.disposed.filter((kind) => kind === 'material')).toHaveLength(MARKED.length + 2);
    });
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
