import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const MODEL_PATH = 'src/site/models/brain.glb';
const HEADER_BYTES = 12;
const CHUNK_HEADER_BYTES = 8;

interface GlbBufferView {
  byteOffset?: number;
  byteLength: number;
}

interface GlbDocument {
  images?: unknown[];
  textures?: unknown[];
  materials?: Record<string, unknown>[];
  meshes: { primitives: { attributes: Record<string, number> }[] }[];
  accessors: { bufferView: number; count: number }[];
  bufferViews: GlbBufferView[];
  buffers: { byteLength: number; uri?: string }[];
}

function readModel(): { document: GlbDocument; binaryLength: number } {
  const file = fs.readFileSync(path.resolve(MODEL_PATH));
  const jsonLength = file.readUInt32LE(HEADER_BYTES);
  const jsonStart = HEADER_BYTES + CHUNK_HEADER_BYTES;
  const document = JSON.parse(file.subarray(jsonStart, jsonStart + jsonLength).toString('utf8')) as GlbDocument;
  return { document, binaryLength: file.readUInt32LE(jsonStart + jsonLength) };
}

describe('brain.glb', () => {
  const { document, binaryLength } = readModel();

  // three.js loads an embedded texture through fetch(blob:), which the site's
  // connect-src 'self' policy blocks. Every consumer overrides the materials,
  // so the model must ship without images (see src/scripts/strip-glb-textures.mjs).
  it('embeds no images or textures', () => {
    expect(document.images ?? []).toEqual([]);
    expect(document.textures ?? []).toEqual([]);
    expect(JSON.stringify(document.materials ?? [])).not.toMatch(/Texture/);
  });

  it('keeps its geometry', () => {
    const positionAccessor = document.meshes[0].primitives[0].attributes.POSITION;
    expect(document.accessors[positionAccessor].count).toBeGreaterThan(0);
  });

  it('keeps every buffer view inside the binary chunk', () => {
    expect(document.buffers).toHaveLength(1);
    expect(document.buffers[0].uri).toBeUndefined();
    expect(document.buffers[0].byteLength).toBe(binaryLength);
    for (const view of document.bufferViews) {
      expect((view.byteOffset ?? 0) + view.byteLength).toBeLessThanOrEqual(binaryLength);
    }
  });
});
