/**
 * Reads the atlas's own geometry files: binary glTF holding triangles and
 * nothing else. Every node carries the atlas, label and side it draws, a scale
 * and a translation, and one mesh of quantised positions with indices.
 *
 * This is a strict reader for exactly that shape, not a general glTF loader.
 * Anything else (a texture, a material, an image, a rotation, a second buffer,
 * an offset past the end of the file) is refused, so a file that is not one of
 * ours is never drawn. Positions come out in millimetres in the file's own
 * axes; nothing here knows about the screen.
 */

import { isRecord } from '@/lib/threat-model/guards';
import { HEMISPHERES, type Hemisphere } from './anatomy-types';

export const GLB_FAILURES = ['not_glb', 'unsupported', 'malformed', 'out_of_bounds'] as const;
export type GlbFailure = typeof GLB_FAILURES[number];

/** A geometry file is not one this reader accepts. */
export class GlbDecodeError extends Error {
  readonly failure: GlbFailure;

  constructor(failure: GlbFailure, detail: string) {
    super(`The geometry file cannot be used: ${detail}. Rebuild the atlas assets; a file that fails this check is never drawn.`);
    this.name = 'GlbDecodeError';
    this.failure = failure;
  }
}

export interface DecodedNode {
  atlas: string;
  labelId: string;
  hemisphere: Hemisphere;
  /** x, y, z per vertex, in millimetres, in the file's axes. */
  positionsMm: Float32Array;
  /** Three vertex numbers per triangle. */
  indices: Uint32Array;
  boundsMm: { min: [number, number, number]; max: [number, number, number] };
}

const GLB_MAGIC = 0x46546c67;
const GLB_VERSION = 2;
const JSON_CHUNK = 0x4e4f534a;
const BINARY_CHUNK = 0x004e4942;
const HEADER_BYTES = 12;
const CHUNK_HEADER_BYTES = 8;
const INT16 = 5122;
const UINT16 = 5123;
const UINT32 = 5125;
const INT16_SCALE = 32767;
const TRIANGLES = 4;
const VERTEX_COMPONENTS = 3;
const TRIANGLE_CORNERS = 3;
const ALLOWED_TOP_LEVEL_KEYS = ['accessors', 'asset', 'bufferViews', 'buffers', 'extensionsRequired', 'extensionsUsed', 'meshes', 'nodes', 'scene', 'scenes'];
const ALLOWED_EXTENSIONS = ['KHR_mesh_quantization'];
const ALLOWED_NODE_KEYS = ['extras', 'mesh', 'name', 'scale', 'translation'];

function fail(failure: GlbFailure, detail: string): never {
  throw new GlbDecodeError(failure, detail);
}

function requireList(value: unknown, what: string): Record<string, unknown>[] {
  if (!Array.isArray(value) || !value.every(isRecord)) return fail('malformed', `${what} is not a list of objects`);
  return value;
}

function requireIndex(value: unknown, length: number, what: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value >= length) return fail('malformed', `${what} points at nothing`);
  return value;
}

function requireTriple(value: unknown, what: string): [number, number, number] {
  const isTriple = Array.isArray(value) && value.length === VERTEX_COMPONENTS && value.every((item) => typeof item === 'number' && Number.isFinite(item));
  if (!isTriple) return fail('malformed', `${what} is not three finite numbers`);
  return value as [number, number, number];
}

interface Chunks {
  document: Record<string, unknown>;
  binary: Uint8Array;
}

