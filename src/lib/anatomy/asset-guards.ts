/**
 * Checks on the committed atlas assets, as pure functions over bytes and lists
 * so each can be tested on a bad fixture. The pipeline that writes the assets
 * runs on a developer machine and never in CI; these are what CI re-verifies.
 *
 * Build and test time only: this module uses node:crypto through row-digest.
 */

import type { LabelTable } from './anatomy-types';
import type { AssetManifest, ManifestAsset } from './manifest-types';
import { sha256Hex } from './row-digest';

export const MANIFEST_NAME = 'manifest.json';
/** Files a served folder may hold beside the manifest's assets and the per-atlas label tables. */
export const NOTICE_FILE_NAMES = ['NOTICE.txt', 'LICENSE.txt'] as const;
const GLB_MAGIC = 0x46546c67;
const GLB_JSON_CHUNK = 0x4e4f534a;
const GLB_HEADER_BYTES = 12;
const GLB_CHUNK_HEADER_BYTES = 8;
/** A geometry-only file has none of these. Any of them could pull in an image, a shader input or motion. */
export const BANNED_GLTF_KEYS = ['images', 'textures', 'materials', 'samplers', 'animations', 'skins', 'cameras'] as const;
/** Quantisation moves a vertex by at most one part in 32767 of its box; this allows for it and for rounding in the manifest. */
const BOUNDS_TOLERANCE_MM = 0.05;
const MAX_VOXEL_MM = 1.5;
const RESCALE_SHARE = 0.08;

function nodeKey(atlas: unknown, labelId: unknown, hemisphere: unknown): string {
  return `${String(atlas)}:${String(labelId)}:${String(hemisphere)}`;
}

export interface LoadedNode {
  extras: { atlas?: unknown; label_id?: unknown; hemisphere?: unknown };
  vertexCount: number;
  boundsMm: [[number, number, number], [number, number, number]];
}

/** An asset whose bytes are missing, the wrong length, or do not hash to what the manifest says. */
export function findHashProblems(manifest: AssetManifest, readAsset: (path: string) => Uint8Array | null): string[] {
  return manifest.assets.flatMap((asset) => {
    const bytes = readAsset(asset.path);
    if (bytes === null) return [`${asset.path}: listed in the manifest but not on disk`];
    if (bytes.byteLength !== asset.bytes) return [`${asset.path}: ${bytes.byteLength} bytes on disk, ${asset.bytes} in the manifest`];
    if (sha256Hex(bytes) !== asset.sha256) return [`${asset.path}: sha256 on disk differs from the manifest`];
    return [];
  });
}

/** Files in the served folder that the manifest does not list, and listed files (assets, notices, label tables) with no file. */
export function findListingProblems(manifest: AssetManifest, listing: readonly string[]): string[] {
  const expected = new Set([MANIFEST_NAME, ...manifest.assets.map((asset) => asset.path), ...Object.keys(manifest.support_files ?? {})]);
  const orphans = listing.filter((path) => !expected.has(path)).map((path) => `${path}: on disk but not in the manifest`);
  const missing = [...expected].filter((path) => !listing.includes(path)).map((path) => `${path}: in the manifest but not on disk`);
  return [...orphans, ...missing];
}

/**
 * A notice, licence text or label table that is missing, was edited after the build, or is not listed at all.
 * Every folder that holds an asset must list its notice, and every atlas with a node must list its label table.
 */
export function findSupportFileProblems(manifest: AssetManifest, readFile: (path: string) => Uint8Array | null): string[] {
  const listed = manifest.support_files ?? {};
  const problems = Object.entries(listed).flatMap(([path, digest]) => {
    const bytes = readFile(path);
    if (bytes === null) return [`${path}: listed in the manifest but not on disk`];
    return sha256Hex(bytes) === digest ? [] : [`${path}: differs from what the pipeline wrote; regenerate it with the pipeline, do not edit it`];
  });
  for (const asset of manifest.assets) {
    const folder = asset.path.split('/')[0];
    if (!(`${folder}/${NOTICE_FILE_NAMES[0]}` in listed)) problems.push(`${folder}/${NOTICE_FILE_NAMES[0]}: not listed in the manifest although ${asset.id} ships from that folder`);
    for (const atlas of new Set(asset.nodes.map((node) => node.extras.atlas))) {
      if (!(`${folder}/labels-${atlas}.json` in listed)) problems.push(`${folder}/labels-${atlas}.json: not listed in the manifest although ${asset.id} carries its labels`);
    }
  }
  return [...new Set(problems)];
}

/** An (atlas, label, hemisphere) that is a node of more than one asset: the same shape shipped twice. */
export function findRepeatedNodeProblems(manifest: AssetManifest): string[] {
  const owners = new Map<string, string[]>();
  for (const asset of manifest.assets) {
    for (const node of asset.nodes) {
      const key = nodeKey(node.extras.atlas, node.extras.label_id, node.extras.hemisphere);
      owners.set(key, [...(owners.get(key) ?? []), asset.id]);
    }
  }
  return [...owners].filter(([, assetIds]) => assetIds.length > 1).map(([key, assetIds]) => `${key} ships in ${assetIds.join(' and ')}`);
}

