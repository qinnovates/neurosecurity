// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { loadTaraChains } from '@/components/atlas/load-tara-chains';
import { contrastRatio, parseColour } from '@/components/lab-kit/contrast';
import { FocusProvider } from '@/components/workbench/FocusContext';
import { STANDING_STATEMENTS } from '@/components/workbench/StandingLine';
import { buildThreatModelReport } from '@/lib/threat-model/build-report';
import { CHECKLIST_TITLE } from '@/lib/threat-model/compliance-us';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import { SCOPE_TERMS, SCOPE_TERM_LABELS } from '@/lib/threat-model/lab-terms';
import { buildRegisterExportCsv } from '@/lib/threat-model/register-csv';
import { describeRegisterUnits, summariseRegisterUnits } from '@/lib/threat-model/register-counts';
import { SCOPE_LIST_BY_TERM, summariseScope } from '@/lib/threat-model/scope-statement';
import { loadEngineBundle, loadReferenceData } from '@/lib/threat-model/__tests__/load-test-data';
import ReportView, { ReportDocument, VIEW_LABELS } from '../../ReportView';
import { REPORT_AUTHOR_LINE } from '../report-author';
import { REPORT_SECTIONS, formatGeneratedAt, headingFor } from '../report-sections';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const bundle = loadEngineBundle();
const { engineData } = bundle;
const referenceData = loadReferenceData(bundle);
const GENERATED_AT = '2026-10-09T05:53:12.345Z';

function reportFor(archetypeIndex: number) {
  const archetype = referenceData.archetypes[archetypeIndex];
  const model = buildModelFromIntake(defaultAnswersFor(archetype), archetype, engineData.registrarVersion);
  return buildThreatModelReport({ model, engineData, referenceData, generatedAt: GENERATED_AT });
}

const report = reportFor(2);
const renderDocument = (source = report) => render(<ReportDocument report={source} engineData={engineData} referenceData={referenceData} regionNames={['Motor cortex']} />);

