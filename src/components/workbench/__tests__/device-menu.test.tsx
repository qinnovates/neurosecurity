// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import { loadTaraChains } from '@/components/atlas/load-tara-chains';
import { downloadModelFile, downloadRegisterCsv, readModelFile } from '@/components/threat-model/model-file-io';
import { DeviceModelFormatError } from '@/lib/threat-model/errors';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import { loadEngineBundle, loadReferenceData } from '@/lib/threat-model/__tests__/load-test-data';
import DeviceChip from '../DeviceChip';
import { FocusProvider, useFocus } from '../FocusContext';
import type { Route } from '../route';
import { CHANGE_DEVICE_TARGET } from '../shell-targets';
import { STANDING_STATEMENTS } from '../standing-statements';
import { ViewStateProvider } from '../ViewStateContext';
import { createViewStateStore, type ViewStateStore } from '../view-state-store';
import { createMemoryStorage, installMemoryLocalStorage } from './memory-storage';

vi.mock('@/components/threat-model/model-file-io', () => ({
  downloadModelFile: vi.fn(),
  downloadRegisterCsv: vi.fn(),
  readModelFile: vi.fn(),
}));

const bundle = loadEngineBundle();
const { engineData } = bundle;
const referenceData = loadReferenceData(bundle);
const curatedChains = loadTaraChains();
const [defaultClass, otherClass] = referenceData.archetypes;
const otherModel = buildModelFromIntake(defaultAnswersFor(otherClass), otherClass, engineData.registrarVersion);
const ACTION_LABELS = ['Change device', 'Edit device', 'Save file', 'Load file', 'Export register', 'Print report'];

/** Stands in for a screen: records a decision, edits an answer, or picks a class. */
function DeviceControls() {
  const { dispatch, report, state } = useFocus();
  return (
    <>
      <button type="button" onClick={() => dispatch({ type: 'risk-decided', riskId: report.riskRows[0].riskId, status: 'accepted', note: '' })}>Decide a risk</button>
      <button type="button" onClick={() => dispatch({ type: 'risk-decided', riskId: report.riskRows[1].riskId, status: 'mitigated', note: '' })}>Decide another risk</button>
      <button type="button" onClick={() => dispatch({ type: 'preset-selected', archetype: defaultClass, registrarVersion: engineData.registrarVersion })}>Pick the first class</button>
      <button type="button" onClick={() => dispatch({ type: 'part-changed', partId: state.model.components[0].id, changes: { label: 'Renamed part' } })}>Rename a part</button>
      <output data-testid="device-name">{state.model.name}</output>
    </>
  );
}

interface Harness {
  navigations: Route[];
  onEditDevice: Mock<() => void>;
  onPrintReport: Mock<() => void>;
  onDeviceReplaced: Mock<() => void>;
  store: ViewStateStore;
}

function renderChip(hasFacts?: boolean): Harness {
  const harness: Harness = { navigations: [], onEditDevice: vi.fn<() => void>(), onPrintReport: vi.fn<() => void>(), onDeviceReplaced: vi.fn<() => void>(), store: createViewStateStore(null) };
  render(
    <ViewStateProvider store={harness.store}>
      <FocusProvider engineData={engineData} referenceData={referenceData} curatedChains={curatedChains} onDeviceReplaced={harness.onDeviceReplaced}>
        <DeviceChip onNavigate={(route) => harness.navigations.push(route)} onEditDevice={harness.onEditDevice} onPrintReport={harness.onPrintReport} hasFacts={hasFacts} />
        <DeviceControls />
        <button type="button">After the chip</button>
      </FocusProvider>
    </ViewStateProvider>,
  );
  return harness;
}

function openMenu(): void {
  fireEvent.click(screen.getByRole('button', { name: /Device in focus/ }));
}

/** The line in the menu that says a file was loaded. */
function loadStatus(): HTMLElement {
  return within(screen.getByRole('group', { name: 'Device in focus' })).getByRole('status');
}

function chooseFile(): void {
  const file = new File(['{}'], 'device.threat-model.json', { type: 'application/json' });
  fireEvent.change(screen.getByLabelText('Model file to load'), { target: { files: [file] } });
}

