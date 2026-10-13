import fs from 'node:fs';
import path from 'node:path';
import { webcrypto } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { loadAnatomyBundle } from '@/components/atlas-scene/load-anatomy-data';
import { compareWithIndex, listExpectedNodes, signedVolumeTimesSix, verifyAsset } from '../asset-integrity';
import { GlbDecodeError, decodeGlb } from '../decode-glb';
import { RAS_TO_SCENE_MATRIX, determinantOf, positionsToScene, rasToScene } from '../ras-to-scene';

const ASSET_ROOT = 'src/site/atlas-assets';
const { index } = loadAnatomyBundle();
const readAsset = (assetPath: string): Uint8Array => new Uint8Array(fs.readFileSync(path.join(ASSET_ROOT, assetPath)));
const subtle = webcrypto.subtle as unknown as SubtleCrypto;
const [firstAsset] = index.assets;
const firstBytes = readAsset(firstAsset.path);

/** A copy of a real file with its JSON chunk rewritten, padded to the same length so the header stays true. */
function withDocument(bytes: Uint8Array, edit: (document: Record<string, unknown>) => void): Uint8Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const jsonLength = view.getUint32(12, true);
  const document = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + jsonLength))) as Record<string, unknown>;
  edit(document);
  const encoded = new TextEncoder().encode(JSON.stringify(document));
  const padded = new Uint8Array(Math.ceil(encoded.length / 4) * 4).fill(0x20);
  padded.set(encoded);
  const copy = new Uint8Array(20 + padded.length + bytes.length - 20 - jsonLength);
  copy.set(bytes.subarray(0, 20));
  copy.set(padded, 20);
  copy.set(bytes.subarray(20 + jsonLength), 20 + padded.length);
  const copyView = new DataView(copy.buffer);
  copyView.setUint32(8, copy.length, true);
  copyView.setUint32(12, padded.length, true);
  return copy;
}
const firstNode = (document: Record<string, unknown>): Record<string, unknown> => (document.nodes as Array<Record<string, unknown>>)[0];

describe('decodeGlb on the committed assets (guard)', () => {
  it('reads every asset the index lists into exactly the shapes, vertex counts and places the index records', async () => {
    expect(index.assets.length).toBeGreaterThan(3);
    for (const asset of index.assets) {
      const verdict = await verifyAsset(readAsset(asset.path), asset, listExpectedNodes(index, asset.id), subtle);
      expect(verdict, asset.id).toMatchObject({ ok: true });
      if (verdict.ok) expect(verdict.nodes.length, asset.id).toBeGreaterThan(0);
    }
  });

  it('gives positions in millimetres inside a head-sized box, and triangles that name real vertices', () => {
    const [outline] = decodeGlb(firstBytes);
    expect(outline.positionsMm.length % 3).toBe(0);
    expect(outline.indices.length % 3).toBe(0);
    expect(Math.max(...outline.indices)).toBeLessThan(outline.positionsMm.length / 3);
    expect(outline.boundsMm.min.every((value) => value > -130 && value < 0)).toBe(true);
    expect(outline.boundsMm.max.every((value) => value < 130 && value > 0)).toBe(true);
  });
});

