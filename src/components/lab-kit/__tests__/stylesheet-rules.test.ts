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
    // A changed figure is marked for one view duration; one pass of flow takes one and a half. Both follow --lab-dur-3, so less motion zeroes them.
    expect(CHANGED_FLAG_MS).toBe(DURATION_VIEW_MS);
    expect(ROOT_TOKENS.get('--lab-dur-flash')).toBe('var(--lab-dur-3)');
    expect(ROOT_TOKENS.get('--lab-dur-flow')).toBe('calc(var(--lab-dur-3) * 1.5)');
    expect(ALL_STYLES).toContain('animation: lab-changed var(--lab-dur-flash) var(--lab-ease) 1 both');
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
    // Opacity is for a layer on its way out (a keyframe), never for a resting state.
    const fades = ALL_RULES.filter((rule) => rule.declarations.has('opacity') && !rule.selector.includes('::placeholder') && !rule.context.includes('@keyframes'));
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

/** Every selector whose animation the less-motion path switches off, joined. */
function stilledSelectors(): string {
  return rulesIn('prefers-reduced-motion: reduce').filter((rule) => rule.declarations.get('animation') === 'none').map((rule) => rule.selector).join(', ');
}

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
    // Every keyframe animation in the kit is switched off in that path, the exits included.
    const animated = ALL_RULES.filter((rule) => rule.context === '' && (rule.declarations.get('animation') ?? 'none') !== 'none').map((rule) => rule.selector);
    expect(animated.sort()).toEqual(['.lab-drawer', '.lab-drawer[data-closing="true"]', '.lab-float[data-closing="true"]', '[data-changed="true"]']);
    for (const selector of animated) expect(stilled.join(', '), selector).toContain(selector);
    // The thumb's slide is switched off as well as running on a 0ms token.
    expect(reduced.filter((rule) => rule.declarations.get('transition') === 'none').map((rule) => rule.selector)).toContain('.lab-segmented-thumb');
    const pressed = ALL_RULES.filter((rule) => rule.context === '' && rule.selector.endsWith(':active') && rule.declarations.has('transform')).map((rule) => rule.selector);
    expect(pressed.sort()).toEqual(['.lab-button:active', '.lab-chip:active', '.lab-segment:active']);
    const unpressed = reduced.filter((rule) => rule.declarations.get('transform') === 'none').map((rule) => rule.selector).join(', ');
    for (const selector of pressed) expect(unpressed, selector).toContain(selector);
  });

  it('plays each exit once, forwards, with the move and colour durations', () => {
    expect(declarationsOf(ALL_RULES, '.lab-drawer[data-closing="true"]').get('animation')).toBe('lab-drawer-out var(--lab-dur-2) var(--lab-ease) both');
    expect(declarationsOf(ALL_RULES, '.lab-float[data-closing="true"]').get('animation')).toBe('lab-float-out var(--lab-dur-1) var(--lab-ease) both');
    const sheet = ALL_RULES.find((rule) => rule.context.includes('max-width: 719.98px') && rule.selector === '.lab-drawer[data-closing="true"]');
    expect(sheet?.declarations.get('animation-name')).toBe('lab-sheet-out');
  });

  it('names what persists through a change of view, and cross-fades the rest for the move duration', () => {
    expect(declarationsOf(ALL_RULES, '.lab-vt-diagram').get('view-transition-name')).toBe('lab-diagram');
    expect(declarationsOf(ALL_RULES, '.lab-vt-identity').get('view-transition-name')).toBe('lab-identity');
    expect(declarationsOf(ALL_RULES, ':root:has(.lab)::view-transition-old(root), :root:has(.lab)::view-transition-new(root)').get('animation-duration')).toBe('var(--lab-dur-2)');
    expect(stilledSelectors()).toContain('::view-transition-group(*)');
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
    // The floor also reaches controls the kit does not name, and outranks a screen's single-class rule.
    const floor = coarse.find((rule) => rule.selector.startsWith('.lab :is(button, select, summary, textarea'));
    expect(floor?.declarations.get('min-height')).toBe('2.75rem');
    const wide = coarse.filter((rule) => rule.declarations.get('min-width') === '2.75rem').map((rule) => rule.selector).join(', ');
    for (const control of ['.lab-button', '.lab-chip', '.lab-segment', '.lab :is(button']) expect(wide, control).toContain(control);
  });

  it('sets field text to 16px on a coarse pointer, so a phone does not zoom the page on focus', () => {
    const fields = rulesIn('pointer: coarse').find((rule) => rule.declarations.get('font-size') === '1rem');
    for (const field of ['input', 'select', 'textarea']) expect(fields?.selector, field).toContain(field);
  });

  it('keeps the 2px focus ring in forced colours, on a lit row too', () => {
    const forced = rulesIn('forced-colors: active');
    expect(forced.find((rule) => rule.selector === '.lab :focus-visible')?.declarations.get('outline')).toBe('2px solid Highlight');
    const lit = forced.find((rule) => rule.selector.includes('[data-lit="true"]'));
    expect(lit?.selector).toBe('.lab [data-lit="true"]:not(:focus-visible)');
  });
});

const GRID_PX = 4;
function toPx(value: string | undefined): number {
  const match = /^(-?[\d.]+)(rem|px)$/.exec(value ?? '');
  if (match === null) throw new Error(`"${value}" is not a length in rem or px.`);
  return Number(match[1]) * (match[2] === 'rem' ? ROOT_FONT_PX : 1);
}