function readChunks(bytes: Uint8Array): Chunks {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength < HEADER_BYTES + CHUNK_HEADER_BYTES || view.getUint32(0, true) !== GLB_MAGIC) return fail('not_glb', 'it is not a binary glTF file');
  if (view.getUint32(4, true) !== GLB_VERSION || view.getUint32(8, true) !== bytes.byteLength) return fail('not_glb', 'its header does not describe this file');
  const jsonLength = view.getUint32(HEADER_BYTES, true);
  const jsonEnd = HEADER_BYTES + CHUNK_HEADER_BYTES + jsonLength;
  if (view.getUint32(HEADER_BYTES + 4, true) !== JSON_CHUNK || jsonEnd + CHUNK_HEADER_BYTES > bytes.byteLength) return fail('malformed', 'its first chunk is not a description');
  const binaryLength = view.getUint32(jsonEnd, true);
  if (view.getUint32(jsonEnd + 4, true) !== BINARY_CHUNK || jsonEnd + CHUNK_HEADER_BYTES + binaryLength !== bytes.byteLength) return fail('malformed', 'its second chunk is not the geometry, or more follows it');
  let document: unknown;
  try {
    document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(HEADER_BYTES + CHUNK_HEADER_BYTES, jsonEnd)));
  } catch (error) {
    return fail('malformed', `its description is not JSON (${error instanceof Error ? error.name : 'unknown error'})`);
  }
  if (!isRecord(document)) return fail('malformed', 'its description is not an object');
  return { document, binary: bytes.subarray(jsonEnd + CHUNK_HEADER_BYTES) };
}

/** Geometry only: no key this reader does not read, one buffer, and no extension but position quantisation. */
function rejectUnsupported(document: Record<string, unknown>): void {
  const strayKey = Object.keys(document).find((key) => !ALLOWED_TOP_LEVEL_KEYS.includes(key));
  if (strayKey !== undefined) fail('unsupported', `it carries "${strayKey}", and only geometry is accepted`);
  const extensions = [document.extensionsUsed, document.extensionsRequired].flatMap((list) => (Array.isArray(list) ? list : []));
  const strayExtension = extensions.find((extension) => !ALLOWED_EXTENSIONS.includes(String(extension)));
  if (strayExtension !== undefined) fail('unsupported', `it needs the extension "${String(strayExtension)}"`);
  if (requireList(document.buffers, 'buffers').length !== 1) fail('unsupported', 'it has more than one buffer');
}

interface Tables {
  accessors: Record<string, unknown>[];
  bufferViews: Record<string, unknown>[];
  meshes: Record<string, unknown>[];
  binary: Uint8Array;
}

/** The bytes an accessor covers, after checking that every one of them lies inside the file. */
function sliceAccessor(tables: Tables, accessorIndex: unknown, bytesPerItem: number, what: string): { view: DataView; count: number } {
  const accessor = tables.accessors[requireIndex(accessorIndex, tables.accessors.length, what)];
  const bufferView = tables.bufferViews[requireIndex(accessor.bufferView, tables.bufferViews.length, `${what} buffer view`)];
  const count = requireIndex(accessor.count, Number.MAX_SAFE_INTEGER, `${what} count`);
  const offset = requireIndex(bufferView.byteOffset ?? 0, tables.binary.byteLength + 1, `${what} offset`) + requireIndex(accessor.byteOffset ?? 0, tables.binary.byteLength + 1, `${what} offset`);
  if (bufferView.byteStride !== undefined || offset + count * bytesPerItem > tables.binary.byteLength) fail('out_of_bounds', `${what} reaches past the end of the file`);
  return { view: new DataView(tables.binary.buffer, tables.binary.byteOffset + offset, count * bytesPerItem), count };
}

function readPositions(tables: Tables, accessorIndex: unknown, scale: [number, number, number], translation: [number, number, number]): Float32Array {
  const accessor = tables.accessors[requireIndex(accessorIndex, tables.accessors.length, 'positions')];
  if (accessor.componentType !== INT16 || accessor.type !== 'VEC3' || accessor.normalized !== true) fail('unsupported', 'positions are not normalised 16-bit triples');
  const { view, count } = sliceAccessor(tables, accessorIndex, VERTEX_COMPONENTS * Int16Array.BYTES_PER_ELEMENT, 'positions');
  const positions = new Float32Array(count * VERTEX_COMPONENTS);
  for (let item = 0; item < positions.length; item += 1) {
    const axis = item % VERTEX_COMPONENTS;
    const unit = Math.max(view.getInt16(item * Int16Array.BYTES_PER_ELEMENT, true) / INT16_SCALE, -1);
    positions[item] = unit * scale[axis] + translation[axis];
  }
  return positions;
}

