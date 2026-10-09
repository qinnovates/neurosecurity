// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { listElementsInModelOrder } from '@/lib/threat-model/model-order';
import { listOrphanDecisions } from '@/lib/threat-model/orphan-decisions';
import type { RiskRow } from '@/lib/threat-model/report-types';
import { PRESETS, engineData, reportFor } from '@/lib/threat-model/__tests__/preset-reports';
import { NOTE_REQUIRED_STATEMENT, NOT_RECORDED_STATEMENT } from '../frame/decision-rules';
import OrphanDecisions, { ORPHAN_DECISIONS_TITLE, describeOrphanPlace } from '../frame/OrphanDecisions';
import { NOT_RECORDED_LABEL } from '../frame/register-columns';
import { groupKeyOf } from '../frame/register-order';
import { listPlacementReasons } from '../frame/RiskDrawer';
import RiskDetail, { SOURCE_NOT_RECORDED_LABEL } from '../RiskDetail';
import { ModelHighlightProvider } from '../model-highlight';
import RisksSection, { describeLitRows } from '../RisksSection';

afterEach(cleanup);

const [, { model, report }] = PRESETS[0];
const elements = listElementsInModelOrder(model);
const currentRows = report.riskRows.filter((row) => row.catalogState === 'current');
const catalogRows = currentRows.filter((row) => row.source === 'catalog');
const strideRows = currentRows.filter((row) => row.source === 'stride');
const techniqueById = new Map(engineData.techniques.map((technique) => [technique.id, technique]));

function bodyRows(): HTMLElement[] {
  return screen.getAllByRole('row').slice(1);
}

function renderRegister(rows: readonly RiskRow[] = currentRows) {
  const handlers = { onDecide: vi.fn(), onOpenRisk: vi.fn(), onOpenTechnique: vi.fn() };
  const { container } = render(<RisksSection rows={rows} elements={elements} openedRiskId={null} {...handlers} />);
  return { ...handlers, container };
}