describe('the 4px grid', () => {
  it('sets 13px text on a 20px line, 12px text on a 16px line and the screen title on 28px', () => {
    expect(declarationsOf(ALL_RULES, '.lab').get('line-height')).toBe('1.25rem');
    expect(declarationsOf(ALL_RULES, '.lab .lab-title').get('line-height')).toBe('1.75rem');
    expect(declarationsOf(ALL_RULES, '.lab .lab-title').get('font-size')).toBe('var(--lab-text-screen)');
    expect(declarationsOf(ALL_RULES, '.lab .lab-panel-title').get('line-height')).toBe('1.25rem');
    // Every rule that sets the 12px size sets its 16px line with it.
    const meta = ALL_RULES.filter((rule) => rule.declarations.get('font-size') === 'var(--lab-text-meta)' && !rule.selector.includes('.lab-hatch'));
    expect(meta.length).toBeGreaterThan(8);
    for (const rule of meta) expect(rule.declarations.get('line-height'), rule.selector).toBe('1rem');
  });

  it('uses no unitless or off-grid line-height anywhere in the kit', () => {
    const lineHeights = ALL_RULES.filter((rule) => rule.declarations.has('line-height') && rule.declarations.get('line-height') !== 'inherit');
    for (const rule of lineHeights) expect(toPx(rule.declarations.get('line-height')) % GRID_PX, rule.selector).toBe(0);
  });

  it('makes a button and a field 28px: a 20px line, 3px of padding and a 1px edge each side', () => {
    for (const selector of ['.lab-button', '.lab-input']) {
      const control = [...ALL_RULES].find((rule) => rule.context === '' && rule.selector === selector)?.declarations;
      const [paddingBlock] = (control?.get('padding') ?? '').split(' ');
      expect(toPx('1.25rem') + 2 * toPx(paddingBlock) + 2 * toPx('1px'), selector).toBe(28);
      expect(toPx(control?.get('min-height')), selector).toBe(28);
    }
  });

  it('draws the segmented track edge inside it, so the control is 28px, and keeps radii on the 6, 10, 14 set', () => {
    const track = declarationsOf(ALL_RULES, '.lab-segmented');
    expect(track.has('border')).toBe(false);
    expect(track.get('box-shadow')).toBe('inset 0 0 0 1px var(--lab-control-line)');
    expect(toPx(declarationsOf(ALL_RULES, '.lab-segment').get('min-height')) + 2 * toPx(track.get('padding'))).toBe(28);
    expect(declarationsOf(ALL_RULES, '.lab-segment').get('border-radius')).toBe('var(--lab-radius-s)');
    expect(declarationsOf(ALL_RULES, '.lab-notice').get('border-radius')).toBe('0 var(--lab-radius-s) var(--lab-radius-s) 0');
  });

  it('wraps a segmented control and a chip inside their own width instead of widening the page', () => {
    const track = declarationsOf(ALL_RULES, '.lab-segmented');
    expect([track.get('flex-wrap'), track.get('max-width')]).toEqual(['wrap', '100%']);
    expect(declarationsOf(ALL_RULES, '.lab-chip').get('max-width')).toBe('100%');
    expect(ALL_RULES.find((rule) => rule.context.includes('max-width: 719.98px') && rule.selector === '.lab-chip')?.declarations.get('white-space')).toBe('normal');
  });
});

describe('the drawer and the sheet', () => {
  it('stands between the bars and the standing statements at every width', () => {
    const drawer = declarationsOf(ALL_RULES, '.lab-drawer');
    expect(drawer.get('top')).toBe('var(--lab-drawer-top, 0px)');
    expect(drawer.get('bottom')).toBe('var(--lab-drawer-bottom, 0px)');
  });

  it('caps the sheet so its title and Close stay under the bars on a phone', () => {
    const sheet = ALL_RULES.find((rule) => rule.context.includes('max-width: 719.98px') && rule.selector === '.lab-drawer')?.declarations;
    expect(sheet?.get('max-height')).toBe('calc(100dvh - var(--lab-drawer-top, 0px) - var(--lab-drawer-bottom, 0px) - 0.5rem)');
    expect(sheet?.has('bottom')).toBe(false);
  });

  it('has a solid surface where the browser cannot blur, and the measured float material where it can', () => {
    expect(declarationsOf(ALL_RULES, '.lab-drawer').get('background')).toBe('var(--lab-panel-raised)');
    expect(declarationsOf(ALL_RULES, '.lab-float').get('background')).toBe('var(--lab-panel-raised)');
    const material = ALL_RULES.find((rule) => rule.context.startsWith('@supports') && rule.selector === '.lab-drawer, .lab-float')?.declarations;
    expect(material?.get('background')).toBe('var(--lab-material-float)');
    expect(material?.get('backdrop-filter')).toBe('saturate(180%) blur(20px)');
  });

  it('shows the linked item with its own fill and an ink bar, not the hover tint', () => {
    expect(declarationsOf(ALL_RULES, '.lab [data-lit="true"]').get('background-color')).toBe('var(--lab-lit)');
    expect(declarationsOf(ALL_RULES, '.lab-table tbody tr[data-lit="true"] td:first-child, .lab-card[data-lit="true"]').get('box-shadow')).toBe('inset 3px 0 0 var(--lab-ink)');
  });
});
