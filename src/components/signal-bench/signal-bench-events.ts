import { QIF_LAYERS, QIF_LAYER_SEAM, type BandId } from '../../lib/qif-constants';
import type { ThreatVector } from '../../lib/threat-data';
import type { SignalEventKind } from './signal-model';

/**
 * Where a technique sits on the public layers. Resolved at build so the island
 * never imports qif-constants, which carries the registrar and the atlas.
 */
export type SignalBenchPlacement =
  | { kind: 'neural'; bandId: BandId; layerName: string; alsoTagged: string[] }
  | { kind: 'classical'; alsoTagged: string[] }
  | { kind: 'seam'; alsoTagged: string[] };

export interface SignalBenchEvent {
  kind: SignalEventKind;
  id: string;
  name: string;
  status: string;
  nissScore: number;
  severity: string;
  placement: SignalBenchPlacement;
}

type CatalogTechnique = Pick<ThreatVector, 'id' | 'name' | 'status' | 'niss' | 'bands'>;

/** Which catalog entry each animated interference class is labelled with. */
export const SIGNAL_BENCH_TECHNIQUES: readonly { kind: SignalEventKind; id: string }[] = [
  { kind: 'inject', id: 'QIF-T0001' },
  { kind: 'intercept', id: 'QIF-T0003' },
  { kind: 'jam', id: 'QIF-T0025' },
  { kind: 'replay', id: 'QIF-T0107' },
  { kind: 'spoof', id: 'QIF-T0104' },
];

const CLASSICAL_LABEL = 'the classical stack';
const SEAM_LABEL = 'the seam';

/**
 * A view brackets one band, so a technique across several neural layers
 * brackets the first in public order and names the rest in `alsoTagged`.
 */
export function resolvePlacement(techniqueId: string, bandIds: readonly BandId[]): SignalBenchPlacement {
  const taggedLayers = QIF_LAYERS.filter((layer) => layer.band_ids.some((bandId) => bandIds.includes(bandId)));
  const neuralLayers = taggedLayers.filter((layer) => layer.zone === 'neural');
  const hasClassical = taggedLayers.length > neuralLayers.length;
  const hasSeam = QIF_LAYER_SEAM.band_ids.some((bandId) => bandIds.includes(bandId));
  const [primaryLayer, ...otherLayers] = neuralLayers;
  if (primaryLayer) {
    const alsoTagged = [...otherLayers.map((layer) => layer.name), ...(hasClassical ? [CLASSICAL_LABEL] : []), ...(hasSeam ? [SEAM_LABEL] : [])];
    return { kind: 'neural', bandId: primaryLayer.band_ids[0], layerName: primaryLayer.name, alsoTagged };
  }
  if (hasClassical) return { kind: 'classical', alsoTagged: hasSeam ? [SEAM_LABEL] : [] };
  if (hasSeam) return { kind: 'seam', alsoTagged: [] };
  throw new Error(`Signal bench: technique ${techniqueId} tags no known band. Fix its band_ids in datalake/qtara-registrar.json.`);
}

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
      placement: resolvePlacement(id, technique.bands),
    };
  });
}