describe('RisksSection', () => {
  it('has the seven columns in order, with the technique ID as a link and evidence in its short form', () => {
    const handlers = renderRegister();
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Threat', 'ID', 'Part', 'Catalog severity', 'Evidence', 'CVEs in other products', 'Decision',
    ]);
    const firstRow = bodyRows()[0];
    const link = within(firstRow).getByRole('button', { name: /^Open technique / });
    fireEvent.click(link);
    expect(handlers.onOpenTechnique).toHaveBeenCalledWith(link.textContent);
    expect(handlers.onOpenRisk).not.toHaveBeenCalled();
    expect(screen.getByRole('list', { name: 'Evidence marks' })).toBeTruthy();
  });

  it('starts on the catalog rows and changes scope with one quiet control', () => {
    renderRegister();
    expect(bodyRows()).toHaveLength(catalogRows.length);
    fireEvent.click(screen.getByRole('radio', { name: 'STRIDE baseline' }));
    expect(bodyRows()).toHaveLength(strideRows.length);
    fireEvent.click(screen.getByRole('radio', { name: 'All' }));
    expect(bodyRows()).toHaveLength(currentRows.length);
  });

  it('groups by technique with one line per part, and marks the first line of each group', () => {
    const { container } = render(<RisksSection rows={currentRows} elements={elements} openedRiskId={null} onDecide={() => undefined} onOpenRisk={() => undefined} onOpenTechnique={() => undefined} />);
    expect(bodyRows()).toHaveLength(catalogRows.length);
    expect(container.querySelectorAll('.model-threat[data-lead="true"]')).toHaveLength(new Set(catalogRows.map(groupKeyOf)).size);
    const ids = bodyRows().map((row) => within(row).getByRole('button', { name: /^Open technique / }).textContent);
    expect(ids.filter((id, index) => index === 0 || ids[index - 1] !== id)).toHaveLength(new Set(ids).size);
  });

  it('hands a decision made on the row to the caller for that row only, without opening the row', () => {
    const handlers = renderRegister();
    const firstRow = bodyRows()[0];
    const decision = within(firstRow).getByRole('combobox');
    fireEvent.click(decision);
    fireEvent.change(decision, { target: { value: 'mitigated' } });
    expect(handlers.onDecide).toHaveBeenCalledTimes(1);
    const [decidedRow, status] = handlers.onDecide.mock.calls[0] as [RiskRow, string];
    expect(status).toBe('mitigated');
    expect(firstRow.getAttribute('data-reflow-key')).toBe(decidedRow.riskId);
    expect(handlers.onOpenRisk).not.toHaveBeenCalled();
    fireEvent.keyDown(firstRow, { key: 'Enter' });
    expect(handlers.onOpenRisk).toHaveBeenCalledWith(decidedRow.riskId);
  });

  it('moves a technique whose lines all have a decision to the end, quieter, and marks the opened row', () => {
    const firstKey = groupKeyOf(catalogRows[0]);
    const rows = catalogRows.map((row): RiskRow => (groupKeyOf(row) === firstKey ? { ...row, status: 'accepted', note: 'Signed off' } : row));
    render(<RisksSection rows={rows} elements={elements} openedRiskId={catalogRows[0].riskId} onDecide={() => undefined} onOpenRisk={() => undefined} onOpenTechnique={() => undefined} />);
    const all = bodyRows();
    expect(all[all.length - 1].getAttribute('data-quiet')).toBe('true');
    expect(all.filter((row) => row.getAttribute('aria-current') === 'true')).toHaveLength(1);
    expect(screen.getByText(`${rows.filter((row) => row.status === 'open').length} open of ${rows.length}. A row closes only when a decision is recorded on that row. Enter opens a row.`)).toBeTruthy();
    expect(screen.getByText('A row closes only when a decision is recorded on that row.')).toBeTruthy();
  });

  it('offers the way back to its own grouping once the reader sorts', () => {
    renderRegister();
    expect(screen.queryByRole('button', { name: 'Group by technique' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Part' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group by technique' }));
    expect(screen.queryByRole('button', { name: 'Group by technique' })).toBeNull();
  });

  it('says why it is empty when the filters leave nothing', () => {
    const { container } = renderRegister([]);
    expect(container.querySelector('.lab-table-empty')?.textContent).toContain('No risk of this kind matches the part and lenses chosen');
  });

  it('carries the open count in a status line, so a decision or a filter is announced', () => {
    const rows = catalogRows.map((row, index): RiskRow => (index === 0 ? { ...row, status: 'mitigated' } : row));
    const { container, rerender } = render(<RisksSection rows={rows} elements={elements} openedRiskId={null} onDecide={() => undefined} onOpenRisk={() => undefined} onOpenTechnique={() => undefined} />);
    const status = container.querySelector('.model-register-count');
    expect(status?.getAttribute('role')).toBe('status');
    expect(status?.textContent).toBe(`${rows.length - 1} open of ${rows.length}`);
    rerender(<RisksSection rows={rows.slice(0, 5)} elements={elements} openedRiskId={null} onDecide={() => undefined} onOpenRisk={() => undefined} onOpenTechnique={() => undefined} />);
    expect(status?.textContent).toBe(`4 open of 5`);
  });

  it('keeps every cell to one line: the threat and the part end in an ellipsis and carry their full text as a tooltip', () => {
    renderRegister();
    for (const row of bodyRows()) {
      const [threat, part] = [row.querySelector('.model-threat'), row.querySelector('.model-part')];
      expect(threat?.classList.contains('model-one-line')).toBe(true);
      expect(part?.classList.contains('model-one-line')).toBe(true);
      expect(threat?.getAttribute('title')).toBe(threat?.textContent);
      expect(part?.getAttribute('title')).toBe(part?.textContent);
      expect(elements.some((element) => element.label === part?.textContent)).toBe(true);
    }
  });

  it('keeps the decision a select on every row, reachable by keyboard, named for its row', () => {
    renderRegister();
    for (const row of bodyRows()) {
      const decision = within(row).getByRole('combobox');
      expect(decision.tagName).toBe('SELECT');
      expect(decision.getAttribute('tabindex')).toBeNull();
      expect(decision.getAttribute('aria-label')).toMatch(/^Decision for .+ on .+$/);
    }
    const names = bodyRows().map((row) => within(row).getByRole('combobox').getAttribute('aria-label'));
    expect(new Set(names).size).toBe(names.length);
  });

  it('counts the rows on the part being pointed at beside the table head, and nothing when no part is', () => {
    const { container } = render(
      <ModelHighlightProvider>
        <RisksSection rows={currentRows} elements={elements} openedRiskId={null} onDecide={() => undefined} onOpenRisk={() => undefined} onOpenTechnique={() => undefined} />
      </ModelHighlightProvider>,
    );
    const chip = container.querySelector('.model-lit-count');
    expect(chip?.getAttribute('data-shown')).toBe('false');
    expect(chip?.textContent).toBe('');
    const row = bodyRows()[0];
    fireEvent.pointerEnter(row);
    const elementId = catalogRows.find((candidate) => candidate.riskId === row.getAttribute('data-reflow-key'))?.elementId;
    const element = elements.find((candidate) => candidate.id === elementId);
    const onElement = catalogRows.filter((candidate) => candidate.elementId === elementId).length;
    expect(chip?.getAttribute('data-shown')).toBe('true');
    expect(chip?.textContent).toBe(`${onElement} rows on ${element?.label}`);
    expect(bodyRows().filter((candidate) => candidate.getAttribute('data-lit') === 'true')).toHaveLength(onElement);
    fireEvent.pointerLeave(row);
    expect(chip?.getAttribute('data-shown')).toBe('false');
    expect(describeLitRows(1, 'Charger')).toBe('1 row on Charger');
  });
});


