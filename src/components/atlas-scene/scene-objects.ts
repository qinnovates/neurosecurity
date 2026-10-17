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
import { DRAW_ORDER, SELECTION_COLOUR, isPickable, materialParamsFor, selectionBrackets, type Box } from '@/lib/atlas-explorer/scene-drawing';
import { NEUTRAL_COLOUR, type SceneShape } from '@/lib/atlas-explorer/scene-shapes';

/** Nominal sizes in millimetres. A ring marks a place; its size says nothing about the structure's. */
const RING_INNER_MM = 2.4;
const RING_OUTER_MM = 3.2;
const RING_SEGMENTS = 32;
const PICK_RADIUS_MM = 3.5;
const PICK_SEGMENTS = 8;

export interface ShapeObjects {
  shape: SceneShape;
  group: Group;
  /** What a click is tested against. Empty for the brain outline, which is never picked. */
  pickTargets: Mesh[];
  /** Rings, turned to face the camera before each frame. */
  billboards: Mesh[];
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

function buildRing(shape: SceneShape, centre: readonly [number, number, number]): Mesh {
  const colour = shape.fill === 'solid' ? shape.colour : NEUTRAL_COLOUR;
  const ring = new Mesh(new RingGeometry(RING_INNER_MM, RING_OUTER_MM, RING_SEGMENTS), new MeshBasicMaterial({ color: colour, transparent: true, depthTest: false, side: DoubleSide }));
  ring.position.set(centre[0], centre[1], centre[2]);
  ring.renderOrder = DRAW_ORDER.mark;
  return ring;
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
  if (shape.sizeMark !== 'mesh') {
    const ring = buildRing(shape, centre);
    objects.group.add(ring);
    objects.billboards.push(ring);
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

/** Everything a shape's objects own that must be freed with them: every geometry but the shared mesh geometry, and every material. */
export function listDisposables(objects: ShapeObjects, sharedGeometry: BufferGeometry | null): Array<{ dispose: () => void }> {
  const owned: Array<{ dispose: () => void }> = [];
  objects.group.traverse((object: Object3D) => {
    const drawn = object as Partial<Mesh>;
    if (drawn.geometry !== undefined && drawn.geometry !== sharedGeometry) owned.push(drawn.geometry);
    if (drawn.material !== undefined) owned.push(...(Array.isArray(drawn.material) ? drawn.material : [drawn.material]));
  });
  return owned;
}
