/**
 * A colour of a region's own, shown on its shapes while the pointer is on them
 * or while they are selected, so the shape under the pointer is unmistakable
 * among its neighbours. It identifies the region and means nothing else: it is
 * not a band's colour and not a NISS step's, and it is never shown at rest, so
 * it cannot be read as a value the lens holds. The hover label and the card
 * name the region in words beside it.
 *
 * The hue is data. Each region's record in the atlas file states it
 * (`brain_regions[].highlight_hue`, carried into the index as the subject's
 * `highlight_hue`), so the assignment is tagged once, in the data lake, and
 * every renderer that reads the index draws the same colour for the same region.
 * This file is the one place that turns the hue into a colour for the surface
 * the canvas is drawn on: a fixed saturation, and a lightness per surface chosen
 * so every hue on the wheel clears 3:1 against that surface (highlight-colour.test.ts
 * holds both to it).
 *
 * A region whose record states no hue still gets one, derived from its position
 * among the index's regions: the hues are spaced evenly around the wheel, one per
 * region, walked with a stride coprime with their number near the golden section,
 * so regions that stand next to each other in the index land far apart in hue.
 * That derivation is what seeded the stored values, and it is what a new region
 * shows until its record is given a hue of its own.
 */

import type { AnatomyIndex, IndexStructure } from '@/lib/anatomy/anatomy-index-types';
import type { SceneTheme } from './scene-shapes';

const GOLDEN_SECTION = 0.6180339887;
const HUE_DEGREES = 360;
export const HIGHLIGHT_SATURATION = 0.7;
/**
 * One lightness per surface, not one for both. On the light surface the weakest
 * hue is yellow (60), which at this lightness reads 3.35:1 against #fcfcfb; on
 * the dark one it is blue (240), at 4.08:1 against #1a1a19. Either value on the
 * other surface would fail the weakest hue.
 */
export const HIGHLIGHT_LIGHTNESS: Readonly<Record<SceneTheme, number>> = { light: 0.33, dark: 0.66 };
const REGION_KIND = 'region';
const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

const greatestCommonDivisor = (first: number, second: number): number => (second === 0 ? first : greatestCommonDivisor(second, first % second));

/** The step around the wheel of n evenly spaced hues: the integer nearest the golden section of n that shares no factor with n, so every hue is visited once. */
export function hueStrideFor(count: number): number {
  if (count < 3) return 1;
  const nearest = Math.round(count * GOLDEN_SECTION);
  for (let offset = 0; offset < count; offset += 1) {
    for (const candidate of [nearest - offset, nearest + offset]) {
      if (candidate > 0 && candidate < count && greatestCommonDivisor(count, candidate) === 1) return candidate;
    }
  }
  return 1;
}

function channelToHex(value: number): string {
  return Math.round(Math.min(1, Math.max(0, value)) * 255).toString(16).padStart(2, '0');
}

/** HSL to a lower-case hex colour, as three.js reads it and as the palettes are written. */
export function hslToHex(hueDegrees: number, saturation: number, lightness: number): string {
  const hue = ((hueDegrees % HUE_DEGREES) + HUE_DEGREES) % HUE_DEGREES;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const second = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const base = lightness - chroma / 2;
  const sector = Math.floor(hue / 60);
  const [red, green, blue] = [[chroma, second, 0], [second, chroma, 0], [0, chroma, second], [0, second, chroma], [second, 0, chroma], [chroma, 0, second]][sector] ?? [0, 0, 0];
  return `#${channelToHex(red + base)}${channelToHex(green + base)}${channelToHex(blue + base)}`;
}

/**
 * The hue, in whole degrees, derived for the region at this position among the
 * index's regions when its record states none.
 *
 * @param ordinal the region's position, from 0
 * @param count how many regions the index holds; the wheel is divided into that many hues
 */
export function derivedHueFor(ordinal: number, count: number): number {
  const slots = Math.max(count, 1);
  const slot = (ordinal * hueStrideFor(slots)) % slots;
  return Math.round((slot * HUE_DEGREES) / slots) % HUE_DEGREES;
}

/** The colour a hue is drawn in on a surface: the fixed saturation and that surface's lightness. */
export function renderHighlightHue(hue: number, theme: SceneTheme): string {
  return hslToHex(hue, HIGHLIGHT_SATURATION, HIGHLIGHT_LIGHTNESS[theme]);
}

/**
 * Each region's highlight hue: the one its record states, or the derived one for
 * a record that states none. Pathways and networks take no hue.
 */
export function regionHighlightHues(index: Pick<AnatomyIndex, 'subjects'>): ReadonlyMap<string, number> {
  const regions = index.subjects.filter((subject) => subject.kind === REGION_KIND);
  return new Map(regions.map((subject, ordinal) => [subject.id, subject.highlight_hue ?? derivedHueFor(ordinal, regions.length)]));
}

/** A stable hue for a shape no region owns, from its key (FNV-1a), so it keeps its colour between builds. */
export function structureHue(structureKey: string): number {
  let hash = FNV_OFFSET;
  for (const character of structureKey) hash = Math.imul(hash ^ character.charCodeAt(0), FNV_PRIME) >>> 0;
  return hash % HUE_DEGREES;
}

/**
 * The colour a structure shows under the pointer, so every shape answers to it:
 * its owning region's, the first owner's on a shape several regions share, or a
 * hue of the shape's own where no region in the index owns it.
 */
export function highlightColourOfStructure(structure: Pick<IndexStructure, 'key' | 'owners'>, hues: ReadonlyMap<string, number>, theme: SceneTheme): string {
  const ownerHue = structure.owners.filter((owner) => owner.subject_kind === REGION_KIND).map((owner) => hues.get(owner.subject_id)).find((hue) => hue !== undefined);
  return renderHighlightHue(ownerHue ?? structureHue(structure.key), theme);
}
