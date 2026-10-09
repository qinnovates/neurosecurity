// @vitest-environment jsdom
/**
 * The Lab's native screens, rendered with the real catalog, placement table and chains,
 * so a change in the data files that breaks a screen fails here and not in the browser.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { loadTaraChains } from '../atlas/load-tara-chains';
import CatalogView from '../explore/catalog/CatalogView';
import CuratedChains from '../explore/CuratedChains';
import EventList from '../monitor/EventList';
import { formatTime } from '../monitor/MonitorMode';
import ScalpMap from '../monitor/ScalpMap';
import SpectrumBars from '../monitor/SpectrumBars';
import { FocusProvider } from '../workbench/FocusContext';
import { MODE_VIEW_GROUPS } from '../workbench/view-registry';
import { FREQUENCY_BANDS } from '@/lib/signal/band-power';
import { countByEvidence } from '@/lib/threat-model/evidence-levels';
import { loadEngineBundle, loadReferenceData } from '@/lib/threat-model/__tests__/load-test-data';

afterEach(cleanup);

const bundle = loadEngineBundle();
const { engineData } = bundle;
const referenceData = loadReferenceData(bundle);
const curatedChains = loadTaraChains();

function inLab(children: ReactNode) {
  return render(<FocusProvider engineData={engineData} referenceData={referenceData} curatedChains={curatedChains}>{children}</FocusProvider>);
}

describe('view registry', () => {
  it('lists only native views, each with a unique id inside its mode', () => {
    for (const groups of Object.values(MODE_VIEW_GROUPS)) {
      const ids = groups.flatMap((group) => group.views.map((view) => view.id));
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.length).toBeGreaterThan(0);
    }
  });
});

describe('CatalogView', () => {
  it('opens on the whole catalog and narrows when an evidence chip is pressed', () => {
    inLab(<CatalogView onOpenMode={() => undefined} />);
    const total = engineData.techniques.length;
    expect(screen.getByText(`${total} of ${total} techniques`)).toBeTruthy();
    const [strongest] = countByEvidence(engineData.techniques);
    fireEvent.click(screen.getByRole('button', { name: `${strongest.label} ${strongest.count}` }));
    expect(screen.getByText(`${strongest.count} of ${total} techniques`)).toBeTruthy();
    expect(screen.getAllByRole('row').length - 1).toBe(strongest.count);
  });

  it('draws one mark per technique per band in the matrix, and a cell narrows the table to itself', () => {
    const { container } = inLab(<CatalogView onOpenMode={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tactic by band' }));
    const expectedCells = new Set(engineData.techniques.flatMap((technique) => technique.bandIds.map((bandId) => `${technique.tactic}|${bandId}`))).size;
    const cells = container.querySelectorAll('.mark-matrix-cell');
    expect(cells).toHaveLength(expectedCells);
    fireEvent.click(cells[0]);
    expect(container.querySelector('.catalog-table')).not.toBeNull();
    expect(screen.getAllByRole('row').length - 1).toBeLessThan(engineData.techniques.length);
  });

  it('opens a technique and says where it stands against the device, with CVEs headed as precedents', () => {
    inLab(<CatalogView onOpenMode={() => undefined} />);
    const firstRow = screen.getAllByRole('row')[1];
    fireEvent.keyDown(firstRow, { key: 'Enter' });
    const panel = screen.getByRole('region', { name: engineData.techniques[0].name });
    expect(within(panel).getByText('Precedents in other products')).toBeTruthy();
    expect(within(panel).getByText(/The catalog ties techniques to bands, not to brain regions\./)).toBeTruthy();
    expect(within(panel).getAllByText(/Applies to this device|Would apply if|Reviewed, outside the device|Not assessed\./).length).toBeGreaterThan(0);
  });
});

describe('CuratedChains', () => {
  it('lists every authored chain and shows the steps of the first', () => {
    inLab(<CuratedChains />);
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
    expect(screen.getByText(new RegExp(`^${curatedChains.length} chains written by hand`))).toBeTruthy();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(curatedChains.length + curatedChains[0].steps.length);
    expect(screen.getByText('Authored chain')).toBeTruthy();
  });
});

describe('Monitor pieces', () => {
  it('formats the playhead in minutes, seconds and tenths without floating-point slips', () => {
    expect(formatTime(11.1)).toBe('00:11.1');
    expect(formatTime(0)).toBe('00:00.0');
    expect(formatTime(75.95)).toBe('01:15.9');
  });

  it('says an empty event list is not a clean bill', () => {
    render(<EventList events={[]} markers={[]} thresholdMicrovolts={75} thresholdOptions={[50, 75]} onThresholdChange={() => undefined} time={0} onSeek={() => undefined} formatTime={String} />);
    expect(screen.getByText(/That is not a clean bill: only this one rule is checked, on a synthetic signal\./)).toBeTruthy();
  });

  it('calls crossings demonstrations, never detections, and seeks to one when pressed', () => {
    const onSeek = vi.fn();
    render(
      <EventList
        events={[{ time: 4.2, channelNames: ['C3', 'C4'], peakMicrovolts: 88.4 }]} markers={[{ time: 1, value: 1 }]} thresholdMicrovolts={75}
        thresholdOptions={[50, 75]} onThresholdChange={() => undefined} time={0} onSeek={onSeek} formatTime={(seconds) => `t${seconds}`}
      />,
    );
    expect(screen.getByRole('status').textContent).toBe('1 crossing in this sample. Demonstrations of the rule, not detections.');
    fireEvent.click(screen.getByRole('button', { name: /t4\.2/ }));
    expect(onSeek).toHaveBeenCalledWith(4.2);
  });

  it('labels each band with its share and lets a band be chosen', () => {
    const onSelectBand = vi.fn();
    render(<SpectrumBars shares={[0.1, 0.2, 0.5, 0.15, 0.05]} selectedBandId="alpha" onSelectBand={onSelectBand} />);
    const bars = screen.getAllByRole('button');
    expect(bars).toHaveLength(FREQUENCY_BANDS.length);
    expect(bars.map((bar) => bar.textContent)).toEqual(['10%', '20%', '50%', '15%', '5%']);
    expect(bars[2].getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(bars[0]);
    expect(onSelectBand).toHaveBeenCalledWith('delta');
  });

  it('draws known electrodes and names the ones it cannot place', () => {
    render(<ScalpMap channelNames={['Fp1', 'Oz', 'X9']} shares={[0.2, 0.6, 0.1]} bandLabel="alpha" />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('2 electrodes');
    expect(screen.getByText(/Not drawn, because they are not standard 10-20 names: X9\./)).toBeTruthy();
    expect(screen.getByText(/not a picture of brain regions/)).toBeTruthy();
  });
});
