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

describe('loadTaraChains', () => {
  it('loads the committed catalog', () => {
    expect(loadTaraChains().length).toBeGreaterThan(0);
  });
});
