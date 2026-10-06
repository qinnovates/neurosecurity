import type { ThreatVector } from '../../lib/threat-data';
import type { SignalEventKind } from './signal-model';

export interface SignalBenchEvent {
  kind: SignalEventKind;
  id: string;
  name: string;
  status: string;
  nissScore: number;
  severity: string;
}

type CatalogTechnique = Pick<ThreatVector, 'id' | 'name' | 'status' | 'niss'>;

/** Which catalog entry each animated interference class is labelled with. */
export const SIGNAL_BENCH_TECHNIQUES: readonly { kind: SignalEventKind; id: string }[] = [
  { kind: 'inject', id: 'QIF-T0001' },
  { kind: 'intercept', id: 'QIF-T0003' },
  { kind: 'jam', id: 'QIF-T0025' },
  { kind: 'replay', id: 'QIF-T0107' },
  { kind: 'spoof', id: 'QIF-T0104' },
];

/**
 * Resolves the bench's labels from the catalog at build time so names, status
 * and NISS scores cannot drift from the registrar. A missing ID fails the build.
 */
export function buildSignalBenchEvents(catalog: readonly CatalogTechnique[]): SignalBenchEvent[] {
  return SIGNAL_BENCH_TECHNIQUES.map(({ kind, id }) => {
    const technique = catalog.find((candidate) => candidate.id === id);
    if (!technique) {
      throw new Error(
        `Signal bench: technique ${id} is not in the TARA catalog. Update SIGNAL_BENCH_TECHNIQUES in src/components/signal-bench/signal-bench-events.ts.`,
      );
    }
    return {
      kind,
      id,
      name: technique.name,
      status: technique.status,
      nissScore: technique.niss.score,
      severity: technique.niss.severity,
    };
  });
}