/** Reads CSV as the builder writes it: every cell quoted, quotes doubled, lines ended with CRLF. */
function parseCsv(text: string): string[][] {
  return text.split('\r\n').filter((line) => line.length > 0).map((line) => [...line.matchAll(/"((?:[^"]|"")*)"/g)].map((cell) => cell[1].replaceAll('""', '"')));
}

function countUnloadListeners(spy: { mock: { calls: readonly (readonly unknown[])[] } }): number {
  return spy.mock.calls.filter(([eventName]) => eventName === 'beforeunload').length;
}

beforeEach(() => {
  installMemoryLocalStorage();
  vi.mocked(downloadModelFile).mockClear();
  vi.mocked(downloadRegisterCsv).mockClear();
  vi.mocked(readModelFile).mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('device chip', () => {
  it('calls the untouched default "Example device", with no warning on it, until the reader picks or edits', () => {
    renderChip();
    const chip = screen.getByRole('button', { name: /Device in focus/ });
    expect(chip.textContent).toContain('Example device');
    expect(chip.textContent).not.toMatch(/Not saved|Unsaved/);
    fireEvent.click(screen.getByRole('button', { name: 'Pick the first class' }));
    expect(chip.textContent).not.toContain('Example device');
    expect(chip.textContent).toContain(screen.getByTestId('device-name').textContent);
  });

  it('stops calling it an example once a decision is recorded', () => {
    renderChip();
    fireEvent.click(screen.getByRole('button', { name: 'Decide a risk' }));
    expect(screen.getByRole('button', { name: /Device in focus/ }).textContent).not.toContain('Example device');
  });

  it('opens a menu with the six device actions and closes it on Escape, returning focus', () => {
    renderChip();
    const chip = screen.getByRole('button', { name: /Device in focus/ });
    expect(chip.getAttribute('aria-expanded')).toBe('false');
    openMenu();
    expect(chip.getAttribute('aria-expanded')).toBe('true');
    const actions = screen.getByRole('group', { name: 'Device actions' });
    expect([...actions.querySelectorAll('button')].map((button) => button.textContent)).toEqual(ACTION_LABELS);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('group', { name: 'Device actions' })).toBeNull();
    expect(document.activeElement).toBe(chip);
  });

  it('closes when the reader presses anywhere else', () => {
    renderChip();
    openMenu();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('group', { name: 'Device actions' })).toBeNull();
  });
});