describe('the report', () => {
  it('prints its sections in the agreed order, after an unnumbered title block', () => {
    renderDocument();
    const expectedTitles = [
      'Overview summary', 'System as modelled', 'Scope, stated with reasons', 'Risk register',
      'Security architecture views', 'Attack chain hypotheses', CHECKLIST_TITLE, 'CVEs in other products',
    ];
    expect(REPORT_SECTIONS.map((section) => section.title)).toEqual(expectedTitles);
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      `Threat model draft: ${report.model.name}`,
      ...expectedTitles.map((title, index) => `${index + 1}. ${title}`),
    ]);
    expect(headingFor('register')).toBe('4. Risk register');
  });

  it('states the versions, the date to the minute and the submission type, and prints every standing statement whole', () => {
    const { container } = renderDocument();
    const block = container.querySelector('.report-title-block') as HTMLElement;
    const facts = Object.fromEntries([...block.querySelectorAll('.report-facts > div')].map((fact) => [fact.querySelector('dt')?.textContent, fact.querySelector('dd')?.textContent]));
    expect(facts).toMatchObject({
      Generated: '2026-10-09 05:53 UTC',
      'Technique catalog version': report.registrarVersion,
      'Placement table version': referenceData.placementTable.version,
      'Requirements checklist version': referenceData.compliance.version,
      'Submission type': 'None yet',
      'Target regions': 'Motor cortex',
    });
    expect(formatGeneratedAt('')).toBe('Not recorded');
    const standing = within(block).getByRole('list', { name: 'What TARA Lab is and is not' });
    expect([...standing.querySelectorAll('li')].map((item) => item.textContent)).toEqual([...STANDING_STATEMENTS]);
    for (const limitation of report.limitations) expect(within(block).getByText(limitation)).toBeTruthy();
    for (const goal of ['read', 'change', 'deny'] as const) {
      const coverage = report.goalCoverage[goal];
      expect(block.textContent).toContain(`${coverage.placedTechniques} of the catalog’s ${coverage.catalogTechniques} techniques of this kind`);
    }
  });

  it('leaves one empty author constant that renders nothing while it is empty', () => {
    const { container } = renderDocument();
    expect(REPORT_AUTHOR_LINE).toBe('');
    expect(container.querySelector('.report-author')).toBeNull();
    expect(container.textContent).not.toMatch(/\bAuthor\b|Prepared by/);
  });

  it('computes every overview figure from the rows and the scope lists, under the Overview\'s own definitions', () => {
    const { container } = renderDocument();
    const scope = summariseScope(report.model, engineData, referenceData);
    const current = report.riskRows.filter((row) => row.catalogState === 'current');
    const catalog = current.filter((row) => row.source === 'catalog');
    const baseline = current.filter((row) => row.source === 'stride');
    const severe = catalog.filter((row) => row.catalogSeverity === 'critical' || row.catalogSeverity === 'high');
    const openOf = (rows: typeof current): number => rows.filter((row) => row.status === 'open').length;
    const tiles = Object.fromEntries([...container.querySelectorAll('.report-tiles .lab-stat')].map((tile) => [tile.querySelector('.lab-stat-label')?.textContent, tile.querySelector('.lab-stat-figure')?.textContent]));
    expect(tiles).toEqual({
      'Open rows': `${openOf(catalog)}of ${catalog.length}`,
      'Critical and high still open': `${openOf(severe)}of ${severe.length}`,
      'Techniques that apply': `${scope.applies.length}of ${scope.total}`,
      'Catalog techniques not assessed': `${scope.notAssessed.length}of ${scope.total}`,
    });
    // The baseline rows are counted apart, in the note under the first tile, as on the Overview.
    expect(container.querySelector('.report-tiles .lab-stat-note')?.textContent).toBe(`${openOf(baseline)} of ${baseline.length} baseline rows open`);
    expect(screen.getByText(describeRegisterUnits(summariseRegisterUnits(report.model, report.riskRows)))).toBeTruthy();
    const { placementCount, notPlacedCount, reviewedPlacementCount } = referenceData.placementTable;
    expect(reviewedPlacementCount).toBe(0);
    expect(screen.getByText(`${placementCount + notPlacedCount} placement decisions (${placementCount} placed, ${notPlacedCount} reviewed, outside the device) drafted with an AI assistant; the placement file records no review yet.`)).toBeTruthy();
  });

  it('lists every catalog technique under exactly one scope term, with its reason', () => {
    const { container } = renderDocument();
    const scope = summariseScope(report.model, engineData, referenceData);
    const counts = SCOPE_TERMS.map((term) => scope[SCOPE_LIST_BY_TERM[term]].length);
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(engineData.techniques.length);
    SCOPE_TERMS.forEach((term, index) => {
      expect(screen.getByRole('heading', { name: new RegExp(`${SCOPE_TERM_LABELS[term].replace(/[()]/g, '\\$&')}: ${counts[index]}$`) })).toBeTruthy();
    });
    const scopeSection = container.querySelector('[aria-labelledby="report-scope"]') as HTMLElement;
    expect(scopeSection.querySelectorAll('tbody tr')).toHaveLength(engineData.techniques.length);
    const [outside] = scope.reviewedOutside;
    if (outside !== undefined) expect(within(scopeSection).getAllByText(outside.reason).length).toBeGreaterThan(0);
  });

  it('describes the system with a row per part and per connection, and one drawing', () => {
    const { container } = renderDocument();
    const system = container.querySelector('[aria-labelledby="report-system"]') as HTMLElement;
    const [parts, connections] = [...system.querySelectorAll('table')];
    expect(parts.querySelectorAll('tbody tr')).toHaveLength(report.model.components.length);
    expect(connections.querySelectorAll('tbody tr')).toHaveLength(report.model.links.length);
    expect(within(system).getByRole('columnheader', { name: 'Carries (direction derived)' })).toBeTruthy();
    const architecture = container.querySelector('[aria-labelledby="report-architecture"]') as HTMLElement;
    expect(architecture.querySelectorAll('.report-diagram')).toHaveLength(1);
    expect(within(architecture).getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual(report.architectureViews.map((selection) => VIEW_LABELS[selection.view]));
  });

  it('prints linked CVEs by id, product and score only, never a description', () => {
    const { container } = renderDocument();
    expect(report.precedentCves.length).toBeGreaterThan(0);
    const cves = container.querySelector('[aria-labelledby="report-cves"]') as HTMLElement;
    expect(within(cves).getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['CVE', 'Product', 'CVSS', 'Linked through']);
    for (const cve of report.precedentCves) {
      expect(cves.textContent).toContain(cve.cveId);
      if (cve.description.length > 0) expect(container.textContent).not.toContain(cve.description);
    }
    for (const cve of engineData.precedentCves) {
      if (cve.description.length > 0) expect(container.textContent).not.toContain(cve.description);
    }
    // The catalog names one technique with this word; it is the reworded CVE descriptions that must not appear.
    expect(cves.textContent).not.toMatch(/neuro-?surveillance/i);
    expect(container.textContent).not.toMatch(/weaker evidence|Precedent vulnerabilities/i);
  });

  it.each(referenceData.archetypes.map((archetype, index) => [archetype.id, index] as const))('never says a device is compliant, on the preset %s', (_id, index) => {
    const { container } = renderDocument(reportFor(index));
    expect(container.textContent).not.toMatch(/\bcompliant\b|\bcomplies\b/i);
    expect(container.querySelectorAll('#lab-results')).toHaveLength(1);
  });

  it('asks the shell to export the register', () => {
    const createUrl = vi.fn(() => 'blob:register');
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: vi.fn() }));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(
      <FocusProvider engineData={engineData} referenceData={referenceData} curatedChains={loadTaraChains()}>
        <ReportView report={report} regionNames={[]} />
      </FocusProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Export register (CSV)' }));
    expect(createUrl).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('has an export with a header block that carries the versions and every standing statement', () => {
    const csv = buildRegisterExportCsv({ report, referenceData, exportDate: '2026-10-09', standingStatements: STANDING_STATEMENTS });
    expect(csv.startsWith(`"Device","${report.model.name}"`)).toBe(true);
    for (const statement of STANDING_STATEMENTS) expect(csv).toContain(statement);
    expect(csv).toContain(referenceData.placementTable.version);
  });
});

