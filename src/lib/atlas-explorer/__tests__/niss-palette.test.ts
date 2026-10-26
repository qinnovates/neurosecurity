import { describe, expect, it } from 'vitest';
import { NISS_COLOURS, NISS_COLOURS_DARK } from '../scene-shapes';

/**
 * The severity palette has one property that matters more than how it looks:
 * **a more severe step must be more visible than a less severe one, on the
 * surface it is actually drawn on.**
 *
 * It did not hold. The light ramp runs lightest-to-darkest, and the canvas used
 * it in both themes, so on the dark surface `critical` landed at about 1.5:1 —
 * effectively invisible — while `none` sat near 13:1 and became the loudest mark
 * on screen. The absence channel outshouted the severity channel, which is the
 * one reading this palette must never produce.
 *
 * These checks pin the property per surface rather than the hex values, so the
 * steps can be restyled but the ordering cannot silently invert again.
 */

const LIGHT_SURFACE = '#ece8e1';
const DARK_SURFACE = '#0e0f11';
const STEPS: readonly string[] = ['none', 'low', 'medium', 'high', 'critical'];
/** Adjacent steps must be told apart from each other, not merely from the surface. */
const MIN_ADJACENT_SEPARATION = 1.25;
/** The most severe step has to be a clearly deliberate mark on its surface. */
const MIN_CRITICAL_CONTRAST = 4.5;

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

describe('NISS palette: severity is more visible than absence, on each surface', () => {
  const surfaces = [
    { name: 'light', colours: NISS_COLOURS, surface: LIGHT_SURFACE },
    { name: 'dark', colours: NISS_COLOURS_DARK, surface: DARK_SURFACE },
  ];

  it('defines exactly the five steps in both palettes', () => {
    for (const { name, colours } of surfaces) {
      expect(Object.keys(colours).sort(), `${name} palette`).toEqual([...STEPS].sort());
    }
  });

  for (const { name, colours, surface } of surfaces) {
    describe(`${name} surface`, () => {
      it('makes each step more visible than the one below it', () => {
        const ratios = STEPS.map((step) => contrast(colours[step], surface));
        for (let at = 1; at < ratios.length; at += 1) {
          expect(ratios[at], `${STEPS[at]} must out-contrast ${STEPS[at - 1]} on ${name}`).toBeGreaterThan(ratios[at - 1]);
        }
      });

      it('never lets absence be the loudest mark', () => {
        const absence = contrast(colours.none, surface);
        const worst = contrast(colours.critical, surface);
        expect(absence, `none must not out-contrast critical on ${name}`).toBeLessThan(worst);
      });

      it('keeps adjacent steps distinguishable from each other', () => {
        for (let at = 1; at < STEPS.length; at += 1) {
          const separation = contrast(colours[STEPS[at]], colours[STEPS[at - 1]]);
          expect(separation, `${STEPS[at - 1]} vs ${STEPS[at]} on ${name}`).toBeGreaterThanOrEqual(MIN_ADJACENT_SEPARATION);
        }
      });

      it('draws the most severe step as a deliberate mark', () => {
        expect(contrast(colours.critical, surface), `critical on ${name}`).toBeGreaterThanOrEqual(MIN_CRITICAL_CONTRAST);
      });
    });
  }
});
