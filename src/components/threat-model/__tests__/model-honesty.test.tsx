// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import AttackChainViz from '@/components/atlas/AttackChainViz';
import { buildThreatModelReport } from '@/lib/threat-model/build-report';
import { CHECKLIST_TITLE, NOT_DETERMINED_STATEMENT, NOT_EVALUATED_STATEMENT } from '@/lib/threat-model/compliance-us';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import type { ThreatModelReport } from '@/lib/threat-model/report-types';
import { loadEngineBundle, loadReferenceData } from '@/lib/threat-model/__tests__/load-test-data';
import ChainList from '../ChainList';
import ComplianceChecklist from '../ComplianceChecklist';
import ReportView from '../ReportView';
import RiskRegister from '../RiskRegister';

afterEach(cleanup);

beforeAll(() => {
  // jsdom has no ResizeObserver; the chain diagram only uses it to choose its narrow layout.
  globalThis.ResizeObserver ??= class { observe(): void {} unobserve(): void {} disconnect(): void {} };
});

const bundle = loadEngineBundle();
const { engineData } = bundle;
const referenceData = loadReferenceData(bundle);
const stimulator = referenceData.archetypes[2];

function reportFor(overrides: Partial<DeviceModel> = {}): ThreatModelReport {
  const model = { ...buildModelFromIntake(defaultAnswersFor(stimulator), stimulator, engineData.registrarVersion), ...overrides };
  return buildThreatModelReport({ model, engineData, referenceData, generatedAt: '' });
}

const report = reportFor();
const [chain] = report.chainResult.chains;

describe('generated chains', () => {
  it('have at least one chain to show on the preset', () => {
    expect(chain).toBeDefined();
  });

  it('are drawn in the Lab without the graded lane and without a defenses box', () => {
    const { container } = render(<ChainList chainResult={report.chainResult} />);
    expect(container.textContent).not.toMatch(/DETECTABILITY|EASY|MODERATE|HARD|Defenses/);
    expect(screen.getAllByText('Generated hypothesis')).toHaveLength(report.chainResult.chains.length);
  });

  it('keep the graded lane on the public chain page, which passes no value', () => {
    const { container } = render(<AttackChainViz chain={chain} />);
    expect(container.textContent).toContain('DETECTABILITY');
    cleanup();
    expect(render(<AttackChainViz chain={chain} isDetectionLaneShown={false} />).container.textContent).not.toContain('DETECTABILITY');
  });
});

describe('ComplianceChecklist', () => {
  function renderChecklist(source: ThreatModelReport) {
    return render(<ComplianceChecklist assessment={source.cyberDeviceAssessment} items={source.complianceItems} />);
  }

  it('is headed by what it is, prints the file\'s own status sentence and says what it does not cover', () => {
    renderChecklist(report);
    expect(screen.getByRole('heading', { name: CHECKLIST_TITLE })).toBeTruthy();
    expect(CHECKLIST_TITLE).toBe('FDA premarket cybersecurity checklist');
    expect(screen.getByText(referenceData.compliance.status)).toBeTruthy();
    expect(screen.getByText(`Not covered here: anything outside the ${referenceData.compliance.sources.length} sources this list was built from.`)).toBeTruthy();
    const listed = screen.getAllByRole('listitem').map((item) => item.textContent);
    expect(listed).toEqual(referenceData.compliance.sources.map((source) => `${source.title}. Read ${source.dateRead}.`));
  });

  it('reads "Not evaluated. Choose a submission type." on every item until a type is chosen', () => {
    renderChecklist(report);
    expect(report.model.submissionType).toBe('none');
    expect(screen.getAllByText(NOT_EVALUATED_STATEMENT)).toHaveLength(report.complianceItems.length);
    expect(screen.queryByText('Not required here')).toBeNull();
    expect(screen.queryByText('Required by statute')).toBeNull();
  });

  it('says "not determined" and never "does not meet" when no listed connection carries anything', () => {
    const { container } = renderChecklist(reportFor({ submissionType: '510k', links: [] }));
    const card = screen.getByRole('heading', { name: 'Is this a cyber device?' }).parentElement as HTMLElement;
    expect(within(card).getByText('Not determined by this tool.')).toBeTruthy();
    expect(within(card).getByText(referenceData.compliance.internetCapableMediaQuote)).toBeTruthy();
    expect(container.textContent).toContain(NOT_DETERMINED_STATEMENT);
    expect(container.textContent).not.toMatch(/does not meet|Not required here/);
  });

  it('never says a device is compliant or complies, whatever the submission type', () => {
    for (const submissionType of ['none', '510k', 'ide'] as const) {
      const { container } = renderChecklist(reportFor({ submissionType }));
      expect(container.textContent).not.toMatch(/\bcompliant\b|\bcomplies\b/i);
      expect(container.textContent).toContain('It is not a compliance determination and not legal advice.');
      cleanup();
    }
  });
});

describe('the printed register and report', () => {
  it('heads the column as the catalog detection note and records no controls', () => {
    render(<RiskRegister rows={report.riskRows} />);
    expect(screen.getByRole('columnheader', { name: 'Detection note, from the catalog' })).toBeTruthy();
    expect(screen.getAllByText('Controls: none recorded for this row.')).toHaveLength(report.riskRows.length);
    expect(screen.queryByText(/Suggested controls|in place/)).toBeNull();
  });

  it('prints linked CVEs by id and product only, never their description', () => {
    const { container } = render(<ReportView report={report} regionNames={[]} />);
    expect(report.precedentCves.length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: '5. CVEs in other products' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: `6. ${CHECKLIST_TITLE}` })).toBeTruthy();
    for (const cve of report.precedentCves) {
      expect(container.textContent).toContain(cve.cveId);
      if (cve.description.length > 0) expect(container.textContent).not.toContain(cve.description);
    }
    expect(container.textContent).not.toMatch(/neuro-?surveillance|weaker evidence|Precedent vulnerabilities/i);
    expect(container.textContent).toMatch(/have no placement decision and are not assessed here\./);
  });
});
