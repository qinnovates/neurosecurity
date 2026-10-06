#!/usr/bin/env node
/**
 * Removes embedded images and textures from a binary glTF (.glb) and repacks it.
 *
 * Why: three.js loads an embedded texture by turning it into a blob: URL and
 * fetching it, which the site's Content-Security-Policy (connect-src 'self')
 * refuses. Every consumer of brain.glb replaces the model's materials with flat
 * colours, so the texture is dead weight. Stripping it keeps the policy strict.
 *
 * Usage: node src/scripts/strip-glb-textures.mjs <input.glb> <output.glb>
 * Both paths must be inside the current working directory.
 */
import fs from 'node:fs';
import path from 'node:path';

const GLB_MAGIC = 0x46546c67;
const GLB_VERSION = 2;
const JSON_CHUNK_TYPE = 0x4e4f534a;
const BIN_CHUNK_TYPE = 0x004e4942;
const HEADER_BYTES = 12;
const CHUNK_HEADER_BYTES = 8;
const ALIGNMENT_BYTES = 4;
const JSON_PADDING = 0x20;
const MATERIAL_TEXTURE_SLOTS = ['normalTexture', 'occlusionTexture', 'emissiveTexture'];
const PBR_TEXTURE_SLOTS = ['baseColorTexture', 'metallicRoughnessTexture'];

function alignUp(byteLength) {
  return Math.ceil(byteLength / ALIGNMENT_BYTES) * ALIGNMENT_BYTES;
}

function resolveInsideWorkingDirectory(candidate) {
  const root = process.cwd();
  const resolved = path.resolve(root, candidate);
  if (!resolved.startsWith(root + path.sep)) {
    throw new Error(`Refusing path outside the working directory: ${candidate}`);
  }
  return resolved;
}

function readGlb(buffer) {
  if (buffer.length < HEADER_BYTES + CHUNK_HEADER_BYTES || buffer.readUInt32LE(0) !== GLB_MAGIC) {
    throw new Error('Input is not a binary glTF file (bad magic number).');
  }
  if (buffer.readUInt32LE(4) !== GLB_VERSION) {
    throw new Error(`Only glTF ${GLB_VERSION} is supported; this file is version ${buffer.readUInt32LE(4)}.`);
  }
  const jsonLength = buffer.readUInt32LE(HEADER_BYTES);
  const jsonStart = HEADER_BYTES + CHUNK_HEADER_BYTES;
  if (buffer.readUInt32LE(HEADER_BYTES + 4) !== JSON_CHUNK_TYPE) {
    throw new Error('First GLB chunk is not JSON.');
  }
  const binHeader = jsonStart + jsonLength;
  if (buffer.readUInt32LE(binHeader + 4) !== BIN_CHUNK_TYPE) {
    throw new Error('Second GLB chunk is not BIN.');
  }
  const binStart = binHeader + CHUNK_HEADER_BYTES;
  return {
    json: JSON.parse(buffer.subarray(jsonStart, binHeader).toString('utf8')),
    bin: buffer.subarray(binStart, binStart + buffer.readUInt32LE(binHeader)),
  };
}

/** Fails on features this script does not rewrite, rather than emitting a subtly broken file. */
function assertSupported(json) {
  if ((json.extensionsUsed ?? []).length > 0) {
    throw new Error(`Extensions are not handled: ${json.extensionsUsed.join(', ')}. Extend the script before using it on this file.`);
  }
  if (json.buffers?.length !== 1 || json.buffers[0].uri !== undefined) {
    throw new Error('Expected exactly one buffer, embedded in the GLB.');
  }
  if ((json.accessors ?? []).some((accessor) => accessor.sparse !== undefined)) {
    throw new Error('Sparse accessors are not handled.');
  }
}

function stripTextureReferences(json) {
  for (const material of json.materials ?? []) {
    for (const slot of MATERIAL_TEXTURE_SLOTS) delete material[slot];
    for (const slot of PBR_TEXTURE_SLOTS) delete material.pbrMetallicRoughness?.[slot];
  }
  const imageBufferViews = new Set((json.images ?? []).map((image) => image.bufferView).filter((index) => index !== undefined));
  delete json.images;
  delete json.textures;
  delete json.samplers;
  return imageBufferViews;
}

