import { describe, it, expect } from 'vitest';
import { CHANGED_FLAG_MS, DURATION_MOVE_MS, DURATION_QUICK_MS, DURATION_VIEW_MS, EASE } from '../motion/motion-tokens';
import { declarationsOf, listStyleFiles, parseRules, readAllStyles, readEntryFile, readStyleFile } from './read-kit-css';

const TOKEN_RULES = parseRules(readStyleFile('lab-tokens.css'));
const ROOT = TOKEN_RULES.filter((rule) => rule.context === '' && rule.selector === ':root').flatMap((rule) => [...rule.declarations]);
const ROOT_TOKENS = new Map(ROOT);
const ALL_STYLES = readAllStyles();
const ALL_RULES = parseRules(ALL_STYLES);
const MAX_FILE_LINES = 300;
const MINIMUM_TEXT_PX = 12;
const ROOT_FONT_PX = 16;

function rulesIn(contextPart: string) {
  return ALL_RULES.filter((rule) => rule.context.includes(contextPart));
}

describe('kit stylesheet files', () => {
  it('imports every file in styles/ from lab-kit.css', () => {
    const entry = readEntryFile();
    for (const name of listStyleFiles()) expect(entry, name).toContain(`@import "./styles/${name}";`);
  });

  it('keeps every file under 300 lines', () => {
    for (const name of listStyleFiles()) expect(readStyleFile(name).split('\n').length, name).toBeLessThan(MAX_FILE_LINES);
  });
});