describe('the print stylesheet', () => {
  const css = fs.readFileSync('src/components/threat-model/report/report-print.css', 'utf-8');
  const printBlock = css.slice(css.indexOf('@media print'));
  const declarations = (selectorPattern: RegExp): string => printBlock.match(selectorPattern)?.[1] ?? '';

  it('holds every rule inside the print block', () => {
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '').trim().startsWith('@media print')).toBe(true);
  });

  it('prints light from either theme: literal dark text on white, at 7:1 or better for headings', () => {
    const headingColour = declarations(/\.report :is\(h1, h2, h3, h4\)[^{]*\{([^}]*)\}/).match(/color:\s*(#[0-9a-f]{6})/i)?.[1] ?? '';
    const paper = declarations(/\.report, \.report-checklist \{([^}]*)\}/).match(/background:\s*(#[0-9a-f]{6})/i)?.[1] ?? '';
    expect(paper).toBe('#ffffff');
    expect(contrastRatio(parseColour(headingColour), parseColour(paper))).toBeGreaterThanOrEqual(7);
    for (const colour of printBlock.match(/#[0-9a-f]{6}/gi) ?? []) {
      // Every literal is either the paper, a hairline, or ink that reads on the paper.
      const ratio = contrastRatio(parseColour(colour), parseColour(paper));
      expect(colour === paper || colour === '#c7c7cc' || ratio >= 4.5, colour).toBe(true);
    }
    expect(printBlock).not.toMatch(/var\(--color-/);
    expect(printBlock).toContain('color-scheme: light');
  });

  it('never clips a table, repeats the head on every page and keeps a row together', () => {
    expect(declarations(/\.report-table-wrap \{([^}]*)\}/)).toContain('overflow: visible');
    expect(declarations(/\.report-table thead \{([^}]*)\}/)).toContain('display: table-header-group');
    expect(declarations(/\.report-table tr \{([^}]*)\}/)).toContain('break-inside: avoid');
    expect(declarations(/\.report-table :is\(th, td\) \{([^}]*)\}/)).toContain('white-space: normal');
    expect(declarations(/\.report-no-print, \.checklist-nav \{([^}]*)\}/)).toContain('display: none');
  });
});

