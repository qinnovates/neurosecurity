/**
 * Attack chains produced by the generator. They share the render shape of the
 * hand-written chains in datalake/tara-chains.json but are a separate type: a
 * generated chain is a hypothesis, and its origin must survive export and print.
 */

export const GENERATED_CHAIN_ORIGIN = 'generated';
export const GENERATED_CHAIN_ID_PREFIX = 'GEN-';
export const CHAIN_GENERATOR_VERSION = '0.1.0';

/** Same vocabulary as src/components/atlas/chain-constants.ts. */
export const CHAIN_ROLES = [
  'reconnaissance', 'initial_access', 'pivot', 'objective', 'persistence', 'exfiltration',
] as const;
export type ChainRole = typeof CHAIN_ROLES[number];

/**
 * Why two consecutive steps are joined.
 * - documented-relation: the catalog itself cross-references the two techniques.
 * - shared-element: both techniques apply to the same component or link in the model.
 * - connected-elements: the two steps act on elements joined directly in the model.
 * - reachable-elements: the elements are joined only through others that have no step.
 *
 * The last three are structural. They show a path exists in the device model; they are
 * not evidence that one step enables the next.
 */
export const EDGE_BASES = ['documented-relation', 'shared-element', 'connected-elements', 'reachable-elements'] as const;
export type EdgeBasis = typeof EDGE_BASES[number];

export interface GeneratedChainStep {
  position: number;
  technique_id: string;
  tara_alias: string;
  role: ChainRole;
  action: string;
  detection_window: string;
  /** Component or link id in the device model this step acts on. */
  elementId: string;
  /** The legacy status the eligibility gate read. Never shown; wording goes through describeEvidence. */
  evidenceStatus: string;
  evidenceTier: string | null;
}

export interface GeneratedChainEdge {
  fromPosition: number;
  toPosition: number;
  basis: EdgeBasis;
}

export interface GeneratedChain {
  origin: typeof GENERATED_CHAIN_ORIGIN;
  chain_id: `${typeof GENERATED_CHAIN_ID_PREFIX}${string}`;
  chain_name: string;
  objective: string;
  drift_profile: string;
  steps: GeneratedChainStep[];
  defenses: string[];
  edges: GeneratedChainEdge[];
  /** The weakest legacy status among the steps; orders the chain list. Never shown; wording goes through describeEvidence. */
  weakestEvidenceStatus: string;
  /** The tier of the step with the weakest evidence by tier rank. */
  weakestEvidenceTier: string | null;
  generatorVersion: string;
  registrarVersion: string;
}

export interface ChainGenerationOptions {
  /** Evidence statuses a step may have. Defaults to confirmed and demonstrated only. */
  allowedEvidenceStatuses: readonly string[];
  maxChains: number;
  maxSteps: number;
  /** Hard cap on search expansions; reaching it sets `wasTruncated`. */
  nodeBudget: number;
}

export interface ChainGenerationResult {
  chains: GeneratedChain[];
  /** The search hit its node budget, so better chains may exist. */
  wasTruncated: boolean;
  /** Chains the search built before the list was cut to `maxChains`. */
  chainsFound: number;
  /** True when `chains` holds fewer than were found, so the list is the first few and not all of them. */
  wasCapped: boolean;
  /** Set when `chains` is empty, saying why. The filter is never relaxed to fill the list. */
  emptyReason: string | null;
}
