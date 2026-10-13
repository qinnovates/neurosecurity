/**
 * Draws the scene. It holds the WebGL renderer, the camera and the objects,
 * redraws only when something changed, and reports picks, hovers and camera
 * turns back to the page. It decides nothing about meaning: which shapes exist,
 * how each is filled and what is selected all arrive from outside.
 *
 * Nothing here moves in proportion to a score and nothing travels along a
 * path. The only motion is the camera's: a move to a view, and a slow idle
 * turn that ends at the first touch and never starts under reduced motion.
 */

import {
  DirectionalLight, HemisphereLight, type Mesh, PerspectiveCamera, Plane, Raycaster, Scene, Vector2, Vector3, WebGLRenderer, type BufferGeometry,
} from 'three';
import { axisDirectionsFor, choosePick, idleTurnSpeed, pointerToNdc, type AxisDirections, type PickHit } from '@/lib/atlas-explorer/scene-drawing';
import type { DecodedNode } from '@/lib/anatomy/decode-glb';
import { rasToScene } from '@/lib/anatomy/ras-to-scene';
import {
  DEFAULT_CAMERA_VIEW, DEFAULT_DISTANCE_MM, blendPoses, clampDistance, planCameraMove, poseForView, positionOfPose, turnPose, type CameraViewId, type OrbitPose,
} from '@/lib/atlas-explorer/camera-views';
import type { SceneShape } from '@/lib/atlas-explorer/scene-shapes';
import { slicePlane, type SliceState } from '@/lib/atlas-explorer/slice-plane';
import { buildGeometry, buildShapeObjects, listDisposables, type ShapeObjects } from './scene-objects';

export type { AxisDirections };

export interface SceneCallbacks {
  /** A click that was not a drag. Null when it landed on nothing. */
  onPick: (structureKey: string | null) => void;
  onHover: (structureKey: string | null) => void;
  onCameraTurn: (directions: AxisDirections) => void;
  onContextLost: () => void;
}

export interface SceneRenderer {
  setShapes: (shapes: readonly SceneShape[], nodesByShapeId: ReadonlyMap<string, DecodedNode>, selectedKeys: ReadonlySet<string>) => void;
  setSlice: (slice: SliceState | null) => void;
  setView: (viewId: CameraViewId) => void;
  focusOn: (centreScene: readonly [number, number, number]) => void;
  zoomTo: (distance: number) => void;
  turnBy: (azimuth: number) => void;
  tiltBy: (polar: number) => void;
  distance: () => number;
  resize: (width: number, height: number) => void;
  dispose: () => void;
}

const FIELD_OF_VIEW = 32;
const NEAR_MM = 5;
const FAR_MM = 2000;
const MAX_PIXEL_RATIO = 2;
const DRAG_RADIANS_PER_PIXEL = 0.006;
const WHEEL_ZOOM_PER_PIXEL = 0.0015;
/** A pointer that moved less than this between press and release was a click, not a drag. */
const CLICK_SLOP_PX = 4;

