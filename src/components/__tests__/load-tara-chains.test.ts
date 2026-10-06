import { describe, it, expect } from 'vitest';
import { TaraChainsFormatError, loadTaraChains, parseTaraChains } from '../atlas/load-tara-chains';

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
    expect(parseTaraChains({ version: '1.0', chains: [chain] })).toEqual([chain]);
  });

  it('accepts an empty catalog', () => {
    expect(parseTaraChains({ chains: [] })).toEqual([]);
  });

  it.each([null, [], { chains: 'none' }, {}])('rejects a top level of %j', (raw) => {
    expect(() => parseTaraChains(raw)).toThrow(TaraChainsFormatError);
  });

  it('names the offending chain when a field is missing', () => {
    expect(() => parseTaraChains({ chains: [buildChain(), buildChain({ defenses: undefined })] })).toThrow(/chains\[1\]/);
  });

  it('rejects a step whose role the diagram cannot draw', () => {
    const steps = [{ ...buildChain().steps[0], role: 'teleport' }];
    expect(() => parseTaraChains({ chains: [buildChain({ steps })] })).toThrow(TaraChainsFormatError);
  });
});

describe('loadTaraChains', () => {
  it('loads the committed catalog', () => {
    expect(loadTaraChains().length).toBeGreaterThan(0);
  });
});
