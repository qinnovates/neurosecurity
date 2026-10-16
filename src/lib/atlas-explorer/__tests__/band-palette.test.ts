import { describe, expect, it } from 'vitest';
import { BAND_COLOURS, BAND_COLOURS_DARK, NEUTRAL_COLOUR } from '../scene-shapes';
import { SELECTION_COLOUR, SELECTION_COLOUR_DARK } from '../scene-drawing';

/**
 * The band palette is two ordinal ramps, not seven categories, because seven
 * mutually distinguishable hues do not exist for marks that are all on screen
 * at once. These checks pin the properties that made the chosen steps pass the
 * palette validator, so a later edit cannot quietly reintroduce a pair that
 * readers cannot tell apart.
 *
 * The thresholds come from the validator's own floors: adjacent ordinal steps
 * need a lightness gap of at least 0.06, and a selection or band colour needs
 * 3:1 against its surface.
 */

const LIGHT_SURFACE = '#fcfcfb';
const DARK_SURFACE = '#1a1a19';
const FOREBRAIN: readonly string[] = ['N7', 'N6', 'N5', 'N4'];
const HINDBRAIN: readonly string[] = ['N3', 'N2', 'N1'];
const MIN_ADJACENT_LIGHTNESS_GAP = 0.06;
const MIN_CONTRAST = 3;

function channels(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) throw new Error(`not a six-digit hex colour: ${hex}`);
  return [0, 2, 4].map((at) => parseInt(value.slice(at, at + 2), 16) / 255) as [number, number, number];
}

/** WCAG relative luminance, which is what the contrast ratio is defined over. */
function relativeLuminance(hex: string): number {
  const [red, green, blue] = channels(hex).map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(hex: string, surface: string): number {
  const [lighter, darker] = [relativeLuminance(hex), relativeLuminance(surface)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Perceptual lightness, the axis an ordinal ramp has to separate its steps on. */
function lightness(hex: string): number {
  return relativeLuminance(hex) ** (1 / 3);
}

function hueAngle(hex: string): number {
  const [red, green, blue] = channels(hex);
  const angle = (Math.atan2(Math.sqrt(3) * (green - blue), 2 * red - green - blue) * 180) / Math.PI;
  return (angle + 360) % 360;
}

/** The smallest angle between two hues, so 350 and 10 are 20 apart rather than 340. */
function hueDistance(a: string, b: string): number {
  const raw = Math.abs(hueAngle(a) - hueAngle(b));
  return Math.min(raw, 360 - raw);
}

describe('band palette: two ordinal ramps split on the forebrain boundary', () => {
  const modes = [
    { name: 'light', colours: BAND_COLOURS, surface: LIGHT_SURFACE },
    { name: 'dark', colours: BAND_COLOURS_DARK, surface: DARK_SURFACE },
  ];

  it('covers every band in both modes and nothing else', () => {
    const expected = [...FOREBRAIN, ...HINDBRAIN].sort();
    for (const { name, colours } of modes) {
      expect(Object.keys(colours).sort(), `${name} mode`).toEqual(expected);
    }
  });

  for (const { name, colours, surface } of modes) {
    describe(`${name} mode`, () => {
      for (const family of [FOREBRAIN, HINDBRAIN]) {
        const label = family === FOREBRAIN ? 'forebrain (N7-N4)' : 'cerebellum, brainstem and cord (N3-N1)';

        it(`${label} reads light to dark with a visible gap at every step`, () => {
          const steps = family.map((band) => colours[band]);
          for (let at = 1; at < steps.length; at += 1) {
            const gap = lightness(steps[at - 1]) - lightness(steps[at]);
            expect(gap, `${family[at - 1]} to ${family[at]}`).toBeGreaterThanOrEqual(MIN_ADJACENT_LIGHTNESS_GAP);
          }
        });

        it(`${label} is one hue family`, () => {
          const steps = family.map((band) => colours[band]);
          for (const step of steps.slice(1)) {
            expect(hueDistance(steps[0], step), `${step} against ${steps[0]}`).toBeLessThan(30);
          }
        });
      }

      it('separates the two families by hue, so a band never reads as one from the other family', () => {
        for (const near of FOREBRAIN) {
          for (const far of HINDBRAIN) {
            expect(hueDistance(colours[near], colours[far]), `${near} against ${far}`).toBeGreaterThan(60);
          }
        }
      });

      it('keeps the selection colour neutral, so it cannot be mistaken for a band', () => {
        const selection = name === 'light' ? SELECTION_COLOUR : SELECTION_COLOUR_DARK;
        expect(contrastRatio(selection, surface)).toBeGreaterThanOrEqual(MIN_CONTRAST);
        for (const band of Object.keys(colours)) {
          // A neutral has no hue to compare, so the test is that it is neutral:
          // its channels sit within a narrow spread, unlike every band.
          const spread = Math.max(...channels(colours[band])) - Math.min(...channels(colours[band]));
          const selectionSpread = Math.max(...channels(selection)) - Math.min(...channels(selection));
          expect(selectionSpread).toBeLessThan(0.1);
          expect(spread, `${band} should be chromatic`).toBeGreaterThan(0.1);
        }
      });
    });
  }

  it('keeps the no-data neutral out of both band families', () => {
    for (const { name, colours } of modes) {
      for (const band of Object.keys(colours)) {
        expect(colours[band].toLowerCase(), `${name} ${band}`).not.toBe(NEUTRAL_COLOUR.toLowerCase());
      }
    }
  });
});
