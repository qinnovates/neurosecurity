// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
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
