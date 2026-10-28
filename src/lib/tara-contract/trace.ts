/**
 * Per-step chain-trace endpoint resolution (G6 §5.20.2, rev 8). Pure: given
 * one chain step and its technique's band tags and lit region links, decides
 * whether the trace head for that step is a region, an address envelope, a
 * device interface, or the signal rail — never a guessed coordinate.
 *
 * Rule 3 (entry) is the rev 8 correction this module exists to carry: every
 * `I0` step defaults to a position-free device-interface badge
 * (`source: 'unresolved'`). The branch's chain and device-geometry data carry
 * no `chain_device_class` and no `lead_trajectories` row today (verified
 * against datalake/tara-chains.json and datalake/qif-anatomy-device-geometry.json
 * this session), so nothing here ever promotes a chain to a scalp or ear
 * coordinate on its own — that only happens once a caller supplies one
 * through `resolveEntrySource`, which this module never invents.
 */

import {
  BAND_ORDER, type BandId,
} from '@/lib/threat-model/catalog-types';
import { NO_ANCHORS_BUILT, type AnchorLookup, type ChainTrace, type TraceEndpoint, type TraceStep, type TraceTechnique, type TraceWaypoint } from './types';

/** N2–N7 have a computed address envelope today; N1 does not (G6 §5.5.8 — no spinal mesh yet, §15). */
export const DEFAULT_ENVELOPE_ADDRESSES: readonly BandId[] = ['N2', 'N3', 'N4', 'N5', 'N6', 'N7'];

/** S1 is nearest the interface, S3 farthest (G6 §5.20.2 rule 4). */
const S_BANDS_NEAREST_FIRST: readonly BandId[] = ['S1', 'S2', 'S3'];
const N_BANDS = new Set<string>(BAND_ORDER.filter((band) => band.startsWith('N')));

export interface ResolveTraceEndpointOptions {
  /** Regions whose anchor state is actually known. Defaults to "none built" (honest today: §5.19 R2–R11 have not shipped). */
  anchors?: AnchorLookup;
  /** The step's declared N-addresses that already have a computed envelope. Defaults to N2–N7. */
  envelopeAddresses?: ReadonlySet<BandId>;
}

/** G6 §5.20.2 rule 1: a region endpoint needs a lit link AND a built anchor for that region. Neither exists without both. */
function resolveRegion(technique: TraceTechnique, anchors: AnchorLookup): TraceEndpoint | null {
  const anchored = technique.litRegionIds
    .map((regionId) => ({ regionId, state: anchors.stateFor(regionId) }))
    .filter((entry): entry is { regionId: string; state: NonNullable<ReturnType<AnchorLookup['stateFor']>> } => entry.state !== null);
  if (anchored.length === 0) return null;
  // Worst-placed anchor among the fan-out wins the step's tier (G6 §5.20.2 rule 1: verified > drafted > provisional).
  const order = { verified: 0, drafted: 1, provisional: 2 } as const;
  const tier = anchored.reduce((worst, entry) => (order[entry.state] > order[worst] ? entry.state : worst), anchored[0].state);
  return { kind: 'region', regionIds: anchored.map((entry) => entry.regionId), tier };
}

/** G6 §5.20.2 rule 2: no `chain_device_class` data exists yet, so every envelope hop fans out; none is a primary. */
function resolveEnvelope(technique: TraceTechnique, envelopeAddresses: ReadonlySet<BandId>): TraceEndpoint | null {
  const addresses = technique.bandIds.filter((band) => N_BANDS.has(band) && envelopeAddresses.has(band));
  if (addresses.length === 0) return null;
  return { kind: 'envelope', addresses, primaryAddress: null };
}

/** G6 §5.20.2 rule 3 (rev 8): the default for every I0 step is a position-free device-interface badge. */
function resolveEntry(technique: TraceTechnique): TraceEndpoint | null {
  if (!technique.bandIds.includes('I0')) return null;
  return { kind: 'entry', source: 'unresolved', tier: 'schematic' };
}

/** G6 §5.20.2 rule 4: the rail address is whichever S-tag sits nearest the interface. */
function resolveRail(technique: TraceTechnique): TraceEndpoint | null {
  const addresses = S_BANDS_NEAREST_FIRST.filter((band) => technique.bandIds.includes(band));
  if (addresses.length === 0) return null;
  return { kind: 'rail', address: addresses[0], addresses };
}

/**
 * Resolves one step's endpoint. Order follows G6 §5.20.2: region, then
 * envelope, then device interface, then rail; a step with none of the four
 * (no neural or signal band at all) is `none`.
 */
export function resolveTraceEndpoint(technique: TraceTechnique | undefined, options: ResolveTraceEndpointOptions = {}): TraceEndpoint {
  if (technique === undefined) return { kind: 'none', reason: 'no registrar entry for this step\'s technique' };
  const anchors = options.anchors ?? NO_ANCHORS_BUILT;
  const envelopeAddresses = options.envelopeAddresses ?? new Set(DEFAULT_ENVELOPE_ADDRESSES);
  const endpoint = resolveRegion(technique, anchors) ?? resolveEnvelope(technique, envelopeAddresses) ?? resolveEntry(technique) ?? resolveRail(technique);
  if (endpoint !== null) return endpoint;
  const hasUnaddressableNTag = technique.bandIds.some((band) => N_BANDS.has(band));
  return {
    kind: 'none',
    reason: hasUnaddressableNTag
      ? 'every N-tag on this step is outside the addresses with a computed envelope (N1, pending §15)'
      : 'this technique carries no signal, interface or neural band tag',
  };
}

const isOffCanvas = (endpoint: TraceEndpoint | null): boolean => endpoint === null || endpoint.kind === 'rail';
const isOnCanvas = (endpoint: TraceEndpoint): boolean => endpoint.kind === 'region' || endpoint.kind === 'envelope';

/**
 * The waypoint between consecutive steps (G6 §5.20.2 rule 5). Entering
 * tissue — whether because this step has an `I0` tag or simply because the
 * previous step was off-canvas — passes through the device interface. Only
 * leaving tissue for the rail is drawn as an edge hand-off.
 */
function resolveWaypoints(previous: TraceEndpoint | null, current: TraceEndpoint, hasInterfaceTag: boolean): readonly TraceWaypoint[] {
  if (previous === null) return []; // the first step has no preceding hop to draw a waypoint on
  if (isOnCanvas(current) && (hasInterfaceTag || isOffCanvas(previous))) return [{ kind: 'entry' }];
  if (current.kind === 'rail' && previous !== null && isOnCanvas(previous)) return [{ kind: 'edge', side: 'bottom' }];
  return [];
}

/** Builds a chain's full trace from its steps and the techniques they name. `railOnly` is G6 §5.20.9 (CHAIN-RBCI-001 today). */
export function buildChainTrace(
  chainId: string,
  steps: ReadonlyArray<{ position: number; techniqueId: string }>,
  techniquesById: ReadonlyMap<string, TraceTechnique>,
  options: ResolveTraceEndpointOptions = {},
): ChainTrace {
  let previousEndpoint: TraceEndpoint | null = null;
  const traceSteps: TraceStep[] = steps.map((step) => {
    const technique = techniquesById.get(step.techniqueId);
    const endpoint = resolveTraceEndpoint(technique, options);
    const via = resolveWaypoints(previousEndpoint, endpoint, technique?.bandIds.includes('I0') ?? false);
    previousEndpoint = endpoint;
    return { position: step.position, techniqueId: step.techniqueId, endpoint, via };
  });
  return { chainId, steps: traceSteps, railOnly: traceSteps.every((step) => step.endpoint.kind === 'rail') };
}
