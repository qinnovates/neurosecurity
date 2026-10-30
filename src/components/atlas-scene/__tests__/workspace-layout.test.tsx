// @vitest-environment jsdom
import fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AtlasExplorer from '../AtlasExplorer';
import { buildServedFiles, serveFiles } from './explorer-test-server';

const REAL_FILES = buildServedFiles();
const TEST_TIMEOUT_MS = 20_000;
vi.setConfig({ testTimeout: TEST_TIMEOUT_MS });
const WORKSPACE_CSS = 'src/components/atlas-scene/atlas-workspace.css';
const SCENE_CSS = 'src/components/atlas-scene/atlas-scene.css';

let reactWarnings: ReturnType<typeof vi.spyOn>;
beforeEach(() => { reactWarnings = vi.spyOn(console, 'error').mockImplementation(() => undefined); });
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  const warnings = reactWarnings.mock.calls.map((call: unknown[]) => String(call[0]));
  reactWarnings.mockRestore();
  expect(warnings).toEqual([]);
});

async function renderExplorer(): Promise<HTMLElement> {
  serveFiles(REAL_FILES);
  const { container } = render(<AtlasExplorer />);
  await screen.findByRole('heading', { name: 'Regions' });
  return container;
}

const lensButton = (label: string): HTMLButtonElement => {
  const button = [...document.querySelectorAll<HTMLButtonElement>('button.atlas-lens')].find((candidate) => candidate.textContent === label);
  if (button === undefined) throw new Error(`No lens button "${label}".`);
  return button;
};
const rows = (container: HTMLElement): HTMLButtonElement[] => [...container.querySelectorAll<HTMLButtonElement>('button[data-region-id]')];

describe('the explorer is laid out around the picture', () => {
  /**
   * The picture used to be a sibling above the main grid, so picking a region in it scrolled the
   * answer off the screen; then the lens panel stood above the whole grid, so the page opened on a
   * form and not on the brain. The picture is now the first thing in the grid, the lens bar beside
   * it, the list under the picture and the region's details beside the list. This is the whole
   * point of the page, so it is asserted rather than left to the stylesheet.
   */
  it('opens on the picture: picture, then the lens bar, then the list, then the region pane, all in one grid', async () => {
    const container = await renderExplorer();
    const main = container.querySelector('.atlas-main') as HTMLElement;
    const column = main.querySelector(':scope > .atlas-main-list') as HTMLElement;
    const lens = main.querySelector(':scope > .atlas-lens-panel') as HTMLElement;
    const list = main.querySelector(':scope > .atlas-list') as HTMLElement;
    const pane = main.querySelector(':scope > .atlas-inspector') as HTMLElement;
    for (const part of [column, lens, list, pane]) expect(part).not.toBeNull();
    // Reading order, which is the tab order: the picture, the lens that colours it, the list it governs, the details.
    const order = [...main.children];
    expect([column, lens, list, pane].map((part) => order.indexOf(part))).toEqual([0, 1, 2, 3]);
    // The picture is the first thing in its column and in the grid; nothing stands above it any more.
    const viewport = container.querySelector('.atlas-viewport') as HTMLElement;
    expect(column.contains(viewport)).toBe(true);
    expect([...column.children].indexOf(viewport)).toBe(0);
    expect(main.contains(lens)).toBe(true);
    expect(main.querySelector('.atlas-lens-panel')).toBe(lens);
    expect(container.querySelector('.atlas-workspace > .atlas-lens-panel')).toBeNull();
    // Nothing 3D is fetched before the button: the page opens on the picture's place, not the picture.
    expect(viewport.getAttribute('data-gate')).toBe('closed');
    expect(screen.getByRole('button', { name: 'Show the 3D view' })).not.toBeNull();
    // The stylesheet names the four areas in that order, wide and stacked.
    const workspace = fs.readFileSync(WORKSPACE_CSS, 'utf-8');
    expect(workspace).toContain('grid-template-areas: "picture lens" "list inspector";');
    expect(workspace).toContain('grid-template-areas: "picture" "lens" "list" "inspector";');
  });

  it('keeps the stacked layout and the sticky pane the narrow screen depends on, and reflows to one column at 320 px', () => {
    const scene = fs.readFileSync(SCENE_CSS, 'utf-8');
    const workspace = fs.readFileSync(WORKSPACE_CSS, 'utf-8');
    // The breakpoint the script reads as STACKED_LAYOUT_QUERY, and what it does: one column, pane unstuck.
    const stacked = /@media \(max-width: 960px\) \{\n  \.atlas-main \{ grid-template-columns: minmax\(0, 1fr\); \}\n  \.atlas-inspector \{ position: static; max-height: none; \}/;
    expect(scene).toMatch(stacked);
    expect(fs.readFileSync('src/components/atlas-scene/ExplorerWorkspace.tsx', 'utf-8')).toContain("'(max-width: 960px)'");
    // WCAG 1.4.10: at 320-375 px every multi-column grid this lane added becomes one column.
    const narrow = /@media \(max-width: 460px\) \{([\s\S]*?)\n\}/.exec(workspace)?.[1] ?? '';
    expect(narrow).toContain('.atlas-coverage-row, .atlas-coverage-row[data-held] { grid-template-columns: minmax(0, 1fr); }');
    expect(narrow).toContain('.atlas-coverage-bar { width: 100%; }');
    // Nothing this lane added is measured in a width a 320 px window may not have.
    const widths = [...workspace.matchAll(/(?:^|[^-])(?:min-)?width:\s*([^;]+);/g)].map((match) => match[1].trim());
    expect(widths.length).toBeGreaterThan(0);
    expect(widths.filter((width) => /(\d+(\.\d+)?)(rem|px)/.test(width) && !width.startsWith('calc') && Number.parseFloat(width) > 20)).toEqual([]);
    // Reduced motion reaches the one thing this lane animates.
    expect(workspace).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\n  \.atlas-coverage-fill \{ animation: none; \}/);
  });
});

