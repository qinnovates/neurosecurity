/**
 * How the selection and the pointer show on the objects the renderer has
 * built. It decides nothing about what is selected: it is told the keys, and
 * keeps a shape's fill as the lens left it, putting the brackets around the
 * selected shapes, dimming the filled ones around them and lifting the one
 * under the pointer. It also carries a change of lens from the old look to the
 * new one, because a dim and a recolour move the same materials.
 */

import type { Material, WebGLRenderer } from 'three';
import type { OrbitPose } from '@/lib/atlas-explorer/camera-views';
import { hoverParamsFor, isPickable, unionBoxes, type Box } from '@/lib/atlas-explorer/scene-drawing';
import type { SceneShape, SceneTheme } from '@/lib/atlas-explorer/scene-shapes';
import {
  BRACKET_ENTRANCE_MS, DIMMED_HOVER_OPACITY, DIMMED_OPACITY, DIM_MS, LENS_RECOLOUR_EASE, LENS_RECOLOUR_MS, entrancePadPx, motionMs, padRect, projectBox, type ViewSize,
} from '@/lib/atlas-explorer/selection-marks';
import { createSelectionBrackets } from './scene-brackets';
import { createMaterialTweens, listMaterials, type MaterialLook } from './scene-marks';
import type { ShapeObjects } from './scene-objects';

const EMISSIVE_OFF = '#000000';
const NO_KEYS: ReadonlySet<string> = new Set();

/** A colour as three.js holds it on a material: set from a hex string, read back without the hash. */
interface MaterialColour { set: (colour: string) => void; getHexString: () => string }
/** A material with a colour, which three.js's drawn materials have, and that can glow, as its lit ones can and its flat ones cannot. */
type Glowing = Material & { color?: MaterialColour; emissive?: MaterialColour; emissiveIntensity?: number };
/** How a material stands with nothing selected. A dim is worked out from this, and leaves it to come back to. */
interface RestingLook { opacity: number; transparent: boolean }
/** What a lifted material was before the pointer reached it. */
interface HoverRestore { material: Glowing; colour: string | null; opacity: number; transparent: boolean; emissiveColour: string | null; emissiveIntensity: number | undefined }
/** How each shape's fill looked, by shape id, so a change of lens can carry it over. */
export type ShapeLooks = ReadonlyMap<string, MaterialLook & { fill: SceneShape['fill'] }>;

/** A material's ink as a colour string, or null for a material with none. */
function inkOf(material: Glowing): string | null {
  return material.color === undefined ? null : `#${material.color.getHexString()}`;
}

export interface SelectionPainter {
  /** Takes on newly built objects, whose looks are what a dim comes back to. */
  adopt: (objects: readonly ShapeObjects[]) => void;
  /**
   * What is selected on the objects held now: which shapes a click prefers, the boxes to bracket, and which shapes dim.
   *
   * @param isArriving whether the dim takes its time: a selection arrives, and shapes built under one are simply drawn dimmed
   */
  select: (selectedKeys: ReadonlySet<string>, bracketGroups: ReadonlyArray<readonly string[]>, isArriving: boolean) => void;
  /** Lifts the shape with this key and puts the last one back. */
  lift: (key: string | null) => void;
  dropLift: () => void;
  /** How each shape's fill looks now. */
  readLooks: () => ShapeLooks;
  /** Carries each shape held now from how it looked to how it looks. */
  recolourFrom: (before: ShapeLooks) => void;
  /** Advances what is in motion. Returns whether another frame is needed. */
  step: (now: number) => boolean;
  /** Draws the brackets for this pose over what the renderer last drew. Returns whether another frame is needed. */
  drawBrackets: (renderer: WebGLRenderer, pose: OrbitPose, view: ViewSize, now: number) => boolean;
  setSize: (widthPx: number, heightPx: number) => void;
  setTheme: (theme: SceneTheme) => void;
  dispose: () => void;
}

