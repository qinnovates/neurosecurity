// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AtlasExplorer from '../AtlasExplorer';
import { buildRegionDeepLink } from '../atlas-deep-link';
import { buildServedFiles, serveFiles } from './explorer-test-server';

const REAL_FILES = buildServedFiles();
const TEST_TIMEOUT_MS = 20_000;
vi.setConfig({ testTimeout: TEST_TIMEOUT_MS });
const REGION_ID = 'hippocampus';
const REGION_NAME = 'Hippocampus';

let reactWarnings: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  serveFiles(REAL_FILES);
  reactWarnings = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/atlas/anatomy/');
  const warnings = reactWarnings.mock.calls.map((call: unknown[]) => String(call[0]));
  reactWarnings.mockRestore();
  expect(warnings).toEqual([]);
});

async function renderExplorer(search?: string): Promise<HTMLElement> {
  const { container } = render(<AtlasExplorer search={search} />);
  await screen.findByRole('heading', { name: 'Regions' });
  return container;
}

const currentRows = (container: HTMLElement): string[] => [...container.querySelectorAll<HTMLButtonElement>('button[data-region-id][aria-current="true"]')].map((row) => row.dataset.regionId ?? '');

describe('AtlasExplorer: opening at a region', () => {
  it('starts with the region the address names selected: the row is current and the inspector shows it, with no later change of state', async () => {
    const container = await renderExplorer(buildRegionDeepLink(REGION_ID).split('?')[1]);
    expect(currentRows(container)).toEqual([REGION_ID]);
    expect(screen.getByRole('heading', { level: 2, name: REGION_NAME })).not.toBeNull();
    // Nothing was selected after the first render, so nothing was announced: the page opened on the region as if it were always chosen.
    expect(container.querySelector('[data-announce="selection"]')?.textContent).toBe('');
    // The selection does not take focus: the visitor arrived at a page, not at a result of their own click on it.
    expect(document.activeElement?.id).not.toBe('atlas-inspector-heading');
  });

  it('reads the address of the page it is on when no query is given', async () => {
    window.history.replaceState(null, '', buildRegionDeepLink(REGION_ID));
    const container = await renderExplorer();
    expect(currentRows(container)).toEqual([REGION_ID]);
  });

  it.each([
    ['an id the index does not hold', '?region=not-a-region'],
    ['an id with markup in it', `?region=${encodeURIComponent('<b>x</b>')}`],
    ['no parameter', ''],
  ])('opens with nothing selected for %s, exactly as from a bare address', async (_case, search) => {
    const container = await renderExplorer(search);
    expect(currentRows(container)).toEqual([]);
    expect(screen.queryByRole('heading', { level: 2, name: REGION_NAME })).toBeNull();
    expect(container.textContent).not.toContain('not-a-region');
  });
});

describe('AtlasExplorer: opening on a lens', () => {
  const lensOf = (container: HTMLElement): string | null => container.querySelector('.atlas-workspace')?.getAttribute('data-lens') ?? null;

  it('opens on the lens the address names, with the region selected too, and announces no change: the page opened that way', async () => {
    const container = await renderExplorer(buildRegionDeepLink(REGION_ID, { kind: 'niss' }).split('?')[1]);
    expect(lensOf(container)).toBe('niss');
    expect(currentRows(container)).toEqual([REGION_ID]);
    expect(container.querySelector('[data-announce="lens"]')?.textContent).toBe('');
  });

  it.each([
    ['a lens that waits for a subject', '?lens=technique'],
    ['a lens that does not exist', `?lens=${encodeURIComponent('<b>x</b>')}`],
    ['an empty lens', '?lens='],
  ])('opens on the default lens for %s, exactly as from a bare address', async (_case, search) => {
    const container = await renderExplorer(search);
    expect(lensOf(container)).toBe('band');
    expect(currentRows(container)).toEqual([]);
  });
});

describe('AtlasExplorer: the address follows the state', () => {
  const row = (container: HTMLElement, regionId: string): HTMLButtonElement => container.querySelector(`button[data-region-id="${regionId}"]`) as HTMLButtonElement;
  const lensButton = (label: string): HTMLButtonElement => [...document.querySelectorAll<HTMLButtonElement>('button.atlas-lens')].find((button) => button.textContent === label) as HTMLButtonElement;

  it('writes the region and the lens as they change, replacing the entry rather than adding to the history', async () => {
    const pushed = vi.spyOn(window.history, 'pushState');
    const entries = window.history.length;
    const container = await renderExplorer();
    expect(window.location.search).toBe('');
    fireEvent.click(row(container, 'pfc'), { detail: 1 });
    await waitFor(() => expect(window.location.search).toBe('?region=pfc'));
    fireEvent.click(lensButton('NISS severity'));
    await waitFor(() => expect(window.location.search).toBe('?region=pfc&lens=niss'));
    fireEvent.click(lensButton('Band'));
    await waitFor(() => expect(window.location.search).toBe('?region=pfc'));
    expect(pushed).not.toHaveBeenCalled();
    expect(window.history.length).toBe(entries);
    pushed.mockRestore();
  });

  it('writes a highlight as the subject it is, and leaves the lens out', async () => {
    const container = await renderExplorer();
    const input = screen.getByRole('combobox', { name: 'Choose a technique or device' });
    fireEvent.change(input, { target: { value: 'neuralink-n1' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(window.location.search).toBe('?highlight=neuralink-n1'));
    expect(container.querySelector('.atlas-workspace')?.getAttribute('data-lens')).toBe('stated_targets');
  });

  it('opens on a highlight the address names, and on nothing for one the page does not hold', async () => {
    const container = await renderExplorer('highlight=neuralink-n1');
    expect(container.querySelector('.atlas-workspace')?.getAttribute('data-lens')).toBe('stated_targets');
    expect(container.querySelector('[data-highlight-chip]')?.textContent).toContain('Device neuralink-n1');
    cleanup();
    const unknown = await renderExplorer('highlight=QIF-T9999');
    expect(unknown.querySelector('.atlas-workspace')?.getAttribute('data-lens')).toBe('band');
  });

  it('counts an address that names a region as having asked for the 3D view, and a bare address as not', async () => {
    const asked = await renderExplorer('region=hippocampus');
    // The fixture page carries no pin, so the gate answers at once and says why; the point is that it was asked.
    expect(asked.querySelector('.atlas-viewport')?.getAttribute('data-gate')).not.toBe('closed');
    cleanup();
    const bare = await renderExplorer('');
    expect(bare.querySelector('.atlas-viewport')?.getAttribute('data-gate')).toBe('closed');
  });
});
