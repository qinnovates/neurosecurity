import { describe, it, expect } from 'vitest';
import { TaraChainsFormatError, loadTaraChains, parseTaraChains } from '../atlas/load-tara-chains';

const KNOWN_IDS = new Set(['QIF-T0001']);

function buildChain(overrides: Record<string, unknown> = {}) {
  return {
    chain_id: 'CHAIN-TEST-001',
    chain_name: 'Test chain',
    objective: 'Exercise the parser',
    drift_profile: 'none',
    steps: [{ position: 1, technique_id: 'QIF-T0001', tara_alias: 'TARA-TEST-001', role: 'pivot', action: 'Act', detection_window: 'hard' }],
    defenses: ['Monitor'],
    ...overrides,
  };
}

describe('parseTaraChains', () => {
  it('returns well-formed chains unchanged', () => {
    const chain = buildChain();
    expect(parseTaraChains({ version: '1.0', chains: [chain] }, KNOWN_IDS)).toEqual([chain]);
  });

  it('accepts an empty catalog', () => {
    expect(parseTaraChains({ chains: [] }, KNOWN_IDS)).toEqual([]);
  });

  it.each([null, [], { chains: 'none' }, {}])('rejects a top level of %j', (raw) => {
    expect(() => parseTaraChains(raw, KNOWN_IDS)).toThrow(TaraChainsFormatError);
  });

  it('names the offending chain when a field is missing', () => {
    expect(() => parseTaraChains({ chains: [buildChain(), buildChain({ defenses: undefined })] }, KNOWN_IDS)).toThrow(/chains\[1\]/);
  });

  it('rejects a step whose role the diagram cannot draw', () => {
    const steps = [{ ...buildChain().steps[0], role: 'teleport' }];
    expect(() => parseTaraChains({ chains: [buildChain({ steps })] }, KNOWN_IDS)).toThrow(TaraChainsFormatError);
  });

  it.each(['constructor', 'toString', '__proto__'])('rejects the inherited key %s as a role', (role) => {
    const steps = [{ ...buildChain().steps[0], role }];
    expect(() => parseTaraChains({ chains: [buildChain({ steps })] }, KNOWN_IDS)).toThrow(TaraChainsFormatError);
  });

  it('rejects a malformed clinical parallel and accepts a well-formed one', () => {
    expect(() => parseTaraChains({ chains: [buildChain({ clinical_parallel: 'calibration' })] }, KNOWN_IDS)).toThrow(TaraChainsFormatError);
    const chain = buildChain({ clinical_parallel: { name: 'Calibration', note: 'Routine' } });
    expect(parseTaraChains({ chains: [chain] }, KNOWN_IDS)).toEqual([chain]);
  });

  it('rejects a step whose technique is not in the catalog, naming it', () => {
    expect(() => parseTaraChains({ chains: [buildChain()] }, new Set(['QIF-T9999']))).toThrow(/QIF-T0001/);
  });
});

describe('parseTaraChains evidence field', () => {
  const chainEvidence = { overall_label: 'projected', rationale: 'Objective step is theoretical.' };

  it('accepts a chain and a step with no evidence block', () => {
    const chain = buildChain();
    expect(parseTaraChains({ chains: [chain] }, KNOWN_IDS)).toEqual([chain]);
  });

  it('accepts a well-formed chain evidence block, with and without the optional fields', () => {
    for (const evidence of [
      chainEvidence,
      { ...chainEvidence, device_class: 'Implanted stimulator' },
      { ...chainEvidence, extrapolation: 'Generalised from cardiac telemetry CVEs.' },
    ]) {
      const chain = buildChain({ evidence });
      expect(parseTaraChains({ chains: [chain] }, KNOWN_IDS)).toEqual([chain]);
    }
  });

  it('accepts a well-formed step evidence block', () => {
    const steps = [{ ...buildChain().steps[0], evidence: { label: 'demonstrated', note: 'CVE resolved at NVD.', source_url: 'https://nvd.nist.gov/vuln/detail/CVE-2019-6538' } }];
    const chain = buildChain({ steps });
    expect(parseTaraChains({ chains: [chain] }, KNOWN_IDS)).toEqual([chain]);
  });

  it.each([
    ['a label the page cannot draw', { overall_label: 'confirmed', rationale: 'x' }],
    ['a missing rationale', { overall_label: 'projected' }],
    ['a non-string rationale', { overall_label: 'projected', rationale: 7 }],
    ['a non-string device_class', { overall_label: 'projected', rationale: 'x', device_class: 7 }],
    ['a non-string extrapolation', { overall_label: 'projected', rationale: 'x', extrapolation: true }],
    ['a non-object block', 'projected'],
  ])('rejects chain evidence with %s', (_name, evidence) => {
    expect(() => parseTaraChains({ chains: [buildChain({ evidence })] }, KNOWN_IDS)).toThrow(TaraChainsFormatError);
  });

  it.each([
    ['a label the page cannot draw', { label: 'maybe', note: 'x' }],
    ['a missing note', { label: 'projected' }],
    ['a non-string source_url', { label: 'projected', note: 'x', source_url: 7 }],
    ['a non-object block', 'projected'],
  ])('rejects step evidence with %s', (_name, evidence) => {
    const steps = [{ ...buildChain().steps[0], evidence }];
    expect(() => parseTaraChains({ chains: [buildChain({ steps })] }, KNOWN_IDS)).toThrow(TaraChainsFormatError);
  });

  it.each(['constructor', 'toString', '__proto__'])('rejects the inherited key %s as an evidence label', (label) => {
    const steps = [{ ...buildChain().steps[0], evidence: { label, note: 'x' } }];
    expect(() => parseTaraChains({ chains: [buildChain({ steps })] }, KNOWN_IDS)).toThrow(TaraChainsFormatError);
  });
});

describe('committed catalog', () => {
  it('labels every step of every chain that carries chain-level evidence', () => {
    for (const chain of loadTaraChains()) {
      if (!chain.evidence) continue;
      for (const step of chain.steps) {
        expect(step.evidence, `${chain.chain_id} step ${step.position}`).toBeDefined();
      }
    }
  });

  it('labels no chain "demonstrated", since no cited incident reports a composed chain', () => {
    for (const chain of loadTaraChains()) {
      expect(chain.evidence?.overall_label).not.toBe('demonstrated');
    }
  });
});

describe('loadTaraChains', () => {
  it('loads the committed catalog', () => {
    expect(loadTaraChains().length).toBeGreaterThan(0);
  });
});
