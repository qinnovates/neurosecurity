/** A valid one-asset manifest for parser tests. Every number is invented. */

import type { AssetManifest, ManifestAsset, ManifestContext, ManifestNode } from '../manifest-types';
import { FIXTURE_ATLAS_ID, FIXTURE_SHA256, FIXTURE_SPACE } from './anatomy-fixtures';

const HASH_PREFIX_LENGTH = 12;
export const FIXTURE_ASSET_ID = 'deep-fixture';
export const FIXTURE_ASSET_PATH = `open/${FIXTURE_ASSET_ID}.${FIXTURE_SHA256.slice(0, HASH_PREFIX_LENGTH)}.glb`;

export function buildNode(overrides: Partial<ManifestNode> = {}): ManifestNode {
  return {
    extras: { atlas: FIXTURE_ATLAS_ID, label_id: '7', hemisphere: 'both' },
    threshold: 0.5,
    max_probability: 0.9,
    volume_mm3_at: { '0.25': 120, '0.5': 100, '0.75': 80 },
    voxels: 100,
    shortest_extent_voxels: 4,
    size_class: 'resolved',
    centroid_mm: [1, 2, 3],
    bbox_mm: [[0, 0, 0], [2, 4, 6]],
    vertex_count: 300,
    mesh_to_mask_mm: { mean: 0.1, max: 0.4 },
    ...overrides,
  };
}

export function buildAsset(overrides: Partial<ManifestAsset> = {}): ManifestAsset {
  return {
    id: FIXTURE_ASSET_ID,
    path: FIXTURE_ASSET_PATH,
    kind: 'mesh',
    layer: 'deep',
    bytes: 2048,
    sha256: FIXTURE_SHA256,
    input_fingerprint: FIXTURE_SHA256,
    source_ids: [FIXTURE_ATLAS_ID],
    computed_with_source_ids: [],
    license_id: 'cc-by-4.0',
    stated_license_id: 'cc-by-4.0',
    route: [{ kind: 'publisher_registered', publisher_registration: { target: FIXTURE_SPACE, method: 'not stated' } }],
    delineation: { basis: 'manual_mri', subjects: 10, hemispheres: 'unknown', grid_voxel_mm: 1, acquisition_voxel_mm: null, probability_meaning: 'not stated' },
    libraries: { 'scikit-image': '0.26.0' },
    nodes: [buildNode()],
    checks: [{ id: 'K6', status: 'not_run', reason: 'side assigned by construction', measured: null, threshold: null }],
    stage_fingerprints: { fetch: FIXTURE_SHA256, register: null, resample: FIXTURE_SHA256, mesh: FIXTURE_SHA256, write: FIXTURE_SHA256 },
    position_check: 'not independently checked',
    ...overrides,
  };
}

export function buildManifest(assets: ManifestAsset[] = [buildAsset()]): AssetManifest {
  return {
    schema_version: 2,
    template_space: FIXTURE_SPACE,
    units: 'mm',
    axes: 'RAS',
    pipeline_code_hash: FIXTURE_SHA256,
    integrity_note: 'Hashes show the files were delivered unchanged. They do not prove where a file came from.',
    assets,
  };
}

export function buildManifestContext(overrides: Partial<ManifestContext> = {}): ManifestContext {
  return {
    declaredSpace: FIXTURE_SPACE,
    statedLicenceBySource: new Map([[FIXTURE_ATLAS_ID, 'cc-by-4.0']]),
    effectiveLicenceBySource: new Map([[FIXTURE_ATLAS_ID, 'cc-by-4.0']]),
    buildableSourceIds: new Set([FIXTURE_ATLAS_ID]),
    ...overrides,
  };
}
