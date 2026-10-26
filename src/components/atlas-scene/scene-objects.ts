/**
 * Builds the three.js objects for the shapes the view draws. It decides
 * nothing: fill, colour, size mark, what is pickable and the selection mark all
 * arrive already chosen (scene-drawing.ts), and this turns them into objects.
 * The three marks stay on three channels: the fill is the mesh's material, the
 * size mark is a ring, the selection is corner brackets (scene-marks.ts draws
 * one set around everything selected together, from each shape's box here).
 */

import {
  BufferAttribute, BufferGeometry, DoubleSide, Float32BufferAttribute, FrontSide, Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, MeshLambertMaterial,
  RingGeometry, SphereGeometry, type Material, type Object3D,
} from 'three';
import type { DecodedNode } from '@/lib/anatomy/decode-glb';
import { positionsToScene, rasToScene } from '@/lib/anatomy/ras-to-scene';
import { DRAW_ORDER, RING_OUTER_MM, SELECTION_COLOUR, isPickable, materialParamsFor, ringParamsFor, selectionBrackets, type Box, type RingParams } from '@/lib/atlas-explorer/scene-drawing';
import type { SceneShape } from '@/lib/atlas-explorer/scene-shapes';

/** How many segments a whole turn of a ring is drawn in; an arc gets its share of them, never fewer than three, which is three.js's own floor. */
const RING_SEGMENTS_PER_TURN = 48;
const RING_MIN_SEGMENTS = 3;
const RING_DOT_SEGMENTS = 16;
const PICK_RADIUS_MM = 3.5;
const PICK_SEGMENTS = 8;

export interface ShapeObjects {
  shape: SceneShape;
  group: Group;
  /** What a click is tested against. Empty for the brain outline, which is never picked. */
  pickTargets: Mesh[];
  /** Marker rings, turned to face the camera before each frame. Each is one group, so its arcs and centre turn together. */
  billboards: Object3D[];
  /** The box around what is drawn for the shape, in scene axes: its mesh, or its marker ring. Null when neither is drawn. */
  box: Box | null;
}

export function buildGeometry(node: DecodedNode): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positionsToScene(node.positionsMm), 3));
  geometry.setIndex(new BufferAttribute(node.indices, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}

function fillMaterial(shape: SceneShape, isCut: boolean): Material {
  const params = materialParamsFor(shape, isCut);
  const shared = { color: params.colour, transparent: params.opacity < 1, opacity: params.opacity, depthWrite: params.writesDepth, side: params.isDoubleSided ? DoubleSide : FrontSide };
  return params.shading === 'flat' ? new MeshBasicMaterial({ ...shared, wireframe: params.isWireframe }) : new MeshLambertMaterial(shared);
}

/** Corner brackets around a box given in scene axes: lines only, drawn over everything so the mark is never hidden. */
export function buildBrackets({ min, max }: Box): LineSegments {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(selectionBrackets(min, max), 3));
  const brackets = new LineSegments(geometry, new LineBasicMaterial({ color: SELECTION_COLOUR, depthTest: false, transparent: true }));
  brackets.renderOrder = DRAW_ORDER.mark;
  return brackets;
}

/**
 * Why the ring is drawn over everything, and what follows from that.
 *
 * `depthTest: false` is deliberate. The ring stands at the structure's own
 * centre, which for a coarse outline is inside the very mesh it annotates:
 * depth-testing it would hide the mark behind the thing the mark is about, and
 * for a place-only marker there is no mesh at all, so depth-testing would
 * leave that structure with nothing on screen and no sign it had been left
 * out. A mark that says "what is drawn here is approximate, or absent" is
 * worthless when the drawing can hide it, so the mark wins the depth test.
 *
 * The cost of winning it is that the ring cannot sit in the volume
 * convincingly, so it does not try: it is built to read as an overlay. Flat
 * and unlit, one constant weight, always square to the camera, drawn in arcs
 * with gaps in them -- a reticle, which no shape in an anatomy atlas resembles
 * -- and at `DRAW_ORDER.marker`, under the selection brackets and the step
 * labels, so the three overlays stack in one fixed order instead of fighting.
 */
