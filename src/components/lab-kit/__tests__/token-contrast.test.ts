import { describe, it, expect } from 'vitest';
import { BOUNDARY_CONTRAST_MINIMUM, ColourParseError, TEXT_CONTRAST_MINIMUM, compositeOver, contrastRatio, parseColour, type Rgba } from '../contrast';
import { declarationsOf, parseRules, readStyleFile } from './read-kit-css';

const RULES = parseRules(readStyleFile('lab-tokens.css'));
const THEMES = {
  light: declarationsOf(RULES, ':root, [data-lab-theme="light"]'),
  dark: declarationsOf(RULES, ':root[data-theme="dark"], [data-lab-theme="dark"]'),
} as const;
type ThemeName = keyof typeof THEMES;
const THEME_NAMES = Object.keys(THEMES) as ThemeName[];

/** The colour names the build spec fixes, plus `--lab-hover`, which the kit adds for hovered and lit rows. */
const COLOUR_TOKENS = [
  '--lab-ground', '--lab-panel', '--lab-panel-raised', '--lab-material', '--lab-ink', '--lab-ink-soft', '--lab-ink-faint', '--lab-line',
  '--lab-control-line', '--lab-hover', '--lab-select', '--lab-select-ink', '--lab-select-soft', '--lab-focus', '--lab-critical', '--lab-caution', '--lab-flow',
] as const;
const OPAQUE_SURFACES = ['--lab-ground', '--lab-panel', '--lab-panel-raised'] as const;
/** Translucent fills that text and controls sit on, each laid over every opaque surface. */
const OVERLAYS = ['--lab-hover', '--lab-select-soft', '--lab-material'] as const;
const TEXT_TOKENS = ['--lab-ink', '--lab-ink-soft', '--lab-ink-faint', '--lab-select', '--lab-critical'] as const;
const BOUNDARY_TOKENS = ['--lab-control-line', '--lab-select', '--lab-focus', '--lab-critical', '--lab-caution', '--lab-flow'] as const;

interface Measurement {
  theme: ThemeName;
  foreground: string;
  background: string;
  ratio: number;
  minimum: number;
}

function token(theme: ThemeName, name: string): Rgba {
  const value = THEMES[theme].get(name);
  if (value === undefined) throw new Error(`${name} is not defined for the ${theme} theme in styles/lab-tokens.css.`);
  return parseColour(value);
}

/** Every ground a foreground can sit on: each opaque surface, and each overlay laid over each surface. */
function backgrounds(theme: ThemeName): { name: string; colour: Rgba }[] {
  return OPAQUE_SURFACES.flatMap((surface) => {
    const base = token(theme, surface);
    return [{ name: surface, colour: base }, ...OVERLAYS.map((overlay) => ({ name: `${overlay} over ${surface}`, colour: compositeOver(token(theme, overlay), base) }))];
  });
}

function measure(theme: ThemeName): Measurement[] {
  const measurements: Measurement[] = [];
  for (const background of backgrounds(theme)) {
    for (const name of TEXT_TOKENS) measurements.push({ theme, foreground: name, background: background.name, ratio: contrastRatio(token(theme, name), background.colour), minimum: TEXT_CONTRAST_MINIMUM });
    for (const name of BOUNDARY_TOKENS) measurements.push({ theme, foreground: `${name} (edge)`, background: background.name, ratio: contrastRatio(token(theme, name), background.colour), minimum: BOUNDARY_CONTRAST_MINIMUM });
  }
  // Filled states: the words on a pressed chip, and on the primary button.
  measurements.push({ theme, foreground: '--lab-select-ink', background: '--lab-select', ratio: contrastRatio(token(theme, '--lab-select-ink'), token(theme, '--lab-select')), minimum: TEXT_CONTRAST_MINIMUM });
  measurements.push({ theme, foreground: '--lab-panel', background: '--lab-ink', ratio: contrastRatio(token(theme, '--lab-panel'), token(theme, '--lab-ink')), minimum: TEXT_CONTRAST_MINIMUM });
  return measurements;
}

describe('contrast arithmetic', () => {
  it('gives 21 for black on white and 1 for a colour on itself', () => {
    expect(contrastRatio(parseColour('#000'), parseColour('#ffffff'))).toBeCloseTo(21, 5);
    expect(contrastRatio(parseColour('#777777'), parseColour('rgb(119, 119, 119)'))).toBeCloseTo(1, 5);
  });

  it('lays a translucent colour over what is beneath it before measuring', () => {
    expect(compositeOver(parseColour('rgba(0, 0, 0, 0.5)'), parseColour('#ffffff'))).toEqual({ red: 127.5, green: 127.5, blue: 127.5, alpha: 1 });
  });

  it('refuses a value it cannot read, so a token that is not a literal fails the test', () => {
    expect(() => parseColour('var(--color-text-primary)')).toThrow(ColourParseError);
  });
});

describe.each(THEME_NAMES)('colour tokens, %s theme', (theme) => {
  it('defines every colour token as a literal colour', () => {
    for (const name of COLOUR_TOKENS) expect(() => token(theme, name), name).not.toThrow();
    expect(THEMES[theme].get('--lab-shadow-float')).toBeDefined();
  });

  it('keeps the three surfaces opaque, so text contrast on them is what was measured', () => {
    for (const surface of OPAQUE_SURFACES) expect(token(theme, surface).alpha, surface).toBe(1);
  });

  it.each(measure(theme))('$foreground on $background meets $minimum:1', ({ ratio, minimum }) => {
    expect(ratio).toBeGreaterThanOrEqual(minimum);
  });
});

describe('colour tokens on paper', () => {
  it('resets every colour token to its light value whatever the theme on screen', () => {
    const print = declarationsOf(RULES, ':root, :root[data-theme="dark"], [data-lab-theme="light"], [data-lab-theme="dark"]', '@media print');
    for (const [name, value] of THEMES.light) expect(print.get(name), name).toBe(value);
    for (const name of THEMES.dark.keys()) expect(print.has(name), name).toBe(true);
    expect(print.get('color-scheme')).toBe('light');
  });

  it('defines the same set of colour tokens in both themes', () => {
    expect([...THEMES.dark.keys()].sort()).toEqual([...THEMES.light.keys()].sort());
  });
});
