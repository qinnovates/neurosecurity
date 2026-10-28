/**
 * The marks drawn over the shapes: the selection brackets, the number of a
 * threat-model step on the shapes its technique marks, and the text labels.
 * Brackets are short lines around one box. A label is text at one place.
 * Nothing here draws a line, an arrow or anything else from one shape to another.
 */

import { CanvasTexture, Sprite, SpriteMaterial, type LineSegments, type Material, type Mesh, type Object3D } from 'three';
import type { Point3 } from '@/lib/anatomy/ras-to-scene';
import { DRAW_ORDER, unionBoxes, type Box } from '@/lib/atlas-explorer/scene-drawing';
import type { SceneTheme } from '@/lib/atlas-explorer/scene-shapes';
import { buildBrackets, type ShapeObjects } from './scene-objects';

const FALLBACK_FONT = 'system-ui, sans-serif';
/** The label texture, in canvas pixels. Large enough to stay sharp when the visitor zooms in. */
const LABEL_FONT_PX = 44;
const LABEL_PAD_PX = 14;
const LABEL_BORDER_PX = 3;
/**
 * A label is dark words on its own light plate, on both surfaces. The plate is
 * the label's background, so what the words need contrast against is the plate
 * and not the page: these take no theme for the same reason the electrode dots
 * do not. See `SURFACE_INK` in scene-drawing.ts for the inks that do.
 */
const LABEL_INK = '#1c1e26';
const LABEL_PAPER = 'rgba(255, 255, 255, 0.94)';
const STEP_LABEL_HEIGHT_MM = 9;
const SELECTION_LABEL_HEIGHT_MM = 7;
/** How far above the top of the bracketed box the selection's name stands. */
const SELECTION_LABEL_LIFT_MM = 4;

/**
 * The face the canvas inherits from the explorer: the Lab's sans body face, which the stylesheet sets and its
 * source rules hold. Labels in the picture are set in it, like every label beside the picture.
 */
export function readLabelFont(canvas: HTMLCanvasElement): string {
  const family = typeof getComputedStyle === 'function' ? getComputedStyle(canvas).fontFamily : '';
  return family === '' ? FALLBACK_FONT : family;
}

/**
 * A text label that always faces the viewer: dark words on a light plate, legible on either theme.
 * Returns null where the browser gives no 2D canvas to write the words on; the same words are in the page beside the picture.
 *
 * @param isAlwaysOnTop false for a label that a filled shape in front of it should hide, as it hides the thing the label names
 */
export function buildLabelSprite(text: string, at: Point3, heightMm: number, fontFamily: string, isAlwaysOnTop = true): Sprite | null {
  const plate = document.createElement('canvas');
  const pen = plate.getContext('2d');
  if (pen === null) return null;
  const font = `600 ${LABEL_FONT_PX}px ${fontFamily}`;
  pen.font = font;
  plate.width = Math.ceil(pen.measureText(text).width) + LABEL_PAD_PX * 2;
  plate.height = LABEL_FONT_PX + LABEL_PAD_PX * 2;
  pen.fillStyle = LABEL_PAPER;
  pen.fillRect(0, 0, plate.width, plate.height);
  pen.lineWidth = LABEL_BORDER_PX;
  pen.strokeStyle = LABEL_INK;
  pen.strokeRect(LABEL_BORDER_PX / 2, LABEL_BORDER_PX / 2, plate.width - LABEL_BORDER_PX, plate.height - LABEL_BORDER_PX);
  // Resizing a canvas clears its state, so the font is set again before the words are written.
  pen.font = font;
  pen.fillStyle = LABEL_INK;
  pen.textAlign = 'center';
  pen.textBaseline = 'middle';
  pen.fillText(text, plate.width / 2, plate.height / 2);
  const sprite = new Sprite(new SpriteMaterial({ map: new CanvasTexture(plate), depthTest: !isAlwaysOnTop, transparent: true }));
  sprite.scale.set(heightMm * (plate.width / plate.height), heightMm, 1);
  sprite.position.set(at[0], at[1], at[2]);
  sprite.renderOrder = DRAW_ORDER.mark;
  sprite.userData = { labelText: text };
  return sprite;
}

/**
 * One bracket set for each group of shapes selected together: a region drawn
 * as many shapes gets one mark around all of them, not one per shape.
 */
