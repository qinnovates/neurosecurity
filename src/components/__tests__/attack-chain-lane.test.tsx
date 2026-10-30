// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import AttackChainViz from '@/components/atlas/AttackChainViz';
import { DOMAIN_COLORS, ON_FILL_INK, extractDomain } from '@/components/atlas/chain-constants';
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

  it('writes each step\'s domain in words, in the on-fill ink and not in the domain\'s colour', () => {
    const { container } = render(<AttackChainViz chain={chain} />);
    const labels = [...container.querySelectorAll<SVGTextElement>('text[data-step-domain]')];
    expect(labels).toHaveLength(chain.steps.length);
    for (const [index, label] of labels.entries()) {
      const domain = extractDomain(chain.steps[index].tara_alias) ?? 'SIL';
      expect(label.getAttribute('data-step-domain')).toBe(domain);
      expect(label.textContent).toBe(DOMAIN_COLORS[domain].label);
      expect(label.getAttribute('fill')).toBe(ON_FILL_INK);
    }
    // Nothing written on a node is set in a domain's stroke colour any more.
    const strokes = new Set(Object.values(DOMAIN_COLORS).map((style) => style.stroke));
    for (const text of container.querySelectorAll('text')) expect(strokes.has(text.getAttribute('fill') ?? '')).toBe(false);
  });
});
