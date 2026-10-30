import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BOUNDARY_CONTRAST_MINIMUM, contrastRatio, parseColour } from '@/components/lab-kit/contrast';
import { toIndexReviewState, UNREVIEWED } from '@/lib/anatomy/review-state';
import type { IndexOwner } from '@/lib/anatomy/anatomy-index-types';
import {
  HIGHLIGHT_LIGHTNESS, HIGHLIGHT_SATURATION, derivedHueFor, highlightColourOfStructure, hslToHex, hueStrideFor, regionHighlightHues, renderHighlightHue, structureHue,
} from '../highlight-colour';
import { BAND_COLOURS, BAND_COLOURS_DARK, LINKED_COLOUR, NEUTRAL_COLOUR, NISS_COLOURS, NISS_COLOURS_DARK, type SceneTheme } from '../scene-shapes';

const REGION_COUNT = 40;
const HEX = /^#[0-9a-f]{6}$/;
const THEMES: readonly SceneTheme[] = ['light', 'dark'];
/** The surfaces the palette tests hold every scene ink to. */
const SURFACE: Readonly<Record<SceneTheme, string>> = { light: '#fcfcfb', dark: '#1a1a19' };
/** A colour whose channels differ by less than this reads as grey, and could be mistaken for the neutral selection ink. */
const MIN_CHANNEL_SPREAD = 0.1;
const LAST_HUE_DEGREE = 359;
const ATLAS_FILE = path.join(process.cwd(), 'datalake', 'qif-brain-bci-atlas.json');

interface RawRegion { id: string; highlight_hue?: unknown }
const atlasRegions = (JSON.parse(fs.readFileSync(ATLAS_FILE, 'utf-8')) as { brain_regions: RawRegion[] }).brain_regions;

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
function channelSpread(hex: string): number {
  const channels = [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16) / 255);
  return Math.max(...channels) - Math.min(...channels);
}
const contrastOn = (colour: string, theme: SceneTheme): number => contrastRatio(parseColour(colour), parseColour(SURFACE[theme]));

const owner = (subjectId: string, subjectKind: IndexOwner['subject_kind'] = 'region'): IndexOwner => ({
  subject_kind: subjectKind, subject_id: subjectId, via: 'row', extent_match: 'same', review_state: toIndexReviewState(UNREVIEWED), check_status: 'supports',
});
const subject = (kind: 'region' | 'pathway' | 'network', id: string, highlightHue: number | null = null) => ({
  kind, id, name: id, band_ids: [], geometry: { state: 'drawn' as const, reason: null, reason_source: null }, structure_keys: [], declared_children: [], highlight_hue: highlightHue,
});

/** Every colour the scene draws for a lens value or a context role, on either surface. */
const SCENE_PALETTE = new Set([
  ...[BAND_COLOURS, BAND_COLOURS_DARK, NISS_COLOURS, NISS_COLOURS_DARK].flatMap((table) => Object.values(table)), LINKED_COLOUR, NEUTRAL_COLOUR,
]);

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

describe('derivedHueFor', () => {
  const hues = Array.from({ length: REGION_COUNT }, (_unused, ordinal) => derivedHueFor(ordinal, REGION_COUNT));

  it('gives every position a whole-degree hue of its own, stably', () => {
    for (const hue of hues) expect(Number.isInteger(hue) && hue >= 0 && hue <= LAST_HUE_DEGREE, String(hue)).toBe(true);
    expect(new Set(hues).size).toBe(REGION_COUNT);
    expect(derivedHueFor(7, REGION_COUNT)).toBe(derivedHueFor(7, REGION_COUNT));
    expect(derivedHueFor(0, 1)).toBe(0);
  });

  it('spaces the hues evenly, so no two positions are closer than the wheel divided by their number, and neighbours in the index stand far apart', () => {
    const floor = 360 / REGION_COUNT;
    for (let first = 0; first < hues.length; first += 1) {
      for (let second = first + 1; second < hues.length; second += 1) {
        expect(hueDistance(hues[first], hues[second]), `ordinals ${first} and ${second}`).toBeGreaterThan(floor - 1);
      }
    }
    for (let ordinal = 1; ordinal < hues.length; ordinal += 1) {
      expect(hueDistance(hues[ordinal - 1], hues[ordinal]), `ordinals ${ordinal - 1} and ${ordinal}`).toBeGreaterThan(90);
    }
  });
});

