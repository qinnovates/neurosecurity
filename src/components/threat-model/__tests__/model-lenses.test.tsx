// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { buildThreatModelReport } from '@/lib/threat-model/build-report';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import { EMPTY_LENS, countOpenRisks, type Lens } from '@/lib/threat-model/lens';
import { THREAT_GOALS, type ThreatModelReport } from '@/lib/threat-model/report-types';
import { countOpenRisksByElement } from '@/lib/threat-model/risk-register';
import { loadEngineBundle, loadReferenceData } from '@/lib/threat-model/__tests__/load-test-data';
import LensBar, { isGoalNotAssessed } from '../LensBar';
import PartStrip from '../PartStrip';

afterEach(cleanup);

const bundle = loadEngineBundle();
const { engineData } = bundle;
const referenceData = loadReferenceData(bundle);

function reportFor(index: number): ThreatModelReport {
  const archetype = referenceData.archetypes[index];
  const model = buildModelFromIntake(defaultAnswersFor(archetype), archetype, engineData.registrarVersion);
  return buildThreatModelReport({ model, engineData, referenceData, generatedAt: '' });
}

describe('isGoalNotAssessed', () => {
  it('is true only for a zero across the whole device where the placement table is incomplete', () => {
    for (let index = 0; index < referenceData.archetypes.length; index += 1) {
      const report = reportFor(index);
      const counts = countOpenRisks(report.riskRows, EMPTY_LENS, report.model.controlsInPlace);
      for (const goal of THREAT_GOALS) {
        const coverage = report.goalCoverage[goal];
        const expected = counts.byGoal[goal] === 0 && coverage.placedTechniques < coverage.catalogTechniques;
        expect(isGoalNotAssessed(goal, EMPTY_LENS, counts, report.goalCoverage)).toBe(expected);
      }
    }
  });

  it('treats a zero as a real count once the view is narrowed to a part', () => {
    const report = reportFor(0);
    const lens: Lens = { ...EMPTY_LENS, elementId: report.model.components[0].id };
    const counts = countOpenRisks(report.riskRows, lens, report.model.controlsInPlace);
    for (const goal of THREAT_GOALS) expect(isGoalNotAssessed(goal, lens, counts, report.goalCoverage)).toBe(false);
  });
});

describe('LensBar', () => {
  it('shows a count on every lens, or says "not assessed", and never a bare zero for an unassessed goal', () => {
    const report = reportFor(0);
    const counts = countOpenRisks(report.riskRows, EMPTY_LENS, report.model.controlsInPlace);
    render(<LensBar lens={EMPTY_LENS} counts={counts} goalCoverage={report.goalCoverage} selectedElementLabel={null} onChange={() => undefined} />);
    for (const goal of THREAT_GOALS) {
      const label = { read: 'Read', change: 'Change', deny: 'Deny' }[goal];
      const expected = isGoalNotAssessed(goal, EMPTY_LENS, counts, report.goalCoverage) ? `${label} not assessed` : `${label} ${counts.byGoal[goal]}`;
      expect(screen.getByRole('button', { name: expected })).toBeTruthy();
    }
    expect(screen.queryByRole('button', { name: 'Show everything' })).toBeNull();
  });

  it('adds a goal to the lens when its chip is pressed', () => {
    const report = reportFor(0);
    const counts = countOpenRisks(report.riskRows, EMPTY_LENS, report.model.controlsInPlace);
    const onChange = vi.fn();
    render(<LensBar lens={EMPTY_LENS} counts={counts} goalCoverage={report.goalCoverage} selectedElementLabel={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: `Read ${counts.byGoal.read}` }));
    expect(onChange).toHaveBeenCalledWith({ elementId: null, entryPaths: [], goals: ['read'] });
  });
});

describe('PartStrip', () => {
  it('lists every part with its open risks and selects one on press', () => {
    const report = reportFor(1);
    const { model } = report;
    const counts = countOpenRisksByElement(report.riskRows, model.controlsInPlace);
    const onLensChange = vi.fn();
    render(<PartStrip model={model} lens={EMPTY_LENS} openRiskCounts={counts} onLensChange={onLensChange} />);
    for (const component of model.components) {
      expect(screen.getByRole('button', { name: `${component.label} ${counts.get(component.id) ?? 0}` })).toBeTruthy();
    }
    const first = model.components[0];
    fireEvent.click(screen.getByRole('button', { name: `${first.label} ${counts.get(first.id) ?? 0}` }));
    expect(onLensChange).toHaveBeenCalledWith({ ...EMPTY_LENS, elementId: first.id });
  });
});