describe('type, shape, space and motion tokens', () => {
  it('defines the names and values the build spec fixes', () => {
    const expected: Record<string, string> = {
      '--lab-text-meta': '0.75rem', '--lab-text-body': '0.8125rem', '--lab-text-title': '0.9375rem', '--lab-text-screen': '1.375rem', '--lab-text-figure': '1.75rem',
      '--lab-radius-s': '6px', '--lab-radius-m': '10px', '--lab-radius-l': '14px', '--lab-gap': '0.75rem', '--lab-pad': '1rem', '--lab-row': '2rem',
      '--lab-dur-1': '160ms', '--lab-dur-2': '280ms', '--lab-dur-3': '420ms', '--lab-ease': 'cubic-bezier(0.22, 1, 0.36, 1)', '--lab-measure': '72ch',
    };
    for (const [name, value] of Object.entries(expected)) expect(ROOT_TOKENS.get(name), name).toBe(value);
  });

  it('serves the family from this site and never a remote font', () => {
    expect(ROOT_TOKENS.get('--lab-font')).toMatch(/^"Inter"/);
    expect(ALL_STYLES).not.toMatch(/@font-face|url\(|@import\s+url|https?:/);
  });

  it('gives the spring a cubic-bezier fallback and a linear() form where supported', () => {
    expect(ROOT_TOKENS.get('--lab-spring')).toMatch(/^cubic-bezier\(/);
    const supported = TOKEN_RULES.find((rule) => rule.context.startsWith('@supports') && rule.selector === ':root');
    expect(supported?.declarations.get('--lab-spring')).toMatch(/^linear\(0, .+, 1\)$/);
  });

  it('matches the numbers the motion hooks use', () => {
    expect(ROOT_TOKENS.get('--lab-dur-1')).toBe(`${DURATION_QUICK_MS}ms`);
    expect(ROOT_TOKENS.get('--lab-dur-2')).toBe(`${DURATION_MOVE_MS}ms`);
    expect(ROOT_TOKENS.get('--lab-dur-3')).toBe(`${DURATION_VIEW_MS}ms`);
    expect(ROOT_TOKENS.get('--lab-ease')).toBe(EASE);
    expect(CHANGED_FLAG_MS).toBe(DURATION_VIEW_MS * 2);
    expect(ALL_STYLES).toContain('animation: lab-changed calc(var(--lab-dur-3) * 2)');
  });

  it('has retired the per-severity colours and keeps old names only as aliases', () => {
    expect(ALL_STYLES).not.toMatch(/--lab-(medium|low)\b/);
    expect(ALL_STYLES.match(/--lab-high/g)).toHaveLength(1);
    expect(ALL_STYLES).toContain('--lab-high: var(--lab-caution);');
    expect(ALL_STYLES).toContain('--lab-line-strong: var(--lab-control-line);');
    expect(ALL_STYLES).not.toMatch(/var\(--(lab-line-strong|lab-radius|lab-high|motion-[a-z-]+)\)/);
  });
});

describe('base rules', () => {
  it('sets one family and makes headings inherit it', () => {
    const headings = declarationsOf(ALL_RULES, '.lab :is(h1, h2, h3, h4, h5, h6)');
    expect(declarationsOf(ALL_RULES, '.lab').get('font-family')).toBe('var(--lab-font)');
    expect(headings.get('font-family')).toBe('inherit');
    expect(headings.get('font-size')).toBe('inherit');
    expect(headings.get('letter-spacing')).toBe('0');
    const families = new Set(ALL_RULES.map((rule) => rule.declarations.get('font-family')).filter((value) => value !== undefined));
    expect([...families].sort()).toEqual(['inherit', 'var(--lab-font)', 'var(--lab-mono)']);
  });

  it('sets nothing under 12px', () => {
    const literalSizes = [...ALL_STYLES.matchAll(/font-size:\s*([\d.]+)(rem|px)/g)].map(([, amount, unit]) => Number(amount) * (unit === 'rem' ? ROOT_FONT_PX : 1));
    const tokenSizes = [...ROOT_TOKENS].filter(([name]) => name.startsWith('--lab-text-')).map(([, value]) => Number.parseFloat(value) * ROOT_FONT_PX);
    for (const size of [...literalSizes, ...tokenSizes]) expect(size).toBeGreaterThanOrEqual(MINIMUM_TEXT_PX);
  });

  it('uses weights 400 and 600 only, and no upper-case labels', () => {
    const weights = new Set([...ALL_STYLES.matchAll(/font-weight:\s*(\w+)/g)].map(([, weight]) => weight));
    expect([...weights].sort()).toEqual(['400', '600']);
    expect(ALL_STYLES).not.toMatch(/text-transform:\s*uppercase/);
  });

  it('caps prose at 72 characters', () => {
    expect(declarationsOf(ALL_RULES, '.lab p, .lab-prose').get('max-width')).toBe('var(--lab-measure)');
  });

  it('draws a quiet row or a step ahead by colour, never by opacity', () => {
    const fades = ALL_RULES.filter((rule) => rule.declarations.has('opacity') && !rule.selector.includes('::placeholder'));
    expect(fades.map((rule) => rule.selector)).toEqual([]);
  });

  it('never fills a pressed chip with the background shorthand, which would wipe what is drawn on it', () => {
    const pressed = declarationsOf(ALL_RULES, '.lab-chip[aria-pressed="true"]');
    expect(pressed.has('background')).toBe(false);
    expect(pressed.get('color')).toBe('var(--lab-select-ink)');
    expect(declarationsOf(ALL_RULES, '.lab-chip[data-not-assessed="true"]:not([aria-pressed="true"])').get('color')).toBe('var(--lab-ink-soft)');
  });

  it('uses red for Critical and nothing else', () => {
    const red = ALL_RULES.filter((rule) => [...rule.declarations.values()].some((value) => value.includes('--lab-critical')));
    expect(red.map((rule) => rule.selector)).toEqual(['.lab-severity[data-severity="critical"] .lab-severity-stripe']);
  });

  it('uses the caution colour for borders only, never for words', () => {
    const caution = ALL_RULES.flatMap((rule) => [...rule.declarations].filter(([property, value]) => value.includes('--lab-caution') && !property.startsWith('--')).map(([property]) => property));
    expect(new Set(caution)).toEqual(new Set(['border-left']));
  });
});

describe('motion rule in the stylesheet', () => {
  it('has nothing that repeats', () => {
    expect(ALL_STYLES).not.toMatch(/\binfinite\b/);
    expect(ALL_STYLES).not.toMatch(/animation-iteration-count/);
  });

  it('removes movement and keeps state changes when the viewer asks for less motion', () => {
    const reduced = rulesIn('prefers-reduced-motion: reduce');
    const durations = reduced.find((rule) => rule.selector === ':root')?.declarations;
    for (const name of ['--lab-dur-1', '--lab-dur-2', '--lab-dur-3']) expect(durations?.get(name), name).toBe('0ms');
    const stilled = reduced.filter((rule) => rule.declarations.get('animation') === 'none').map((rule) => rule.selector);
    expect(stilled).toEqual(expect.arrayContaining(['.lab-drawer', '[data-changed="true"]']));
    // Every keyframe animation in the kit is switched off in that path.
    const animated = ALL_RULES.filter((rule) => rule.context === '' && (rule.declarations.get('animation') ?? 'none') !== 'none').map((rule) => rule.selector);
    expect(animated.sort()).toEqual(['.lab-drawer', '[data-changed="true"]']);
  });
});

describe('paper, forced colours and coarse pointers', () => {
  it('prints marks with their fills', () => {
    const marks = declarationsOf(ALL_RULES, '.lab-evidence-mark, .lab-hatch-swatch, .lab-severity-stripe');
    expect(marks.get('print-color-adjust')).toBe('exact');
    expect(declarationsOf(ALL_RULES, '.lab-splitbar-track').get('print-color-adjust')).toBe('exact');
  });

  it('keeps pressed, checked, current and selected states filled in forced colours', () => {
    const forced = rulesIn('forced-colors: active');
    const filled = forced.find((rule) => rule.declarations.get('background-color') === 'Highlight');
    expect(filled?.declarations.get('forced-color-adjust')).toBe('none');
    for (const state of ['[aria-pressed="true"]', '[aria-checked="true"]', '[aria-current="page"]', '[aria-current="true"]']) expect(filled?.selector, state).toContain(state);
  });

  it('keeps every mark visible in forced colours by drawing it in the text colour', () => {
    const forced = rulesIn('forced-colors: active');
    expect(forced.some((rule) => rule.selector.includes('.lab-evidence-mark') && rule.declarations.get('color') === 'inherit')).toBe(true);
    expect(forced.some((rule) => rule.selector.includes('.lab-splitbar-segment[data-kind="solid"]') && rule.declarations.get('background-color') === 'CanvasText')).toBe(true);
  });

  it('gives touch targets 44px on a coarse pointer', () => {
    const coarse = rulesIn('pointer: coarse');
    expect(coarse.find((rule) => rule.selector === ':root')?.declarations.get('--lab-row')).toBe('2.75rem');
    const tall = coarse.filter((rule) => rule.declarations.get('min-height') === '2.75rem').map((rule) => rule.selector).join(', ');
    for (const control of ['.lab-button', '.lab-chip', '.lab-segment', '.lab-input', '.lab-link', '.lab-table-sort', '.lab summary']) expect(tall, control).toContain(control);
  });
});