/** The JSON chunk of a GLB file, or a problem saying why it could not be read. */
export function readGlbJson(bytes: Uint8Array): { document: Record<string, unknown> } | { problem: string } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength < GLB_HEADER_BYTES + GLB_CHUNK_HEADER_BYTES || view.getUint32(0, true) !== GLB_MAGIC) return { problem: 'not a GLB file' };
  if (view.getUint32(8, true) !== bytes.byteLength) return { problem: 'the GLB length field differs from the file length' };
  const jsonLength = view.getUint32(GLB_HEADER_BYTES, true);
  if (view.getUint32(GLB_HEADER_BYTES + 4, true) !== GLB_JSON_CHUNK) return { problem: 'the first GLB chunk is not JSON' };
  const start = GLB_HEADER_BYTES + GLB_CHUNK_HEADER_BYTES;
  try {
    return { document: JSON.parse(new TextDecoder().decode(bytes.subarray(start, start + jsonLength))) as Record<string, unknown> };
  } catch {
    return { problem: 'the GLB JSON chunk does not parse' };
  }
}

/** Anything in a GLB beyond geometry: banned top-level keys, an external buffer, or an attribute other than POSITION. */
export function findGeometryOnlyProblems(assetPath: string, bytes: Uint8Array): string[] {
  const parsed = readGlbJson(bytes);
  if ('problem' in parsed) return [`${assetPath}: ${parsed.problem}`];
  const { document } = parsed;
  const problems = BANNED_GLTF_KEYS.filter((key) => key in document).map((key) => `${assetPath}: holds "${key}"; assets are geometry only`);
  const buffers = Array.isArray(document.buffers) ? document.buffers as Array<Record<string, unknown>> : [];
  if (buffers.length !== 1 || 'uri' in buffers[0]) problems.push(`${assetPath}: expected one embedded buffer and no external one`);
  const meshes = Array.isArray(document.meshes) ? document.meshes as Array<{ primitives?: Array<{ attributes?: Record<string, unknown> }> }> : [];
  const strayAttribute = meshes.flatMap((mesh) => mesh.primitives ?? []).flatMap((primitive) => Object.keys(primitive.attributes ?? {})).find((name) => name !== 'POSITION');
  if (strayAttribute !== undefined) problems.push(`${assetPath}: holds the attribute "${strayAttribute}"; only POSITION is allowed`);
  return problems;
}


/**
 * Holds a loaded file to its manifest entry and to the label tables: the mesh
 * nodes in the file are exactly the manifest nodes that have a mesh, each id is
 * a label of its atlas, and each mesh has the vertex count and bounds recorded.
 */
export function findNodeProblems(asset: ManifestAsset, loadedNodes: readonly LoadedNode[], labelTables: ReadonlyMap<string, LabelTable>): string[] {
  const problems: string[] = [];
  const expected = new Map(asset.nodes.filter((node) => node.vertex_count > 0).map((node) => [nodeKey(node.extras.atlas, node.extras.label_id, node.extras.hemisphere), node]));
  const seen = new Set<string>();
  for (const loaded of loadedNodes) {
    const key = nodeKey(loaded.extras.atlas, loaded.extras.label_id, loaded.extras.hemisphere);
    const labels = labelTables.get(String(loaded.extras.atlas));
    if (labels === undefined || !labels.labels.some((label) => label.id === loaded.extras.label_id)) {
      problems.push(`${asset.path}: node ${key} carries an id that is not in its atlas's label table`);
    }
    const node = expected.get(key);
    if (node === undefined) {
      problems.push(`${asset.path}: node ${key} is in the file but the manifest lists no mesh for it`);
      continue;
    }
    seen.add(key);
    if (loaded.vertexCount !== node.vertex_count) problems.push(`${asset.path}: node ${key} has ${loaded.vertexCount} vertices, the manifest says ${node.vertex_count}`);
    const outside = [0, 1, 2].some((axis) => loaded.boundsMm[0][axis] < node.bbox_mm[0][axis] - boundsSlack(node, axis) || loaded.boundsMm[1][axis] > node.bbox_mm[1][axis] + boundsSlack(node, axis));
    if (outside) problems.push(`${asset.path}: node ${key} reaches outside the bounds the manifest records for its structure`);
  }
  for (const key of expected.keys()) {
    if (!seen.has(key)) problems.push(`${asset.path}: the manifest lists a mesh for ${key} but the file has none`);
  }
  return problems;
}

/**
 * How far a mesh may reach past the bounds the manifest records. Those bounds are of voxel centres; the
 * surface lies half a voxel outside them, and the volume-restoring rescale can add up to 7.5% of the extent.
 */
function boundsSlack(node: ManifestAsset['nodes'][number], axis: number): number {
  return BOUNDS_TOLERANCE_MM + MAX_VOXEL_MM + RESCALE_SHARE * (node.bbox_mm[1][axis] - node.bbox_mm[0][axis]);
}

/** Manifest nodes, with or without a mesh, whose label id is not in the label table of their atlas. */
export function findUnknownLabelProblems(manifest: AssetManifest, labelTables: ReadonlyMap<string, LabelTable>): string[] {
  return manifest.assets.flatMap((asset) => asset.nodes
    .filter((node) => !(labelTables.get(node.extras.atlas)?.labels.some((label) => label.id === node.extras.label_id) ?? false))
    .map((node) => `${asset.id}: node ${nodeKey(node.extras.atlas, node.extras.label_id, node.extras.hemisphere)} is not in the label table of "${node.extras.atlas}"`));
}
