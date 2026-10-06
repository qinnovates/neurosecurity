import { describe, it, expect } from 'vitest';
import { SIGNAL_BENCH_TECHNIQUES, buildSignalBenchEvents } from '../signal-bench/signal-bench-events';

function buildCatalog(ids: readonly string[]) {
  return ids.map((id, position) => ({
    id,
    name: `Technique ${position}`,
    status: 'THEORETICAL' as const,
    niss: { version: '1.1', vector: '', score: position + 0.5, severity: 'medium' as const, pins: false },
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

  it('maps each class to a distinct technique', () => {
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});
