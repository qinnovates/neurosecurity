// @vitest-environment jsdom
import fs from 'node:fs';
import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, renderHook, within } from '@testing-library/react';
import { useEffect, type ReactNode } from 'react';
import { loadTaraChains } from '@/components/atlas/load-tara-chains';
import { FocusProvider, useFocus } from '@/components/workbench/FocusContext';
import { ANALYSIS_WINDOW_SAMPLES, analysisWindowSeconds } from '@/lib/signal/analysis-window';
import { FREQUENCY_BANDS } from '@/lib/signal/band-power';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import type { DeviceArchetype } from '@/lib/threat-model/reference-data-types';
import { loadEngineBundle, loadReferenceData } from '@/lib/threat-model/__tests__/load-test-data';
import BandComposition from '../BandComposition';
import EventList from '../EventList';
import { formatSeconds, formatTime } from '../monitor-format';
import MonitorMode, { SCALP_ORIENTATION_STATEMENT, describeRelationToDevice } from '../MonitorMode';
import { describeAnalysisWindow } from '../SampleMonitor';
import ScalpCells from '../ScalpCells';
import { isThresholdDrawable, pageStartFor } from '../signal-plot-draw';
import { usePlayhead } from '../use-playhead';

const bundle = loadEngineBundle();
const { engineData } = bundle;
const referenceData = loadReferenceData(bundle);
const SAMPLE_RATE_HZ = 250;
const SAMPLE_ROWS = 1000;
/** What the older static page calls the samples. None of it may reach the Lab's screen. */
const sourceList = JSON.parse(fs.readFileSync('src/site/brain-siem/data/manifest.json', 'utf-8')) as { datasets: { name: string; description: string }[] };

/** A two-channel sample: a 10 Hz tone with one large excursion on a 10-20 electrode, and a quiet channel with a name the map does not know. */
function buildSampleCsv(): string {
  const rows = Array.from({ length: SAMPLE_ROWS }, (_, index) => {
    const tone = 20 * Math.sin((2 * Math.PI * 10 * index) / SAMPLE_RATE_HZ) + (index === 700 ? 130 : 0);
    return `${(index / SAMPLE_RATE_HZ).toFixed(6)},${index},${tone.toFixed(4)},0.5,0`;
  });
  return ['timestamp,package_num,O1,X9,marker', ...rows].join('\n');
}

function stubSampleRequests(): void {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.endsWith('index.json')
    ? new Response(JSON.stringify({ samples: [{ file: 'sample-01.csv' }, { file: 'sample-02.csv' }] }))
    : new Response(buildSampleCsv()))));
}

function ChooseDevice({ archetype }: { archetype: DeviceArchetype }) {
  const { dispatch } = useFocus();
  useEffect(() => dispatch({ type: 'preset-selected', archetype, registrarVersion: engineData.registrarVersion }), [dispatch, archetype]);
  return null;
}

function inLab(children: ReactNode) {
  return render(<FocusProvider engineData={engineData} referenceData={referenceData} curatedChains={loadTaraChains()}>{children}</FocusProvider>);
}

const modeProps = { viewId: 'signal', onSelectView: () => undefined, onOpenMode: () => undefined };

