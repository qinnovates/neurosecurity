import { describe, it, expect } from 'vitest';
import { SIGNAL_BENCH_TECHNIQUES, buildSignalBenchEvents, resolvePlacement } from '../signal-bench/signal-bench-events';

function buildCatalog(ids: readonly string[]) {
  return ids.map((id, position) => ({
    id,
    name: `Technique ${position}`,
    status: 'THEORETICAL' as const,
    bands: ['I0', 'N1'] as ('I0' | 'N1')[],
    niss: { version: '1.1', vector: '', score: position + 0.5, severity: 'medium' as const, pins: false, scoring_state: 'scored' as const },
  }));
}

describe('buildSignalBenchEvents', () => {
  const allIds = SIGNAL_BENCH_TECHNIQUES.map((technique) => technique.id);

  it('labels every interference class from the catalog entry with the same ID', () => {
    const events = buildSignalBenchEvents(buildCatalog(allIds));
    expect(events.map((event) => event.kind)).toEqual(SIGNAL_BENCH_TECHNIQUES.map((technique) => technique.kind));
    expect(events[1]).toMatchObject({ id: allIds[1], name: 'Technique 1', nissScore: 1.5, severity: 'medium', status: 'THEORETICAL' });
  });

  it('fails loudly when a referenced technique leaves the catalog', () => {
    expect(() => buildSignalBenchEvents(buildCatalog(allIds.slice(1)))).toThrow(allIds[0]);
  });

  it('brackets the first neural layer in public order and names what else is tagged', () => {
    expect(resolvePlacement('QIF-T0025', ['I0', 'N2', 'N7'])).toEqual({ kind: 'neural', bandId: 'N7', layerName: 'Neocortex', alsoTagged: ['Brainstem', 'the seam'] });
    expect(resolvePlacement('QIF-T0003', ['I0', 'N1', 'S1', 'S2'])).toMatchObject({ kind: 'neural', bandId: 'N1', alsoTagged: ['the classical stack', 'the seam'] });
  });

  it('brackets nothing for a classical-only or seam-only technique', () => {
    expect(resolvePlacement('QIF-T9001', ['S1', 'S3'])).toEqual({ kind: 'classical', alsoTagged: [] });
    expect(resolvePlacement('QIF-T9002', ['I0', 'S2'])).toEqual({ kind: 'classical', alsoTagged: ['the seam'] });
    expect(resolvePlacement('QIF-T9003', ['I0'])).toEqual({ kind: 'seam', alsoTagged: [] });
  });

  it('fails the build for a technique with no band', () => {
    expect(() => resolvePlacement('QIF-T9004', [])).toThrow('QIF-T9004');
  });

  it('maps each class to a distinct technique', () => {
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});
