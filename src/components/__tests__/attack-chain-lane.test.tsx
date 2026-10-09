// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import AttackChainViz from '@/components/atlas/AttackChainViz';
import { buildThreatModelReport } from '@/lib/threat-model/build-report';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import { loadEngineBundle, loadReferenceData } from '@/lib/threat-model/__tests__/load-test-data';

afterEach(cleanup);

beforeAll(() => {
  // jsdom has no ResizeObserver; the chain diagram only uses it to choose its narrow layout.
  globalThis.ResizeObserver ??= class { observe(): void {} unobserve(): void {} disconnect(): void {} };
});

const bundle = loadEngineBundle();
const referenceData = loadReferenceData(bundle);
const archetype = referenceData.archetypes[2];
const model = buildModelFromIntake(defaultAnswersFor(archetype), archetype, bundle.engineData.registrarVersion);
const [chain] = buildThreatModelReport({ model, engineData: bundle.engineData, referenceData, generatedAt: '' }).chainResult.chains;

/** The public chain page keeps its card. The Lab no longer draws chains with it; see the report's own tests. */
describe('the public chain card', () => {
  it('keeps the graded lane where no value is passed, and drops it when asked', () => {
    expect(chain).toBeDefined();
    expect(render(<AttackChainViz chain={chain} />).container.textContent).toContain('DETECTABILITY');
    cleanup();
    expect(render(<AttackChainViz chain={chain} isDetectionLaneShown={false} />).container.textContent).not.toContain('DETECTABILITY');
  });
});
