/**
 * The asset manifest the offline pipeline writes (src/site/atlas-assets/manifest.json).
 * It is produced by another runtime on a developer machine, so the build treats
 * it as untrusted input and parses every field.
 */

import type { DelineationBasis, Hemisphere } from './anatomy-types';
import type { LayerId, LicenceId, PublisherRegistration, RouteKind } from './source-types';

export const ASSET_KINDS = ['mesh', 'label_binary', 'tracts', 'tract_index', 'tract_proximity'] as const;
export type AssetKind = typeof ASSET_KINDS[number];

/**
 * How well the source resolves a structure. `unresolved` and `not_drawn`
 * structures have no mesh: they are a location marker or a list entry only.
 */
export const SIZE_CLASSES = ['resolved', 'coarse', 'unresolved', 'not_drawn'] as const;
export type SizeClass = typeof SIZE_CLASSES[number];
export const MESHLESS_SIZE_CLASSES: readonly SizeClass[] = ['unresolved', 'not_drawn'];

/** Set only from checks that are independent of what a registration optimises. */
export const POSITION_CHECKS = ['independently checked', 'not independently checked', 'failed'] as const;
export type PositionCheck = typeof POSITION_CHECKS[number];

export const CHECK_IDS = ['K0', 'K1', 'K2', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'V1', 'V2'] as const;
export type CheckId = typeof CHECK_IDS[number];

export const CHECK_RESULTS = ['pass', 'fail', 'not_run'] as const;
export type CheckResult = typeof CHECK_RESULTS[number];

export const HEMISPHERE_RECORDS = ['separate', 'mirrored', 'unknown'] as const;
export type HemisphereRecord = typeof HEMISPHERE_RECORDS[number];

export const PIPELINE_STAGES = ['fetch', 'register', 'resample', 'mesh', 'write'] as const;
export type PipelineStage = typeof PIPELINE_STAGES[number];

export type Point3 = [number, number, number];

/** The archived registration an asset went through. It is reused, not recomputed, while its hashes match. */
export interface RegisterFingerprint {
  /** Archive file name -> sha256 of the archived transform files. */
  archive_sha256: Record<string, string>;
  /** The parameter setting's name, as the registration record calls it. */
  setting: string;
  tool: string;
  tool_version: string;
  seed: number;
  parameters: Record<string, string | number | boolean>;
}

/**
 * What each pipeline stage consumed or produced, so an unchanged stage is
 * skipped. `fetch` lists every source file by name with its sha256, which must
 * equal the registry's pin for that file. `register` is null for an asset that
 * went through no registration. The other stages are digests.
 */
export interface StageFingerprints {
  fetch: Record<string, string>;
  register: RegisterFingerprint | null;
  resample: string | null;
  mesh: string | null;
  write: string | null;
}

export interface ManifestNode {
  /** The ids a mesh node carries. Node names are cosmetic; these are what the page reads. */
  extras: { atlas: string; label_id: string; hemisphere: Hemisphere };
  threshold: number;
  max_probability: number;
  volume_mm3_at: Record<string, number>;
  voxels: number;
  shortest_extent_voxels: number;
  size_class: SizeClass;
  centroid_mm: Point3;
  bbox_mm: [Point3, Point3];
  vertex_count: number;
  mesh_to_mask_mm: { mean: number; max: number };
}

export interface ManifestCheck {
  id: CheckId;
  status: CheckResult;
  /** Required when the check did not run. */
  reason?: string;
  measured: number | null;
  threshold: number | null;
}

export interface ManifestRouteStep {
  kind: RouteKind;
  publisher_registration?: PublisherRegistration;
}

export interface ManifestDelineation {
  basis: DelineationBasis;
  subjects: number | null;
  hemispheres: HemisphereRecord;
  grid_voxel_mm: number;
  acquisition_voxel_mm: number | null;
  probability_meaning: string;
}

export interface ManifestAsset {
  id: string;
  path: string;
  kind: AssetKind;
  layer: LayerId;
  bytes: number;
  sha256: string;
  input_fingerprint: string;
  /** Sources whose material is in the file. Every one must be buildable. */
  source_ids: string[];
  /** Pipeline-only inputs: used to compute the file, never copied into it. */
  computed_with_source_ids: string[];
  license_id: LicenceId;
  stated_license_id: LicenceId;
  route: ManifestRouteStep[];
  delineation: ManifestDelineation;
  libraries: Record<string, string>;
  nodes: ManifestNode[];
  checks: ManifestCheck[];
  stage_fingerprints: StageFingerprints;
  position_check: PositionCheck;
  /** One or two plain sentences saying what was done to the source to make this asset. Required by the sources' licences. */
  modification_note: string;
}

export interface AssetManifest {
  schema_version: number;
  template_space: string;
  units: 'mm';
  axes: 'RAS';
  pipeline_code_hash: string;
  integrity_note: string;
  assets: ManifestAsset[];
}

/** What the manifest is checked against: the registry, and what each source may do today. */
export interface ManifestContext {
  declaredSpace: string;
  /** Source id -> stated licence id. */
  statedLicenceBySource: ReadonlyMap<string, LicenceId>;
  /** Source id -> the licence it is handled under. */
  effectiveLicenceBySource: ReadonlyMap<string, LicenceId>;
  buildableSourceIds: ReadonlySet<string>;
  /** Source id -> file name -> the registry's sha256 pin, or null while the file is unpinned. */
  filePinsBySource: ReadonlyMap<string, ReadonlyMap<string, string | null>>;
}
