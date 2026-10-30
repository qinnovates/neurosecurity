/**
 * Draws the scene. It holds the WebGL renderer, the camera and the objects,
 * redraws only when something changed, and reports picks, hovers and camera
 * turns back to the page. It decides nothing about meaning: which shapes exist,
 * how each is filled and what is selected all arrive from outside.
 *
 * Nothing here moves in proportion to a score and nothing travels along a
 * path. The camera moves: to a view, and in a slow idle turn that ends at the
 * first touch and never starts under reduced motion. A threat-model step's own
 * marks may fade in where they stand; they never change place. The selection
 * is drawn on the selected shapes themselves, lit from within; nothing is
 * drawn around them, and the name stands beside the picture.
 */

import {
  DirectionalLight, HemisphereLight, type Material, type Mesh, type Object3D, PerspectiveCamera, Plane, Raycaster, Scene, Vector2, Vector3, WebGLRenderer, type BufferGeometry,
} from 'three';
import { HEAD_VIEW_SCALE, type DeviceDrawing } from '@/lib/atlas-explorer/device-drawing';
import { HOVER_EMISSIVE, SELECTED_EMISSIVE_INTENSITY, axisDirectionsFor, choosePickTarget, hoverParamsFor, idleTurnSpeed, pointerToNdc, stepEaseDuration, type AxisDirections, type PickHit, type PickTarget } from '@/lib/atlas-explorer/scene-drawing';
import type { DecodedNode } from '@/lib/anatomy/decode-glb';
import { rasToScene } from '@/lib/anatomy/ras-to-scene';
import {
  DEFAULT_CAMERA_VIEW, DEFAULT_DISTANCE_MM, blendPoses, clampDistance, planCameraMove, poseForView, positionOfPose, turnPose, type CameraViewId, type OrbitPose,
} from '@/lib/atlas-explorer/camera-views';
import type { SceneShape, SceneTheme } from '@/lib/atlas-explorer/scene-shapes';
import { slicePlane, type SliceState } from '@/lib/atlas-explorer/slice-plane';
import { buildDeviceObjects, type DeviceObjects } from './device-objects';
import { buildStepLabels, createEaser, disposeTree, easeKeyOf, listMaterials, readLabelFont } from './scene-marks';
import { buildGeometry, buildShapeObjects, listDisposables, type ShapeObjects } from './scene-objects';

export type { AxisDirections };

export interface SceneCallbacks {
  /** A click that was not a drag. Null when it landed on nothing. */
  onPick: (structureKey: string | null) => void;
  /** A click on an electrode dot. It is not a shape and selects no region. */
  onPickElectrode: (electrodeId: string) => void;
  onHover: (structureKey: string | null) => void;
  onCameraTurn: (directions: AxisDirections) => void;
  onContextLost: () => void;
}

