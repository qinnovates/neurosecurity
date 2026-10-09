// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { buildThreatModelReport } from '@/lib/threat-model/build-report';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import type { RiskRow } from '@/lib/threat-model/report-types';
import { loadEngineBundle, loadReferenceData } from '@/lib/threat-model/__tests__/load-test-data';
import RiskDetail from '../RiskDetail';
import RisksSection from '../RisksSection';

afterEach(cleanup);

const bundle = loadEngineBundle();
const { engineData } = bundle;
const referenceData = loadReferenceData(bundle);
const [archetype] = referenceData.archetypes;
const model = buildModelFromIntake(defaultAnswersFor(archetype), archetype, engineData.registrarVersion);
const report = buildThreatModelReport({ model, engineData, referenceData, generatedAt: '' });
const catalogRows = report.riskRows.filter((row) => row.source === 'catalog');
const strideRows = report.riskRows.filter((row) => row.source === 'stride');
const techniqueById = new Map(engineData.techniques.map((technique) => [technique.id, technique]));

function bodyRows(): HTMLElement[] {
  return screen.getAllByRole('row').slice(1);
}

describe('RisksSection', () => {
  it('starts on the catalog rows and switches source with the chips, each showing its count', () => {
    render(<RisksSection rows={report.riskRows} techniqueById={techniqueById} onDecide={() => undefined} onOpenRisk={() => undefined} />);
    expect(bodyRows()).toHaveLength(catalogRows.length);
    fireEvent.click(screen.getByRole('button', { name: `STRIDE baseline ${strideRows.length}` }));
    expect(bodyRows()).toHaveLength(strideRows.length);
    fireEvent.click(screen.getByRole('button', { name: `All ${report.riskRows.length}` }));
    expect(bodyRows()).toHaveLength(report.riskRows.length);
  });

  it('records a decision from the row without opening the row', () => {
    const onDecide = vi.fn();
    const onOpenRisk = vi.fn();
    render(<RisksSection rows={report.riskRows} techniqueById={techniqueById} onDecide={onDecide} onOpenRisk={onOpenRisk} />);
    const firstRow = bodyRows()[0];
    const decision = within(firstRow).getByRole('combobox');
    fireEvent.click(decision);
    fireEvent.change(decision, { target: { value: 'mitigated' } });
    expect(onDecide).toHaveBeenCalledWith(catalogRows[0].riskId, 'mitigated', catalogRows[0].note);
    expect(onOpenRisk).not.toHaveBeenCalled();
    fireEvent.keyDown(firstRow, { key: 'Enter' });
    expect(onOpenRisk).toHaveBeenCalledWith(catalogRows[0].riskId);
  });

  it('puts addressed rows last and drops them under "Open only"', () => {
    const addressed: RiskRow = { ...catalogRows[0], status: 'accepted' };
    const rows = [addressed, ...catalogRows.slice(1)];
    render(<RisksSection rows={rows} techniqueById={techniqueById} onDecide={() => undefined} onOpenRisk={() => undefined} />);
    const all = bodyRows();
    expect(all[all.length - 1].getAttribute('data-quiet')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: `Open only ${rows.length - 1}` }));
    expect(bodyRows()).toHaveLength(rows.length - 1);
  });

  it('says why it is empty when the lenses leave nothing', () => {
    render(<RisksSection rows={[]} techniqueById={techniqueById} onDecide={() => undefined} onOpenRisk={() => undefined} />);
    expect(screen.getByRole('status').textContent).toContain('No risk of this kind matches the part and lenses chosen');
  });
});

describe('RiskDetail', () => {
  const row = catalogRows.find((candidate) => candidate.precedentCveIds.length > 0 && candidate.detectionNote !== null) ?? catalogRows[0];
  const cves = report.precedentCves.filter((cve) => row.precedentCveIds.includes(cve.cveId));

  function renderDetail(overrides: Partial<Parameters<typeof RiskDetail>[0]> = {}) {
    const handlers = { onDecide: vi.fn(), onClose: vi.fn() };
    render(
      <RiskDetail
        row={row} technique={engineData.techniques.find((technique) => technique.id === row.techniqueId)} placementReasons={['Placed for a stated reason.']}
        precedentCves={cves} precedentCvesAsOf={report.precedentCvesAsOf} {...handlers} {...overrides}
      />,
    );
    return handlers;
  }

  it('heads linked CVEs as found in other products, never as findings about this device', () => {
    renderDetail();
    expect(screen.getByText('CVEs in other products')).toBeTruthy();
    expect(screen.getByText(/Not findings about this device\./)).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(cves.length);
  });

  it('says so when no CVE is linked, without calling that a finding', () => {
    renderDetail({ precedentCves: [] });
    expect(screen.getByText(/That is not a finding about this device\./)).toBeTruthy();
  });

  it('labels NISS as proposed wherever it shows a score', () => {
    renderDetail({ row: { ...row, nissScore: 2.7 } });
    expect(screen.getByText(/NISS is a proposed score and is not peer reviewed\./)).toBeTruthy();
  });

  it('prints the catalog detection note, says no controls are recorded, and offers nothing to tick', () => {
    renderDetail();
    expect(screen.getByText('Detection note, from the catalog')).toBeTruthy();
    expect(screen.getByText(row.detectionNote as string)).toBeTruthy();
    expect(screen.getByText('Controls: none recorded for this row.')).toBeTruthy();
    expect(screen.queryByText(/Suggested controls/)).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('says so when the catalog records no detection note', () => {
    renderDetail({ row: { ...row, detectionNote: null } });
    expect(screen.getByText('None recorded.')).toBeTruthy();
  });

  it('moves focus to its heading, closes on Escape, and reports decision changes', () => {
    const handlers = renderDetail();
    expect(document.activeElement?.textContent).toBe(row.title);
    fireEvent.change(screen.getByRole('combobox', { name: 'Decision' }), { target: { value: 'accepted' } });
    expect(handlers.onDecide).toHaveBeenCalledWith(row.riskId, 'accepted', row.note);
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Decision' }), { key: 'Escape' });
    expect(handlers.onClose).toHaveBeenCalledOnce();
  });
});
