import { describe, expect, it } from 'vitest';
import { toIndexReviewState, UNREVIEWED } from '@/lib/anatomy/review-state';
import type { IndexOwner } from '@/lib/anatomy/anatomy-index-types';
import { HIGHLIGHT_LIGHTNESS, highlightColourFor, highlightColourOfStructure, hslToHex, hueStrideFor, regionOrdinals } from '../highlight-colour';
import { BAND_COLOURS, BAND_COLOURS_DARK, NISS_COLOURS, NISS_COLOURS_DARK } from '../scene-shapes';

const REGION_COUNT = 40;
const HEX = /^#[0-9a-f]{6}$/;

function hueOf(hex: string): number {
  const [red, green, blue] = [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16) / 255);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  if (max === min) return 0;
  const delta = max - min;
  const hue = max === red ? ((green - blue) / delta) % 6 : max === green ? (blue - red) / delta + 2 : (red - green) / delta + 4;
  return ((hue * 60) + 360) % 360;
}
const hueDistance = (first: number, second: number): number => Math.min(Math.abs(first - second), 360 - Math.abs(first - second));

const owner = (subjectId: string, subjectKind: IndexOwner['subject_kind'] = 'region'): IndexOwner => ({
  subject_kind: subjectKind, subject_id: subjectId, via: 'row', extent_match: 'same', review_state: toIndexReviewState(UNREVIEWED), check_status: 'supports',
});

describe('hslToHex', () => {
  it('writes the primaries, greys and wrapped hues as lower-case hex', () => {
    expect(hslToHex(0, 1, 0.5)).toBe('#ff0000');
    expect(hslToHex(120, 1, 0.5)).toBe('#00ff00');
    expect(hslToHex(240, 1, 0.5)).toBe('#0000ff');
    expect(hslToHex(0, 0, 0.5)).toBe('#808080');
    expect(hslToHex(360 + 120, 1, 0.5)).toBe(hslToHex(120, 1, 0.5));
    expect(hslToHex(-240, 1, 0.5)).toBe(hslToHex(120, 1, 0.5));
  });
});

describe('hueStrideFor', () => {
  it('walks every hue once: the stride shares no factor with the count, and sits near the golden section of it', () => {
    for (const count of [3, 4, 5, 8, 12, 20, 36, 38, 40, 41, 60]) {
      const stride = hueStrideFor(count);
      const visited = new Set(Array.from({ length: count }, (_unused, ordinal) => (ordinal * stride) % count));
      expect(visited.size, `count ${count}`).toBe(count);
      expect(Math.abs(stride - count * 0.618), `count ${count}`).toBeLessThan(3);
    }
    expect(hueStrideFor(1)).toBe(1);
    expect(hueStrideFor(2)).toBe(1);
  });
});

describe('highlightColourFor', () => {
  const colours = Array.from({ length: REGION_COUNT }, (_unused, ordinal) => highlightColourFor(ordinal, REGION_COUNT));

  it('gives every region a stable hex colour of its own', () => {
    for (const colour of colours) expect(colour).toMatch(HEX);
    expect(new Set(colours).size).toBe(REGION_COUNT);
    expect(highlightColourFor(7, REGION_COUNT)).toBe(highlightColourFor(7, REGION_COUNT));
  });

  it('spaces the hues evenly, so no two regions are closer than the wheel divided by their number, and neighbours in the index stand far apart', () => {
    const hues = colours.map(hueOf);
    const floor = 360 / REGION_COUNT;
    for (let first = 0; first < hues.length; first += 1) {
      for (let second = first + 1; second < hues.length; second += 1) {
        expect(hueDistance(hues[first], hues[second]), `ordinals ${first} and ${second}`).toBeGreaterThan(floor - 1);
      }
    }
    for (let ordinal = 1; ordinal < hues.length; ordinal += 1) {
      expect(hueDistance(hues[ordinal - 1], hues[ordinal]), `ordinals ${ordinal - 1} and ${ordinal}`).toBeGreaterThan(90);
    }
    expect(HIGHLIGHT_LIGHTNESS[0]).not.toBe(HIGHLIGHT_LIGHTNESS[1]);
  });

  it('is never a band\'s or a NISS step\'s colour, so it cannot be read as a value', () => {
    const palette = new Set([BAND_COLOURS, BAND_COLOURS_DARK, NISS_COLOURS, NISS_COLOURS_DARK].flatMap((table) => Object.values(table)));
    for (const count of [REGION_COUNT, 38, 12]) {
      for (let ordinal = 0; ordinal < count; ordinal += 1) expect(palette.has(highlightColourFor(ordinal, count)), `${ordinal} of ${count}`).toBe(false);
    }
  });
});

describe('regionOrdinals and highlightColourOfStructure', () => {
  const subject = (kind: 'region' | 'pathway' | 'network', id: string) => ({ kind, id, name: id, band_ids: [], geometry: { state: 'drawn' as const, reason: null, reason_source: null }, structure_keys: [], declared_children: [] });
  const index = { subjects: [subject('region', 'pfc'), subject('pathway', 'cst'), subject('region', 'm1'), subject('network', 'dmn'), subject('region', 'v1')] };

  it('numbers the regions in the index\'s order and gives pathways and networks no position', () => {
    const ordinals = regionOrdinals(index as never);
    expect([...ordinals]).toEqual([['pfc', 0], ['m1', 1], ['v1', 2]]);
  });

  it('colours a structure by its one owning region, and gives a shared or unowned structure no colour of its own', () => {
    const ordinals = regionOrdinals(index as never);
    expect(highlightColourOfStructure({ owners: [owner('m1')] }, ordinals)).toBe(highlightColourFor(1, 3));
    // The same owner reached two ways is still one region; two different regions is none.
    expect(highlightColourOfStructure({ owners: [owner('m1'), owner('m1')] }, ordinals)).toBe(highlightColourFor(1, 3));
    expect(highlightColourOfStructure({ owners: [owner('m1'), owner('pfc')] }, ordinals)).toBeNull();
    expect(highlightColourOfStructure({ owners: [] }, ordinals)).toBeNull();
    expect(highlightColourOfStructure({ owners: [owner('cst', 'pathway')] }, ordinals)).toBeNull();
    expect(highlightColourOfStructure({ owners: [owner('not-in-index')] }, ordinals)).toBeNull();
  });
});