describe('decodeGlb on files that are not ours', () => {
  it('throws a typed error for bytes that are not a geometry file', () => {
    expect(() => decodeGlb(new Uint8Array(40))).toThrow(GlbDecodeError);
    expect(() => decodeGlb(new TextEncoder().encode('<html>not found</html>          '))).toThrow(/not a binary glTF file/);
    expect(() => decodeGlb(firstBytes.subarray(0, firstBytes.length - 4))).toThrow(/header does not describe this file/);
  });

  it('refuses anything but plain geometry: images, materials, extensions, rotations, extra attributes', () => {
    expect(() => decodeGlb(withDocument(firstBytes, (document) => { document.images = [{ uri: 'https://example.org/x.png' }]; }))).toThrow(/carries "images"/);
    expect(() => decodeGlb(withDocument(firstBytes, (document) => { document.materials = [{}]; }))).toThrow(/carries "materials"/);
    expect(() => decodeGlb(withDocument(firstBytes, (document) => { document.extensionsUsed = ['KHR_draco_mesh_compression']; }))).toThrow(/needs the extension "KHR_draco_mesh_compression"/);
    expect(() => decodeGlb(withDocument(firstBytes, (document) => { firstNode(document).rotation = [0, 0, 0, 1]; }))).toThrow(/carries "rotation"/);
    expect(() => decodeGlb(withDocument(firstBytes, (document) => { (document.buffers as unknown[]).push({ uri: 'more.bin', byteLength: 4 }); }))).toThrow(/more than one buffer/);
  });

  it('refuses a file that names bytes or vertices it does not hold', () => {
    expect(() => decodeGlb(withDocument(firstBytes, (document) => { (document.accessors as Array<Record<string, unknown>>)[0].count = 10_000_000; }))).toThrow(/reaches past/);
    expect(() => decodeGlb(withDocument(firstBytes, (document) => { (document.accessors as Array<Record<string, unknown>>)[0].count = 3; }))).toThrow(/names a vertex the mesh does not have/);
    expect(() => decodeGlb(withDocument(firstBytes, (document) => { firstNode(document).mesh = 9; }))).toThrow(/points at nothing/);
  });

  it('refuses a buffer that points at another file, sparse storage, a mirroring or zero scale, and a malformed extension list', () => {
    expect(() => decodeGlb(withDocument(firstBytes, (document) => { (document.buffers as Array<Record<string, unknown>>)[0].uri = 'https://example.org/other.bin'; }))).toThrow(/points at another file/);
    expect(() => decodeGlb(withDocument(firstBytes, (document) => { (document.accessors as Array<Record<string, unknown>>)[0].sparse = { count: 1 }; }))).toThrow(/stored sparsely/);
    expect(() => decodeGlb(withDocument(firstBytes, (document) => { firstNode(document).scale = [-1, 1, 1]; }))).toThrow(/scaled by zero or mirrored/);
    expect(() => decodeGlb(withDocument(firstBytes, (document) => { firstNode(document).scale = [0, 1, 1]; }))).toThrow(/scaled by zero or mirrored/);
    expect(() => decodeGlb(withDocument(firstBytes, (document) => { document.extensionsUsed = 'KHR_mesh_quantization'; }))).toThrow(/extensionsUsed is not a list/);
    expect(() => decodeGlb(withDocument(firstBytes, (document) => { document.nodes = Array.from({ length: 2001 }, () => firstNode(document)); }))).toThrow(/more than 2000 shapes/);
    expect(() => decodeGlb(withDocument(firstBytes, (document) => { (document.bufferViews as Array<Record<string, unknown>>)[0].byteLength = 6; }))).toThrow(/reaches past its buffer view/);
  });

  it('refuses a shape that does not say what it draws', () => {
    expect(() => decodeGlb(withDocument(firstBytes, (document) => { firstNode(document).extras = { atlas: 'x' }; }))).toThrow(/does not say which atlas label and side/);
    expect(() => decodeGlb(withDocument(firstBytes, (document) => { firstNode(document).scale = [1, 'a', 1]; }))).toThrow(/not three finite numbers/);
  });
});