export function buildSelectionMarks(groups: ReadonlyArray<readonly string[]>, entries: readonly ShapeObjects[], theme: SceneTheme): LineSegments[] {
  return groups.flatMap((keys) => {
    const box = unionBoxes(entries.filter((entry) => keys.includes(entry.shape.structureKey)).flatMap((entry) => entry.box ?? []));
    return box === null ? [] : [buildBrackets(box, theme)];
  });
}

const middleOf = (box: Box): Point3 => [(box.min[0] + box.max[0]) / 2, (box.min[1] + box.max[1]) / 2, (box.min[2] + box.max[2]) / 2];

/**
 * The selected region's name, standing just above the box its brackets mark,
 * so the selection can be found among many shapes. Null where none of the
 * group's shapes is drawn, or where the browser gives no 2D canvas for the words.
 */
export function buildSelectionLabel(keys: readonly string[], entries: readonly ShapeObjects[], text: string, fontFamily: string): Sprite | null {
  const box = unionBoxes(entries.filter((entry) => keys.includes(entry.shape.structureKey)).flatMap((entry) => entry.box ?? []));
  if (box === null) return null;
  const middle = middleOf(box);
  return buildLabelSprite(text, [middle[0], box.max[1] + SELECTION_LABEL_LIFT_MM, middle[2]], SELECTION_LABEL_HEIGHT_MM, fontFamily);
}

/** "Step 4", or "Steps 1, 3" where several steps mark the same shape, at the middle of each marked shape. */
export function buildStepLabels(entries: readonly ShapeObjects[], fontFamily: string): Sprite[] {
  return entries.flatMap((entry) => {
    const numbers = entry.shape.stepNumbers ?? [];
    if (numbers.length === 0 || entry.box === null) return [];
    return buildLabelSprite(`${numbers.length === 1 ? 'Step' : 'Steps'} ${numbers.join(', ')}`, middleOf(entry.box), STEP_LABEL_HEIGHT_MM, fontFamily) ?? [];
  });
}

/** The materials of an object and everything under it. */
export function listMaterials(object: Object3D): Material[] {
  const materials: Material[] = [];
  object.traverse((child) => {
    const material = (child as Partial<Mesh>).material;
    if (material !== undefined) materials.push(...(Array.isArray(material) ? material : [material]));
  });
  return materials;
}

/** Frees an object's geometries, materials and label textures. */
export function disposeTree(object: Object3D): void {
  object.traverse((child) => (child as Partial<Mesh>).geometry?.dispose());
  for (const material of listMaterials(object)) {
    (material as Partial<SpriteMaterial>).map?.dispose();
    material.dispose();
  }
}

/** Changes when the steps on screen, or the shapes they mark, change. Empty when no step marks a shape. */
export function easeKeyOf(entries: readonly ShapeObjects[]): string {
  return entries.filter((entry) => (entry.shape.stepNumbers ?? []).length > 0).map((entry) => `${entry.shape.id}=${(entry.shape.stepNumbers ?? []).join('+')}`).join(' ');
}

export interface Easer {
  /** Starts the given materials at nothing and brings each back to its own opacity. An empty list ends any ease under way. */
  begin: (materials: readonly Material[], now: number) => void;
  /** Advances the ease. Returns whether another frame is needed. */
  step: (now: number) => boolean;
}

/**
 * Lets a step's own marks appear in place: each material's opacity rises from
 * nothing to what it was. Nothing changes position, and with no duration (reduced motion) nothing fades at all.
 */
export function createEaser(durationMs: number): Easer {
  let running: Array<{ material: Material; opacity: number; wasTransparent: boolean }> = [];
  let startedAt = 0;
  return {
    begin(materials, now) {
      running = durationMs === 0 ? [] : materials.map((material) => ({ material, opacity: material.opacity, wasTransparent: material.transparent }));
      startedAt = now;
      for (const { material } of running) Object.assign(material, { transparent: true, opacity: 0 });
    },
    step(now) {
      if (running.length === 0) return false;
      const progress = Math.min(1, Math.max(0, (now - startedAt) / durationMs));
      for (const { material, opacity } of running) material.opacity = opacity * progress;
      if (progress < 1) return true;
      for (const { material, wasTransparent } of running) Object.assign(material, { transparent: wasTransparent, needsUpdate: true });
      running = [];
      return false;
    },
  };
}
