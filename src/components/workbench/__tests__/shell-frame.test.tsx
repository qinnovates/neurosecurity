// @vitest-environment jsdom
/**
 * The frame, with every mode replaced by a stand-in, so these tests fail only when the
 * shell itself breaks: routing, the reader's place, the standing statements, the keyboard path.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import { loadTaraChains } from '@/components/atlas/load-tara-chains';
import { loadEngineBundle, loadReferenceData } from '@/lib/threat-model/__tests__/load-test-data';
import { STANDING_STATEMENTS } from '../StandingLine';
import { installMemoryLocalStorage } from './memory-storage';
import { titleFor } from '../route';
import { MODE_VIEW_GROUPS, defaultViewId } from '../view-registry';
import WorkbenchShell from '../WorkbenchShell';

vi.mock('../mode-registry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../mode-registry')>();
  return { ...actual, WORKBENCH_MODES: actual.WORKBENCH_MODES.map((mode) => ({ ...mode, load: () => import('./StubMode') })) };
});

const bundle = loadEngineBundle();
const { engineData } = bundle;
const referenceData = loadReferenceData(bundle);
const curatedChains = loadTaraChains();
const NARROW_QUERY = '(max-width: 720px)';
const SHORT_QUERY = '(max-height: 499px)';

function stubMatchMedia(matchingQueries: readonly string[]): void {
  const matchMedia = (query: string) => ({
    matches: matchingQueries.includes(query), media: query, addEventListener: () => undefined, removeEventListener: () => undefined,
  });
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: matchMedia });
}

async function openLab(hash = ''): Promise<HTMLElement> {
  window.history.replaceState(null, '', `${window.location.pathname}${hash}`);
  const { container } = render(<WorkbenchShell engineData={engineData} referenceData={referenceData} curatedChains={curatedChains} />);
  await screen.findByTestId('stub-view');
  return container;
}

async function expectView(viewId: string): Promise<void> {
  await waitFor(() => expect(screen.getByTestId('stub-view').textContent).toBe(viewId));
}

function pressMode(label: string): void {
  fireEvent.click(within(screen.getByRole('navigation', { name: 'TARA Lab modes' })).getByRole('button', { name: label }));
}

beforeEach(() => {
  window.sessionStorage.clear();
  installMemoryLocalStorage();
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'matchMedia');
  vi.restoreAllMocks();
});

describe('frame', () => {
  it('keeps every standing statement whole, in a bar outside the scrolling screen', async () => {
    const container = await openLab();
    const foot = container.querySelector('.lab-foot');
    const scroller = container.querySelector('.lab-shell-scroll');
    expect(scroller?.contains(foot)).toBe(false);
    expect(scroller?.querySelector('#lab-screen')).not.toBeNull();
    for (const statement of STANDING_STATEMENTS) expect(within(foot as HTMLElement).getByText(statement)).toBeTruthy();
    expect(foot?.textContent).toContain(`Catalog version ${engineData.registrarVersion}, ${engineData.techniques.length} techniques.`);
  });

  it('puts the statements at the top of the scrolling screen on a short viewport, still whole', async () => {
    stubMatchMedia([SHORT_QUERY]);
    const container = await openLab();
    const inline = container.querySelector('.lab-shell-scroll .lab-standing-inline') as HTMLElement;
    for (const statement of STANDING_STATEMENTS) expect(within(inline).getByText(statement)).toBeTruthy();
    expect(container.querySelector('.lab-foot')?.textContent).toBe('');
    expect(inline.compareDocumentPosition(container.querySelector('#lab-screen') as HTMLElement) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('offers "Skip to results" first, and it moves focus without changing the address', async () => {
    const container = await openLab('#model');
    const firstFocusable = container.querySelector('a[href], button, input, select');
    expect(firstFocusable?.textContent).toBe('Skip to results');
    fireEvent.click(firstFocusable as HTMLElement);
    expect(document.activeElement?.id).toBe('lab-results');
    expect(window.location.hash).toBe('#model');
  });
});

describe('address', () => {
  it('names each screen in the browser title', async () => {
    await openLab('#model');
    await waitFor(() => expect(document.title).toBe(titleFor({ modeId: 'model', viewId: defaultViewId('model') })));
    fireEvent.click(screen.getByRole('button', { name: 'Report' }));
    await waitFor(() => expect(document.title).toBe(titleFor({ modeId: 'model', viewId: 'report' })));
  });

  it('shows one line for an unknown address, corrects it, and drops the line on the next move', async () => {
    await openLab('#nonsense/anything');
    expect(screen.getByRole('status').textContent).toBe('That address is not a screen in TARA Lab. Showing Explore, Start.');
    await waitFor(() => expect(window.location.hash).toBe('#explore'));
    pressMode('Model');
    await expectView(defaultViewId('model'));
    expect(screen.queryByText(/That address is not a screen/)).toBeNull();
  });

  it('reopens a mode at the view it was left on', async () => {
    await openLab('#model/report');
    await expectView('report');
    pressMode('Explore');
    await expectView(defaultViewId('explore'));
    pressMode('Model');
    await expectView('report');
    expect(window.location.hash).toBe('#model/report');
  });

  it('lists every view in one labelled menu on a narrow screen, with the modes along the bottom', async () => {
    stubMatchMedia([NARROW_QUERY]);
    const container = await openLab('#model');
    const select = screen.getByRole('combobox', { name: 'View' });
    const expectedLabels = MODE_VIEW_GROUPS.model.flatMap((group) => group.views.map((view) => view.label));
    expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual(expectedLabels);
    fireEvent.change(select, { target: { value: 'report' } });
    await expectView('report');
    expect(container.querySelector('.lab-foot .lab-modes--bottom')).not.toBeNull();
    expect(container.querySelector('.lab-topbar .lab-modes')).toBeNull();
    expect(within(container.querySelector('.lab-foot') as HTMLElement).getByRole('link', { name: 'Back to the site' })).toBeTruthy();
  });
});

describe('the reader\'s place', () => {
  it('keeps a view\'s state through a change of mode and back', async () => {
    await openLab('#explore');
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'bluetooth' } });
    pressMode('Model');
    await expectView(defaultViewId('model'));
    pressMode('Explore');
    await expectView(defaultViewId('explore'));
    expect((screen.getByLabelText('Note') as HTMLInputElement).value).toBe('bluetooth');
  });

  it('keeps it when the browser goes Back', async () => {
    await openLab('#explore');
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'bluetooth' } });
    fireEvent.click(screen.getByRole('button', { name: MODE_VIEW_GROUPS.explore[0].views[1].label }));
    await expectView(MODE_VIEW_GROUPS.explore[0].views[1].id);
    pressMode('Model');
    await expectView(defaultViewId('model'));
    window.history.back();
    await expectView(MODE_VIEW_GROUPS.explore[0].views[1].id);
    expect((screen.getByLabelText('Note') as HTMLInputElement).value).toBe('bluetooth');
  });

  it('keeps it across a reload, from session storage', async () => {
    await openLab('#explore');
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'bluetooth' } });
    cleanup();
    await openLab('#explore');
    expect((screen.getByLabelText('Note') as HTMLInputElement).value).toBe('bluetooth');
  });

  it('clears what described the device when the device is replaced, and nothing else', async () => {
    await openLab('#model/report');
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'bluetooth' } });
    fireEvent.change(screen.getByLabelText('Lens'), { target: { value: 'patient app' } });
    fireEvent.click(screen.getByRole('button', { name: 'Pick another class' }));
    expect((screen.getByLabelText('Lens') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Note') as HTMLInputElement).value).toBe('bluetooth');
    pressMode('Explore');
    await expectView(defaultViewId('explore'));
    pressMode('Model');
    await expectView(defaultViewId('model'));
  });

  it('returns to the scroll offset a view was left at', async () => {
    const container = await openLab('#explore');
    const scroller = container.querySelector('.lab-shell-scroll') as HTMLElement;
    scroller.scrollTop = 120;
    pressMode('Model');
    await expectView(defaultViewId('model'));
    expect(scroller.scrollTop).toBe(0);
    pressMode('Explore');
    await expectView(defaultViewId('explore'));
    expect(scroller.scrollTop).toBe(120);
  });
});

describe('command palette and printing', () => {
  it('opens on Ctrl+K or Cmd+K and from the visible button, and closes on Escape', async () => {
    await openLab();
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByRole('dialog', { name: 'Go to' })).toBeTruthy();
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.keyDown(window, { key: 'K', metaKey: true });
    expect(screen.getByRole('dialog', { name: 'Go to' })).toBeTruthy();
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^Go to/ }));
    expect(screen.getByRole('dialog', { name: 'Go to' })).toBeTruthy();
  });

  it('jumps to a screen chosen in the palette and moves focus into it', async () => {
    await openLab();
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Report' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await expectView('report');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement?.id).toBe('lab-screen');
  });

  it('prints the report from the device menu: opens the report, then prints once', async () => {
    const print = vi.fn();
    Object.defineProperty(window, 'print', { configurable: true, writable: true, value: print });
    await openLab('#explore');
    fireEvent.click(screen.getByRole('button', { name: /Device in focus/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Print report' }));
    await expectView('report');
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
  });
});