describe('renderHighlightHue', () => {
  it('draws a hue at the fixed saturation and the surface\'s lightness, as lower-case hex, and keeps the hue it was given', () => {
    for (const theme of THEMES) {
      for (const hue of [0, 37, 120, 211, 300, LAST_HUE_DEGREE]) {
        const colour = renderHighlightHue(hue, theme);
        expect(colour, `${hue} ${theme}`).toMatch(HEX);
        expect(colour).toBe(hslToHex(hue, HIGHLIGHT_SATURATION, HIGHLIGHT_LIGHTNESS[theme]));
        expect(hueDistance(hueOf(colour), hue), `${hue} ${theme}`).toBeLessThan(2);
      }
    }
    expect(HIGHLIGHT_LIGHTNESS.light).toBeLessThan(HIGHLIGHT_LIGHTNESS.dark);
  });

  it('clears the boundary contrast floor against its surface for every hue on the wheel, on both surfaces', () => {
    for (const theme of THEMES) {
      for (let hue = 0; hue <= LAST_HUE_DEGREE; hue += 1) {
        expect(contrastOn(renderHighlightHue(hue, theme), theme), `${hue} ${theme}`).toBeGreaterThanOrEqual(BOUNDARY_CONTRAST_MINIMUM);
      }
    }
  });

  it('is chromatic for every hue, so it cannot be mistaken for the neutral selection ink, and is never a band\'s, a step\'s or a context colour', () => {
    for (const theme of THEMES) {
      for (let hue = 0; hue <= LAST_HUE_DEGREE; hue += 1) {
        const colour = renderHighlightHue(hue, theme);
        expect(channelSpread(colour), `${hue} ${theme}`).toBeGreaterThan(MIN_CHANNEL_SPREAD);
        expect(SCENE_PALETTE.has(colour), `${hue} ${theme}`).toBe(false);
      }
    }
  });
});

describe('the atlas file\'s highlight hues', () => {
  it('gives every region a whole-degree hue of its own, no two the same', () => {
    expect(atlasRegions.length).toBe(38);
    const hues = atlasRegions.map((region) => region.highlight_hue);
    for (const [at, hue] of hues.entries()) {
      expect(typeof hue === 'number' && Number.isInteger(hue) && hue >= 0 && hue <= LAST_HUE_DEGREE, `${atlasRegions[at].id}: ${String(hue)}`).toBe(true);
    }
    expect(new Set(hues).size).toBe(atlasRegions.length);
  });

  it('holds the hues the derivation gives the regions at their positions, so the stored assignment and the fallback agree', () => {
    for (const [ordinal, region] of atlasRegions.entries()) expect(region.highlight_hue, region.id).toBe(derivedHueFor(ordinal, atlasRegions.length));
  });

  it('renders every region\'s colour on both surfaces above the contrast floor, chromatic, and apart from every lens and context colour', () => {
    for (const theme of THEMES) {
      const colours = atlasRegions.map((region) => renderHighlightHue(region.highlight_hue as number, theme));
      expect(new Set(colours).size, theme).toBe(atlasRegions.length);
      for (const [at, colour] of colours.entries()) {
        const label = `${atlasRegions[at].id} ${theme}`;
        expect(contrastOn(colour, theme), label).toBeGreaterThanOrEqual(BOUNDARY_CONTRAST_MINIMUM);
        expect(channelSpread(colour), label).toBeGreaterThan(MIN_CHANNEL_SPREAD);
        expect(SCENE_PALETTE.has(colour), label).toBe(false);
      }
    }
  });
});

describe('regionHighlightHues and highlightColourOfStructure', () => {
  const index = { subjects: [subject('region', 'pfc', 123), subject('pathway', 'cst', 7), subject('region', 'm1'), subject('network', 'dmn'), subject('region', 'v1', 0)] };

  it('takes each region\'s stored hue, derives one from the position of a region that states none, and gives pathways and networks no hue', () => {
    const hues = regionHighlightHues(index as never);
    expect([...hues]).toEqual([['pfc', 123], ['m1', derivedHueFor(1, 3)], ['v1', 0]]);
  });

  it('colours a structure by its one owning region\'s hue for the surface, and gives a shared or unowned structure no colour of its own', () => {
    const hues = regionHighlightHues(index as never);
    for (const theme of THEMES) {
      expect(highlightColourOfStructure({ key: 'shape-a', owners: [owner('pfc')] }, hues, theme), theme).toBe(renderHighlightHue(123, theme));
      // The same owner reached two ways is still one region; two different regions is none.
      expect(highlightColourOfStructure({ key: 'shape-a', owners: [owner('pfc'), owner('pfc')] }, hues, theme), theme).toBe(renderHighlightHue(123, theme));
      expect(highlightColourOfStructure({ key: 'shape-a', owners: [owner('pfc'), owner('m1')] }, hues, theme), theme).toBe(renderHighlightHue(123, theme));
      expect(highlightColourOfStructure({ key: 'shape-a', owners: [] }, hues, theme), theme).toBe(renderHighlightHue(structureHue('shape-a'), theme));
      expect(highlightColourOfStructure({ key: 'shape-a', owners: [owner('cst', 'pathway')] }, hues, theme), theme).toBe(renderHighlightHue(structureHue('shape-a'), theme));
      expect(highlightColourOfStructure({ key: 'shape-a', owners: [owner('not-in-index')] }, hues, theme), theme).toBe(renderHighlightHue(structureHue('shape-a'), theme));
    }
    expect(highlightColourOfStructure({ key: 'shape-a', owners: [owner('pfc')] }, hues, 'light')).not.toBe(highlightColourOfStructure({ key: 'shape-a', owners: [owner('pfc')] }, hues, 'dark'));
  });
});
