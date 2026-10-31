/**
 * A stand-in for three.js that keeps what was built: every object, its kind,
 * its geometry's attributes and its material's settings. Tests read the scene
 * back from it to check what the drawing code made, with no WebGL.
 */

type Numbers = ArrayLike<number>;

export class StandInAttribute {
  constructor(public array: Numbers, public itemSize: number) {}
}

export class StandInGeometry {
  attributes: Record<string, StandInAttribute> = {};
  index: StandInAttribute | null = null;
  boundingBox: { min: { toArray: () => number[] }; max: { toArray: () => number[] } } | null = null;
  isDisposed = false;
  /** Set if any code asks to draw only part of the geometry. */
  drawRangeCalls = 0;
  /** How many vertices the last such request asked for. */
  drawCount = 0;
  setAttribute(name: string, attribute: StandInAttribute): void { this.attributes[name] = attribute; }
  setIndex(attribute: StandInAttribute): void { this.index = attribute; }
  setDrawRange(_start: number, count: number): void { this.drawRangeCalls += 1; this.drawCount = count; }
  computeVertexNormals(): void { /* no shading in the stand-in */ }
  computeBoundingBox(): void {
    const positions = Array.from(this.attributes.position?.array ?? []);
    const along = (axis: number): number[] => positions.filter((_value, at) => at % 3 === axis);
    const corner = (pick: (...values: number[]) => number): number[] => [0, 1, 2].map((axis) => (along(axis).length === 0 ? 0 : pick(...along(axis))));
    this.boundingBox = { min: { toArray: () => corner(Math.min) }, max: { toArray: () => corner(Math.max) } };
  }
  dispose(): void { this.isDisposed = true; }
}

/** A colour as the renderer touches it: set from a hex string, read back without the hash. */
export class StandInColour {
  private hex: string;
  constructor(colour = '#000000') { this.hex = colour.replace('#', '').toLowerCase(); }
  set(colour: string): void { this.hex = colour.replace('#', '').toLowerCase(); }
  getHexString(): string { return this.hex; }
}

export class StandInMaterial {
  opacity = 1;
  transparent = false;
  isDisposed = false;
  map?: { dispose: () => void };
  /** The material's colour as three.js holds it, from the `color` it was made with; `params.color` keeps the value it was made with. */
  color: StandInColour;
  constructor(public params: Record<string, unknown> = {}) {
    const { color, ...rest } = params;
    Object.assign(this, rest);
    this.color = new StandInColour(typeof color === 'string' ? color : '#000000');
  }
  dispose(): void { this.isDisposed = true; }
}

/** A lit material, as three.js's MeshLambertMaterial: it can glow, with black and full intensity meaning no glow, as three.js defaults them. */
export class StandInLitMaterial extends StandInMaterial {
  emissive = new StandInColour();
  emissiveIntensity = 1;
}

class Vector {
  constructor(public x = 0, public y = 0, public z = 0) {}
  set(x: number, y: number, z: number): void { Object.assign(this, { x, y, z }); }
}

export class StandInObject {
  kind = 'group';
  visible = true;
  children: StandInObject[] = [];
  userData: Record<string, unknown> = {};
  renderOrder = 0;
  position = new Vector();
  scale = new Vector(1, 1, 1);
  quaternion = { copy: () => undefined };
  geometry?: StandInGeometry;
  material?: StandInMaterial;
  add(...objects: StandInObject[]): void { this.children.push(...objects); }
  remove(object: StandInObject): void { this.children = this.children.filter((child) => child !== object); }
  traverse(visit: (object: StandInObject) => void): void { visit(this); for (const child of this.children) child.traverse(visit); }
}

class Drawn extends StandInObject {
  constructor(kind: string, geometry: StandInGeometry | undefined, material: StandInMaterial) {
    super();
    Object.assign(this, { kind, geometry, material });
  }
}

/** What the stand-in recorded. `scenes` holds every scene made, so a test can walk what is in it. */
export const standIn = { scenes: [] as StandInObject[], hits: [] as unknown[], pickTargets: [] as StandInObject[], rendered: 0 };

export function resetStandIn(): void {
  Object.assign(standIn, { scenes: [], hits: [], pickTargets: [], rendered: 0 });
}

/** Everything in the scene, flattened. */
export function listSceneObjects(): StandInObject[] {
  const found: StandInObject[] = [];
  for (const scene of standIn.scenes) scene.traverse((object) => found.push(object));
  return found;
}

export function createThreeStandIn(): Record<string, unknown> {
  class Scene extends StandInObject { constructor() { super(); standIn.scenes.push(this); } }
  class Mesh extends Drawn { constructor(geometry: StandInGeometry, material: StandInMaterial) { super('mesh', geometry, material); } }
  class LineSegments extends Drawn { constructor(geometry: StandInGeometry, material: StandInMaterial) { super('lines', geometry, material); } }
  class Sprite extends Drawn { constructor(material: StandInMaterial) { super('sprite', undefined, material); } }
  class Camera extends StandInObject {
    aspect = 1;
    lookAt(): void { /* the pose arithmetic is tested on its own */ }
    updateProjectionMatrix(): void { /* nothing to project */ }
  }
  class OrthographicCamera extends Camera {
    constructor(public left = 0, public right = 0, public top = 0, public bottom = 0) { super(); }
  }
  class WebGLRenderer {
    clippingPlanes: unknown[] = [];
    autoClear = true;
    setPixelRatio(): void { /* no pixels */ }
    setSize(): void { /* no pixels */ }
    render(): void { standIn.rendered += 1; }
    dispose(): void { /* nothing held */ }
    forceContextLoss(): void { /* no context */ }
  }
  class Raycaster {
    setFromCamera(): void { /* the pointer mapping is tested on its own */ }
    intersectObjects(targets: StandInObject[]): unknown[] { standIn.pickTargets = targets; return standIn.hits; }
  }
  class Plane { distanceToPoint(): number { return 1; } }
  class CanvasTexture { constructor(public image: unknown) {} dispose(): void { /* nothing held */ } }
  return {
    BufferAttribute: StandInAttribute, Float32BufferAttribute: StandInAttribute, BufferGeometry: StandInGeometry, RingGeometry: StandInGeometry, SphereGeometry: StandInGeometry,
    DoubleSide: 2, FrontSide: 0, BackSide: 1, Group: StandInObject, Scene, DirectionalLight: StandInObject, HemisphereLight: StandInObject, PerspectiveCamera: Camera, OrthographicCamera,
    Mesh, LineSegments, Sprite, SpriteMaterial: StandInMaterial, CanvasTexture, MeshBasicMaterial: StandInMaterial, MeshLambertMaterial: StandInLitMaterial, LineBasicMaterial: StandInMaterial,
    WebGLRenderer, Raycaster, Plane, Vector2: Vector, Vector3: Vector,
  };
}
