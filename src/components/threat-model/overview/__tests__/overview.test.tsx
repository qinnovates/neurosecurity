// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { CATALOG_SEVERITIES } from '@/lib/threat-model/catalog-types';
import { RISK_STATUSES, type DeviceModel } from '@/lib/threat-model/device-model';
import { SCOPE_TERMS, SCOPE_TERM_LABELS } from '@/lib/threat-model/lab-terms';
import { summariseCoverageBySeverity } from '@/lib/threat-model/placement-coverage';
import { countRowsByElement, describeRegisterUnits, summariseRegisterUnits } from '@/lib/threat-model/register-counts';
import { THREAT_GOALS, type RiskRow } from '@/lib/threat-model/report-types';
import { isRiskAddressed } from '@/lib/threat-model/risk-register';
import { summariseScope } from '@/lib/threat-model/scope-statement';
import { PRESETS, engineData, referenceData, reportFor, type Preset } from '@/lib/threat-model/__tests__/preset-reports';
import { findCoverageGaps } from '../../frame/facet-counts';
import { ModelHighlightProvider } from '../../model-highlight';
import { RISK_STATUS_LABELS } from '../../risk-status-labels';
import OpenRowsByElement from '../OpenRowsByElement';
import { listTopOpenRows, sumDecisions, summariseOverview } from '../overview-figures';
import OverviewView, { TOP_ROW_LIMIT } from '../OverviewView';
import StackBar from '../StackBar';

afterEach(cleanup);

function currentRowsOf(preset: Preset): RiskRow[] {
  return preset.report.riskRows.filter((row) => row.catalogState === 'current');
}

function renderOverview(preset: Preset, rows: readonly RiskRow[] = currentRowsOf(preset)) {
  const scope = summariseScope(preset.model, engineData, referenceData);
  const severityCoverage = summariseCoverageBySeverity(engineData.techniques, scope);
  const handlers = { onSelectElement: vi.fn(), onOpenRisk: vi.fn(), onOpenTechnique: vi.fn(), onOpenScopeLists: vi.fn() };
  const view = render(
    <ModelHighlightProvider>
      <OverviewView
        model={preset.model} rows={rows} scope={scope} severityCoverage={severityCoverage} goalCoverage={preset.report.goalCoverage}
        gaps={findCoverageGaps(preset.report.goalCoverage, severityCoverage)} placementTable={referenceData.placementTable}
        diagram={<div data-testid="diagram" />} {...handlers}
      />
    </ModelHighlightProvider>,
  );
  return { ...handlers, ...view, scope, severityCoverage };
}

describe('overview figures', () => {
  it.each(PRESETS)('%s: every figure is counted from the rows and the scope statement', (_presetId, preset) => {
    const rows = currentRowsOf(preset);
    const scope = summariseScope(preset.model, engineData, referenceData);
    const figures = summariseOverview(rows, scope);
    const catalog = rows.filter((row) => row.source === 'catalog');
    expect(figures.catalogRows + figures.baselineRows).toBe(rows.length);
    expect(figures.openCatalogRows).toBe(catalog.filter((row) => !isRiskAddressed(row)).length);
    expect(figures.severeRows).toBe(catalog.filter((row) => row.catalogSeverity === 'critical' || row.catalogSeverity === 'high').length);
    expect(figures.techniquesThatApply).toBe(new Set(catalog.map((row) => row.techniqueId)).size);
    expect(figures.techniquesThatApply + scope.wouldApplyIf.length + scope.reviewedOutside.length + figures.techniquesNotAssessed).toBe(engineData.techniques.length);
    expect(figures.catalogTechniques).toBe(engineData.techniques.length);
  });

  it('sums decisions over every part and connection to the register\'s own totals', () => {
    const [, preset] = PRESETS[1];
    const rows = currentRowsOf(preset).map((row, index): RiskRow => (index % 3 === 0 ? { ...row, status: 'mitigated' } : row));
    const totals = sumDecisions(countRowsByElement(preset.model, rows));
    for (const status of RISK_STATUSES) {
      expect(totals.catalog[status]).toBe(rows.filter((row) => row.source === 'catalog' && row.status === status).length);
      expect(totals.baseline[status]).toBe(rows.filter((row) => row.source === 'stride' && row.status === status).length);
    }
  });

  it('lists the first open catalog rows in the register\'s order, and no decided or baseline row', () => {
    const [, preset] = PRESETS[0];
    const rows = currentRowsOf(preset).map((row, index): RiskRow => (index === 0 ? { ...row, status: 'accepted' } : row));
    const top = listTopOpenRows(rows, TOP_ROW_LIMIT);
    expect(top).toEqual(rows.filter((row) => row.source === 'catalog' && row.status === 'open').slice(0, TOP_ROW_LIMIT));
  });
});