/** Drops the given buffer views, packs the rest back to back, and renumbers accessor references. */
function repackBuffer(json, bin, droppedBufferViews) {
  const newIndexByOldIndex = new Map();
  const keptViews = [];
  const segments = [];
  let byteOffset = 0;
  json.bufferViews.forEach((view, oldIndex) => {
    if (droppedBufferViews.has(oldIndex)) return;
    const start = view.byteOffset ?? 0;
    const paddedLength = alignUp(view.byteLength);
    const segment = Buffer.alloc(paddedLength);
    bin.copy(segment, 0, start, start + view.byteLength);
    newIndexByOldIndex.set(oldIndex, keptViews.length);
    keptViews.push({ ...view, byteOffset });
    segments.push(segment);
    byteOffset += paddedLength;
  });
  for (const accessor of json.accessors ?? []) {
    if (accessor.bufferView === undefined) continue;
    const newIndex = newIndexByOldIndex.get(accessor.bufferView);
    if (newIndex === undefined) {
      throw new Error(`An accessor reads buffer view ${accessor.bufferView}, which held image data.`);
    }
    accessor.bufferView = newIndex;
  }
  json.bufferViews = keptViews;
  json.buffers[0].byteLength = byteOffset;
  return Buffer.concat(segments, byteOffset);
}

function writeGlb(json, bin) {
  const jsonBytes = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonChunk = Buffer.alloc(alignUp(jsonBytes.length), JSON_PADDING);
  jsonBytes.copy(jsonChunk);
  const totalLength = HEADER_BYTES + CHUNK_HEADER_BYTES + jsonChunk.length + CHUNK_HEADER_BYTES + bin.length;
  const header = Buffer.alloc(HEADER_BYTES + CHUNK_HEADER_BYTES);
  header.writeUInt32LE(GLB_MAGIC, 0);
  header.writeUInt32LE(GLB_VERSION, 4);
  header.writeUInt32LE(totalLength, 8);
  header.writeUInt32LE(jsonChunk.length, HEADER_BYTES);
  header.writeUInt32LE(JSON_CHUNK_TYPE, HEADER_BYTES + 4);
  const binHeader = Buffer.alloc(CHUNK_HEADER_BYTES);
  binHeader.writeUInt32LE(bin.length, 0);
  binHeader.writeUInt32LE(BIN_CHUNK_TYPE, 4);
  return Buffer.concat([header, jsonChunk, binHeader, bin], totalLength);
}

/** Proves the geometry survived: every accessor's bytes must match the original exactly. */
function assertGeometryUnchanged(original, stripped) {
  original.json.accessors.forEach((accessor, index) => {
    const before = original.json.bufferViews[accessor.bufferView];
    const after = stripped.json.bufferViews[stripped.json.accessors[index].bufferView];
    const beforeBytes = original.bin.subarray(before.byteOffset ?? 0, (before.byteOffset ?? 0) + before.byteLength);
    const afterBytes = stripped.bin.subarray(after.byteOffset, after.byteOffset + after.byteLength);
    if (!beforeBytes.equals(afterBytes)) {
      throw new Error(`Accessor ${index} changed during repacking; output not written.`);
    }
  });
}

function stripGlbTextures(inputBuffer) {
  const original = readGlb(inputBuffer);
  assertSupported(original.json);
  const json = structuredClone(original.json);
  const droppedBufferViews = stripTextureReferences(json);
  const bin = repackBuffer(json, original.bin, droppedBufferViews);
  const output = writeGlb(json, bin);
  assertGeometryUnchanged(original, readGlb(output));
  return { output, removedImages: original.json.images?.length ?? 0 };
}

function main() {
  const [inputArgument, outputArgument] = process.argv.slice(2);
  if (!inputArgument || !outputArgument) {
    throw new Error('Usage: node src/scripts/strip-glb-textures.mjs <input.glb> <output.glb>');
  }
  const inputPath = resolveInsideWorkingDirectory(inputArgument);
  const outputPath = resolveInsideWorkingDirectory(outputArgument);
  const inputBuffer = fs.readFileSync(inputPath);
  const { output, removedImages } = stripGlbTextures(inputBuffer);
  fs.writeFileSync(outputPath, output);
  console.log(`[strip-glb-textures] removed ${removedImages} embedded image(s): ${inputBuffer.length} -> ${output.length} bytes`);
}

try {
  main();
} catch (error) {
  console.error(`[strip-glb-textures] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
