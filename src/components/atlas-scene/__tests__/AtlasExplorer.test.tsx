// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import registrar from '@shared/qtara-registrar.json';
import { ANATOMY_INDEX_PATH } from '@/lib/anatomy/anatomy-index-types';
import { isLimitId, matchesLimitTemplate } from '@/lib/anatomy/limits-copy';
import AtlasExplorer from '../AtlasExplorer';
import { buildServedFiles, requestedPaths, serveFiles, type ServedFile } from './explorer-test-server';

const REAL_FILES = buildServedFiles();
/** Each test renders the whole explorer over the real data; on a loaded machine that can pass the default five seconds. */
const TEST_TIMEOUT_MS = 20_000;
vi.setConfig({ testTimeout: TEST_TIMEOUT_MS });

let fetchMock: ReturnType<typeof vi.fn>;

let reactWarnings: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchMock = serveFiles(REAL_FILES);
  reactWarnings = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  // The explorer writes its state to the address, and the next test reads the address it opens on.
  window.history.replaceState(null, '', '/atlas/anatomy/');
  const warnings = reactWarnings.mock.calls.map((call: unknown[]) => String(call[0]));
  reactWarnings.mockRestore();
  expect(warnings).toEqual([]);
});

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
/**
 * Finds by text rather than by computed role: the page holds several hundred controls, and working out every
 * accessible name for each query is slow enough to time a test out. Roles are asserted where they are the point.
 */
function lensButton(label: string): HTMLButtonElement {
  const button = [...document.querySelectorAll<HTMLButtonElement>('button.atlas-lens')].find((candidate) => candidate.textContent === label);
  if (button === undefined) throw new Error(`No lens button "${label}".`);
  return button;
}
function panelOf(headingText: string): HTMLElement {
  const heading = [...document.querySelectorAll('h2')].find((candidate) => candidate.textContent === headingText);
  if (heading?.parentElement == null) throw new Error(`No panel headed "${headingText}".`);
  return heading.parentElement;
}
const rows = (container: HTMLElement): HTMLButtonElement[] => [...container.querySelectorAll<HTMLButtonElement>('button[data-region-id]')];
const announcement = (container: HTMLElement, kind: 'selection' | 'lens'): string => container.querySelector(`[data-announce="${kind}"]`)?.textContent ?? '';
/** A click as the keyboard makes it: Enter or Space on a button arrives as a click with no pointer detail. */
const pressEnterOn = (element: HTMLElement): boolean => fireEvent.click(element, { detail: 0 });

/**
 * A technique and a device are highlights, not lenses: they are chosen from the one combined picker,
 * which colours the regions linked to whatever is picked. There is no lens button for either, because
 * such a button coloured nothing until its own picker had been found and used.
 */
const highlightInput = (): HTMLElement => screen.getByRole('combobox', { name: 'Choose a technique or device' });

function highlight(query: string): void {
  const input = highlightInput();
  fireEvent.change(input, { target: { value: query } });
  fireEvent.keyDown(input, { key: 'Enter' });
}

async function chooseTechnique(container: HTMLElement, query: string): Promise<void> {
  highlight(query);
  await waitFor(() => expect(container.querySelector('.atlas-subject')).not.toBeNull());
}

describe('AtlasExplorer: the highlight chip', () => {
  it.each([
    ['technique', 'QIF-T0030', 'Technique QIF-T0030'],
    ['device', 'neuralink-n1', 'Device neuralink-n1'],
  ])('shows a chosen %s as a chip beside the lens bar, and its cross restores the lens it replaced', async (_kind, subjectId, words) => {
    const container = await renderExplorer();
    const lensOf = (): string | null | undefined => container.querySelector('.atlas-root')?.getAttribute('data-lens');
    fireEvent.click(lensButton('NISS severity'));
    expect(container.querySelector('[data-highlight-chip]')).toBeNull();
    highlight(subjectId);
    await waitFor(() => expect(lensOf()).not.toBe('niss'));
    const chip = container.querySelector('[data-viewport-header] [data-highlight-chip]') as HTMLElement;
    expect(chip.textContent).toBe(`${words}×`);
    fireEvent.click(within(chip).getByRole('button', { name: `Clear ${words}, back to the NISS severity lens` }));
    await waitFor(() => expect(lensOf()).toBe('niss'));
    expect(container.querySelector('[data-highlight-chip]')).toBeNull();
  });
});