beforeAll(() => {
  // jsdom draws nothing; the plot's picture is not what these tests read.
  HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('the Monitor screen', () => {
  it('opens paused, names the sample only by what was computed from its signal, and states the real analysis window', async () => {
    stubSampleRequests();
    const frameSpy = vi.spyOn(window, 'requestAnimationFrame');
    const { container } = inLab(<MonitorMode {...modeProps} />);
    expect(await screen.findByRole('button', { name: 'Play' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();
    expect(frameSpy).not.toHaveBeenCalled();

    expect(screen.getByRole('heading', { name: 'Synthetic sample 1 of 2' })).toBeTruthy();
    const facts = Object.fromEntries([...container.querySelectorAll('.monitor-facts > div')].map((fact) => [fact.querySelector('dt')?.textContent, fact.querySelector('dd')?.textContent]));
    expect(facts).toEqual({ Channels: '2', 'Sample rate': '250 Hz', Duration: '4.00 s', 'Dominant band': 'Alpha, 8 to 13 Hz', 'Peak amplitude': expect.stringMatching(/^1[34]\d µV$/) });

    const stated = `Analysis window: ${ANALYSIS_WINDOW_SAMPLES} samples at 250 Hz, ${(ANALYSIS_WINDOW_SAMPLES / SAMPLE_RATE_HZ).toFixed(2)} s, ending at the playhead.`;
    expect(screen.getByText(stated)).toBeTruthy();
    expect(screen.getByRole('heading', { name: `Band composition over the last ${formatSeconds(analysisWindowSeconds(SAMPLE_RATE_HZ))}` })).toBeTruthy();
    expect(container.querySelector('#lab-results')).not.toBeNull();
  });

  it('shows no clinical or cognitive name from the source list', async () => {
    stubSampleRequests();
    const { container } = inLab(<MonitorMode {...modeProps} />);
    await screen.findByRole('button', { name: 'Play' });
    expect(sourceList.datasets.length).toBeGreaterThan(0);
    for (const { name, description } of sourceList.datasets) {
      expect(container.textContent).not.toContain(name);
      expect(container.textContent).not.toContain(description);
    }
    expect(container.textContent).not.toMatch(/seizure|epilep|sleep|meditat|imagery|P300|oddball|eyes (open|closed)|blink/i);
  });

  it('lists a crossing with its duration, and a second press of play is what starts motion', async () => {
    stubSampleRequests();
    inLab(<MonitorMode {...modeProps} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Play' }));
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByText('1 crossing in this sample. Demonstrations of the rule, not detections.')).toBeTruthy();
    expect(screen.getByRole('cell', { name: formatSeconds(1 / SAMPLE_RATE_HZ) })).toBeTruthy();
  });

  it('says only that these are scalp samples when the device in focus is not a scalp recorder', async () => {
    stubSampleRequests();
    const models = referenceData.archetypes.map((archetype) => ({ archetype, model: buildModelFromIntake(defaultAnswersFor(archetype), archetype, engineData.registrarVersion) }));
    const nonScalp = models.filter(({ model }) => model.invasiveness !== 'noninvasive' || model.direction === 'write');
    const scalp = models.filter(({ model }) => model.invasiveness === 'noninvasive' && model.direction !== 'write');
    expect(nonScalp.length).toBeGreaterThan(0);
    expect(scalp.length).toBeGreaterThan(0);
    for (const { model } of nonScalp) expect(describeRelationToDevice(model)).toBe('These are scalp samples, shown for orientation.');
    for (const { model } of scalp) expect(describeRelationToDevice(model)).toContain(`${model.name} records`);

    inLab(<><ChooseDevice archetype={nonScalp[0].archetype} /><MonitorMode {...modeProps} /></>);
    const banner = await screen.findByRole('region', { name: 'About these signals' });
    expect(within(banner).getByText(new RegExp(`${SCALP_ORIENTATION_STATEMENT.replace('.', '\\.')}$`))).toBeTruthy();
    expect(banner.textContent).not.toMatch(/records, so|would leave its neural interface|only stimulates/);
  });
});

describe('Monitor pieces', () => {
  it('formats the playhead in minutes, seconds and tenths without floating-point slips', () => {
    expect(formatTime(11.1)).toBe('00:11.1');
    expect(formatTime(0)).toBe('00:00.0');
    expect(formatTime(75.95)).toBe('01:15.9');
  });

  it('states the window from the constant and the sample rate, whatever the rate', () => {
    for (const rate of [250, 256, 500]) {
      expect(describeAnalysisWindow(rate)).toBe(`Analysis window: ${ANALYSIS_WINDOW_SAMPLES} samples at ${rate} Hz, ${(ANALYSIS_WINDOW_SAMPLES / rate).toFixed(2)} s, ending at the playhead.`);
    }
  });

  it('starts every playhead paused, at the position asked for', () => {
    const { result } = renderHook(() => usePlayhead(30, 2.048));
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.time).toBe(2.048);
  });

  it('turns the page at whole pages and keeps the last page in range', () => {
    expect(pageStartFor(2.05, 8, 30)).toBe(0);
    expect(pageStartFor(8, 8, 30)).toBe(8);
    expect(pageStartFor(30, 8, 30)).toBe(24);
    expect(pageStartFor(16, 8, 16)).toBe(8);
  });

  it('draws the threshold only when a row can show it', () => {
    expect(isThresholdDrawable(75, 100)).toBe(true);
    expect(isThresholdDrawable(100, 100)).toBe(true);
    expect(isThresholdDrawable(150, 100)).toBe(false);
  });

  it('says an empty event list is not a clean bill', () => {
    render(<EventList events={[]} markers={[]} onSeek={() => undefined} />);
    expect(screen.getByText(/That is not a clean bill: only this one rule is checked, on a synthetic signal\./)).toBeTruthy();
  });

  it('calls crossings demonstrations, never detections, prints each duration, and seeks to one when opened', () => {
    const onSeek = vi.fn();
    render(<EventList events={[{ time: 4.2, endTime: 10.7, channelNames: ['C3', 'C4'], peakMicrovolts: 88.4 }]} markers={[{ time: 1, value: 1 }]} onSeek={onSeek} />);
    expect(screen.getByText('1 crossing in this sample. Demonstrations of the rule, not detections.')).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: /Duration/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('cell', { name: '6.50 s' }));
    expect(onSeek).toHaveBeenCalledWith(4.2);
  });

  it('draws the composition as one bar of five shares and lets a band be chosen', () => {
    const onSelectBand = vi.fn();
    const { container } = render(<BandComposition composition={[0.1, 0.2, 0.5, 0.15, 0.05]} selectedBandId="alpha" onSelectBand={onSelectBand} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Share of band power: Delta 10%, Theta 20%, Alpha 50%, Beta 15%, Gamma 5%.');
    const shares = [...container.querySelectorAll<HTMLElement>('.monitor-bands-share')];
    expect(shares.map((share) => share.style.flexGrow)).toEqual(['0.1', '0.2', '0.5', '0.15', '0.05']);
    const keys = screen.getAllByRole('button');
    expect(keys).toHaveLength(FREQUENCY_BANDS.length);
    expect(keys[2].getAttribute('aria-pressed')).toBe('true');
    expect(keys[2].textContent).toBe('50%Alpha8 to 13 Hz');
    fireEvent.click(keys[0]);
    expect(onSelectBand).toHaveBeenCalledWith('delta');
  });

  it('prints each electrode\'s name and figure in a cell, with a bar from zero, and names the ones it cannot place', () => {
    const { container } = render(<ScalpCells channelNames={['Fp1', 'Oz', 'X9']} values={[5, 20, 3]} formatValue={(value) => value.toFixed(1)} quantity="alpha amplitude" />);
    const cells = [...container.querySelectorAll('.monitor-cell')];
    expect(cells.map((cell) => cell.textContent)).toEqual(['Fp15.0', 'Oz20.0']);
    expect(cells.map((cell) => cell.querySelector<HTMLElement>('.monitor-cell-bar > span')?.style.width)).toEqual(['25%', '100%']);
    expect(screen.getByRole('group').getAttribute('aria-label')).toBe('2 electrodes, each with its alpha amplitude');
    expect(['Front', 'Left', 'Right'].every((side) => screen.getByText(side) !== null)).toBe(true);
    expect(screen.getByText(/Not drawn, because they are not standard 10-20 names: X9\./)).toBeTruthy();
    expect(screen.getByText(/not a picture of brain regions/)).toBeTruthy();
  });
});