function readIndices(tables: Tables, accessorIndex: unknown, vertexCount: number): Uint32Array {
  const accessor = tables.accessors[requireIndex(accessorIndex, tables.accessors.length, 'indices')];
  const isShort = accessor.componentType === UINT16;
  if ((!isShort && accessor.componentType !== UINT32) || accessor.type !== 'SCALAR') fail('unsupported', 'indices are not unsigned 16-bit or 32-bit numbers');
  const width = isShort ? Uint16Array.BYTES_PER_ELEMENT : Uint32Array.BYTES_PER_ELEMENT;
  const { view, count } = sliceAccessor(tables, accessorIndex, width, 'indices');
  if (count % TRIANGLE_CORNERS !== 0) fail('malformed', 'the indices do not make whole triangles');
  const indices = new Uint32Array(count);
  for (let item = 0; item < count; item += 1) {
    indices[item] = isShort ? view.getUint16(item * width, true) : view.getUint32(item * width, true);
    if (indices[item] >= vertexCount) fail('out_of_bounds', 'a triangle names a vertex the mesh does not have');
  }
  return indices;
}

function measureBounds(positions: Float32Array): DecodedNode['boundsMm'] {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (let item = 0; item < positions.length; item += 1) {
    const axis = item % VERTEX_COMPONENTS;
    if (positions[item] < min[axis]) min[axis] = positions[item];
    if (positions[item] > max[axis]) max[axis] = positions[item];
  }
  return { min, max };
}

function readIdentity(node: Record<string, unknown>): Pick<DecodedNode, 'atlas' | 'labelId' | 'hemisphere'> {
  const extras = isRecord(node.extras) ? node.extras : {};
  const { atlas, label_id: labelId, hemisphere } = extras;
  const isHemisphere = typeof hemisphere === 'string' && (HEMISPHERES as readonly string[]).includes(hemisphere);
  if (typeof atlas !== 'string' || atlas === '' || typeof labelId !== 'string' || labelId === '' || !isHemisphere) return fail('malformed', 'a shape does not say which atlas label and side it draws');
  return { atlas, labelId, hemisphere: hemisphere as Hemisphere };
}

function decodeNode(node: Record<string, unknown>, tables: Tables): DecodedNode {
  const strayKey = Object.keys(node).find((key) => !ALLOWED_NODE_KEYS.includes(key));
  if (strayKey !== undefined) fail('unsupported', `a shape carries "${strayKey}"; only a scale and a translation are accepted`);
  const mesh = tables.meshes[requireIndex(node.mesh, tables.meshes.length, 'a shape\'s mesh')];
  const primitives = requireList(mesh.primitives, 'primitives');
  const [primitive] = primitives;
  const attributes = primitive !== undefined && isRecord(primitive.attributes) ? primitive.attributes : {};
  const hasOnlyPositions = Object.keys(attributes).length === 1 && Object.keys(primitive ?? {}).every((key) => ['attributes', 'indices', 'mode'].includes(key));
  if (primitives.length !== 1 || primitive.mode !== TRIANGLES || !hasOnlyPositions) fail('unsupported', 'a mesh is not one plain set of triangles');
  const positionsMm = readPositions(tables, attributes.POSITION, requireTriple(node.scale ?? [1, 1, 1], 'a scale'), requireTriple(node.translation ?? [0, 0, 0], 'a translation'));
  return { ...readIdentity(node), positionsMm, indices: readIndices(tables, primitive.indices, positionsMm.length / VERTEX_COMPONENTS), boundsMm: measureBounds(positionsMm) };
}

/**
 * @returns every shape in the file, in file order
 * @throws GlbDecodeError when the file is not one of the atlas's geometry files, or names bytes it does not hold
 */
export function decodeGlb(bytes: Uint8Array): DecodedNode[] {
  const { document, binary } = readChunks(bytes);
  rejectUnsupported(document);
  const tables: Tables = { accessors: requireList(document.accessors, 'accessors'), bufferViews: requireList(document.bufferViews, 'bufferViews'), meshes: requireList(document.meshes, 'meshes'), binary };
  if (tables.bufferViews.some((bufferView) => bufferView.buffer !== 0)) fail('unsupported', 'a buffer view names a second buffer');
  return requireList(document.nodes, 'nodes').map((node) => decodeNode(node, tables));
}
