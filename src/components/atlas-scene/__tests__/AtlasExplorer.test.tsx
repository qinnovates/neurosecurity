// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import registrar from '@shared/qtara-registrar.json';
import { ANATOMY_EVIDENCE_PATH, ANATOMY_INDEX_PATH } from '@/lib/anatomy/anatomy-index-types';
import { isLimitId, matchesLimitTemplate } from '@/lib/anatomy/limits-copy';
import { H01_CARD_PATH } from '@/lib/anatomy/parse-h01-card';
import { REGION_EVIDENCE_PATH } from '@/lib/anatomy/region-evidence-types';
import AtlasExplorer from '../AtlasExplorer';
import { buildServedFiles, requestedPaths, serveFiles, type ServedFile } from './explorer-test-server';

const REAL_FILES = buildServedFiles();
const UNREVIEWED = 'AI-drafted, unreviewed';

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => { fetchMock = serveFiles(REAL_FILES); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function renderExplorer(files: Record<string, ServedFile> = REAL_FILES): Promise<HTMLElement> {
  fetchMock = serveFiles(files);
  const { container } = render(<AtlasExplorer />);
  await screen.findByRole('heading', { name: 'Regions' });
  return container;
}

const rowOf = (container: HTMLElement, regionId: string): HTMLButtonElement => {
  const row = container.querySelector<HTMLButtonElement>(`button[data-region-id="${regionId}"]`);
  if (row === null) throw new Error(`No row for region "${regionId}".`);
  return row;
};
const rows = (container: HTMLElement): HTMLButtonElement[] => [...container.querySelectorAll<HTMLButtonElement>('button[data-region-id]')];
const announcement = (container: HTMLElement, kind: 'selection' | 'lens'): string => container.querySelector(`[data-announce="${kind}"]`)?.textContent ?? '';
/** A click as the keyboard makes it: Enter or Space on a button arrives as a click with no pointer detail. */
const pressEnterOn = (element: HTMLElement): boolean => fireEvent.click(element, { detail: 0 });

async function chooseTechnique(container: HTMLElement, query: string): Promise<void> {
  fireEvent.click(screen.getByRole('button', { name: 'Technique' }));
  const input = screen.getByRole('combobox', { name: 'Choose a technique' });
  fireEvent.change(input, { target: { value: query } });
  fireEvent.keyDown(input, { key: 'Enter' });
  await waitFor(() => expect(container.querySelector('.atlas-subject')).not.toBeNull());
}

describe('AtlasExplorer: the list', () => {
  it('fetches the index and the catalog only, and nothing lazy, before the visitor asks', async () => {
    await renderExplorer();
    expect(requestedPaths(fetchMock).sort()).toEqual(['/atlas/anatomy-catalog.json', ANATOMY_INDEX_PATH]);
  });

  it('lists all 38 regions by band, each row carrying its mark as an attribute and its facts as text', async () => {
    const container = await renderExplorer();
    expect(rows(container)).toHaveLength(38);
    expect(screen.getAllByRole('heading', { level: 3 }).slice(0, 7).map((heading) => heading.textContent?.slice(0, 2))).toEqual(['N7', 'N6', 'N5', 'N4', 'N3', 'N2', 'N1']);
    for (const row of rows(container)) {
      expect(row.dataset.mark, row.dataset.regionId).toMatch(/^(solid|inside_or_mixed|no_data|context|no_shape|varies)$/);
      expect(row.textContent, row.dataset.regionId).toMatch(/Shape: .+Under this lens: N\d .+QIF's own grouping/);
    }
    expect(rowOf(container, 'cervical_cord').textContent).toContain('no shape');
    expect(rowOf(container, 'cervical_cord').textContent).toContain('The only spinal cord template found states no licence');
  });

  it('puts the AI-drafted mark on every list row', async () => {
    const container = await renderExplorer();
    const unmarked = rows(container).filter((row) => row.querySelector('[data-ai-drafted="true"]')?.textContent !== UNREVIEWED);
    expect(rows(container).length).toBeGreaterThan(0);
    expect(unmarked.map((row) => row.dataset.regionId)).toEqual([]);
  });

  it('moves between rows with the arrow keys, Home and End, keeping one tab stop', async () => {
    const container = await renderExplorer();
    const all = rows(container);
    expect(all.filter((row) => row.tabIndex === 0)).toEqual([all[0]]);
    all[0].focus();
    fireEvent.keyDown(all[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(all[1]);
    fireEvent.keyDown(all[1], { key: 'End' });
    expect(document.activeElement).toBe(all[37]);
    fireEvent.keyDown(all[37], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(all[37]);
    fireEvent.keyDown(all[37], { key: 'Home' });
    expect(document.activeElement).toBe(all[0]);
    fireEvent.keyDown(all[0], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(all[0]);
  });

  it('selects with Enter, announces the selection with its review state, and moves focus to the inspector', async () => {
    const container = await renderExplorer();
    pressEnterOn(rowOf(container, 'hippocampus'));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: 'Hippocampus' })));
    expect(rowOf(container, 'hippocampus').getAttribute('aria-current')).toBe('true');
    expect(rowOf(container, 'hippocampus').tabIndex).toBe(0);
    await waitFor(() => expect(announcement(container, 'selection')).toMatch(/^Hippocampus selected\. Band N6\. .+\. AI-drafted, unreviewed\.$/));
    fireEvent.click(screen.getByRole('button', { name: 'Back to the list' }));
    expect(document.activeElement).toBe(rowOf(container, 'hippocampus'));
  });

  it('leaves focus where it is when a row is chosen with a pointer', async () => {
    const container = await renderExplorer();
    fireEvent.click(rowOf(container, 'pfc'), { detail: 1 });
    await screen.findByRole('heading', { level: 2, name: 'Prefrontal Cortex' });
    expect(document.activeElement?.id).not.toBe('atlas-inspector-heading');
  });

  it('filters by name, says how many are shown, and offers the way back', async () => {
    const container = await renderExplorer();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a region' }), { target: { value: 'cord' } });
    expect(rows(container).map((row) => row.dataset.regionId)).toEqual(['cervical_cord', 'thoracic_cord', 'lumbar_cord', 'sacral_cord']);
    expect(screen.getByText(/Showing 4 of 38 regions\./)).toBeTruthy();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a region' }), { target: { value: 'zzzz' } });
    expect(rows(container)).toEqual([]);
    expect(screen.getByText(/No region matches these filters\./)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show all regions' }));
    expect(rows(container)).toHaveLength(38);
  });
});

describe('AtlasExplorer: lenses and the picker', () => {
  it('keeps the selection when the lens changes, and announces what the lens shows', async () => {
    const container = await renderExplorer();
    pressEnterOn(rowOf(container, 'hippocampus'));
    fireEvent.click(screen.getByRole('button', { name: 'NISS severity' }));
    expect(screen.getByRole('button', { name: 'NISS severity' }).getAttribute('aria-pressed')).toBe('true');
    expect(rowOf(container, 'hippocampus').getAttribute('aria-current')).toBe('true');
    await waitFor(() => expect(announcement(container, 'lens')).toMatch(/^NISS severity lens\. \d+ regions? with a value, \d+ AI-drafted, \d+ with no data\.$/));
    expect(container.querySelector('[data-tally="true"]')?.textContent).toMatch(/\d+ regions? ha(s|ve) a value under this lens, \d+ named but not counted, \d+ with no data\./);
  });

  it('reads an unlinked region as "no data" under NISS, never as a step', async () => {
    const container = await renderExplorer();
    fireEvent.click(screen.getByRole('button', { name: 'NISS severity' }));
    const cord = rowOf(container, 'cervical_cord');
    expect(cord.dataset.standing).toBe('no_data');
    expect(cord.querySelector('.atlas-row-value')?.textContent).toBe('no data');
    const withStep = rows(container).filter((row) => row.dataset.standing === 'value');
    expect(withStep.length).toBeGreaterThan(0);
    expect(withStep.every((row) => /^(none|low|medium|high|critical)$/.test(row.querySelector('.atlas-row-value')?.textContent ?? ''))).toBe(true);
    expect(withStep.every((row) => row.querySelector('.atlas-cell-lens [data-ai-drafted="true"]') !== null)).toBe(true);
  });

  it('offers every technique of the catalog in the picker and narrows it from the keyboard', async () => {
    await renderExplorer();
    fireEvent.click(screen.getByRole('button', { name: 'Technique' }));
    const listbox = screen.getByRole('listbox', { name: 'technique list' });
    expect(within(listbox).getAllByRole('option')).toHaveLength(registrar.techniques.length);
    const input = screen.getByRole('combobox', { name: 'Choose a technique' });
    fireEvent.change(input, { target: { value: 'QIF-T001' } });
    const matches = within(listbox).getAllByRole('option');
    expect(matches.length).toBeGreaterThan(1);
    expect(matches.length).toBeLessThan(20);
    expect(input.getAttribute('aria-activedescendant')).toBe(matches[0].id);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.getAttribute('aria-activedescendant')).toBe(matches[1].id);
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.getAttribute('aria-activedescendant')).toBe(matches[0].id);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect((input as HTMLInputElement).value).toBe('');
    expect(within(listbox).getAllByRole('option')).toHaveLength(registrar.techniques.length);
  });

  it('marks a picker result that shows drafted links, and not one that shows none', async () => {
    await renderExplorer();
    fireEvent.click(screen.getByRole('button', { name: 'Technique' }));
    const options = within(screen.getByRole('listbox', { name: 'technique list' })).getAllByRole('option');
    const drafted = options.filter((option) => option.dataset.techniqueKind === 'regions');
    expect(drafted.length).toBeGreaterThan(0);
    expect(drafted.filter((option) => option.querySelector('[data-ai-drafted="true"]') === null)).toEqual([]);
    const deviceOnly = options.filter((option) => option.dataset.techniqueKind === 'device_only');
    expect(deviceOnly).toHaveLength(65);
    expect(deviceOnly.filter((option) => option.querySelector('[data-ai-drafted]') !== null)).toEqual([]);
  });

  it('shows a chosen technique\'s linked regions with the mark, and the limit for a technique that is band-level only', async () => {
    const container = await renderExplorer();
    const linked = JSON.parse(REAL_FILES[ANATOMY_INDEX_PATH] as string).techniques.find((technique: { links: Array<{ lit: boolean }> }) => technique.links.some((link) => link.lit));
    await chooseTechnique(container, linked.id);
    const linkedRows = rows(container).filter((row) => row.dataset.standing === 'value');
    expect(linkedRows.length).toBeGreaterThan(0);
    expect(linkedRows.every((row) => row.querySelector('.atlas-cell-lens [data-ai-drafted="true"]') !== null)).toBe(true);
    expect(container.querySelector('.atlas-subject [data-ai-drafted="true"]')).not.toBeNull();
    expect(container.querySelector('.atlas-lens-limits [data-limit-id="lens_technique"]')).not.toBeNull();
  });

  it('says a lens with nothing linked has no data, which is not the same as low', async () => {
    const container = await renderExplorer();
    const deviceOnly = registrar.techniques.find((technique) => !technique.band_ids.some((bandId) => bandId.startsWith('N')));
    await chooseTechnique(container, deviceOnly?.id ?? '');
    expect(container.querySelector('[data-limit-id="lens_technique_device_only"]')).not.toBeNull();
    expect(container.querySelector('[data-limit-id="lens_no_data"]')?.textContent).toContain('it does not mean low');
    expect(rows(container).every((row) => row.dataset.standing === 'no_data' && row.querySelector('.atlas-row-value')?.textContent === 'no data')).toBe(true);
  });
});

describe('AtlasExplorer: limits, layers and marks', () => {
  it('keeps every unavailable layer as a reachable control with its reason tied to it', async () => {
    await renderExplorer();
    const layers = within(screen.getByRole('heading', { name: 'Layers' }).parentElement as HTMLElement).getAllByRole('button');
    expect(layers.map((layer) => layer.textContent)).toEqual(['Brain outline', 'Cortical shapes', 'Deep structures', 'Tracts', 'Networks', 'Devices']);
    for (const layer of layers.filter((candidate) => candidate.getAttribute('aria-disabled') === 'true')) {
      const reason = document.getElementById(layer.getAttribute('aria-describedby') ?? '');
      expect(reason?.textContent, layer.textContent ?? '').toMatch(/^Not available in this build\. .+/);
      expect((layer as HTMLButtonElement).disabled).toBe(false);
      fireEvent.click(layer);
      expect(layer.getAttribute('aria-pressed')).toBe('false');
    }
    expect(layers.filter((layer) => ['Tracts', 'Networks'].includes(layer.textContent ?? '')).every((layer) => layer.getAttribute('aria-disabled') === 'true')).toBe(true);
  });

  it('shows only limit sentences that come from the closed templates, in every state it is put through', async () => {
    const container = await renderExplorer();
    pressEnterOn(rowOf(container, 'ppc'));
    await screen.findAllByText(/Filed under Posterior Parietal Cortex/);
    fireEvent.click(screen.getByRole('button', { name: 'NISS severity' }));
    fireEvent.click(screen.getByRole('button', { name: /Also list the 77 techniques/ }));
    fireEvent.click(screen.getByRole('button', { name: /What this page holds/ }));
    const notes = [...container.querySelectorAll<HTMLElement>('[data-limit-id]')];
    expect(notes.length).toBeGreaterThan(20);
    const strays = notes.filter((note) => !isLimitId(note.dataset.limitId ?? '') || !matchesLimitTemplate(note.dataset.limitId as Parameters<typeof matchesLimitTemplate>[0], note.textContent ?? ''));
    expect(strays.map((note) => `${note.dataset.limitId}: ${note.textContent}`)).toEqual([]);
    expect([...container.querySelectorAll('.atlas-limit')].filter((note) => !note.hasAttribute('data-limit-id'))).toEqual([]);
  });

  it('puts a limit sentence in the same group as each control it limits', async () => {
    const container = await renderExplorer();
    for (const lens of ['Band', 'Technique', 'NISS severity', 'DSM cluster', 'Device']) {
      fireEvent.click(screen.getByRole('button', { name: lens }));
      expect(container.querySelectorAll('.atlas-lens-panel [data-limit-id]').length, lens).toBeGreaterThan(0);
    }
    for (const heading of ['Layers', 'Regions', 'Device stages', 'Network names', 'A real sample at nanometre scale']) {
      expect(screen.getByRole('heading', { name: heading }).parentElement?.querySelector('[data-limit-id]'), heading).not.toBeNull();
    }
  });

  it('lists network names as labels only', async () => {
    await renderExplorer();
    const panel = screen.getByRole('heading', { name: 'Network names' }).parentElement as HTMLElement;
    expect(panel.querySelectorAll('.atlas-name-label').length).toBeGreaterThan(0);
    expect(within(panel).queryAllByRole('button')).toEqual([]);
    expect(panel.querySelector('[data-limit-id="networks_names_only"]')).not.toBeNull();
  });
});
