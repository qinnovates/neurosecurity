/**
 * Draws the selection's corner brackets. They are a flat overlay in canvas
 * pixels, drawn after the scene in a scene of their own, so they keep their
 * size at any zoom, stand over everything and are not touched by an open cut.
 * Where they go is decided in selection-marks.ts; this turns rectangles into
 * triangles on the GPU, in the two inks the surface gives them.
 */

import { BufferAttribute, BufferGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, OrthographicCamera, Scene, type Plane, type WebGLRenderer } from 'three';
import { SURFACE_INK } from '@/lib/atlas-explorer/scene-drawing';
import type { SceneTheme } from '@/lib/atlas-explorer/scene-shapes';
import { BRACKET_HALO_PX, BRACKET_VERTEX_COUNT, buildBracketPositions, type ScreenRect } from '@/lib/atlas-explorer/selection-marks';

/** More separate selections than the atlas has regions. Past it, the first ones are marked. */
const MAX_BRACKETS = 64;
const VALUES_PER_VERTEX = 3;
const NEAR = -1;
const FAR = 1;
const NO_PLANES: Plane[] = [];
/** Marks the group for anything that needs to find it in the scene. */
const BRACKETS_USER_DATA = { selectionBrackets: true };

export interface SelectionBrackets {
  /** The rectangles to bracket, in canvas pixels. */
  setRects: (rects: readonly ScreenRect[]) => void;
  setSize: (widthPx: number, heightPx: number) => void;
  setTheme: (theme: SceneTheme) => void;
  /** Draws them over what the renderer last drew. */
  render: (renderer: WebGLRenderer) => void;
  dispose: () => void;
}

/** One ink of the brackets: a mesh and the positions it draws, rewritten as the camera moves. */
interface BracketLayer { mesh: Mesh<BufferGeometry, MeshBasicMaterial>; positions: BufferAttribute }

function buildLayer(ink: string, drawOrder: number): BracketLayer {
  const geometry = new BufferGeometry();
  const positions = new BufferAttribute(new Float32Array(MAX_BRACKETS * BRACKET_VERTEX_COUNT * VALUES_PER_VERTEX), VALUES_PER_VERTEX);
  geometry.setAttribute('position', positions);
  geometry.setDrawRange(0, 0);
  const mesh = new Mesh(geometry, new MeshBasicMaterial({ color: ink, depthTest: false, depthWrite: false, side: DoubleSide }));
  mesh.renderOrder = drawOrder;
  // The rectangles change every frame the camera moves; the bounds three.js would cull by do not follow them.
  mesh.frustumCulled = false;
  return { mesh, positions };
}

function writeLayer({ mesh, positions }: BracketLayer, rects: readonly ScreenRect[], growPx: number): void {
  const triangles = buildBracketPositions(rects.slice(0, MAX_BRACKETS), growPx);
  (positions.array as Float32Array).set(triangles);
  positions.needsUpdate = true;
  mesh.geometry.setDrawRange(0, triangles.length / VALUES_PER_VERTEX);
}

export function createSelectionBrackets(theme: SceneTheme): SelectionBrackets {
  const halo = buildLayer(SURFACE_INK[theme].selectionHalo, 0);
  const ink = buildLayer(SURFACE_INK[theme].selection, 1);
  const group = new Group();
  group.userData = BRACKETS_USER_DATA;
  group.add(halo.mesh, ink.mesh);
  const overlay = new Scene();
  overlay.add(group);
  const camera = new OrthographicCamera(0, 1, 1, 0, NEAR, FAR);
  return {
    setRects(rects) {
      writeLayer(halo, rects, BRACKET_HALO_PX);
      writeLayer(ink, rects, 0);
    },
    setSize(widthPx, heightPx) {
      camera.right = widthPx;
      camera.top = heightPx;
      camera.updateProjectionMatrix();
    },
    setTheme(next) {
      halo.mesh.material.color.set(SURFACE_INK[next].selectionHalo);
      ink.mesh.material.color.set(SURFACE_INK[next].selection);
    },
    render(renderer) {
      const { clippingPlanes, autoClear } = renderer;
      // A cut is in the brain's own axes and would slice a flat overlay wherever it happens to lie.
      Object.assign(renderer, { clippingPlanes: NO_PLANES, autoClear: false });
      renderer.render(overlay, camera);
      Object.assign(renderer, { clippingPlanes, autoClear });
    },
    dispose() {
      for (const { mesh } of [halo, ink]) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
    },
  };
}