describe('device menu actions', () => {
  it('sends Change device to its screen, hands Edit device to the shell, and closes the menu each time', () => {
    const harness = renderChip();
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Change device' }));
    expect(screen.queryByRole('group', { name: 'Device actions' })).toBeNull();
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Edit device' }));
    expect(harness.navigations).toEqual([CHANGE_DEVICE_TARGET]);
    expect(harness.onEditDevice).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('group', { name: 'Device actions' })).toBeNull();
  });

  it('asks the shell to print the report', () => {
    const harness = renderChip();
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Print report' }));
    expect(harness.onPrintReport).toHaveBeenCalledTimes(1);
  });

  it('exports the register through the one production path: header block, all four standing statements, and a reason on every catalog row', () => {
    renderChip();
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Export register' }));
    expect(downloadRegisterCsv).toHaveBeenCalledTimes(1);
    const text = vi.mocked(downloadRegisterCsv).mock.calls[0][1];
    const rows = parseCsv(text);
    const headerIndex = rows.findIndex((row) => row[0] === 'Risk id');
    const block = rows.slice(0, headerIndex);

    expect(block.filter((row) => row[0] === 'Standing statement').map((row) => row[1])).toEqual([...STANDING_STATEMENTS]);
    expect(block.find((row) => row[0] === 'Device')?.[1]).toBe(screen.getByTestId('device-name').textContent);
    expect(block.find((row) => row[0] === 'Exported')?.[1]).toBe(new Date().toISOString().slice(0, 10));
    expect(block.find((row) => row[0] === 'Technique catalog version')?.[1]).toBe(engineData.registrarVersion);
    expect(block.find((row) => row[0] === 'Placement table version')?.[1]).toBe(referenceData.placementTable.version);
    // The placement file's own status sentence uses wording the Lab has retired, so it is not printed.
    expect(referenceData.placementTable.status).toMatch(/confirmed|weaker evidence/);
    expect(text).not.toContain(referenceData.placementTable.status);
    expect(block.map((row) => row.join(' ')).join(' ')).not.toMatch(/\b(confirmed|proven|weaker evidence)\b/i);

    const columns = rows[headerIndex];
    const whyHere = columns.indexOf('Why here');
    const catalogRows = rows.slice(headerIndex + 1).filter((row) => row[columns.indexOf('Source')] === 'TARA catalog');
    expect(catalogRows.length).toBeGreaterThan(0);
    expect(catalogRows.filter((row) => row[whyHere].trim() === '')).toEqual([]);
  });

  it('loads a file at once when nothing would be lost, and reports the device as replaced', async () => {
    vi.mocked(readModelFile).mockResolvedValue(otherModel);
    const harness = renderChip();
    openMenu();
    chooseFile();
    await waitFor(() => expect(screen.getByTestId('device-name').textContent).toBe(otherModel.name));
    expect(harness.onDeviceReplaced).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/^Saved to a file:/).textContent).toBe('Saved to a file: saved');
    expect(loadStatus().textContent).toBe(`Loaded ${otherModel.name}.`);
  });

  it('has the status line in the menu before any file is loaded, empty, and says nothing after a refused file', async () => {
    vi.mocked(readModelFile).mockRejectedValueOnce(new DeviceModelFormatError('it is not valid JSON'));
    renderChip();
    openMenu();
    expect(loadStatus().textContent).toBe('');
    chooseFile();
    await screen.findByRole('alert');
    expect(loadStatus().textContent).toBe('');
  });

  it('asks before a loaded file replaces recorded decisions, and keeps the device by default', async () => {
    vi.mocked(readModelFile).mockResolvedValue(otherModel);
    renderChip();
    const originalName = screen.getByTestId('device-name').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Decide a risk' }));
    openMenu();
    chooseFile();
    const confirm = await screen.findByRole('alertdialog');
    expect(confirm.textContent).toContain('1 recorded decision.');
    fireEvent.click(screen.getByRole('button', { name: `Keep ${originalName}` }));
    expect(screen.getByTestId('device-name').textContent).toBe(originalName);
    chooseFile();
    await screen.findByRole('alertdialog');
    fireEvent.click(screen.getByRole('button', { name: 'Replace it' }));
    expect(screen.getByTestId('device-name').textContent).toBe(otherModel.name);
    expect(loadStatus().textContent).toBe(`Loaded ${otherModel.name}.`);
  });

  it('shows the parser\'s message for a file it refuses, and a fixed line for anything else', async () => {
    vi.mocked(readModelFile).mockRejectedValueOnce(new DeviceModelFormatError('it is not valid JSON'));
    renderChip();
    openMenu();
    chooseFile();
    expect((await screen.findByRole('alert')).textContent).toBe('The model file could not be loaded: it is not valid JSON');
    vi.mocked(readModelFile).mockRejectedValueOnce(new Error('C:\\secret\\path'));
    chooseFile();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('The model file could not be loaded: an unexpected problem occurred while reading it.'));
  });
});

describe('save status', () => {
  it('moves through never, saved and changed since last save', () => {
    renderChip();
    openMenu();
    const fileStatus = (): string | null => screen.getByText(/^Saved to a file:/).textContent;
    expect(fileStatus()).toBe('Saved to a file: never');
    fireEvent.click(screen.getByRole('button', { name: 'Save file' }));
    expect(downloadModelFile).toHaveBeenCalledTimes(1);
    expect(fileStatus()).toBe('Saved to a file: saved');
    fireEvent.click(screen.getByRole('button', { name: 'Decide a risk' }));
    expect(fileStatus()).toBe('Saved to a file: changed since last save');
    fireEvent.click(screen.getByRole('button', { name: 'Save file' }));
    expect(fileStatus()).toBe('Saved to a file: saved');
    fireEvent.click(screen.getByRole('button', { name: 'Pick the first class' }));
    expect(fileStatus()).toBe('Saved to a file: never');
  });

  it('says whether the device is remembered in this browser, and follows the switch', () => {
    renderChip();
    openMenu();
    const browserStatus = (): string | null => screen.getByText(/^Remembered in this browser:/).textContent;
    expect(browserStatus()).toBe('Remembered in this browser: no');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Remember this device in this browser' }));
    expect(browserStatus()).toBe('Remembered in this browser: yes');
    expect(window.localStorage.getItem('tara-lab:device:v1')).not.toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Remember this device in this browser' }));
    expect(browserStatus()).toBe('Remembered in this browser: no');
    expect(window.localStorage.getItem('tara-lab:device:v1')).toBeNull();
  });

  it('says "no" when the browser refuses to store the device', () => {
    installMemoryLocalStorage({ ...createMemoryStorage(), setItem: () => { throw new Error('quota'); } });
    renderChip();
    openMenu();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Remember this device in this browser' }));
    expect(screen.getByText(/^Remembered in this browser:/).textContent).toBe('Remembered in this browser: no');
    expect(screen.getByRole('alert').textContent).toContain('refused to save the device');
  });
});

