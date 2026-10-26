/**
 * The TARA chain-trace data contract (G6 §6.2, §5.20.2). These types describe
 * where one chain step's trace head is allowed to go — region, address
 * envelope, device interface or the signal rail — without claiming the
 * rendering layer (the WebGL ribbon in `packages/brain`, not yet extracted
 * from this branch) exists. `resolveTraceEndpoint` in `./trace.ts` is the
 * pure function that fills these from the registrar and chain data.
 */

import type { BandId } from '@/lib/threat-model/catalog-types';

export type { BandId };

/** G6 §5.17: one vocabulary for how placed a region, an envelope, an entry point or a step's region hop reads to a viewer. */
export const PLACEMENT_TIERS = ['verified', 'drafted', 'provisional', 'schematic', 'none'] as const;
export type PlacementTier = typeof PLACEMENT_TIERS[number];

/** PlacementTier without 'schematic' and 'none': the states a built anchor can actually hold (G6 §6.2 `AnchorState`). */
export type AnchorState = Exclude<PlacementTier, 'schematic' | 'none'>;

/**
 * Looks up a region's anchor placement. Returns `null` when no anchor has
 * been computed for the region at all — which is the honest answer for every
 * region today, since the vertex-level anchor pipeline (G6 §5.19 R2–R11:
 * decoding the shipped GLBs, snapping to an outward-facing vertex, the
 * outline-mask and bounds checks) has not been built in this session. Only
 * R1 (asymmetric containment — which regions a label set belongs to at all,
 * `src/lib/anatomy/build-region-anchors.ts`) is real. A caller that has not
 * computed anchor points must pass `NO_ANCHORS_BUILT`, never fabricate a state.
 */
export interface AnchorLookup {
  stateFor(regionId: string): AnchorState | null;
}

export const NO_ANCHORS_BUILT: AnchorLookup = { stateFor: () => null };

/** One step's registrar-derived shape, trimmed to what `resolveTraceEndpoint` reads. Matches `IndexTechnique` (anatomy-index-types.ts). */
export interface TraceTechnique {
  id: string;
  bandIds: readonly BandId[];
  /** `lit` links only matter here; G6 §5.20.2's `RegionLink.lit` already encodes id/synonym resolution, band agreement, current addressing and a found quote. */
  litRegionIds: readonly string[];
}

export type TraceWaypoint = { kind: 'entry'; } | { kind: 'edge'; side: 'left' | 'right' | 'bottom' };

export type TraceEndpoint =
  | { kind: 'rail'; address: BandId; addresses: readonly BandId[] }
  | { kind: 'entry'; source: 'electrode_layout' | 'lead_trajectory' | 'unresolved'; electrode?: string; tier: 'drafted' | 'schematic' }
  | { kind: 'envelope'; addresses: readonly BandId[]; primaryAddress: BandId | null }
  | { kind: 'region'; regionIds: readonly string[]; tier: Exclude<PlacementTier, 'schematic' | 'none'> }
  | { kind: 'none'; reason: string };

export interface TraceStep {
  position: number;
  techniqueId: string;
  endpoint: TraceEndpoint;
  via: readonly TraceWaypoint[];
}

export interface ChainTrace {
  chainId: string;
  steps: readonly TraceStep[];
  /** True when every step resolved to 'rail' — G6 §5.20.9 (CHAIN-RBCI-001 today). */
  railOnly: boolean;
}