describe('OverviewView', () => {
  it.each(PRESETS)('%s: prints the four tiles, the unit sentence and the diagram', (_presetId, preset) => {
    const rows = currentRowsOf(preset);
    const { scope, container } = renderOverview(preset);
    const figures = summariseOverview(rows, scope);
    const tiles = within(screen.getByRole('region', { name: 'This device at a glance' }));
    const tileText = Array.from(container.querySelectorAll('.lab-stat')).map((tile) => tile.textContent);
    expect(tileText).toHaveLength(4);
    expect(tileText[0]).toContain(`${figures.openCatalogRows}of ${figures.catalogRows}Open rows`);
    expect(tileText[0]).toContain(`${figures.openBaselineRows} of ${figures.baselineRows} baseline rows open`);
    expect(tileText[1]).toContain(`${figures.openSevereRows}of ${figures.severeRows}Critical and high still open`);
    expect(tileText[2]).toContain(`${figures.techniquesThatApply}of ${figures.catalogTechniques}Techniques that apply`);
    expect(tileText[3]).toContain(`${figures.techniquesNotAssessed}of ${figures.catalogTechniques}Catalog techniques not assessed`);
    expect(tiles.getByText('Open rows')).toBeTruthy();
    expect(screen.getByText(describeRegisterUnits(summariseRegisterUnits(preset.model, rows)))).toBeTruthy();
    expect(screen.getByTestId('diagram')).toBeTruthy();
  });

  it('prints every integer of coverage by catalog severity, with a hatch for "Not assessed"', () => {
    const [, preset] = PRESETS[0];
    const { severityCoverage } = renderOverview(preset);
    const table = within(screen.getByRole('region', { name: 'Coverage by catalog severity' })).getByRole('table');
    const bodyRows = within(table).getAllByRole('row').slice(1);
    expect(bodyRows).toHaveLength(CATALOG_SEVERITIES.length + 1);
    severityCoverage.rows.forEach((row, index) => {
      const cells = within(bodyRows[index]).getAllByRole('cell').slice(1).map((cell) => Number(cell.textContent));
      expect(cells).toEqual([...SCOPE_TERMS.map((term) => row.byTerm[term]), row.total]);
    });
    const totals = within(bodyRows[CATALOG_SEVERITIES.length]).getAllByRole('cell').slice(1).map((cell) => Number(cell.textContent));
    expect(totals).toEqual([...SCOPE_TERMS.map((term) => severityCoverage.totalsByTerm[term]), engineData.techniques.length]);
    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent?.trim())).toEqual(
      ['Catalog severity', 'Share', ...SCOPE_TERMS.map((term) => SCOPE_TERM_LABELS[term]), 'Total'],
    );
    expect(table.querySelectorAll('.lab-splitbar-segment[data-kind="hatch"]')).toHaveLength(CATALOG_SEVERITIES.length + 1);
  });

  it('says how far placement has got for each effect that is incomplete, and that no row is not the same as no risk', () => {
    const [, preset] = PRESETS[0];
    renderOverview(preset);
    const rows = currentRowsOf(preset);
    for (const goal of THREAT_GOALS) {
      const coverage = preset.report.goalCoverage[goal];
      const sentence = new RegExp(`${coverage.placedTechniques} of the catalog.s ${coverage.catalogTechniques} techniques of this kind`);
      expect(screen.queryAllByText(sentence).length > 0).toBe(coverage.isIncomplete);
      const hasRow = rows.some((row) => row.source === 'catalog' && row.goal === goal);
      const label = { read: 'Read', change: 'Change', deny: 'Deny' }[goal];
      expect(screen.queryByText(`${label} is not assessed, which is not the same as no risk.`) !== null).toBe(coverage.isIncomplete && !hasRow);
    }
  });

  it('opens the rows of a part from its bar, a row from the top list, and the scope lists from their link', () => {
    const [, preset] = PRESETS[0];
    const handlers = renderOverview(preset);
    const counts = countRowsByElement(preset.model, currentRowsOf(preset));
    const withRows = counts.find((element) => element.catalogRows > 0);
    if (withRows === undefined) throw new Error('test setup: the preset has no catalog row');
    const lines = within(screen.getByRole('region', { name: 'Open rows by part and connection' })).getAllByRole('button');
    expect(lines).toHaveLength(counts.length);
    fireEvent.click(lines[counts.indexOf(withRows)]);
    expect(handlers.onSelectElement).toHaveBeenCalledWith(withRows.id);

    const top = within(screen.getByRole('region', { name: 'Top open rows' }));
    const topRows = top.getAllByRole('row').slice(1);
    const expected = listTopOpenRows(currentRowsOf(preset), TOP_ROW_LIMIT);
    expect(topRows).toHaveLength(expected.length);
    fireEvent.keyDown(topRows[0], { key: 'Enter' });
    expect(handlers.onOpenRisk).toHaveBeenCalledWith(expected[0].riskId);

    fireEvent.click(screen.getByRole('button', { name: 'The four scope lists with reasons' }));
    expect(handlers.onOpenScopeLists).toHaveBeenCalledOnce();
  });

  it('prints decision progress for catalog and baseline rows, every status counted', () => {
    const [, preset] = PRESETS[0];
    const rows = currentRowsOf(preset).map((row, index): RiskRow => (index === 0 ? { ...row, status: 'accepted' } : row));
    renderOverview(preset, rows);
    const table = within(screen.getByRole('region', { name: 'Decision progress' })).getByRole('table');
    expect(within(table).getAllByRole('columnheader').slice(2).map((header) => header.textContent?.trim())).toEqual(RISK_STATUSES.map((status) => RISK_STATUS_LABELS[status]));
    const [catalogLine] = within(table).getAllByRole('row').slice(1);
    expect(within(catalogLine).getAllByRole('cell').slice(1).map((cell) => Number(cell.textContent))).toEqual(
      RISK_STATUSES.map((status) => rows.filter((row) => row.source === 'catalog' && row.status === status).length),
    );
  });

  it('counts the placements drafted with an AI assistant and how many the author has reviewed', () => {
    const [, preset] = PRESETS[0];
    renderOverview(preset);
    const { placementCount, reviewedPlacementCount } = referenceData.placementTable;
    expect(screen.getByText((_text, node) => node?.textContent === `${placementCount} placements drafted with an AI assistant; ${reviewedPlacementCount} reviewed by the author.`)).toBeTruthy();
  });

  it('never looks clean for a device with no catalog row: the tiles and the bars say "Not assessed"', () => {
    const [, preset] = PRESETS[0];
    const bare: DeviceModel = { ...preset.model, components: [], links: [] };
    const bareReport = reportFor(bare);
    renderOverview({ model: bare, report: bareReport }, bareReport.riskRows);
    const tiles = screen.getByRole('region', { name: 'This device at a glance' });
    expect(within(tiles).getAllByText('Not assessed').length).toBeGreaterThanOrEqual(2);
    expect(tiles.textContent).not.toMatch(/(^|\D)0of 0/);
    expect(within(screen.getByRole('region', { name: 'Top open rows' })).getByRole('status').textContent).toContain('No techniques are placed on this model.');
  });
});

