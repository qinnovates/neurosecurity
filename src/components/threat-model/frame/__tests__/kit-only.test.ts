import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { parseCss, splitSelectors } from '../../diagram/__tests__/parse-css';

const MODEL_DIR = path.resolve('src/components/threat-model');
const WORKBENCH_DIR = path.resolve('src/components/workbench');
/** The Model frame's own files. The diagram, the editor and the report are other folders' work. */
const OWN_FILES = [
  'ThreatModelStudio.tsx', 'RisksSection.tsx', 'RiskDetail.tsx', 'ElementPanel.tsx', 'ReplaceDeviceConfirm.tsx', 'ThreatMatrix.tsx',
  'ChainsSection.tsx', 'BeyondDevice.tsx', 'model-layout.css',
].map((name) => path.join(MODEL_DIR, name));
const OWN_WORKBENCH_FILES = ['view-registry.ts', 'shell-targets.ts', 'mode-registry.ts', 'use-open-technique.ts'].map((name) => path.join(WORKBENCH_DIR, name));
const MAX_LINES = 300;

function listSources(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : listSources(path.join(directory, entry.name));
    return /\.(tsx?|css)$/.test(entry.name) ? [path.join(directory, entry.name)] : [];
  });
}

const files = [...OWN_FILES, ...OWN_WORKBENCH_FILES, ...listSources(path.join(MODEL_DIR, 'frame')), ...listSources(path.join(MODEL_DIR, 'overview'))];

describe('the Model frame is built from the kit', () => {
  it.each(files.map((file) => [path.relative(MODEL_DIR, file), file]))('%s uses no tm- class, no site colour token and no retired alias', (_name, file) => {
    const source = fs.readFileSync(file, 'utf-8');
    expect(source).not.toMatch(/\btm-[a-z]/);
    expect(source).not.toMatch(/--color-/);
    expect(source).not.toMatch(/--lab-line-strong|--lab-radius\)|--lab-high|--motion-/);
    expect(source).not.toMatch(/opacity\s*:/);
    expect(source.split('\n').length).toBeLessThanOrEqual(MAX_LINES);
  });

  const css = fs.readFileSync(path.join(MODEL_DIR, 'model-layout.css'), 'utf-8');
  const rules = parseCss(css);
  const REDUCED = '@media (prefers-reduced-motion: reduce)';
  const isAnimated = (value: string): boolean => value !== 'none';

  it('animates only what answers the reader, each once: the opened row, the step being played, the row of parts arriving', () => {
    expect(css).not.toMatch(/infinite/);
    const animated = rules.filter((rule) => rule.declarations.some((declaration) => declaration.property === 'animation' && isAnimated(declaration.value)));
    expect(animated.map((rule) => rule.selector)).toEqual([
      '.model-pinned-strip > .lab-diagram-strip',
      '.model-register .lab-table tbody tr[aria-current="true"] td:first-child',
      '.model-chain-steps li[data-state="now"] .lab-step::before',
    ]);
    for (const rule of animated) {
      const value = rule.declarations.find((declaration) => declaration.property === 'animation')?.value ?? '';
      expect(value, rule.selector).toMatch(/ 1 backwards$/);
    }
  });

  it('removes movement for a reader who asked for less: every animation and every transition is named in the reduced-motion block', () => {
    const calmed = (property: string): string[] => rules
      .filter((rule) => rule.context.includes(REDUCED) && rule.declarations.some((declaration) => declaration.property === property && declaration.value === 'none'))
      .flatMap((rule) => splitSelectors(rule.selector));
    const moving = (property: string): string[] => rules
      .filter((rule) => !rule.context.includes(REDUCED) && rule.declarations.some((declaration) => declaration.property === property && isAnimated(declaration.value)))
      .flatMap((rule) => splitSelectors(rule.selector));
    for (const selector of moving('animation')) expect(calmed('animation'), selector).toContain(selector);
    for (const selector of moving('transition')) expect(calmed('transition').some((calm) => selector.includes(calm)), selector).toBe(true);
  });

  it('animates no layout property: the drawer never moves the page by a transition of padding or margin', () => {
    const transitions = rules.flatMap((rule) => rule.declarations.filter((declaration) => declaration.property === 'transition').map((declaration) => declaration.value));
    for (const value of transitions) expect(value).not.toMatch(/padding|margin|\bheight\b|\ball\b/);
  });

  it('keeps the detail of a risk inside its drawer: one column that may shrink, and a vector that wraps', () => {
    const declared = (selector: string, property: string): string | undefined => rules
      .filter((rule) => rule.context.length === 0 && splitSelectors(rule.selector).includes(selector))
      .flatMap((rule) => rule.declarations).find((declaration) => declaration.property === property)?.value;
    expect(declared('.model-risk-body', 'grid-template-columns')).toBe('minmax(0, 1fr)');
    expect(declared('.model-risk-body > *', 'min-width')).toBe('0');
    expect(declared('.lab-id.model-risk-vector', 'white-space')).toBe('normal');
    expect(declared('.lab-id.model-risk-vector', 'overflow-wrap')).toBe('anywhere');
  });

  it('scrolls the register with the page: no inner height cap, and a head that stops under the bars', () => {
    expect(css).not.toMatch(/max-height:\s*70vh/);
    const head = rules.find((rule) => rule.selector === '.model-register .lab-table th');
    expect(head?.declarations.find((declaration) => declaration.property === 'top')?.value).toContain('var(--lab-topbar-height)');
  });

  it('sets no line height of its own but the title\'s', () => {
    const lineHeights = rules.flatMap((rule) => rule.declarations.filter((declaration) => declaration.property === 'line-height').map((declaration) => ({ selector: rule.selector, value: declaration.value })));
    for (const { selector, value } of lineHeights) expect(value, selector).toBe('1.75rem');
  });
});