describe('leaving the page', () => {
  it('warns only while there are decisions that are neither remembered nor in a file', () => {
    const added = vi.spyOn(window, 'addEventListener');
    const removed = vi.spyOn(window, 'removeEventListener');
    renderChip();
    expect(countUnloadListeners(added)).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: 'Decide a risk' }));
    expect(countUnloadListeners(added)).toBe(1);
    expect(screen.getByRole('button', { name: /Device in focus/ }).textContent).toContain('Unsaved changes');
    const unload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);

    openMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Save file' }));
    expect(countUnloadListeners(removed)).toBe(1);
    expect(screen.getByRole('button', { name: /Device in focus/ }).textContent).not.toContain('Unsaved');
    const afterSave = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(afterSave);
    expect(afterSave.defaultPrevented).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Decide another risk' }));
    expect(countUnloadListeners(added)).toBe(2);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Remember this device in this browser' }));
    expect(countUnloadListeners(removed)).toBe(2);
  });

  it('counts an edit to the model as unsaved work, with no decision recorded, and clears it on save', () => {
    renderChip();
    const chip = screen.getByRole('button', { name: /Device in focus/ });
    expect(chip.textContent).not.toContain('Unsaved');
    fireEvent.click(screen.getByRole('button', { name: 'Rename a part' }));
    expect(chip.textContent).toContain('Unsaved changes');
    expect(chip.textContent).not.toContain('Unsaved decisions');
    const unload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
    openMenu();
    expect(screen.getByText(/^Changes to this device are not remembered/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save file' }));
    expect(chip.textContent).not.toContain('Unsaved');
  });
});

describe('device chip in a mode whose screen states the facts', () => {
  it('shows the glyph and the name only, and still lists the facts in the menu', () => {
    renderChip(false);
    const chip = screen.getByRole('button', { name: /Device in focus/ });
    expect(chip.querySelector('.lab-device-glyph')).not.toBeNull();
    expect(chip.querySelector('.lab-device-name')).not.toBeNull();
    expect(chip.querySelector('.lab-device-facts')).toBeNull();
    openMenu();
    expect(screen.getByRole('group', { name: 'Device in focus' }).querySelectorAll('.lab-device-list li').length).toBeGreaterThan(0);
  });

  it('shows the facts beside the name elsewhere', () => {
    renderChip();
    expect(screen.getByRole('button', { name: /Device in focus/ }).querySelector('.lab-device-facts')?.textContent).toMatch(/part/);
  });
});

describe('device menu and focus', () => {
  it('closes when focus moves to something outside it, and stays open when focus goes nowhere', () => {
    renderChip();
    openMenu();
    const remember = screen.getByRole('checkbox', { name: 'Remember this device in this browser' });
    remember.focus();
    // The file picker or another window takes focus without naming where it went: the menu stays.
    fireEvent.blur(remember, { relatedTarget: null });
    expect(screen.getByRole('group', { name: 'Device actions' })).toBeTruthy();
    // Moving inside the menu keeps it.
    fireEvent.blur(remember, { relatedTarget: screen.getByRole('button', { name: 'Save file' }) });
    expect(screen.getByRole('group', { name: 'Device actions' })).toBeTruthy();
    fireEvent.blur(remember, { relatedTarget: screen.getByRole('button', { name: 'After the chip' }) });
    expect(screen.queryByRole('group', { name: 'Device actions' })).toBeNull();
  });
});
