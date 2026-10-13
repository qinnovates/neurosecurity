/**
 * Decides whether a fetched geometry file may be drawn. Three checks, in
 * order: the bytes are the file the index pins (length, then sha256); the file
 * decodes as one of the atlas's own geometry files; and what it holds is what
 * the index says it holds (the same shapes, the same vertex counts, each one
 * around the centre the index records and wound to face outward). A file that fails any of them is not
 * drawn, and nothing falls back to unchecked data.
 */

import type { AnatomyIndex, IndexAsset } from './anatomy-index-types';
import { decodeGlb, GlbDecodeError, type DecodedNode } from './decode-glb';

export const ASSET_REFUSALS = ['length_mismatch', 'digest_mismatch', 'digest_unavailable', 'not_geometry', 'contents_differ'] as const;
/**
 * Why a file is not drawn. `digest_unavailable`: this browser context offers no
 * digest (a page served over plain HTTP), so the file cannot be checked and is
 * not drawn; that is not a mismatch.
 */
export type AssetRefusal = typeof ASSET_REFUSALS[number];

export type AssetVerdict = { ok: true; nodes: DecodedNode[] } | { ok: false; refusal: AssetRefusal; detail: string };

/** A shape as the index expects to find it in an asset. */
export interface ExpectedNode {
  atlas: string;
  labelId: string;
  hemisphere: string;
  vertexCount: number;
  centroidMm: readonly [number, number, number];
}

/** How far outside a shape's own box its recorded centre may lie: rounding only. Every real shape's centre lies inside its box. */
export const CENTROID_TOLERANCE_MM = 0.5;
const HEX_RADIX = 16;
const HEX_BYTE_WIDTH = 2;
const KEY_SEPARATOR = ':';

function refuse(refusal: AssetRefusal, detail: string): AssetVerdict {
  return { ok: false, refusal, detail };
}

function nodeKey(node: { atlas: string; labelId: string; hemisphere: string }): string {
  return [node.atlas, node.labelId, node.hemisphere].join(KEY_SEPARATOR);
}

/** The shapes with a mesh that the index says an asset holds. Markers have no mesh and are not in the file. */
export function listExpectedNodes(index: AnatomyIndex, assetId: string): ExpectedNode[] {
  return index.structures.flatMap((structure) => structure.nodes
    .filter((node) => node.asset_id === assetId && node.vertex_count > 0)
    .map((node) => ({ atlas: structure.atlas, labelId: structure.label_id, hemisphere: node.hemisphere, vertexCount: node.vertex_count, centroidMm: node.centroid_mm })));
}

/**
 * Six times the volume a mesh encloses, signed: positive when its triangles are wound to face outward, negative when
 * they face inward. A mesh wound inward is lit and outlined inside out, so it is refused, not corrected here.
 */
export function signedVolumeTimesSix(node: Pick<DecodedNode, 'positionsMm' | 'indices'>): number {
  const { positionsMm: p, indices } = node;
  let total = 0;
  for (let corner = 0; corner < indices.length; corner += 3) {
    const [a, b, c] = [indices[corner] * 3, indices[corner + 1] * 3, indices[corner + 2] * 3];
    total += p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) - p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c]) + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c]);
  }
  return total;
}

function isNear(node: DecodedNode, centroidMm: readonly [number, number, number]): boolean {
  return centroidMm.every((value, axis) => value >= node.boundsMm.min[axis] - CENTROID_TOLERANCE_MM && value <= node.boundsMm.max[axis] + CENTROID_TOLERANCE_MM);
}

/** Whether a decoded file holds exactly the shapes the index expects, each with its vertex count, around its recorded centre and wound outward. */
export function compareWithIndex(decoded: readonly DecodedNode[], expected: readonly ExpectedNode[]): AssetVerdict {
  const decodedByKey = new Map(decoded.map((node) => [nodeKey(node), node]));
  if (decodedByKey.size !== decoded.length) return refuse('contents_differ', 'the file draws one shape twice');
  if (decoded.length !== expected.length) return refuse('contents_differ', `the file holds ${decoded.length} shapes and the index expects ${expected.length}`);
  for (const node of expected) {
    const found = decodedByKey.get(nodeKey(node));
    if (found === undefined) return refuse('contents_differ', `the file has no shape for ${nodeKey(node)}`);
    if (found.positionsMm.length / 3 !== node.vertexCount) return refuse('contents_differ', `${nodeKey(node)} has a different number of vertices than the index records`);
    if (!isNear(found, node.centroidMm)) return refuse('contents_differ', `${nodeKey(node)} is not where the index records it`);
    if (!found.positionsMm.every(Number.isFinite)) return refuse('contents_differ', `${nodeKey(node)} holds a position that is not a number`);
    if (!(signedVolumeTimesSix(found) > 0)) return refuse('contents_differ', `${nodeKey(node)} is wound inward, so it would be drawn inside out. The file needs rebuilding; the viewer does not correct it`);
  }
  return { ok: true, nodes: [...decoded] };
}

async function sha256Hex(bytes: Uint8Array, subtle: SubtleCrypto): Promise<string> {
  const digest = new Uint8Array(await subtle.digest('SHA-256', bytes as BufferSource));
  return [...digest].map((byte) => byte.toString(HEX_RADIX).padStart(HEX_BYTE_WIDTH, '0')).join('');
}

/**
 * @param subtle the browser's digest interface, or undefined where the context offers none
 * @returns the decoded shapes, or why the file is refused. Never throws for a bad file.
 */
export async function verifyAsset(bytes: Uint8Array, asset: IndexAsset, expected: readonly ExpectedNode[], subtle: SubtleCrypto | undefined): Promise<AssetVerdict> {
  if (bytes.byteLength !== asset.bytes) return refuse('length_mismatch', `the file is ${bytes.byteLength} bytes and the index pins ${asset.bytes}`);
  if (subtle === undefined) return refuse('digest_unavailable', 'this page was not served securely, so the file cannot be checked');
  if ((await sha256Hex(bytes, subtle)) !== asset.sha256) return refuse('digest_mismatch', 'the file differs from the one the index pins');
  try {
    return compareWithIndex(decodeGlb(bytes), expected);
  } catch (error) {
    if (error instanceof GlbDecodeError) return refuse('not_geometry', error.message);
    throw error;
  }
}
