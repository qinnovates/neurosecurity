/**
 * The source registry and the licence verdicts: which upstream atlases exist,
 * how each reaches the declared template space, and whether its licence
 * reading lets it ship. Licence readings here were made by AI, not by a lawyer.
 */

import type { DelineationBasis } from './anatomy-types';

/** The closed list of licence ids. What a licence permits is derived from its id in licence-rules.ts and never typed in a data file. */
export const LICENCE_IDS = [
  'cc-by-4.0', 'cc0-1.0', 'cc-by-sa-4.0', 'mit', 'mni-icbm-notice',
  'melbourne-subcortex', 'freesurfer-sla-1.0', 'hcp-data-use-terms', 'none-stated',
] as const;
export type LicenceId = typeof LICENCE_IDS[number];

export const VERDICTS = ['SHIP', 'SHIP-SEPARATE-FILE', 'NEEDS-KEVIN', 'DO-NOT-SHIP'] as const;
export type Verdict = typeof VERDICTS[number];

/** `explicit`: the grant is in the publisher's words. `interpretation`: it rests on a reading. `none`: no grant was found. */
export const GRANTS = ['explicit', 'interpretation', 'none'] as const;
export type Grant = typeof GRANTS[number];

/**
 * How a source reaches the declared space. `declared_space` is the template
 * that defines the space; `not_applicable` is a source no shape is made from.
 * `unknown` means the space is not established, and the source ships nothing.
 */
export const ROUTE_KINDS = [
  'declared_space', 'publisher_registered', 'header_resample', 'distributed_transform',
  'computed_registration', 'fit_to_scalp', 'not_applicable', 'unknown',
] as const;
export type RouteKind = typeof ROUTE_KINDS[number];

/** `open` until the route has been confirmed against the publisher's own files. */
export const ROUTE_STATUSES = ['settled', 'open'] as const;
export type RouteStatus = typeof ROUTE_STATUSES[number];

export const LAYER_IDS = ['outline', 'cortical', 'deep', 'tracts', 'networks', 'devices'] as const;
export type LayerId = typeof LAYER_IDS[number];

/** `publisher`: the publisher prints the digest. `first_download`: the pin is trust on first download. */
export const DIGEST_ORIGINS = ['publisher', 'first_download'] as const;
export type DigestOrigin = typeof DIGEST_ORIGINS[number];

export const VERIFIER_KINDS = ['ai', 'human'] as const;
export type VerifierKind = typeof VERIFIER_KINDS[number];

export interface SourceFile {
  name: string;
  url: string;
  /** Null until the pipeline lane pins the file. */
  sha256: string | null;
  bytes: number | null;
  digest_origin: DigestOrigin | null;
}

export interface PublisherRegistration {
  target: string;
  method: string;
}

export interface SourceRoute {
  kind: RouteKind;
  status: RouteStatus;
  note: string;
  publisher_registration?: PublisherRegistration;
}

export interface SourceDelineation {
  /** Null until the publisher's own description has been read. */
  basis: DelineationBasis | null;
  subjects: number | null;
}

export interface AnatomySource {
  id: string;
  name: string;
  attribution_text: string | null;
  urls: string[];
  /** The licence the publisher states. A verdict may treat the source as something stricter. */
  licence_id: LicenceId;
  redistribute: boolean;
  layers: LayerId[];
  delineated_in: string;
  arrives_in: string;
  route: SourceRoute;
  delineation: SourceDelineation;
  required_text: string[];
  files: SourceFile[];
}

export interface RefusedSource {
  id: string;
  name: string;
  reason: string;
}

export interface AnatomySources {
  schema_version: number;
  status: string;
  declared_space: string;
  sources: AnatomySource[];
  considered_and_refused: RefusedSource[];
}

export interface AccessAgreement {
  name: string;
  terms_url: string;
  /** sha256 of the agreement text as read. Null until someone pins the text; an unpinned agreement cannot be accepted. */
  text_sha256: string | null;
}

export interface Clearance {
  cleared: boolean;
  reason: string;
  unlocks_when: string[];
  drafted_by: 'ai';
}

export interface LicenceVerdict {
  source_id: string;
  verdict: Verdict;
  grant: Grant;
  /** A stricter licence id to handle the source under, or null to use the stated one. */
  treat_as: LicenceId | null;
  terms_url: string | null;
  quoted_terms: string[];
  read_on: string;
  verified_by: string[];
  human_confirmed: false;
  access_agreement: AccessAgreement | null;
  clearance: Clearance;
}

export interface Verifier {
  id: string;
  kind: VerifierKind;
}

export interface LicenceVerdicts {
  schema_version: number;
  status: string;
  verifiers: Verifier[];
  verdicts: LicenceVerdict[];
}
