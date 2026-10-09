/**
 * The shape of /atlas/anatomy-index.json, the one file the atlas page reads
 * first. The whole shape is fixed here, including fields that later work fills
 * (assets, centroids, tracts, devices), so filling them never changes a type.
 *
 * Every drafted thing in the index carries its review state and check status.
 * A review state has no empty value, so no consumer can drop the mark.
 */

import type { ExtentMatch, Hemisphere, SubjectKind, TechniqueScope } from './anatomy-types';
import type { CheckStatus, ClaimBasis } from './evidence';
import type { UnbuildableReason } from './licence-rules';
import type { AssetKind, Point3, PositionCheck, SizeClass } from './manifest-types';
import type { FiducialId, SpacingMeasure } from './parse-device-geometry';
import type { ReviewerRole } from './parse-review-ledger';
import type { Resolution } from './resolve-region-term';
import type { ReviewState } from './review-state';
import type { SourceRefState } from './source-ref';
import type { Grant, LayerId, LicenceId, RouteKind, RouteStatus, Verdict } from './source-types';

export const ANATOMY_INDEX_SCHEMA_VERSION = 1;
export const ANATOMY_INDEX_PATH = '/atlas/anatomy-index.json';
export const ANATOMY_EVIDENCE_PATH = '/atlas/anatomy-evidence.json';

/** A review state with the words of its mark. The words are never empty. */
export type IndexReviewState = ReviewState & { mark: string };

/** A file the index pins by length and digest, so the page can check every byte before use. */
export interface PinnedFile {
  path: string;
  bytes: number;
  sha256: string;
}

export interface IndexLayer {
  id: LayerId;
  available: boolean;
  /** Why the layer is not available. Null only when it is. */
  reason: string | null;
  source_ids: string[];
  asset_ids: string[];
}

export interface IndexSource {
  id: string;
  name: string;
  /** The licence the source is handled under. */
  licence_id: LicenceId;
  stated_licence_id: LicenceId;
  verdict: Verdict;
  grant: Grant;
  route_kind: RouteKind;
  route_status: RouteStatus;
  buildable: boolean;
  blockers: UnbuildableReason[];
  /** The clearance record's reason, AI-drafted. */
  clearance_reason: string;
  /** Always false today: no person has confirmed any licence reading. */
  human_confirmed: false;
}

export const VISUAL_CHECK_STATES = ['not_done', 'signed'] as const;
export type VisualCheckState = typeof VISUAL_CHECK_STATES[number];

export interface IndexVisualCheck {
  state: VisualCheckState;
  role: ReviewerRole | null;
  reviewed_on: string | null;
}

export interface IndexAsset extends PinnedFile {
  id: string;
  kind: AssetKind;
  layer: LayerId;
  licence_id: LicenceId;
  source_ids: string[];
  position_check: PositionCheck;
  visual_check: IndexVisualCheck;
}

export const OWNER_VIAS = ['row', 'declared_parent', 'declared_child'] as const;
/** How a subject comes to own a structure: its own row names it, or a declared containment reaches it. */
export type OwnerVia = typeof OWNER_VIAS[number];

export interface IndexOwner {
  subject_kind: SubjectKind;
  subject_id: string;
  via: OwnerVia;
  /** The row's grade. Null when the owner reaches the structure through containment only. */
  extent_match: ExtentMatch | null;
  review_state: IndexReviewState;
  check_status: CheckStatus;
}

export interface IndexStructureNode {
  asset_id: string;
  hemisphere: Hemisphere;
  size_class: SizeClass;
  centroid_mm: Point3;
  vertex_count: number;
}

/** The drawable unit: one atlas label. Its style is a function of its full owner set. */
export interface IndexStructure {
  key: string;
  atlas: string;
  label_id: string;
  name: string | null;
  nodes: IndexStructureNode[];
  owners: IndexOwner[];
  /** The worst state among the owners. */
  review_state: IndexReviewState;
  check_status: CheckStatus;
}

export const GEOMETRY_STATES = ['drawn', 'contained', 'no_geometry', 'predates_addressing', 'not_mapped'] as const;
export type GeometryState = typeof GEOMETRY_STATES[number];

export interface IndexSubject {
  kind: SubjectKind;
  id: string;
  name: string;
  /** Derived from the region table, never stored. Empty for a subject with no band of its own. */
  band_ids: string[];
  geometry: { state: GeometryState; reason: string | null; reason_source: string | null };
  structure_keys: string[];
  declared_children: string[];
  review_state: IndexReviewState;
  check_status: CheckStatus;
}

export interface IndexTechniqueLink {
  term: string;
  resolved_region_id: string | null;
  resolution: Resolution;
  /** Whether the resolved region's band is among the technique's band tags. Derived; never a gate on what is stored. */
  band_agrees: boolean;
  valid_for_current_addressing: boolean;
  quote_state: SourceRefState;
  /** True only for an id or synonym resolution that agrees with the band tags, is current and still quoted. */
  lit: boolean;
  claim_basis: ClaimBasis;
  review_state: IndexReviewState;
  check_status: CheckStatus;
}

/** `not_drafted`: the technique has a neural band but no entry in the technique-regions file yet. */
export const INDEX_TECHNIQUE_SCOPES = ['regions', 'band_level', 'not_drafted'] as const;
export type IndexTechniqueScope = TechniqueScope | 'not_drafted';

export interface IndexTechnique {
  id: string;
  name: string;
  band_ids: string[];
  severity: string;
  /** NISS's own severity word as the registrar holds it, or null when the registrar holds none. */
  niss_severity: string | null;
  dsm_cluster: string | null;
  scope: IndexTechniqueScope;
  links: IndexTechniqueLink[];
}

export interface IndexFiducial {
  id: FiducialId;
  position_mm: Point3;
  review_state: IndexReviewState;
}

export interface IndexLead {
  id: string;
  name: string;
  contacts: number;
  contact_length_mm: number;
  contact_spacing_mm: number;
  spacing_measure: SpacingMeasure;
  diameter_mm: number;
  /** A lead is drawn only while a ledger entry covers its row. */
  drawable: boolean;
  review_state: IndexReviewState;
}

export interface IndexStatedTargets {
  device_id: string;
  region_ids: string[];
}

export interface IndexDevices {
  fiducial_space: string | null;
  fiducials: IndexFiducial[];
  leads: IndexLead[];
  /** The regions each device's own record names. Published by the maker's material as the atlas file records it. */
  stated_targets: IndexStatedTargets[];
}

export interface IndexTracts {
  index_asset_id: string | null;
  proximity_asset_id: string | null;
  group_asset_ids: string[];
}

export interface AnatomyIndex {
  schema_version: number;
  status: string;
  addressing_version: number;
  template_space: string;
  evidence: PinnedFile;
  layers: IndexLayer[];
  sources: IndexSource[];
  assets: IndexAsset[];
  structures: IndexStructure[];
  subjects: IndexSubject[];
  techniques: IndexTechnique[];
  tracts: IndexTracts;
  devices: IndexDevices;
  /** Ledger keys of drafted items whose quoted words no longer appear at their pointer. Their check status reads unchecked. */
  stale_evidence_keys: string[];
}