describe('the regions the lens holds nothing for', () => {
  /**
   * Under the NISS lens 31 of 38 regions hold no value. Listed among the bands they read as the
   * quiet end of a ranking, so they are moved below every band, under their own heading, where the
   * count makes the sparsity visible and nothing orders them against a region that holds a value.
   */
  it('lists them under their own heading below every band, never inside one, with the count and the words', async () => {
    const container = await renderExplorer();
    // Under the band lens every region holds a value, so the group does not exist at all.
    expect(container.querySelector('[data-not-assessed="true"]')).toBeNull();
    fireEvent.click(lensButton('NISS severity'));
    const sections = [...container.querySelectorAll<HTMLElement>('.atlas-band')];
    const notAssessed = sections.filter((section) => section.dataset.notAssessed === 'true');
    expect(notAssessed).toHaveLength(1);
    expect(sections.indexOf(notAssessed[0])).toBe(sections.length - 1);
    const held = rows(container).filter((row) => row.dataset.standing !== 'no_data');
    const empty = rows(container).filter((row) => row.dataset.standing === 'no_data');
    expect(held.length).toBeGreaterThan(0);
    expect(empty.length).toBeGreaterThan(held.length);
    // Every empty row is in the group and no band holds one; every row that holds a value stays in its band.
    expect(empty.filter((row) => !notAssessed[0].contains(row))).toEqual([]);
    expect(held.filter((row) => notAssessed[0].contains(row))).toEqual([]);
    const heading = notAssessed[0].querySelector('.atlas-band-heading') as HTMLElement;
    expect(heading.textContent).toBe(`Not assessed${empty.length} regions`);
    expect(heading.querySelector('.atlas-band-code')).toBeNull();
    expect(notAssessed[0].querySelector('[data-coverage-note="lens_no_data_not_safe"]')?.textContent)
      .toContain('which is not a finding that they are safe, or low, and they are never ordered against the regions that do hold a value');
  });

  it('keeps one tab stop and walks the arrow keys through the group as part of the same list', async () => {
    const container = await renderExplorer();
    fireEvent.click(lensButton('NISS severity'));
    const all = rows(container);
    expect(all.filter((row) => row.tabIndex === 0)).toEqual([all[0]]);
    all[0].focus();
    fireEvent.keyDown(all[0], { key: 'End' });
    const last = all.at(-1) as HTMLButtonElement;
    expect(document.activeElement).toBe(last);
    // The last row of the whole list is in the group, which is therefore walked and not stranded.
    expect(last.dataset.standing).toBe('no_data');
    fireEvent.keyDown(last, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(all.at(-2));
  });

  it('states the coverage of the chosen region apart from its name, so what is heard is the denominator too', async () => {
    const container = await renderExplorer();
    fireEvent.click(rows(container).find((row) => row.dataset.regionId === 'pfc') as HTMLButtonElement, { detail: 1 });
    await waitFor(() => expect(container.querySelector('[data-announce="coverage"]')?.textContent).not.toBe(''));
    const spoken = container.querySelector('[data-announce="coverage"]') as HTMLElement;
    expect([spoken.getAttribute('role'), spoken.getAttribute('aria-live')]).toEqual(['status', 'polite']);
    expect(spoken.textContent).toMatch(/^This region holds \d+ attack techniques linked to this region, \d+ pathways .+, \d+ devices .+\. \d+ of \d+ links? carr(y|ies) a NISS severity\. \d+ DSM-5-TR category references\.$/);
  });
});