describe('AtlasExplorer: the list', () => {
  it('fetches the index and the catalog only, and nothing lazy, before the visitor asks', async () => {
    await renderExplorer();
    expect(requestedPaths(fetchMock).sort()).toEqual(['/atlas/anatomy-catalog.json', ANATOMY_INDEX_PATH]);
    expect(panelOf('Layers').querySelectorAll('.atlas-layer button')).toHaveLength(0);
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
    await waitFor(() => expect(announcement(container, 'selection')).toMatch(/^Hippocampus selected\. Band N6\. .+\.$/));
    for (const kind of ['selection', 'lens']) {
      const region = container.querySelector(`[data-announce="${kind}"]`);
      expect([region?.getAttribute('role'), region?.getAttribute('aria-live')]).toEqual(['status', 'polite']);
    }
    fireEvent.click(screen.getByRole('button', { name: 'Back to the list' }));
    expect(document.activeElement).toBe(rowOf(container, 'hippocampus'));
  });

  it('returns from the details to the 3D view\'s heading, brought to the top of the screen', async () => {
    const scrolled = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrolled;
    const container = await renderExplorer();
    pressEnterOn(rowOf(container, 'hippocampus'));
    await waitFor(() => expect(document.activeElement?.id).toBe('atlas-inspector-heading'));
    fireEvent.click(screen.getByRole('button', { name: 'Back to the 3D view' }));
    expect(document.activeElement?.id).toBe('atlas-viewport-heading');
    expect(document.activeElement?.textContent).toBe('3D view');
    expect(scrolled).toHaveBeenLastCalledWith({ block: 'start' });
  });

  it('lands a technique chosen from the details on the lens panel while the picture is closed, and offers the way back to the band lens', async () => {
    const scrolled = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrolled;
    const container = await renderExplorer();
    pressEnterOn(rowOf(container, 'hippocampus'));
    await waitFor(() => expect(document.activeElement?.id).toBe('atlas-inspector-heading'));
    const technique = panelOf('Hippocampus').querySelector<HTMLButtonElement>('.atlas-techniques .atlas-link-button');
    if (technique === null) throw new Error('No linked technique to drill into.');
    fireEvent.click(technique);
    await waitFor(() => expect(container.querySelector('.atlas-root')?.getAttribute('data-lens')).toBe('technique'));
    expect(document.activeElement?.id).toBe('atlas-lens-heading');
    expect(scrolled).toHaveBeenLastCalledWith({ block: 'start' });
    expect(screen.getByRole('heading', { level: 2, name: 'Hippocampus' })).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Back to the Band lens' }));
    await waitFor(() => expect(container.querySelector('.atlas-root')?.getAttribute('data-lens')).toBe('band'));
    expect(screen.queryByRole('button', { name: /^Back to the .* lens$/ })).toBeNull();
  });

  it('moves nothing but the pane when a row is chosen on a wide screen, so the picture stays where it is', async () => {
    const documentScroll = vi.fn();
    const paneScroll = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = documentScroll;
    window.HTMLElement.prototype.scrollTo = paneScroll;
    const focus = vi.spyOn(window.HTMLElement.prototype, 'focus');
    const container = await renderExplorer();
    pressEnterOn(rowOf(container, 'hippocampus'));
    await waitFor(() => expect(document.activeElement?.id).toBe('atlas-inspector-heading'));
    expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
    expect(paneScroll).toHaveBeenLastCalledWith({ top: 0 });
    expect(paneScroll.mock.contexts.at(-1)).toBe(container.querySelector('.atlas-inspector'));
    fireEvent.click(rowOf(container, 'pfc'), { detail: 1 });
    await screen.findByRole('heading', { level: 2, name: 'Prefrontal Cortex' });
    await waitFor(() => expect(paneScroll.mock.contexts.at(-1)).toBe(container.querySelector('.atlas-inspector')));
    expect(documentScroll).not.toHaveBeenCalled();
    focus.mockRestore();
  });

  it('moves focus and the view to the details when a row is tapped on a narrow, stacked screen', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(max-width: 960px)', addEventListener: () => undefined, removeEventListener: () => undefined }));
    const scrolled = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrolled;
    const container = await renderExplorer();
    fireEvent.click(rowOf(container, 'pfc'), { detail: 1 });
    await waitFor(() => expect(document.activeElement?.id).toBe('atlas-inspector-heading'));
    expect(document.activeElement?.textContent).toBe('Prefrontal Cortex');
    expect(scrolled).toHaveBeenCalledWith({ block: 'start' });
  });

  it('announces the Device lens without any count of AI-drafted links, and keeps the provenance words in each row', async () => {
    const container = await renderExplorer();
    highlight('neuralink-n1');
    await waitFor(() => expect(announcement(container, 'lens')).toMatch(/^Device lens: neuralink-n1\. \d+ regions? listed in the device's QIF record, \d+ not listed\.$/));
    expect(announcement(container, 'lens')).not.toContain('AI-drafted');
    const listed = rows(container).filter((row) => row.dataset.standing === 'value');
    expect(listed.length).toBeGreaterThan(0);
    for (const row of listed) expect(row.querySelector('.atlas-cell-lens')?.textContent).toContain('QIF\'s atlas file lists this region for the device; no expert has reviewed the list');
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
    fireEvent.click(lensButton('NISS severity'));
    expect(lensButton('NISS severity').getAttribute('aria-pressed')).toBe('true');
    expect(rowOf(container, 'hippocampus').getAttribute('aria-current')).toBe('true');
    await waitFor(() => expect(announcement(container, 'lens')).toMatch(/^NISS severity lens\. \d+ regions? with a value, \d+ AI-drafted, \d+ with no data\.$/));
    expect(container.querySelector('[data-tally="true"]')?.textContent).toMatch(/\d+ regions? ha(s|ve) a value under this lens, \d+ named but not counted, \d+ with no data\./);
  });

  it('reads an unlinked region as "no data" under NISS, never as a step', async () => {
    const container = await renderExplorer();
    fireEvent.click(lensButton('NISS severity'));
    const cord = rowOf(container, 'cervical_cord');
    expect(cord.dataset.standing).toBe('no_data');
    expect(cord.querySelector('.atlas-row-value')?.textContent).toBe('no data');
    const withStep = rows(container).filter((row) => row.dataset.standing === 'value');
    expect(withStep.length).toBeGreaterThan(0);
    expect(withStep.every((row) => /^(none|low|medium|high|critical)$/.test(row.querySelector('.atlas-row-value')?.textContent ?? ''))).toBe(true);
  });

  it('offers every technique and every device in one picker and narrows it from the keyboard', async () => {
    await renderExplorer();
    const listbox = screen.getByRole('listbox', { name: 'technique or device list' });
    const deviceCount = JSON.parse(REAL_FILES[ANATOMY_INDEX_PATH] as string).devices.stated_targets.length;
    expect(deviceCount).toBeGreaterThan(0);
    expect(within(listbox).getAllByRole('option')).toHaveLength(registrar.techniques.length + deviceCount);
    const input = highlightInput();
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
    expect(within(listbox).getAllByRole('option')).toHaveLength(registrar.techniques.length + deviceCount);
  });

  /**
   * Four buttons, not five, and none of them a state that colours nothing: `technique` and `device`
   * left the row for the highlight picker. The fourth is specified and unavailable, and keeps its
   * control, reachable and with the reason tied to it, rather than vanishing.
   */
  it('offers four fact lenses, the unavailable one reachable with its reason, and no lens that colours nothing', async () => {
    const container = await renderExplorer();
    const lenses = [...container.querySelectorAll<HTMLButtonElement>('button.atlas-lens')];
    expect(lenses.map((lens) => lens.textContent)).toEqual(['Band', 'NISS severity', 'DSM cluster', 'Body function']);
    expect(lenses.filter((lens) => lens.textContent === 'Technique' || lens.textContent === 'Device')).toEqual([]);
    const blocked = lenses[3];
    expect(blocked.getAttribute('aria-disabled')).toBe('true');
    expect(blocked.disabled).toBe(false);
    expect(document.getElementById(blocked.getAttribute('aria-describedby') ?? '')?.textContent)
      .toMatch(/^Not available in this build\. A body-function lens needs a controlled list of functions\./);
    fireEvent.click(blocked);
    expect(blocked.getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelector('.atlas-lenses')?.getAttribute('data-fact-lens')).toBe('true');
    // Every lens the row offers colours something the moment it is pressed: none waits for a subject.
    for (const lens of ['Band', 'NISS severity']) {
      fireEvent.click(lensButton(lens));
      expect(rows(container).filter((row) => row.dataset.standing === 'value').length, lens).toBeGreaterThan(0);
    }
    // A highlight carries the colour instead, and then no fact lens claims to.
    highlight('neuralink-n1');
    expect(container.querySelector('.atlas-lenses')?.getAttribute('data-fact-lens')).toBe('false');
    expect(lenses.filter((lens) => lens.getAttribute('aria-pressed') === 'true')).toEqual([]);
  });

  it('marks a picker result that shows drafted links, and not one that shows none', async () => {
    await renderExplorer();
    const options = within(screen.getByRole('listbox', { name: 'technique or device list' })).getAllByRole('option');
    const drafted = options.filter((option) => option.dataset.techniqueKind === 'regions');
    expect(drafted.length).toBeGreaterThan(0);
    const deviceOnly = options.filter((option) => option.dataset.techniqueKind === 'device_only');
    expect(deviceOnly).toHaveLength(67);
  });

  it('shows a chosen technique\'s linked regions, and the limit for a technique that is band-level only', async () => {
    const container = await renderExplorer();
    const linked = JSON.parse(REAL_FILES[ANATOMY_INDEX_PATH] as string).techniques.find((technique: { links: Array<{ lit: boolean }> }) => technique.links.some((link) => link.lit));
    await chooseTechnique(container, linked.id);
    const linkedRows = rows(container).filter((row) => row.dataset.standing === 'value');
    expect(linkedRows.length).toBeGreaterThan(0);
    expect(container.querySelector('.atlas-subject')).not.toBeNull();
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
    fireEvent.click(within(panelOf('Layers')).getByRole('button', { name: /^Show the 6 layers \(\d available in this build\)$/ }));
    const layers = [...panelOf('Layers').querySelectorAll<HTMLElement>('.atlas-layer button')];
    expect(layers.map((layer) => layer.textContent)).toEqual(['Brain outline', 'Cortical shapes', 'Deep structures', 'Tracts', 'Networks', 'EEG electrode layout']);
    for (const layer of layers.filter((candidate) => candidate.getAttribute('aria-disabled') === 'true')) {
      const reason = document.getElementById(layer.getAttribute('aria-describedby') ?? '');
      expect(reason?.textContent, layer.textContent ?? '').toMatch(/^(Not available in this build\. .+|This layer is not available in this build\.)$/);
      expect(reason?.textContent).not.toMatch(/MIT software|template space|requires additional acknowledgment/);
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
    fireEvent.click(lensButton('NISS severity'));
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
    for (const lens of ['Band', 'NISS severity', 'DSM cluster']) {
      fireEvent.click(lensButton(lens));
      expect(container.querySelectorAll('.atlas-lens-panel [data-limit-id]').length, lens).toBeGreaterThan(0);
    }
    highlight('neuralink-n1');
    expect(container.querySelectorAll('.atlas-lens-panel [data-limit-id]').length).toBeGreaterThan(0);
    for (const heading of ['Layers', 'Regions', 'Device stages', 'Network names', 'A real sample at nanometre scale']) {
      expect(panelOf(heading).querySelector('[data-limit-id]'), heading).not.toBeNull();
    }
  });

  it('lists network names as labels only', async () => {
    await renderExplorer();
    const panel = panelOf('Network names');
    expect(panel.querySelectorAll('.atlas-name-label').length).toBeGreaterThan(0);
    expect(within(panel).queryAllByRole('button')).toEqual([]);
    expect(panel.querySelector('[data-limit-id="networks_names_only"]')).not.toBeNull();
  });
});
