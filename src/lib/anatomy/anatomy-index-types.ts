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
import type { AssetKind, HemisphereRecord, Point3, PositionCheck, SizeClass } from './manifest-types';
import type { DimensionSourceKind, FiducialId, LeadDimensionField, SpacingMeasure } from './parse-device-geometry';
import type { ReadDepth } from './parse-electrode-layouts';
import type { ReviewerRole } from './parse-review-ledger';
import type { Resolution } from './resolve-region-term';
import type { ReviewState } from './review-state';
import type { SourceRefState } from './source-ref';
import type { IndexNeurorightCode, IndexTechniqueNeurorights, IndexTechniqueNiss } from './technique-tags';
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
  license_id: LicenceId;
  stated_license_id: LicenceId;
  verdict: Verdict;
  grant: Grant;
  route_kind: RouteKind;
  route_status: RouteStatus;
  buildable: boolean;
  /** True for a source the pipeline only computes with. Attribution lists it as used to compute, not redistributed. */
  pipeline_only: boolean;
  blockers: UnbuildableReason[];
  /** The clearance record's reason, AI-drafted. */
  clearance_reason: string;
  /** True only while a `licence_confirmation` ledger entry backs this source's reading at its own digest (see review-state.ts). */
  human_confirmed: boolean;
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
  license_id: LicenceId;
  source_ids: string[];
  position_check: PositionCheck;
  /** What was done to the source to make this asset, in the pipeline's own words. */
  modification_note: string;
  visual_check: IndexVisualCheck;
}

export const OWNER_VIAS = ['row', 'owner_contains_row_subject', 'row_subject_contains_owner'] as const;
/**
 * How a subject comes to own a structure.
 * - `row`: the subject's own crosswalk row names the structure.
 * - `owner_contains_row_subject`: the owner is the declared parent of a subject whose row names it (thalamus owns the shape of its nucleus).
 * - `row_subject_contains_owner`: the owner is a declared child of a subject whose row names it (a nucleus lies somewhere inside the thalamus shape).
 */
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
  /**
   * Whether the source drew each side itself. `mirrored`: one side is a mirror
   * image of the other's drawing, so a left-right difference in this shape means
   * nothing. Carried from the manifest so the scene states it and never guesses.
   */
  hemispheres_drawn: HemisphereRecord;
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

/**
 * What stands for a subject in this build.
 * - `drawn`: a shipped mesh exists for a label one of its drawing rows names.
 * - `contained`: it lies somewhere inside a shipped mesh that has no boundary for it.
 * - `marker_only`: its only shipped node is too small to outline; a location marker, no mesh.
 * - `not_built`: a drawing row is drafted, but no shape ships for it.
 * - `no_geometry`: a record says no buildable atlas has geometry, with the reason.
 * - `predates_addressing`: its rows are not valid for the current addressing.
 * - `not_mapped`: nothing has been drafted.
 */
export const GEOMETRY_STATES = ['drawn', 'contained', 'marker_only', 'not_built', 'no_geometry', 'predates_addressing', 'not_mapped'] as const;
export type GeometryState = typeof GEOMETRY_STATES[number];

