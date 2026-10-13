/**
 * Builds the three.js objects for the shapes the view draws. It decides
 * nothing: fill, colour and size mark arrive already chosen in each SceneShape,
 * and this turns them into materials. The three marks stay on three channels:
 * the fill is the mesh's material, the size mark is a ring, the selection is a
 * shell behind the mesh.
 */

import {
  BackSide, BufferAttribute, BufferGeometry, CircleGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, MeshLambertMaterial, RingGeometry, SphereGeometry,
  type Material,
} from 'three';
import type { DecodedNode } from '@/lib/anatomy/decode-glb';
import { positionsToScene, rasToScene } from '@/lib/anatomy/ras-to-scene';
import { NEUTRAL_COLOUR, type SceneShape } from '@/lib/atlas-explorer/scene-shapes';

/** The outline of a selected shape. Unlike every fill colour, so it reads as a different kind of mark. */
export const SELECTION_COLOUR = '#ff9f1c';
const OUTLINE_LAYER = 'outline';
const TRANSLUCENT_OPACITY = 0.24;
const NEUTRAL_OPACITY = 0.14;
const BRAIN_OUTLINE_OPACITY = 0.1;
const LINES_OPACITY = 0.45;
const SHELL_SCALE = 1.045;
/** Nominal sizes in millimetres. A ring marks a place; its size says nothing about the structure's. */
const RING_INNER_MM = 2.4;
const RING_OUTER_MM = 3.2;
const RING_SEGMENTS = 32;
const HALO_RADIUS_MM = 5;
const PICK_RADIUS_MM = 3.5;
const PICK_SEGMENTS = 8;
/** Draw order: fills first, then see-through things, then rings on top so a marker is never buried. */
const ORDER = { fill: 0, translucent: 1, brainOutline: 2, shell: -1, ring: 3 } as const;

export interface ShapeObjects {
  shape: SceneShape;
  group: Group;
  /** What a click is tested against. Empty for the brain outline, which is never picked. */
  pickTargets: Mesh[];
  /** Rings and halos, turned to face the camera before each frame. */
  billboards: Mesh[];
}

export function buildGeometry(node: DecodedNode): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positionsToScene(node.positionsMm), 3));
  geometry.setIndex(new BufferAttribute(node.indices, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}

function fillMaterial(shape: SceneShape): Material {
  if (shape.layer === OUTLINE_LAYER) return new MeshLambertMaterial({ color: NEUTRAL_COLOUR, transparent: true, opacity: BRAIN_OUTLINE_OPACITY, depthWrite: false, side: DoubleSide });
  if (shape.fill === 'solid') return new MeshLambertMaterial({ color: shape.colour });
  if (shape.fill === 'lines') return new MeshBasicMaterial({ color: NEUTRAL_COLOUR, wireframe: true, transparent: true, opacity: LINES_OPACITY });
  const opacity = shape.fill === 'translucent' ? TRANSLUCENT_OPACITY : NEUTRAL_OPACITY;
  return new MeshLambertMaterial({ color: NEUTRAL_COLOUR, transparent: true, opacity, depthWrite: false });
}

function renderOrderOf(shape: SceneShape): number {
  if (shape.layer === OUTLINE_LAYER) return ORDER.brainOutline;
  return shape.fill === 'solid' ? ORDER.fill : ORDER.translucent;
}

function flatMark(geometry: BufferGeometry, colour: string, opacity: number, centre: readonly [number, number, number]): Mesh {
  const mark = new Mesh(geometry, new MeshBasicMaterial({ color: colour, transparent: true, opacity, depthTest: false, side: DoubleSide }));
  mark.position.set(centre[0], centre[1], centre[2]);
  mark.renderOrder = ORDER.ring;
  return mark;
}

/** A selected mesh gets a slightly larger copy drawn inside out behind it: a rim, with no lines across the surface. */
function buildShell(geometry: BufferGeometry): Mesh {
  const shell = new Mesh(geometry, new MeshBasicMaterial({ color: SELECTION_COLOUR, side: BackSide }));
  const centre = geometry.boundingBox?.getCenter(shell.position.clone());
  if (centre !== undefined) shell.position.copy(centre.multiplyScalar(1 - SHELL_SCALE));
  shell.scale.setScalar(SHELL_SCALE);
  shell.renderOrder = ORDER.shell;
  return shell;
}

/** @param geometry the shape's mesh, or null for a structure the atlas marks with a ring alone */
export function buildShapeObjects(shape: SceneShape, geometry: BufferGeometry | null, isSelected: boolean): ShapeObjects {
  const group = new Group();
  const centre = rasToScene(shape.centroidMm);
  const objects: ShapeObjects = { shape, group, pickTargets: [], billboards: [] };
  if (geometry !== null) {
    const mesh = new Mesh(geometry, fillMaterial(shape));
    mesh.renderOrder = renderOrderOf(shape);
    group.add(mesh);
    if (shape.layer !== OUTLINE_LAYER) objects.pickTargets.push(mesh);
    if (isSelected) group.add(buildShell(geometry));
  }
  if (shape.sizeMark !== 'mesh') {
    const ring = flatMark(new RingGeometry(RING_INNER_MM, RING_OUTER_MM, RING_SEGMENTS), shape.fill === 'solid' ? shape.colour : NEUTRAL_COLOUR, 1, centre);
    group.add(ring);
    objects.billboards.push(ring);
  }
  if (shape.sizeMark === 'ring_only') {
    const target = new Mesh(new SphereGeometry(PICK_RADIUS_MM, PICK_SEGMENTS, PICK_SEGMENTS), new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    target.position.set(centre[0], centre[1], centre[2]);
    group.add(target);
    objects.pickTargets.push(target);
    if (isSelected) {
      const halo = flatMark(new CircleGeometry(HALO_RADIUS_MM, RING_SEGMENTS), SELECTION_COLOUR, 0.4, centre);
      group.add(halo);
      objects.billboards.push(halo);
    }
  }
  for (const target of objects.pickTargets) target.userData.structureKey = shape.structureKey;
  return objects;
}

/** Frees what a shape's objects own. Mesh geometry is shared and cached, so only the marks' own geometry goes. */
export function disposeShapeObjects(objects: ShapeObjects, sharedGeometry: BufferGeometry | null): void {
  objects.group.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    if (object.geometry !== sharedGeometry) object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
  });
}