describe('the files of Monitor, Query and the Report', () => {
  const directories = ['src/components/monitor', 'src/components/query', 'src/lib/signal', 'src/components/threat-model/report'];
  const singles = ['ReportView.tsx', 'RiskRegister.tsx', 'ChainList.tsx', 'ComplianceChecklist.tsx'].map((file) => path.join('src/components/threat-model', file));
  const list = (directory: string): string[] => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return list(entryPath);
    return /\.(ts|tsx|css)$/.test(entry.name) ? [entryPath] : [];
  });
  const files = [...directories.flatMap(list), ...singles].map((file) => ({ file, text: fs.readFileSync(file, 'utf-8') }));
  const shipped = files.filter(({ file }) => !file.includes('__tests__'));

  it('use the kit\'s tokens and classes: no old "tm-" class and no site colour token', () => {
    expect(shipped.length).toBeGreaterThan(30);
    expect(shipped.filter(({ text }) => /\btm-[a-z]/.test(text) || /--color-/.test(text)).map(({ file }) => file)).toEqual([]);
    const retiredAliases = /--lab-line-strong|--lab-radius\)|--lab-high|--motion-(quick|move|ease|flow|trace-step)|\blab-hatch\b/;
    expect(shipped.filter(({ text }) => retiredAliases.test(text)).map(({ file }) => file)).toEqual([]);
  });

  it('are each under 300 lines', () => {
    expect(files.filter(({ text }) => text.split('\n').length > 300).map(({ file }) => file)).toEqual([]);
  });

  it('never dim with opacity and set no type under 12px', () => {
    const styles = shipped.filter(({ file }) => file.endsWith('.css'));
    expect(styles.filter(({ text }) => /\bopacity\s*:/.test(text)).map(({ file }) => file)).toEqual([]);
    expect(styles.filter(({ text }) => /font-size:\s*(0\.[0-6]\d*rem|\d(\.\d+)?px|1[01](\.\d+)?px)/.test(text)).map(({ file }) => file)).toEqual([]);
  });
});

describe('the old chain card', () => {
  it('is imported nowhere under the Model\'s components', () => {
    const list = (directory: string): string[] => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return list(entryPath);
      return /\.(ts|tsx)$/.test(entry.name) ? [entryPath] : [];
    });
    const importers = list('src/components/threat-model').filter((file) => /from ['"][^'"]*AttackChainViz['"]/.test(fs.readFileSync(file, 'utf-8')));
    expect(importers).toEqual([]);
  });
});

describe('the print layout', () => {
  const css = fs.readFileSync('src/components/threat-model/report/report-print.css', 'utf-8');
  const printBlock = css.slice(css.indexOf('@media print'));
  const declarations = (selectorPattern: RegExp): string => printBlock.match(selectorPattern)?.[1] ?? '';

  it('lays the report, its sections, the checklist and the frame around them out as blocks, so no text is painted over other text at a page break', () => {
    const blockRule = printBlock.replace(/\/\*[\s\S]*?\*\//g, '').match(/([^{}]*)\{\s*display:\s*block;\s*\}/)?.[1] ?? '';
    const selectors = blockRule.split(',').map((selector) => selector.trim());
    for (const selector of ['.report', '.report-section', '.report-checklist', '.model-frame', '.model-results']) expect(selectors, selector).toContain(selector);
    // Nothing in the print block turns one of them back into a grid or a flex row.
    expect(printBlock).not.toMatch(/display:\s*(grid|flex|inline-grid|inline-flex)/);
    const screenCss = fs.readFileSync('src/components/threat-model/report/report.css', 'utf-8');
    for (const selector of ['.report', '.report-section', '.report-checklist']) {
      // The fault this guards: each of these is a grid on screen, so print must say otherwise.
      expect(screenCss, selector).toMatch(new RegExp(`\\${selector} \\{ display: grid;`));
    }
  });

  it('leaves the drawing off paper, where its labels would fall under the smallest type size, and says where to look', () => {
    expect(declarations(/\.report-diagram \{([^}]*)\}/)).toContain('display: none');
    expect(declarations(/\.report-print-block \{([^}]*)\}/)).toContain('display: block');
    expect(printBlock).not.toMatch(/\.report-diagram svg/);
    const { container } = renderDocument();
    const note = container.querySelector('.report-diagram + .report-print-block');
    expect(note?.textContent).toBe('The diagram is not printed. See the parts and connections tables.');
    // The tables the note points at are in the document, with every part and connection.
    expect(container.querySelectorAll('#report-system ~ * table, [aria-labelledby="report-system"] table').length).toBeGreaterThanOrEqual(2);
  });
});
