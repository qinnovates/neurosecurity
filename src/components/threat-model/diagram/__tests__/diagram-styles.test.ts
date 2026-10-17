import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { parseCss, splitSelectors, type CssRule } from './parse-css';

const COMPONENT_DIRECTORY = 'src/components/threat-model';
const STYLESHEET = path.join(COMPONENT_DIRECTORY, 'threat-model.css');
const OWNED_FILES = [
  'ArchitectureDiagram.tsx', 'diagram-layout.ts', 'DeviceCanvas.tsx', 'PartStrip.tsx', 'TargetRegionsPanel.tsx', 'threat-model.css',
  ...fs.readdirSync(path.join(COMPONENT_DIRECTORY, 'diagram')).filter((name) => /\.(ts|tsx)$/.test(name)).map((name) => path.join('diagram', name)),
];
const MIN_TYPE_PX = 12;
const ROOT_FONT_PX = 16;
const MAX_FILE_LINES = 300;

const css = fs.readFileSync(STYLESHEET, 'utf-8');
const rules = parseCss(css);
const declarationsOf = (property: string): { rule: CssRule; value: string }[] =>
  rules.flatMap((rule) => rule.declarations.filter((declaration) => declaration.property === property).map((declaration) => ({ rule, value: declaration.value })));

function toPixels(value: string): number | null {
  const match = value.match(/^([\d.]+)(px|rem)$/);
  if (match === null) return null;
  return Number(match[1]) * (match[2] === 'rem' ? ROOT_FONT_PX : 1);
}