describe('verifyAsset', () => {
  const expected = listExpectedNodes(index, firstAsset.id);

  it('refuses a file of the wrong length, a changed file, and any file where no digest can be taken', async () => {
    expect(await verifyAsset(firstBytes.subarray(0, firstBytes.length - 1), firstAsset, expected, subtle)).toMatchObject({ ok: false, refusal: 'length_mismatch' });
    const flipped = new Uint8Array(firstBytes);
    flipped[flipped.length - 1] ^= 1;
    expect(await verifyAsset(flipped, firstAsset, expected, subtle)).toMatchObject({ ok: false, refusal: 'digest_mismatch' });
    expect(await verifyAsset(firstBytes, firstAsset, expected, undefined)).toMatchObject({ ok: false, refusal: 'digest_unavailable' });
  });

  it('refuses a real file that the index describes differently: another build\'s shapes, counts or places', () => {
    const decoded = decodeGlb(firstBytes);
    expect(compareWithIndex(decoded, expected)).toMatchObject({ ok: true });
    expect(compareWithIndex(decoded, [])).toMatchObject({ ok: false, refusal: 'contents_differ' });
    expect(compareWithIndex(decoded, expected.map((node) => ({ ...node, vertexCount: node.vertexCount + 1 })))).toMatchObject({ ok: false, detail: expect.stringContaining('different number of vertices') });
    expect(compareWithIndex(decoded, expected.map((node) => ({ ...node, labelId: 'other' })))).toMatchObject({ ok: false, detail: expect.stringContaining('has no shape for') });
    expect(compareWithIndex(decoded, expected.map((node) => ({ ...node, centroidMm: [400, 0, 0] as const })))).toMatchObject({ ok: false, detail: expect.stringContaining('not where the index records it') });
    expect(compareWithIndex([...decoded, ...decoded], expected)).toMatchObject({ ok: false, detail: 'the file draws one shape twice' });
  });

  it('tells a mesh wound to face outward from one wound inward, and refuses a position that is not a number', () => {
    const tetrahedron = { positionsMm: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]), indices: new Uint32Array([0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3]) };
    const insideOut = { positionsMm: tetrahedron.positionsMm, indices: new Uint32Array([0, 1, 2, 0, 3, 1, 0, 2, 3, 1, 3, 2]) };
    expect(signedVolumeTimesSix(tetrahedron)).toBeCloseTo(1);
    expect(signedVolumeTimesSix(insideOut)).toBeCloseTo(-1);
    const decoded = decodeGlb(firstBytes);
    const broken = decoded.map((node) => ({ ...node, positionsMm: node.positionsMm.map((value, position) => (position === 0 ? Number.NaN : value)) }));
    expect(compareWithIndex(broken, expected)).toMatchObject({ ok: false, detail: expect.stringContaining('not a number') });
    expect(compareWithIndex(decoded, expected.map((node) => ({ ...node, centroidMm: [node.centroidMm[0], node.centroidMm[1] + 200, node.centroidMm[2]] as const })))).toMatchObject({ ok: false });
  });

  it('expects no mesh for a marker-only structure', () => {
    const markerNodes = index.structures.flatMap((structure) => structure.nodes).filter((node) => node.vertex_count === 0);
    expect(markerNodes.length).toBeGreaterThan(0);
    const allExpected = index.assets.flatMap((asset) => listExpectedNodes(index, asset.id));
    expect(allExpected.every((node) => node.vertexCount > 0)).toBe(true);
  });
});

describe('rasToScene', () => {
  it('is a rotation, so the brain cannot ship mirrored', () => {
    expect(determinantOf(RAS_TO_SCENE_MATRIX)).toBe(1);
    expect(determinantOf([[-1, 0, 0], [0, 0, 1], [0, -1, 0]])).toBe(-1);
  });

  it('keeps the person\'s left on scene left, puts up on up and the front away from the viewer', () => {
    expect(rasToScene([-40, 0, 0])[0]).toBeLessThan(0);
    expect(rasToScene([0, 0, 50])).toEqual([0, 50, -0]);
    expect(rasToScene([0, 60, 0])[2]).toBeLessThan(0);
    expect(RAS_TO_SCENE_MATRIX.map((row) => row[0] * 1 + row[1] * 2 + row[2] * 3)).toEqual(rasToScene([1, 2, 3]));
  });

  it('converts a flat list the same way', () => {
    expect([...positionsToScene(new Float32Array([1, 2, 3, -4, 5, 6]))]).toEqual([1, 3, -2, -4, 6, -5]);
  });
});