describe('RiskDetail', () => {
  const row = catalogRows.find((candidate) => candidate.precedentCveIds.length > 0 && candidate.detectionNote !== null) ?? catalogRows[0];
  const technique = techniqueById.get(row.techniqueId as string);
  const cves = report.precedentCves.filter((cve) => row.precedentCveIds.includes(cve.cveId));

  function renderDetail(overrides: Partial<Parameters<typeof RiskDetail>[0]> = {}) {
    const handlers = { onDecide: vi.fn(), onOpenTechnique: vi.fn() };
    const view = render(
      <RiskDetail
        row={row} technique={technique} placementReasons={listPlacementReasons(row, report)}
        precedentCves={cves} precedentCvesAsOf={report.precedentCvesAsOf} {...handlers} {...overrides}
      />,
    );
    return { ...handlers, ...view };
  }

  it('puts the decision and its note before everything else', () => {
    const { container } = renderDetail();
    const [first] = Array.from(container.querySelector('.model-risk-body')?.children ?? []);
    expect(first.getAttribute('aria-label')).toBe('Your decision');
    expect(within(first as HTMLElement).getByRole('combobox', { name: 'Decision' })).toBeTruthy();
    expect(within(first as HTMLElement).getByRole('textbox', { name: 'Note for this decision' })).toBeTruthy();
  });

  it('records Mitigated at once, and holds Accepted and Not applicable until a note is written', () => {
    const { onDecide } = renderDetail();
    fireEvent.change(screen.getByRole('combobox', { name: 'Decision' }), { target: { value: 'mitigated' } });
    expect(onDecide).toHaveBeenLastCalledWith(row.riskId, 'mitigated', row.note);
    onDecide.mockClear();

    for (const status of ['accepted', 'not_applicable'] as const) {
      fireEvent.change(screen.getByRole('combobox', { name: 'Decision' }), { target: { value: status } });
      expect(onDecide).not.toHaveBeenCalled();
      expect(screen.getByRole('alert').textContent).toBe(`${NOTE_REQUIRED_STATEMENT} ${NOT_RECORDED_STATEMENT}`);
      expect(screen.getByRole('textbox', { name: 'Note for this decision' }).getAttribute('aria-invalid')).toBe('true');
    }
    fireEvent.change(screen.getByRole('textbox', { name: 'Note for this decision' }), { target: { value: 'Out of scope for this build' } });
    expect(onDecide).toHaveBeenCalledWith(row.riskId, 'not_applicable', 'Out of scope for this build');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('opens on a decision chosen on the row that still needs its note, unrecorded', () => {
    const { onDecide } = renderDetail({ pendingStatus: 'accepted' });
    expect((screen.getByRole('combobox', { name: 'Decision' }) as HTMLSelectElement).value).toBe('accepted');
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(onDecide).not.toHaveBeenCalled();
  });

  it('says why the row is here in the placement table\'s words, then the evidence lines for a device row', () => {
    renderDetail();
    const reasons = listPlacementReasons(row, report);
    expect(reasons.length).toBeGreaterThan(0);
    expect(screen.getByText(reasons.join(' '))).toBeTruthy();
    expect(screen.getByText('Applying it to this part is this tool\'s placement, drafted with an AI assistant and not yet reviewed by the author.')).toBeTruthy();
  });

  it('prints sources as the catalog records them, or says none is recorded', () => {
    const view = renderDetail();
    for (const source of technique?.sources ?? []) expect(view.container.textContent).toContain(source);
    cleanup();
    renderDetail({ technique: technique === undefined ? undefined : { ...technique, sources: [] } });
    expect(screen.getByText(SOURCE_NOT_RECORDED_LABEL)).toBeTruthy();
  });

  it('heads linked CVEs as found in other products, with id, product and score only', () => {
    const { container } = renderDetail();
    expect(screen.getByRole('heading', { name: 'CVEs in other products' })).toBeTruthy();
    expect(screen.getByText(/Not findings about this device\./)).toBeTruthy();
    for (const cve of cves) {
      expect(container.textContent).toContain(cve.cveId);
      if (cve.description.length > 0) expect(container.textContent).not.toContain(cve.description);
    }
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
    expect(screen.queryByRole('checkbox')).toBeNull();
    cleanup();
    renderDetail({ row: { ...row, detectionNote: null } });
    expect(screen.getByText('None recorded.')).toBeTruthy();
  });

  it('uses one label for a score the data does not hold: a CVE with no score reads "Not recorded"', () => {
    const unscored = { cveId: 'CVE-0000-0001', product: 'Example product', description: '', cvssScore: null };
    renderDetail({ precedentCves: [{ ...cves[0], ...unscored }] });
    expect(NOT_RECORDED_LABEL).toBe('Not recorded');
    const item = screen.getByText('CVE-0000-0001').closest('li');
    expect(item?.textContent).toContain(NOT_RECORDED_LABEL);
    expect(document.body.textContent).not.toContain('Not scored');
  });

  it('shows a baseline row as the generic baseline, with no technique sections', () => {
    renderDetail({ row: strideRows[0], technique: undefined, placementReasons: [], precedentCves: [] });
    expect(screen.getByText('Generic baseline, not a catalog technique')).toBeTruthy();
    expect(screen.queryByText('Sources, as recorded')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'CVEs in other products' })).toBeNull();
  });
});

