import { describe, expect, it } from 'vitest';
import { INSIDE_COLOUR, INSIDE_COLOUR_DARK, SELECTION_COLOUR, SELECTION_COLOUR_DARK, SURFACE_INK, materialParamsFor } from '../scene-drawing';
import { NEUTRAL_COLOUR, NISS_COLOURS, NISS_COLOURS_DARK, type SceneTheme } from '../scene-shapes';

/**
 * The inks that belong to the surface rather than to a shape: the selection
 * brackets and the "inside or mixed" fill. Each has one property that matters
 * more than how it looks, and each property is about the surface the ink is
 * actually drawn on:
 *
 *   - **the selection mark must be findable.** It says "this one, the one you
 *     asked for", so a reader who cannot see it has lost the answer to their own
 *     question. The light ink was used on both surfaces: near-black brackets on
 *     the dark surface read at 1.10:1, a mark drawn and then hidden.
 *   - **a pale shape must be denser than a shape with no record.** Pale means
 *     "the lens holds this somewhere inside here"; lines mean "the lens holds
 *     nothing here". On the light surface the pale ink out-contrasted the context
 *     neutral 5.07 to 2.61. The same ink on the dark surface inverted it, 3.09 to
 *     6.01, so the shapes with no record were the denser ones -- the absence
 *     channel over the ownership channel, the same reading the NISS palette must
 *     never produce (see niss-palette.test.ts).
 *
 * The checks pin the properties per surface rather than the hex values, so the
 * inks can be restyled but the orderings cannot silently invert again. The two
 * surfaces are the pair the NISS palette is measured against, so every canvas
 * palette check in this suite reads against one pair.
 */

const LIGHT_SURFACE = '#ece8e1';
const DARK_SURFACE = '#0e0f11';
/** A mark on a canvas is a non-text graphic: WCAG's floor for one is 3:1. */
const MIN_SELECTION_CONTRAST = 3;
/** Two inks must be told apart from each other, not merely each from the surface. */
const MIN_SEPARATION = 1.25;

function channels(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) throw new Error(`not a six-digit hex colour: ${hex}`);
  return [0, 2, 4].map((at) => parseInt(value.slice(at, at + 2), 16) / 255) as [number, number, number];
}

/** WCAG relative luminance, which is what the contrast ratio is defined over. */
function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

describe('the surface inks: the selection is findable and a pale shape is denser than an empty one', () => {
  const surfaces = [
    { name: 'light', theme: 'light' as SceneTheme, surface: LIGHT_SURFACE, steps: NISS_COLOURS },
    { name: 'dark', theme: 'dark' as SceneTheme, surface: DARK_SURFACE, steps: NISS_COLOURS_DARK },
  ];

  it('holds the pale ink for each surface, stepped apart, and the selection ink beside it as a role of its own', () => {
    expect(Object.keys(SURFACE_INK).sort()).toEqual(['dark', 'light']);
    expect(SURFACE_INK.light).toEqual({ inside: INSIDE_COLOUR, selection: SELECTION_COLOUR, selectionHalo: SELECTION_COLOUR_DARK });
    expect(SURFACE_INK.dark).toEqual({ inside: INSIDE_COLOUR_DARK, selection: SELECTION_COLOUR_DARK, selectionHalo: SELECTION_COLOUR });
    expect(INSIDE_COLOUR).not.toBe(INSIDE_COLOUR_DARK);
    // The selection never inks a shape: it inks the corner brackets and the picked electrode dot, each with the other surface's ink as its halo.
    expect(new Set([SELECTION_COLOUR, SELECTION_COLOUR_DARK, INSIDE_COLOUR, INSIDE_COLOUR_DARK]).size).toBe(4);
  });

  for (const { name, theme, surface, steps } of surfaces) {
    describe(`${name} surface`, () => {
      const ink = SURFACE_INK[theme];
      const selection = theme === 'light' ? SELECTION_COLOUR : SELECTION_COLOUR_DARK;

      it('keeps a selection ink that stands as a deliberate mark on this surface', () => {
        expect(contrast(selection, surface), `selection on ${name}`).toBeGreaterThanOrEqual(MIN_SELECTION_CONTRAST);
      });

      it('keeps the selection neutral, so it can never read as a band or a step', () => {
        const spread = Math.max(...channels(selection)) - Math.min(...channels(selection));
        expect(spread, `selection on ${name} must have no hue`).toBeLessThan(0.1);
      });

      it('makes a pale shape denser than a shape the lens holds nothing for', () => {
        const pale = contrast(ink.inside, surface);
        const empty = contrast(NEUTRAL_COLOUR, surface);
        expect(pale, `the pale ink must out-contrast the context neutral on ${name}`).toBeGreaterThan(empty);
        expect(contrast(ink.inside, NEUTRAL_COLOUR), `pale against neutral on ${name}`).toBeGreaterThanOrEqual(MIN_SEPARATION);
      });

      it('keeps a pale shape quieter than a filled one, so "inside" never shouts over a value', () => {
        expect(contrast(ink.inside, surface), `the pale ink on ${name}`).toBeLessThan(contrast(steps.critical, surface));
      });

      it('tells the selection ink and the pale ink apart from each other', () => {
        expect(contrast(selection, ink.inside), `selection against pale on ${name}`).toBeGreaterThanOrEqual(MIN_SEPARATION);
      });

      it('is the ink the drawing layer actually reaches for on this surface', () => {
        const shape = { layer: 'cortical' as const, fill: 'translucent' as const, colour: '#123456' };
        expect(materialParamsFor(shape, false, theme).colour).toBe(ink.inside);
      });
    });
  }

  it('is the only thing that changes between the surfaces: the context neutral is one ink for both', () => {
    for (const { theme } of surfaces) {
      for (const fill of ['lines', 'neutral'] as const) {
        expect(materialParamsFor({ layer: 'cortical', fill, colour: '#123456' }, false, theme).colour).toBe(NEUTRAL_COLOUR);
      }
    }
  });
});