export function createSelectionPainter(prefersLessMotion: boolean, theme: SceneTheme): SelectionPainter {
  const brackets = createSelectionBrackets(theme);
  const tweens = createMaterialTweens();
  const dimMs = motionMs(DIM_MS, prefersLessMotion);
  const recolourMs = motionMs(LENS_RECOLOUR_MS, prefersLessMotion);
  const bracketEntranceMs = motionMs(BRACKET_ENTRANCE_MS, prefersLessMotion);
  const restingLooks = new Map<Material, RestingLook>();
  let objects: readonly ShapeObjects[] = [];
  let selected = NO_KEYS;
  /** One box per pair of brackets, in scene axes, for the shapes held now. */
  let bracketBoxes: Box[] = [];
  /** Names the groups the brackets stand around, so they enter when those change and not on every redraw. */
  let bracketKey = '';
  let bracketsEnteredAt = 0;
  /** The materials lifted for the shape under the pointer, with what to put back. */
  let lifted: HoverRestore[] = [];

  /** Whether a shape stands dimmed: it is filled, it can be picked, it is not selected, and something that is selected is drawn. */
  const isDimmed = (entry: ShapeObjects): boolean => !selected.has(entry.shape.structureKey) && entry.shape.fill === 'solid' && isPickable(entry.shape) && bracketBoxes.length > 0;

  const dropLift = (): void => {
    for (const { material, colour, opacity, transparent, emissiveColour, emissiveIntensity } of lifted) {
      Object.assign(material, { opacity, transparent });
      if (colour !== null) material.color?.set(`#${colour}`);
      if (emissiveIntensity !== undefined) { material.emissive?.set(emissiveColour === null ? EMISSIVE_OFF : `#${emissiveColour}`); material.emissiveIntensity = emissiveIntensity; }
    }
    lifted = [];
  };

  return {
    adopt(next) {
      lifted = [];
      tweens.clear();
      restingLooks.clear();
      objects = next;
      for (const entry of objects) for (const material of listMaterials(entry.group)) restingLooks.set(material, { opacity: material.opacity, transparent: material.transparent });
    },
    select(selectedKeys, bracketGroups, isArriving) {
      selected = selectedKeys;
      const now = performance.now();
      for (const entry of objects) for (const target of entry.pickTargets) target.userData.isSelected = selectedKeys.has(entry.shape.structureKey);
      bracketBoxes = bracketGroups.flatMap((keys) => unionBoxes(objects.filter((entry) => keys.includes(entry.shape.structureKey)).flatMap((entry) => entry.box ?? [])) ?? []);
      const nextBracketKey = bracketGroups.map((keys) => keys.join(' ')).join('|');
      if (nextBracketKey !== bracketKey) bracketsEnteredAt = now;
      bracketKey = nextBracketKey;
      if (bracketBoxes.length === 0) brackets.setRects([]);
      for (const entry of objects) {
        const shouldDim = isDimmed(entry);
        for (const material of listMaterials(entry.group)) {
          const resting = restingLooks.get(material);
          if (resting === undefined) continue;
          const opacity = shouldDim ? Math.min(resting.opacity, DIMMED_OPACITY) : resting.opacity;
          tweens.start(material, { from: { opacity: material.opacity, colour: null }, to: { opacity, colour: null }, endsTransparent: resting.transparent || opacity < 1, durationMs: isArriving ? dimMs : 0, ease: LENS_RECOLOUR_EASE }, now);
        }
      }
    },
    /**
     * A selected shape is not lifted: it already carries the stronger mark. A dimmed one comes up part of the way. A
     * marker ring is not lifted: its pick target is an invisible sphere, and making it visible would add a surface the
     * data does not hold.
     */
    lift(key) {
      dropLift();
      if (key === null || selected.has(key)) return;
      for (const entry of objects.filter((item) => item.shape.structureKey === key && item.shape.sizeMark !== 'ring_only')) {
        const params = hoverParamsFor(entry.shape);
        const opacity = isDimmed(entry) ? DIMMED_HOVER_OPACITY : params.opacity;
        for (const target of entry.pickTargets) {
          const material = target.material as Glowing;
          tweens.finish(material);
          const emissive = material.emissive;
          lifted.push({
            material, colour: material.color?.getHexString() ?? null, opacity: material.opacity, transparent: material.transparent,
            emissiveColour: emissive === undefined ? null : emissive.getHexString(),
            emissiveIntensity: emissive === undefined ? undefined : material.emissiveIntensity,
          });
          Object.assign(material, { opacity, transparent: opacity < 1 });
          // The region's own colour, so the shape under the pointer is told from its neighbours; it is no step's colour.
          if (entry.shape.highlightColour !== null) material.color?.set(entry.shape.highlightColour);
          if (params.emissiveColour !== null && material.emissive !== undefined) { material.emissive.set(params.emissiveColour); material.emissiveIntensity = params.emissiveIntensity; }
        }
      }
    },
    dropLift,
    /** A marker's fill is its ring, which is rebuilt as it stands. */
    readLooks: () => new Map(objects.flatMap((entry) => {
      const material = entry.pickTargets[0]?.material as Glowing | undefined;
      if (material === undefined || entry.shape.sizeMark === 'ring_only') return [];
      return [[entry.shape.id, { opacity: material.opacity, colour: inkOf(material), fill: entry.shape.fill }]];
    })),
    /** A wireframe and a surface are different things and cannot blend, so one that becomes the other comes up from nothing in its own ink. */
    recolourFrom(before) {
      const now = performance.now();
      for (const entry of objects) {
        const previous = before.get(entry.shape.id);
        const material = entry.pickTargets[0]?.material as Glowing | undefined;
        const resting = material === undefined ? undefined : restingLooks.get(material);
        if (previous === undefined || material === undefined || resting === undefined) continue;
        const to: MaterialLook = { opacity: material.opacity, colour: inkOf(material) };
        const isSameKindOfDrawing = (previous.fill === 'lines') === (entry.shape.fill === 'lines');
        const from: MaterialLook = isSameKindOfDrawing ? previous : { opacity: 0, colour: to.colour };
        tweens.start(material, { from, to, endsTransparent: resting.transparent || to.opacity < 1, durationMs: recolourMs, ease: LENS_RECOLOUR_EASE }, now);
      }
    },
    step: (now) => tweens.step(now),
    drawBrackets(renderer, pose, view, now) {
      if (bracketBoxes.length === 0) return false;
      const entrance = bracketEntranceMs === 0 ? 1 : Math.min(1, Math.max(0, (now - bracketsEnteredAt) / bracketEntranceMs));
      const padPx = entrancePadPx(entrance);
      brackets.setRects(bracketBoxes.flatMap((box) => { const rect = projectBox(box, pose, view); return rect === null ? [] : [padRect(rect, padPx, view)]; }));
      brackets.render(renderer);
      return entrance < 1;
    },
    setSize: (widthPx, heightPx) => brackets.setSize(widthPx, heightPx),
    setTheme: (next) => brackets.setTheme(next),
    dispose: () => brackets.dispose(),
  };
}