const RING_DEPTH_TEST = false;

/**
 * The ring as a billboarded group: its arcs, and for a structure with no
 * outline at all a filled centre. One material for the whole ring, so the
 * pieces can never drift apart in colour or opacity.
 */
function buildRingMarker(params: RingParams, centre: readonly [number, number, number]): Group {
  const marker = new Group();
  const material = new MeshBasicMaterial({ color: params.colour, transparent: true, opacity: params.opacity, depthTest: RING_DEPTH_TEST, side: DoubleSide });
  const parts = params.arcs.map(([start, length]) => {
    const segments = Math.max(RING_MIN_SEGMENTS, Math.round((length / (Math.PI * 2)) * RING_SEGMENTS_PER_TURN));
    return new Mesh(new RingGeometry(params.innerMm, params.outerMm, segments, 1, start, length), material);
  });
  if (params.dotMm > 0) parts.push(new Mesh(new RingGeometry(0, params.dotMm, RING_DOT_SEGMENTS, 1), material));
  for (const part of parts) part.renderOrder = DRAW_ORDER.marker;
  marker.add(...parts);
  marker.position.set(centre[0], centre[1], centre[2]);
  marker.userData = { ringReason: params.reason };
  return marker;
}

function buildMarkerTarget(centre: readonly [number, number, number]): Mesh {
  const target = new Mesh(new SphereGeometry(PICK_RADIUS_MM, PICK_SEGMENTS, PICK_SEGMENTS), new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  target.position.set(centre[0], centre[1], centre[2]);
  return target;
}

/** @param geometry the shape's mesh, or null for a structure the atlas marks with a ring alone */
export function buildShapeObjects(shape: SceneShape, geometry: BufferGeometry | null, isSelected: boolean, isCut: boolean): ShapeObjects {
  const objects: ShapeObjects = { shape, group: new Group(), pickTargets: [], billboards: [], box: null };
  const centre = rasToScene(shape.centroidMm);
  if (geometry !== null) {
    const mesh = new Mesh(geometry, fillMaterial(shape, isCut));
    mesh.renderOrder = materialParamsFor(shape, isCut).drawOrder;
    objects.group.add(mesh);
    if (isPickable(shape)) objects.pickTargets.push(mesh);
    const box = geometry.boundingBox;
    if (box !== null) objects.box = { min: box.min.toArray(), max: box.max.toArray() };
  }
  const ring = ringParamsFor(shape);
  if (ring !== null) {
    const marker = buildRingMarker(ring, centre);
    objects.group.add(marker);
    objects.billboards.push(marker);
  }
  if (shape.sizeMark === 'ring_only') {
    const target = buildMarkerTarget(centre);
    objects.group.add(target);
    objects.pickTargets.push(target);
    const reach = RING_OUTER_MM;
    objects.box = { min: [centre[0] - reach, centre[1] - reach, centre[2] - reach], max: [centre[0] + reach, centre[1] + reach, centre[2] + reach] };
  }
  for (const target of objects.pickTargets) target.userData = { structureKey: shape.structureKey, fill: shape.fill, isSelected };
  return objects;
}

/**
 * Everything a shape's objects own that must be freed with them: every geometry
 * but the shared mesh geometry, and every material. Each is listed once,
 * however many of the shape's pieces share it, as a ring's arcs share theirs.
 */
export function listDisposables(objects: ShapeObjects, sharedGeometry: BufferGeometry | null): Array<{ dispose: () => void }> {
  const owned = new Set<{ dispose: () => void }>();
  objects.group.traverse((object: Object3D) => {
    const drawn = object as Partial<Mesh>;
    if (drawn.geometry !== undefined && drawn.geometry !== sharedGeometry) owned.add(drawn.geometry);
    if (drawn.material !== undefined) for (const material of Array.isArray(drawn.material) ? drawn.material : [drawn.material]) owned.add(material);
  });
  return [...owned];
}
