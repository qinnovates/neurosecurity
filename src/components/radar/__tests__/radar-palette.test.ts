/**
 * The palette is measured, not judged. Every fill colour the radars use is read
 * out of `radar-palette.css` and held to the 3:1 boundary floor this codebase
 * already holds its control edges to, in both themes, on every surface a chart
 * sits on: the three page surfaces and `.glass` laid over each of them.
 *
 * The severity order is held separately, as ink coverage, because hue is never
 * allowed to be the only channel.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BOUNDARY_CONTRAST_MINIMUM, compositeOver, contrastRatio, parseColour, type Rgba } from '@/components/lab-kit/contrast';
import { parseRules } from '@/components/lab-kit/__tests__/read-kit-css';
import { COUNT_TONE, RADAR_TONES, TONE_PATTERNS, WITHHELD_PATTERN, inkCoverage } from '../radar-patterns';

const PALETTE = parseRules(readFileSync(path.resolve(import.meta.dirname, '..', 'radar-palette.css'), 'utf8'));

/** The page surfaces from `src/styles/global.css`, and the glass fill a chart's card is made of. */
const SURFACES = {
  light: { deep: '#f5f6f8', surface: '#eceef2', elevated: '#dfe2e9', glass: 'rgba(255, 255, 255, 0.62)' },
  dark: { deep: '#000000', surface: '#0b0b10', elevated: '#15151c', glass: 'rgba(255, 255, 255, 0.05)' },
} as const;
type ThemeName = keyof typeof SURFACES;
const THEMES = Object.keys(SURFACES) as ThemeName[];

const FILL_KINDS = [...RADAR_TONES, COUNT_TONE] as const;

const DARK_SCOPE = ':root[data-theme="dark"]';

/**
 * The value of `property` for `theme`, from the rules that are not inside an
 * at-rule: the dark theme's rules are the ones scoped to `:root[data-theme="dark"]`,
 * and the light theme's are the rest. The last declaration wins, as in the browser.
 */
function tokenFor(theme: ThemeName, needle: string, property: string): string {
  const matches = PALETTE.filter(
    (rule) => rule.context === '' && rule.selector.includes(needle) && rule.selector.includes(DARK_SCOPE) === (theme === 'dark') && rule.declarations.has(property),
  );
  const value = matches.at(-1)?.declarations.get(property);
  if (value === undefined) throw new Error(`No ${theme} rule for "${needle}" declares ${property} in radar-palette.css.`);
  return value;
}

function toneColour(theme: ThemeName, fill: string): string {
  return tokenFor(theme, `[data-radar-fill="${fill}"]`, '--radar-tone');
}

function withheldColour(theme: ThemeName): string {
  return tokenFor(theme, '.radar', '--radar-withheld');
}

/** Every ground a chart is drawn on: each page surface, and the glass card over each. */
function groundsOf(theme: ThemeName): { name: string; colour: Rgba }[] {
  const surfaces = SURFACES[theme];
  const opaque = (['deep', 'surface', 'elevated'] as const).map((name) => ({ name, colour: parseColour(surfaces[name]) }));
  return [...opaque, ...opaque.map((ground) => ({ name: `glass over ${ground.name}`, colour: compositeOver(parseColour(surfaces.glass), ground.colour) }))];
}

describe('the radar palette', () => {
  for (const theme of THEMES) {
    for (const fill of FILL_KINDS) {
      it(`draws ${fill} at 3:1 or better on every ${theme} ground`, () => {
        const colour = parseColour(toneColour(theme, fill));
        for (const ground of groundsOf(theme)) {
          expect(contrastRatio(colour, ground.colour), `${fill} on ${ground.name} (${theme})`).toBeGreaterThanOrEqual(BOUNDARY_CONTRAST_MINIMUM);
        }
      });
    }

    it(`draws the withheld hatch at 3:1 or better on every ${theme} ground`, () => {
      const colour = parseColour(withheldColour(theme));
      for (const ground of groundsOf(theme)) {
        expect(contrastRatio(colour, ground.colour), `withheld on ${ground.name} (${theme})`).toBeGreaterThanOrEqual(BOUNDARY_CONTRAST_MINIMUM);
      }
    });

    it(`gives every ${theme} fill its own colour`, () => {
      const values = FILL_KINDS.map((fill) => toneColour(theme, fill).toLowerCase());
      expect(new Set(values).size).toBe(values.length);
    });

    it(`defines every ${theme} value as a literal, so this test can read it`, () => {
      for (const fill of FILL_KINDS) expect(() => parseColour(toneColour(theme, fill))).not.toThrow();
      expect(() => parseColour(withheldColour(theme))).not.toThrow();
    });
  }
});

describe('the severity order', () => {
  it('rises as ink, so it reads without colour', () => {
    const coverages = RADAR_TONES.map((tone) => inkCoverage(TONE_PATTERNS[tone]));
    for (let index = 1; index < coverages.length; index += 1) {
      expect(coverages[index], `${RADAR_TONES[index]} over ${RADAR_TONES[index - 1]}`).toBeGreaterThan(coverages[index - 1]);
    }
  });

  it('keeps the withheld hatch apart from every severity fill', () => {
    const withheld = inkCoverage(WITHHELD_PATTERN);
    for (const tone of RADAR_TONES) expect(Math.abs(withheld - inkCoverage(TONE_PATTERNS[tone])), tone).toBeGreaterThan(0.02);
    // And it is the one fill whose marks run the other diagonal, so it is not a denser member of the ramp.
    expect(WITHHELD_PATTERN.marks).toEqual([{ kind: 'line', x1: 0, y1: 0, x2: 4, y2: 4, width: 1 }]);
  });
});