describe('the diagram stylesheet', () => {
  it('is read as rules', () => {
    expect(rules.length).toBeGreaterThan(50);
    expect(rules.some((rule) => rule.context.some((context) => context.startsWith('@keyframes')))).toBe(true);
  });

  it('has no animation that repeats: every animation names a finite count and none is infinite', () => {
    expect(css).not.toMatch(/infinite/);
    const animations = declarationsOf('animation').filter(({ value }) => value !== 'none');
    expect(animations.length).toBeGreaterThan(0);
    for (const { rule, value } of animations) expect(value.split(/\s+/), rule.selector).toContain('1');
    for (const { rule, value } of declarationsOf('animation-iteration-count')) expect(value, rule.selector).toMatch(/^\d+$/);
  });

  const ANIMATED = ['.lab-diagram-step[data-step="now"]', '.lab-diagram-part[data-entered="true"]', '.lab-diagram-pass'];

  it('animates three things, each once and each in answer to the reader or an edit: the step just reached, a part an edit added, and the flow pass', () => {
    const animated = rules.filter((rule) => rule.declarations.some((declaration) => declaration.property === 'animation' && declaration.value !== 'none'));
    expect(animated.map((rule) => rule.selector)).toEqual(ANIMATED);
  });

  it('stops every one of them for a reader who asked for less motion', () => {
    const calmed = rules
      .filter((rule) => rule.context.includes('@media (prefers-reduced-motion: reduce)') && rule.declarations.some((declaration) => declaration.property === 'animation' && declaration.value === 'none'))
      .flatMap((rule) => splitSelectors(rule.selector));
    for (const selector of ANIMATED) expect(calmed, selector).toContain(selector);
  });

  it('never scales the drawing: the fit to a narrow place is the list form, so no rule shrinks the svg', () => {
    const svgRules = rules.filter((rule) => !rule.context.includes('@media print') && splitSelectors(rule.selector).includes('.lab-diagram-svg'));
    for (const rule of svgRules) expect(rule.declarations.some((declaration) => declaration.property === 'max-width' && declaration.value !== 'none'), rule.selector).toBe(false);
  });

  it('lights a part with the lit token and tints a zone with the zone token, each apart from plain hover', () => {
    const valuesOf = (selectorPart: string): string => rules.filter((rule) => rule.selector.includes(selectorPart)).flatMap((rule) => rule.declarations.map((declaration) => declaration.value)).join(' ');
    expect(valuesOf('.lab-diagram-zone rect')).toContain('var(--lab-zone)');
    expect(valuesOf('.lab-diagram-row[data-lit="true"]')).toContain('var(--lab-lit)');
    expect(valuesOf('.lab-diagram-zone rect')).not.toContain('var(--lab-hover)');
  });

  it('removes the flow pass for a reader who asked for less motion, and on paper', () => {
    const hides = (context: string): boolean => rules.some((rule) => rule.context.includes(context) && splitSelectors(rule.selector).includes('.lab-diagram-pass')
      && rule.declarations.some((declaration) => declaration.property === 'display' && declaration.value === 'none'));
    expect(hides('@media (prefers-reduced-motion: reduce)')).toBe(true);
    expect(hides('@media print')).toBe(true);
  });

  it('sets no type under 12px, and the drawing\'s type in CSS pixels', () => {
    const sizes = declarationsOf('font-size');
    expect(sizes.length).toBeGreaterThan(5);
    for (const { rule, value } of sizes) {
      if (/^var\(--lab-text-(meta|body|title|screen|figure)\)$/.test(value)) continue;
      const pixels = toPixels(value);
      expect(pixels, `${rule.selector} { font-size: ${value} }`).not.toBeNull();
      expect(pixels, rule.selector).toBeGreaterThanOrEqual(MIN_TYPE_PX);
    }
    const drawingSizes = sizes.filter(({ rule }) => rule.selector.includes('lab-diagram-svg') || rule.selector.includes('lab-diagram-part'));
    expect(drawingSizes.length).toBeGreaterThan(0);
    for (const { value } of drawingSizes) expect(value).toMatch(/^\d+px$/);
  });

  it('uses the selection colour only for a selected element', () => {
    const selecting = rules.filter((rule) => rule.declarations.some((declaration) => declaration.value.includes('var(--lab-select')));
    expect(selecting.length).toBeGreaterThan(0);
    for (const rule of selecting) {
      for (const selector of splitSelectors(rule.selector)) expect(selector, selector).toMatch(/\[(data-selected|aria-selected|aria-pressed)="true"\]/);
    }
  });

  it('steps an element back by colour, never by transparency', () => {
    expect(declarationsOf('opacity')).toEqual([]);
    expect(declarationsOf('stroke-opacity')).toEqual([]);
    expect(declarationsOf('fill-opacity')).toEqual([]);
    const dimmed = rules.filter((rule) => rule.selector.includes('data-dimmed'));
    expect(dimmed.length).toBeGreaterThan(0);
    for (const rule of dimmed) expect(rule.declarations.every((declaration) => /^(stroke|fill|color|border-color)$/.test(declaration.property)), rule.selector).toBe(true);
  });

  it('marks the tissue-contact part in ink', () => {
    const tissue = rules.filter((rule) => rule.selector.includes('data-tissue-contact') && !rule.selector.includes('data-dimmed'));
    expect(tissue.length).toBeGreaterThan(0);
    for (const rule of tissue) expect(rule.declarations.map((declaration) => declaration.value).join(' '), rule.selector).toContain('var(--lab-ink)');
  });
});

describe('the files of the diagram', () => {
  const files = OWNED_FILES.map((name) => ({ name, text: fs.readFileSync(path.join(COMPONENT_DIRECTORY, name), 'utf-8') }));

  it.each(files)('$name uses the kit\'s tokens: no site colour token and no retired alias', ({ text }) => {
    expect(text).not.toMatch(/--color-/);
    expect(text).not.toMatch(/--lab-line-strong|--lab-radius\)|--lab-high|--motion-/);
  });

  it.each(files)('$name is under 300 lines', ({ text }) => {
    expect(text.split('\n').length).toBeLessThan(MAX_FILE_LINES);
  });

  it('keeps old component classes out of the diagram\'s own markup', () => {
    for (const { name, text } of files.filter((file) => file.name !== 'threat-model.css')) expect(text, name).not.toMatch(/["'`\s]tm-[a-z]/);
  });
});