describe('Decisions without a row', () => {
  const [partId] = model.components.map((component) => component.id);
  const techniqueOnPart = catalogRows.find((row) => row.elementId === partId)?.techniqueId as string;
  const orphanModel = {
    ...model,
    riskDecisions: [
      { riskId: `removed-part::${techniqueOnPart}`, status: 'accepted' as const, note: 'Signed off in March' },
      { riskId: `${partId}::QIF-T9999`, status: 'mitigated' as const, note: '' },
      { riskId: catalogRows[0].riskId, status: 'mitigated' as const, note: '' },
    ],
  };
  const orphans = listOrphanDecisions(orphanModel, reportFor(orphanModel));

  const techniqueNameById = new Map([...techniqueById].map(([id, technique]) => [id, technique.name]));
  const elementLabelById = new Map(elements.map((element) => [element.id, element.label]));

  it('lists each decision that lost its row with its status, note and cause, and none that still has one', () => {
    render(<OrphanDecisions orphans={orphans} techniqueNameById={techniqueNameById} elementLabelById={elementLabelById} onOpenTechnique={() => undefined} />);
    expect(orphans).toHaveLength(2);
    const panel = screen.getByRole('region', { name: ORPHAN_DECISIONS_TITLE });
    const items = within(panel).getAllByRole('listitem');
    expect(items).toHaveLength(orphans.length);
    expect(items[0].textContent).toContain('Accepted');
    expect(items[0].textContent).toContain('Signed off in March');
    orphans.forEach((orphan, index) => expect(items[index].textContent).toContain(orphan.detail));
    expect(items[1].textContent).toContain('No note');
  });

  it('names the technique and says the part was removed, with the part\'s id; a part still in the model is named', () => {
    render(<OrphanDecisions orphans={orphans} techniqueNameById={techniqueNameById} elementLabelById={elementLabelById} onOpenTechnique={() => undefined} />);
    const [removed, uncatalogued] = within(screen.getByRole('region', { name: ORPHAN_DECISIONS_TITLE })).getAllByRole('listitem');
    expect(orphans[0].cause).toBe('element_removed');
    expect(removed.textContent).toContain(techniqueNameById.get(techniqueOnPart));
    expect(removed.textContent).toContain('on a removed part (removed-part)');
    expect(uncatalogued.textContent).toContain(`on ${elementLabelById.get(partId)}`);
    expect(uncatalogued.textContent).not.toContain('removed part');
    expect(describeOrphanPlace({ cause: 'technique_no_longer_applies', elementId: 'gone' }, elementLabelById)).toBe('on a removed part (gone)');
  });

  it('links a technique the catalog still has, and prints one it no longer has as plain text', () => {
    const onOpenTechnique = vi.fn();
    render(<OrphanDecisions orphans={orphans} techniqueNameById={techniqueNameById} elementLabelById={elementLabelById} onOpenTechnique={onOpenTechnique} />);
    const links = screen.getAllByRole('button', { name: /^Open technique / });
    expect(links).toHaveLength(orphans.filter((orphan) => orphan.cause !== 'technique_not_in_catalog' && orphan.techniqueId !== null).length);
    fireEvent.click(links[0]);
    expect(onOpenTechnique).toHaveBeenCalledWith(techniqueOnPart);
    expect(screen.getByText('QIF-T9999').tagName).toBe('SPAN');
  });

  it('draws nothing when every decision has its row', () => {
    const { container } = render(<OrphanDecisions orphans={[]} techniqueNameById={techniqueNameById} elementLabelById={elementLabelById} onOpenTechnique={() => undefined} />);
    expect(container.textContent).toBe('');
  });
});
