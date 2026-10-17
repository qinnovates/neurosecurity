// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { buildThreatModelReport } from '@/lib/threat-model/build-report';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import { EMPTY_LENS } from '@/lib/threat-model/lens';
import type { ThreatModelReport } from '@/lib/threat-model/report-types';
import { countOpenRisksByElement } from '@/lib/threat-model/risk-register';
import { loadEngineBundle, loadReferenceData } from '@/lib/threat-model/__tests__/load-test-data';
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

// The facet bar that replaced the lens bar is tested beside it, in frame/__tests__/ModelFacets.test.tsx.
describe('PartStrip', () => {
  it('lists every part with its open risks and selects one on press', () => {
    const report = reportFor(1);
    const { model } = report;
    const counts = countOpenRisksByElement(report.riskRows);
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
