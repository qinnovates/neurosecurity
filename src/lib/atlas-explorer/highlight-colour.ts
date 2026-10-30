/**
 * A colour of a region's own, shown on its shapes while the pointer is on them
 * or while they are selected, so the shape under the pointer is unmistakable
 * among its neighbours. It identifies the region and means nothing else: it is
 * not a band's colour and not a NISS step's, and it is never shown at rest, so
 * it cannot be read as a value the lens holds. The hover label and the card
 * name the region in words beside it.
 *
 * The hues are spaced evenly around the wheel, one per region of the index, so
 * no two regions are closer than 360/n degrees; the walk around the wheel takes
 * a stride coprime with n, near the golden section, so regions that stand next
 * to each other in the index (often next to each other in the brain) land far
 * apart in hue. Two lightness tiers, alternated by position, add a second
 * difference. The position is stable for one index and nothing more is
 * claimed for it.
 */

import type { AnatomyIndex, IndexStructure } from '@/lib/anatomy/anatomy-index-types';

const GOLDEN_SECTION = 0.6180339887;
export const HIGHLIGHT_SATURATION = 0.72;
/** Alternated by position: even ordinals the deeper tier, odd the lighter. Both read on either surface. */
export const HIGHLIGHT_LIGHTNESS: readonly [number, number] = [0.5, 0.66];
const REGION_KIND = 'region';

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
  const hue = ((hueDegrees % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const second = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const base = lightness - chroma / 2;
  const sector = Math.floor(hue / 60);
  const [red, green, blue] = [[chroma, second, 0], [second, chroma, 0], [0, chroma, second], [0, second, chroma], [second, 0, chroma], [chroma, 0, second]][sector] ?? [0, 0, 0];
  return `#${channelToHex(red + base)}${channelToHex(green + base)}${channelToHex(blue + base)}`;
}

/**
 * The colour of the region at this position among the index's regions.
 *
 * @param ordinal the region's position, from 0
 * @param count how many regions the index holds; the wheel is divided into that many hues
 */
export function highlightColourFor(ordinal: number, count: number): string {
  const slots = Math.max(count, 1);
  const slot = (ordinal * hueStrideFor(slots)) % slots;
  return hslToHex((slot * 360) / slots, HIGHLIGHT_SATURATION, HIGHLIGHT_LIGHTNESS[ordinal % 2]);
}

/** Each region's position among the index's regions, in the index's own order. Pathways and networks take no position. */
export function regionOrdinals(index: Pick<AnatomyIndex, 'subjects'>): ReadonlyMap<string, number> {
  return new Map(index.subjects.filter((subject) => subject.kind === REGION_KIND).map((subject, ordinal) => [subject.id, ordinal]));
}

/**
 * The colour a structure shows under the pointer: its one owning region's. A
 * structure that several regions have a record on belongs to none of them
 * alone and gets no colour of its own; so does one no region owns.
 */
export function highlightColourOfStructure(structure: Pick<IndexStructure, 'owners'>, ordinals: ReadonlyMap<string, number>): string | null {
  const regionIds = [...new Set(structure.owners.filter((owner) => owner.subject_kind === REGION_KIND).map((owner) => owner.subject_id))];
  if (regionIds.length !== 1) return null;
  const ordinal = ordinals.get(regionIds[0]);
  return ordinal === undefined ? null : highlightColourFor(ordinal, ordinals.size);
}