describe('OpenRowsByElement', () => {
  it('lights the element it points at through the shared highlight, and says "Not assessed" where an element has no row', () => {
    const [, preset] = PRESETS[0];
    const counts = countRowsByElement(preset.model, currentRowsOf(preset));
    render(<ModelHighlightProvider><OpenRowsByElement elementCounts={counts} isCoverageIncomplete onSelectElement={() => undefined} /></ModelHighlightProvider>);
    const lines = screen.getAllByRole('button');
    fireEvent.pointerEnter(lines[0]);
    expect(lines[0].getAttribute('data-lit')).toBe('true');
    fireEvent.pointerLeave(lines[0]);
    expect(lines[0].getAttribute('data-lit')).toBe('false');
    counts.forEach((element, index) => {
      if (element.catalogRows === 0) expect(lines[index].textContent).toBe(`${element.label} Not assessed`);
      else expect(lines[index].textContent).toBe(`${element.label}${element.openCatalogRows} open of ${element.catalogRows}`);
    });
  });
});

describe('StackBar', () => {
  it('names every share in its summary, sizes each by its count, and hides an empty one', () => {
    render(<StackBar subject="open rows" segments={[{ id: 'a', label: 'Critical', count: 3, tone: 'critical' }, { id: 'b', label: 'High', count: 0, tone: 'strong' }]} />);
    const bar = screen.getByRole('img', { name: '3 open rows: 3 Critical, 0 High.' });
    const [first, second] = Array.from(bar.children) as HTMLElement[];
    expect(first.style.flexGrow).toBe('3');
    expect(second.getAttribute('data-empty')).toBe('true');
  });

  it('says so when there is nothing to split', () => {
    render(<StackBar subject="open rows" segments={[{ id: 'a', label: 'Critical', count: 0, tone: 'critical' }]} />);
    expect(screen.getByRole('img', { name: 'No open rows.' })).toBeTruthy();
  });
});