function easeOut(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

/** @throws when the browser gives no WebGL context; the caller shows the "not available" notice */
export function createSceneRenderer(canvas: HTMLCanvasElement, callbacks: SceneCallbacks, prefersLessMotion: boolean): SceneRenderer {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  const scene = new Scene();
  const camera = new PerspectiveCamera(FIELD_OF_VIEW, 1, NEAR_MM, FAR_MM);
  const headlight = new DirectionalLight('#ffffff', 1.6);
  camera.add(headlight);
  scene.add(camera, new HemisphereLight('#ffffff', '#5a6070', 1.5));

  const geometries = new Map<string, BufferGeometry>();
  let objects: ShapeObjects[] = [];
  let pose: OrbitPose = poseForView(DEFAULT_CAMERA_VIEW, [0, 0, 0], DEFAULT_DISTANCE_MM);
  /** The middle of the brain outline: what every named view looks at. */
  let home: readonly [number, number, number] = [0, 0, 0];
  let move: { from: OrbitPose; to: OrbitPose; startedAt: number; durationMs: number } | null = null;
  const idleSpeed = idleTurnSpeed(prefersLessMotion);
  let isIdleTurning = idleSpeed > 0;
  let lastFrameAt = 0;
  let frame = 0;
  let hoverPoint: { x: number; y: number } | null = null;
  let hoveredKey: string | null = null;
  let press: { x: number; y: number; pointerId: number } | null = null;
  let clip: Plane | null = null;
  let drawn: { shapes: readonly SceneShape[]; nodesByShapeId: ReadonlyMap<string, DecodedNode>; selectedKeys: ReadonlySet<string> } | null = null;
  const raycaster = new Raycaster();

  const invalidate = (): void => {
    if (frame === 0) frame = requestAnimationFrame(draw);
  };

  const applyPose = (): void => {
    const [x, y, z] = positionOfPose(pose);
    camera.position.set(x, y, z);
    camera.lookAt(pose.target[0], pose.target[1], pose.target[2]);
    callbacks.onCameraTurn(axisDirectionsFor(pose));
  };

  const pickAt = (clientX: number, clientY: number): string | null => {
    const [x, y] = pointerToNdc(clientX, clientY, canvas.getBoundingClientRect());
    raycaster.setFromCamera(new Vector2(x, y), camera);
    const hits = raycaster.intersectObjects<Mesh>(objects.flatMap((entry) => entry.pickTargets), false);
    return choosePick(hits.map((hit): PickHit => ({
      structureKey: String(hit.object.userData.structureKey), distance: hit.distance, fill: hit.object.userData.fill, isSelected: hit.object.userData.isSelected === true,
      isHiddenByCut: clip !== null && clip.distanceToPoint(hit.point) < 0,
    })));
  };

  /** Advances the camera. Returns whether another frame is needed. */
  const stepCamera = (now: number): boolean => {
    if (move !== null) {
      const progress = move.durationMs === 0 ? 1 : Math.min(1, (now - move.startedAt) / move.durationMs);
      pose = blendPoses(move.from, move.to, easeOut(progress));
      if (progress >= 1) move = null;
      return move !== null;
    }
    if (!isIdleTurning) return false;
    pose = turnPose(pose, idleSpeed * (lastFrameAt === 0 ? 0 : now - lastFrameAt), 0);
    return true;
  };

  function draw(now: number): void {
    frame = 0;
    const needsAnother = stepCamera(now);
    lastFrameAt = needsAnother ? now : 0;
    applyPose();
    for (const mark of objects.flatMap((entry) => entry.billboards)) mark.quaternion.copy(camera.quaternion);
    if (hoverPoint !== null) {
      const key = pickAt(hoverPoint.x, hoverPoint.y);
      hoverPoint = null;
      if (key !== hoveredKey) {
        hoveredKey = key;
        callbacks.onHover(key);
      }
    }
    renderer.render(scene, camera);
    if (needsAnother) invalidate();
  }

  const moveTo = (to: OrbitPose): void => {
    isIdleTurning = false;
    move = { from: pose, to, startedAt: performance.now(), durationMs: planCameraMove(prefersLessMotion).durationMs };
    invalidate();
  };

  const onPointerDown = (event: PointerEvent): void => {
    isIdleTurning = false;
    move = null;
    press = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    canvas.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent): void => {
    if (press === null) {
      hoverPoint = { x: event.clientX, y: event.clientY };
    } else if (event.buttons !== 0) {
      pose = turnPose(pose, -event.movementX * DRAG_RADIANS_PER_PIXEL, -event.movementY * DRAG_RADIANS_PER_PIXEL);
    }
    invalidate();
  };
  const onPointerUp = (event: PointerEvent): void => {
    if (press !== null && Math.hypot(event.clientX - press.x, event.clientY - press.y) < CLICK_SLOP_PX) callbacks.onPick(pickAt(event.clientX, event.clientY));
    press = null;
  };
  /** The wheel zooms only with Ctrl or Command held, so an ordinary scroll over the picture still scrolls the page. */
  const onWheel = (event: WheelEvent): void => {
    if (!event.ctrlKey && !event.metaKey) return;
    const distance = clampDistance(pose.distance * (1 + event.deltaY * WHEEL_ZOOM_PER_PIXEL));
    // At either end of the zoom range the wheel is left alone, so the page can take it.
    if (distance === pose.distance) return;
    event.preventDefault();
    isIdleTurning = false;
    pose = { ...pose, distance };
    invalidate();
  };
  const onPointerCancel = (): void => { press = null; };
  const onContextLost = (event: Event): void => {
    event.preventDefault();
    callbacks.onContextLost();
  };
  const listeners: Array<[string, EventListener, AddEventListenerOptions?]> = [
    ['pointerdown', onPointerDown as EventListener], ['pointermove', onPointerMove as EventListener], ['pointerup', onPointerUp as EventListener], ['pointercancel', onPointerCancel],
    ['wheel', onWheel as EventListener, { passive: false }], ['webglcontextlost', onContextLost],
  ];
  for (const [type, listener, options] of listeners) canvas.addEventListener(type, listener, options);

  const clearObjects = (): void => {
    for (const entry of objects) {
      scene.remove(entry.group);
      for (const owned of listDisposables(entry, geometries.get(entry.shape.id) ?? null)) owned.dispose();
    }
    objects = [];
  };

  return {
    setShapes(shapes, nodesByShapeId, selectedKeys) {
      drawn = { shapes, nodesByShapeId, selectedKeys };
      clearObjects();
      const brainOutline = shapes.find((shape) => shape.layer === 'outline');
      if (brainOutline !== undefined && home.every((value) => value === 0)) {
        home = rasToScene(brainOutline.centroidMm);
        pose = { ...pose, target: home };
      }
      for (const shape of shapes) {
        const node = nodesByShapeId.get(shape.id);
        if (node !== undefined && !geometries.has(shape.id)) geometries.set(shape.id, buildGeometry(node));
        const geometry = geometries.get(shape.id) ?? null;
        // A shape whose file has not arrived is not drawn at all; a marker needs no file.
        if (geometry === null && shape.sizeMark !== 'ring_only') continue;
        const entry = buildShapeObjects(shape, geometry, selectedKeys.has(shape.structureKey), clip !== null);
        scene.add(entry.group);
        objects.push(entry);
      }
      invalidate();
    },
    setSlice(slice) {
      const plane = slice === null ? null : slicePlane(slice);
      const wasCut = clip !== null;
      clip = plane === null ? null : new Plane(new Vector3(plane.normal[0], plane.normal[1], plane.normal[2]), plane.constant);
      renderer.clippingPlanes = clip === null ? [] : [clip];
      // Opening or closing the cut changes how filled shapes and the selection are drawn; moving it does not.
      if (wasCut !== (clip !== null) && drawn !== null) this.setShapes(drawn.shapes, drawn.nodesByShapeId, drawn.selectedKeys);
      invalidate();
    },
    setView: (viewId) => moveTo(poseForView(viewId, home, viewId === DEFAULT_CAMERA_VIEW ? DEFAULT_DISTANCE_MM : pose.distance)),
    focusOn: (centreScene) => moveTo({ ...pose, target: centreScene }),
    zoomTo: (distance) => moveTo({ ...pose, distance: clampDistance(distance) }),
    turnBy: (azimuth) => moveTo(turnPose(pose, azimuth, 0)),
    tiltBy: (polar) => moveTo(turnPose(pose, 0, polar)),
    distance: () => (move?.to ?? pose).distance,
    resize(width, height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      invalidate();
    },
    dispose() {
      cancelAnimationFrame(frame);
      for (const [type, listener, options] of listeners) canvas.removeEventListener(type, listener, options);
      clearObjects();
      for (const geometry of geometries.values()) geometry.dispose();
      renderer.dispose();
      // Hands the WebGL context back at once: browsers allow only a handful, and a view opened and hidden many times would run out.
      renderer.forceContextLoss();
    },
  };
}