export interface IndexSubject {
  kind: SubjectKind;
  id: string;
  name: string;
  /**
   * Derived from the region table, never stored. Regions only: a pathway or a
   * network has no band of its own in the QIF files, so its list is empty and no
   * colour mode lights it by band.
   */
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
export const INDEX_TECHNIQUE_SCOPES = ['regions', 'band_level', 'not_drafted'] as const satisfies ReadonlyArray<TechniqueScope | 'not_drafted'>;
export type IndexTechniqueScope = typeof INDEX_TECHNIQUE_SCOPES[number];

export interface IndexTechnique {
  id: string;
  name: string;
  band_ids: string[];
  /** The catalog's severity word. For a technique NISS has not scored it is an editorial label, so `niss.scoring_state` says which it is. */
  severity: string;
  /** NISS's own severity word, or null where the registrar holds none. Null is not a severity of `none`: see `niss.scoring_state`, which the parser holds to this field. */
  niss_severity: string | null;
  dsm_cluster: string | null;
  /** The registrar's NISS block: the scoring state, and the vector, score and PINS flag it holds only where it has scored. */
  niss: IndexTechniqueNiss;
  /** The registrar's raw neurorights codes, unfolded, or null where it holds no record. `neurorights_taxonomy` defines each code and names the folds. */
  neurorights: IndexTechniqueNeurorights | null;
  scope: IndexTechniqueScope;
  links: IndexTechniqueLink[];
}

export interface IndexFiducial {
  id: FiducialId;
  position_mm: Point3;
  /** How far the placement can be trusted, in plain words, AI-drafted. Shown with any layout built on the landmark. */
  confidence_note: string | null;
  review_state: IndexReviewState;
}

/** Where a lead's numbers were read (a regulator's document or a review paper) and which fields the source states. Words only: never drawn. */
export interface IndexLeadSource { citation: string; url: string; kind: DimensionSourceKind; supports: LeadDimensionField[] }

export interface IndexLead {
  id: string;
  name: string;
  contacts: number;
  contact_length_mm: number;
  contact_spacing_mm: number;
  spacing_measure: SpacingMeasure;
  diameter_mm: number;
  /** True for every lead whose row parsed: each dimension has a quoted source. Draw it only together with `review_state`. */
  drawable: boolean;
  /** One entry per quoted source in the lead's row. Every dimension above is named by at least one. */
  sources: IndexLeadSource[];
  review_state: IndexReviewState;
}

export interface IndexStatedTargets {
  device_id: string;
  region_ids: string[];
}

export interface IndexElectrode {
  id: string;
  position_mm: Point3;
  also_called: string | null;
}

/**
 * Electrode positions on the head surface asset, ready to draw as they are. A layout names no brain
 * region: what lies under an electrode differs between people and is not computed here.
 */
export interface IndexElectrodeLayout {
  id: string;
  name: string;
  /** The head surface asset the positions lie on. */
  scalp_asset_id: string;
  construction: string;
  shown_by_default: boolean;
  electrodes: IndexElectrode[];
  /**
   * True when the head surface the manifest ships is the file the positions were placed on, by sha256.
   * Reviewed or not, a layout is drawn only together with `review_state` and the landmarks' confidence notes.
   */
  drawable: boolean;
  review_state: IndexReviewState;
}

export interface IndexDeviceFact {
  id: string;
  statement: string;
  citation: string;
  url: string;
  read_depth: ReadDepth;
}

export interface IndexDevices {
  fiducial_space: string | null;
  /** How the landmarks were placed, in words. Null while there are none. */
  fiducial_method: string | null;
  fiducials: IndexFiducial[];
  electrode_layouts: IndexElectrodeLayout[];
  leads: IndexLead[];
  /** Sourced statements to show in words beside the layout. Never drawn. */
  facts: IndexDeviceFact[];
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
  /**
   * Other static files a page reads beside the index (the explorer's catalog, the literature statements, the H01
   * card), each pinned so a page can refuse a set of files that did not come from one build.
   */
  companions: PinnedFile[];
  layers: IndexLayer[];
  sources: IndexSource[];
  assets: IndexAsset[];
  structures: IndexStructure[];
  subjects: IndexSubject[];
  techniques: IndexTechnique[];
  /** The registrar's neurorights glossary once: every code a technique may name, with the code it folds into where the registrar states one. Nothing here is folded. */
  neurorights_taxonomy: IndexNeurorightCode[];
  tracts: IndexTracts;
  devices: IndexDevices;
  /** Ledger keys of drafted items whose quoted words no longer appear at their pointer. Their check status reads unchecked. */
  stale_evidence_keys: string[];
}
