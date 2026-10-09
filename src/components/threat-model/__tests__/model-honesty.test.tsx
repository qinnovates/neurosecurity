// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { buildThreatModelReport } from '@/lib/threat-model/build-report';
import { CHECKLIST_TITLE, NOT_DETERMINED_STATEMENT, NOT_EVALUATED_STATEMENT } from '@/lib/threat-model/compliance-us';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { describeEvidence } from '@/lib/threat-model/evidence-levels';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import { listOrphanDecisions } from '@/lib/threat-model/orphan-decisions';
import type { ThreatModelReport } from '@/lib/threat-model/report-types';
import { loadEngineBundle, loadReferenceData } from '@/lib/threat-model/__tests__/load-test-data';
import ChainList from '../ChainList';
import ComplianceChecklist from '../ComplianceChecklist';
import RiskRegister from '../RiskRegister';
import { RISK_STATUS_LABELS } from '../risk-status-labels';

afterEach(cleanup);

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

  it('are plain numbered step lists, each labelled a hypothesis, with no graded lane and no defenses box', () => {
    const { container } = render(<ChainList model={report.model} chainResult={report.chainResult} />);
    expect(container.textContent).not.toMatch(/DETECTABILITY|EASY|MODERATE|HARD|Defenses|SILICON|BIOLOGICAL/);
    expect(screen.getAllByText('Generated hypothesis')).toHaveLength(report.chainResult.chains.length);
    const lists = container.querySelectorAll('ol.lab-steps');
    expect(lists).toHaveLength(report.chainResult.chains.length);
    expect(lists[0].querySelectorAll(':scope > li')).toHaveLength(chain.steps.length);
    expect([...lists[0].querySelectorAll('.lab-step-number')].map((number) => number.textContent)).toEqual(chain.steps.map((step) => String(step.position)));
    expect(container.textContent).toContain('Every chain is a hypothesis for review');
  });

  it('use one ID scheme, say why each step follows the last, and word evidence by tier', () => {
    const { container } = render(<ChainList model={report.model} chainResult={{ ...report.chainResult, chains: [chain] }} />);
    for (const step of chain.steps) {
      expect(container.textContent).toContain(step.technique_id);
      if (step.tara_alias !== step.technique_id) expect(container.textContent).not.toContain(step.tara_alias);
    }
    expect(container.querySelectorAll('.lab-step-reason')).toHaveLength(chain.edges.length);
    expect(container.textContent).not.toMatch(/\b(CONFIRMED|DEMONSTRATED|EMERGING|THEORETICAL)\b/);
    expect(container.textContent).toContain(describeEvidence({ evidenceTier: chain.weakestEvidenceTier, evidenceStatus: chain.weakestEvidenceStatus }).label);
    expect(container.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('say when the list is the first few of those found', () => {
    render(<ChainList model={report.model} chainResult={{ ...report.chainResult, wasCapped: true, chainsFound: report.chainResult.chains.length + 7 }} />);
    expect(screen.getByText(`Showing the first ${report.chainResult.chains.length} of ${report.chainResult.chains.length + 7} chains found.`)).toBeTruthy();
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
    const listed = [...document.querySelectorAll('.checklist-intro .report-list li')].map((item) => item.textContent);
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

  it('links a source only by a secure address and always prints the address for paper', () => {
    const { container } = renderChecklist(reportFor({ submissionType: '510k' }));
    const links = [...container.querySelectorAll('a')];
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute('href')).toMatch(/^https:\/\//);
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    }
    expect(container.querySelectorAll('.report-print-only')).toHaveLength(report.complianceItems.length);
  });
});

describe('the printed register', () => {
  it('prints one line per row under the seven columns, with evidence in the tier\'s words', () => {
    const { container } = render(<RiskRegister rows={report.riskRows} />);
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Threat', 'ID', 'Part', 'Catalog severity', 'Evidence', 'Decision', 'Note']);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(report.riskRows.length);
    const catalogRow = report.riskRows.find((row) => row.source === 'catalog');
    expect(catalogRow).toBeDefined();
    expect(container.textContent).toContain(describeEvidence(catalogRow as NonNullable<typeof catalogRow>).shortLabel);
    expect(container.textContent).not.toMatch(/\b(CONFIRMED|DEMONSTRATED|EMERGING|THEORETICAL)\b|Suggested controls|in place/);
    expect(screen.getByText(`${report.riskRows.length} rows: ${report.riskRows.filter((row) => row.source === 'catalog').length} from the technique catalog, ${report.riskRows.filter((row) => row.source === 'stride').length} from the generic baseline`)).toBeTruthy();
  });

  it('prints each decision and its note on the row it was recorded on', () => {
    const [target] = report.riskRows;
    const decided = reportFor({ riskDecisions: [{ riskId: target.riskId, status: 'accepted', note: 'Covered by the enclosure.' }] });
    render(<RiskRegister rows={decided.riskRows} />);
    const row = screen.getByText('Covered by the enclosure.').closest('tr') as HTMLElement;
    expect(within(row).getByText(RISK_STATUS_LABELS.accepted)).toBeTruthy();
    expect(screen.getAllByText(RISK_STATUS_LABELS.open)).toHaveLength(decided.riskRows.length - 1);
  });

  it('lists a decision that no longer has a row, with the reason, and keeps it out of the register rows', () => {
    const orphanId = `no-such-part::${report.riskRows.find((row) => row.techniqueId !== null)?.techniqueId}`;
    const decided = reportFor({ riskDecisions: [{ riskId: orphanId, status: 'mitigated', note: 'Old note.' }] });
    const orphans = listOrphanDecisions(decided.model, decided);
    expect(orphans).toHaveLength(1);
    render(<RiskRegister rows={decided.riskRows} orphanDecisions={orphans} />);
    expect(screen.getByRole('heading', { name: 'Decisions without a row: 1' })).toBeTruthy();
    expect(screen.getByText(orphans[0].detail)).toBeTruthy();
    expect(screen.getByText('Old note.')).toBeTruthy();
  });
});