export interface SceneRenderer {
  /** @param selectedKeys the structures selected, each drawn lit from within */
  setShapes: (shapes: readonly SceneShape[], nodesByShapeId: ReadonlyMap<string, DecodedNode>, selectedKeys: ReadonlySet<string>) => void;
  /** The electrode dots to draw, or null for none. */
  setDevices: (drawing: DeviceDrawing | null, selectedElectrodeId: string | null) => void;
  /**
   * The surface the canvas is drawn on. The renderer holds it rather than reading
   * it, and redraws what is already on screen when it changes: the theme can be
   * toggled with the view open, and the pale fills are built from it.
   */
  setTheme: (theme: SceneTheme) => void;
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
/** Set on the canvas while a shape a click would pick lies under the pointer; the stylesheet shows the pick cursor for it. */
const PICK_ATTRIBUTE = 'data-pick';
const PICK_VALUE = 'shape';
const EMISSIVE_OFF = '#000000';

/** A material that can glow, as three.js's lit materials can and its flat ones cannot. */
type Glowing = Material & { emissive?: { set: (colour: string) => void; getHexString: () => string }; emissiveIntensity?: number };
/** What a lifted material was before the pointer reached it: a selected shape's own glow comes back, not darkness. */
interface HoverRestore { material: Glowing; opacity: number; transparent: boolean; emissiveColour: string | null; emissiveIntensity: number | undefined }

function easeOut(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

/**
 * @param theme the surface the canvas is drawn on. It arrives as data, from the
 * one hook that asks the document, and is never read here. See `SceneTheme` in
 * scene-shapes.ts for where the theme lives and why.
 * @throws when the browser gives no WebGL context; the caller shows the "not available" notice
 */
export function createSceneRenderer(canvas: HTMLCanvasElement, callbacks: SceneCallbacks, prefersLessMotion: boolean, theme: SceneTheme): SceneRenderer {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  const scene = new Scene();
  const camera = new PerspectiveCamera(FIELD_OF_VIEW, 1, NEAR_MM, FAR_MM);
  const headlight = new DirectionalLight('#ffffff', 1.6);
  camera.add(headlight);
  scene.add(camera, new HemisphereLight('#ffffff', '#5a6070', 1.5));

  const geometries = new Map<string, BufferGeometry>();
  let objects: ShapeObjects[] = [];
  /** Step labels: drawn over the shapes and rebuilt with them. */
  let marks: Object3D[] = [];
  let devices: DeviceObjects | null = null;
  /** The surface the shapes were last built for. Only the pale fills read it. */
  let surface = theme;
  const labelFont = readLabelFont(canvas);
  const easer = createEaser(stepEaseDuration(prefersLessMotion));
  let easedKey = '';
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
  /** The materials lifted for the shape under the pointer, with what to put back. */
  let lifted: HoverRestore[] = [];
  const raycaster = new Raycaster();

  /**
   * The selection, on the selected shapes themselves: the same lift as hover, held. A filled shape is lit from within;
   * a see-through one is drawn denser and gets no light, by the same rule as hover, so it never reads as holding a
   * value it does not hold. A marker ring is not lifted, for the reason given at applyHover.
   */
  const glowSelected = (selectedKeys: ReadonlySet<string>): void => {
    for (const entry of objects.filter((item) => selectedKeys.has(item.shape.structureKey) && item.shape.sizeMark !== 'ring_only')) {
      const params = hoverParamsFor(entry.shape);
      const opacity = Math.max(params.opacity, ...entry.pickTargets.map((target) => (target.material as Material).opacity));
      for (const target of entry.pickTargets) {
        const material = target.material as Glowing;
        Object.assign(material, { opacity, transparent: opacity < 1 });
        if (params.emissiveIntensity > 0 && material.emissive !== undefined) { material.emissive.set(HOVER_EMISSIVE); material.emissiveIntensity = SELECTED_EMISSIVE_INTENSITY; }
      }
    }
  };

  /**
   * Lifts every drawn shape of the hovered structure and puts the last one back as it was, glow included. A marker
   * ring is not lifted: its pick target is an invisible sphere, and making it visible would add a surface the data
   * does not hold.
   */
  const applyHover = (key: string | null): void => {
    for (const { material, opacity, transparent, emissiveColour, emissiveIntensity } of lifted) {
      Object.assign(material, { opacity, transparent });
      if (emissiveIntensity !== undefined) { material.emissive?.set(emissiveColour === null ? EMISSIVE_OFF : `#${emissiveColour}`); material.emissiveIntensity = emissiveIntensity; }
    }
    lifted = [];
    if (key === null) canvas.removeAttribute(PICK_ATTRIBUTE);
    else canvas.setAttribute(PICK_ATTRIBUTE, PICK_VALUE);
    if (key === null) return;
    for (const entry of objects.filter((item) => item.shape.structureKey === key && item.shape.sizeMark !== 'ring_only')) {
      const params = hoverParamsFor(entry.shape);
      for (const target of entry.pickTargets) {
        const material = target.material as Glowing;
        const emissive = material.emissive;
        lifted.push({
          material, opacity: material.opacity, transparent: material.transparent,
          emissiveColour: emissive === undefined ? null : emissive.getHexString(),
          emissiveIntensity: emissive === undefined ? undefined : material.emissiveIntensity,
        });
        Object.assign(material, { opacity: params.opacity, transparent: params.opacity < 1 });
        if (params.emissiveIntensity > 0 && material.emissive !== undefined) { material.emissive.set(HOVER_EMISSIVE); material.emissiveIntensity = params.emissiveIntensity; }
      }
    }
  };

  const invalidate = (): void => {
    if (frame === 0) frame = requestAnimationFrame(draw);
  };

  const applyPose = (): void => {
    const [x, y, z] = positionOfPose(pose);
    camera.position.set(x, y, z);
    camera.lookAt(pose.target[0], pose.target[1], pose.target[2]);
    callbacks.onCameraTurn(axisDirectionsFor(pose));
  };

  const pickAt = (clientX: number, clientY: number): PickTarget | null => {
    const [x, y] = pointerToNdc(clientX, clientY, canvas.getBoundingClientRect());
    raycaster.setFromCamera(new Vector2(x, y), camera);
    const hits = raycaster.intersectObjects<Mesh>([...objects.flatMap((entry) => entry.pickTargets), ...(devices?.pickTargets ?? [])], false);
    return choosePickTarget(hits.map((hit): PickHit => ({
      structureKey: String(hit.object.userData.structureKey), distance: hit.distance, fill: hit.object.userData.fill, isSelected: hit.object.userData.isSelected === true,
      isHiddenByCut: clip !== null && clip.distanceToPoint(hit.point) < 0, electrodeId: hit.object.userData.electrodeId,
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
    const isCameraMoving = stepCamera(now);
    lastFrameAt = isCameraMoving ? now : 0;
    const needsAnother = easer.step(now) || isCameraMoving;
    applyPose();
    for (const mark of objects.flatMap((entry) => entry.billboards)) mark.quaternion.copy(camera.quaternion);
    if (hoverPoint !== null) {
      const target = pickAt(hoverPoint.x, hoverPoint.y);
      const key = target?.kind === 'structure' ? target.structureKey : null;
      hoverPoint = null;
      if (key !== hoveredKey) {
        hoveredKey = key;
        applyHover(key);
        callbacks.onHover(key);
      }
    }
    renderer.render(scene, camera);
    if (needsAnother) invalidate();
  }

  /** How far back the default view stands: further once the head surface is drawn, so the whole head is in the picture. */
  const homeDistance = (): number => clampDistance(DEFAULT_DISTANCE_MM * (devices === null ? 1 : HEAD_VIEW_SCALE));
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
    const isClick = press !== null && Math.hypot(event.clientX - press.x, event.clientY - press.y) < CLICK_SLOP_PX;
    press = null;
    if (!isClick) return;
    const target = pickAt(event.clientX, event.clientY);
    if (target?.kind === 'electrode') callbacks.onPickElectrode(target.electrodeId);
    else callbacks.onPick(target?.structureKey ?? null);
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
    lifted = [];
    for (const entry of objects) {
      scene.remove(entry.group);
      for (const owned of listDisposables(entry, geometries.get(entry.shape.id) ?? null)) owned.dispose();
    }
    objects = [];
    for (const mark of marks) {
      scene.remove(mark);
      disposeTree(mark);
    }
    marks = [];
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
        const entry = buildShapeObjects(shape, geometry, selectedKeys.has(shape.structureKey), clip !== null, surface);
        scene.add(entry.group);
        objects.push(entry);
      }
      marks = buildStepLabels(objects, labelFont);
      for (const mark of marks) scene.add(mark);
      // The objects were rebuilt: the selection is lit on the new ones first, then the shape under the pointer is lifted over it.
      glowSelected(selectedKeys);
      applyHover(hoveredKey);
      // A step's marks fade in once, when the step arrives; a redraw for any other reason leaves them as they are.
      const easeKey = easeKeyOf(objects);
      const stepMarked = objects.filter((entry) => (entry.shape.stepNumbers ?? []).length > 0).map((entry) => entry.group);
      if (easeKey !== easedKey) easer.begin([...stepMarked, ...marks.filter((mark) => mark.userData.labelText !== undefined)].flatMap(listMaterials), performance.now());
      else easer.begin([], 0);
      easedKey = easeKey;
      invalidate();
    },
    setDevices(drawing, selectedElectrodeId) {
      if (devices !== null) {
        scene.remove(devices.group);
        disposeTree(devices.group);
      }
      const isFirstDrawing = devices === null && drawing !== null;
      devices = drawing === null ? null : buildDeviceObjects(drawing, selectedElectrodeId, labelFont);
      if (isFirstDrawing) pose = { ...pose, distance: Math.max(pose.distance, homeDistance()) };
      if (devices !== null) scene.add(devices.group);
      invalidate();
    },
    setTheme(next) {
      if (next === surface) return;
      surface = next;
      // The shapes carry what the surface decides -- their pale fills -- so they are rebuilt from what setShapes was last given. The electrode dots take no surface ink (see device-objects.ts).
      if (drawn !== null) this.setShapes(drawn.shapes, drawn.nodesByShapeId, drawn.selectedKeys);
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
    setView: (viewId) => moveTo(poseForView(viewId, home, viewId === DEFAULT_CAMERA_VIEW ? homeDistance() : pose.distance)),
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
      canvas.removeAttribute(PICK_ATTRIBUTE);
      for (const [type, listener, options] of listeners) canvas.removeEventListener(type, listener, options);
      clearObjects();
      if (devices !== null) disposeTree(devices.group);
      for (const geometry of geometries.values()) geometry.dispose();
      renderer.dispose();
      // Hands the WebGL context back at once: browsers allow only a handful, and a view opened and hidden many times would run out.
      renderer.forceContextLoss();
    },
  };
}
