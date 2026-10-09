// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { Box3, type BufferGeometry, type Mesh, type Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { describe, expect, it } from 'vitest';
import { loadAnatomyData } from '@/components/atlas-scene/load-anatomy-data';
import {
  BANNED_GLTF_KEYS, MANIFEST_NAME, findGeometryOnlyProblems, findHashProblems, findListingProblems, findNodeProblems, findUnknownLabelProblems, readGlbJson,
  type LoadedNode,
} from '../asset-guards';
import type { LabelTable } from '../anatomy-types';
import { assessBuildability } from '../licence-rules';
import { isAgreementAccepted } from '../anatomy-inputs';
import type { AssetManifest, ManifestAsset } from '../manifest-types';

const ASSET_DIRECTORY = 'src/site/atlas-assets';
const PIPELINE_BUILDABILITY_FILE = 'src/scripts/atlas-pipeline/registry/buildability.json';
/** The most the committed meshes may weigh together. Past it, context shapes are dropped before anything else. */
const TOTAL_ASSET_BUDGET_BYTES = 7_000_000;
const SERVED_EXTENSIONS = ['.glb', '.json', '.txt'];

const data = loadAnatomyData();
const manifest = data.manifest as AssetManifest;

function listServedFiles(directory: string, prefix = ''): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory()
    ? listServedFiles(path.join(directory, entry.name), `${prefix}${entry.name}/`)
    : [`${prefix}${entry.name}`]));
}

const readAsset = (assetPath: string): Uint8Array | null => {
  const filePath = path.join(ASSET_DIRECTORY, assetPath);
  return fs.existsSync(filePath) ? new Uint8Array(fs.readFileSync(filePath)) : null;
};

/** Parses bytes with the loader the page uses and lists each mesh node's ids, vertex count and world bounds. */
async function loadNodes(bytes: Uint8Array): Promise<LoadedNode[]> {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const gltf = await new GLTFLoader().parseAsync(buffer, '');
  gltf.scene.updateMatrixWorld(true);
  const nodes: LoadedNode[] = [];
  gltf.scene.traverse((object: Object3D) => {
    if (!(object as Mesh).isMesh) return;
    const mesh = object as Mesh<BufferGeometry>;
    const box = new Box3().setFromObject(mesh);
    nodes.push({ extras: mesh.userData, vertexCount: mesh.geometry.getAttribute('position').count, boundsMm: [box.min.toArray(), box.max.toArray()] });
  });
  return nodes;
}

function fixtureAsset(overrides: Partial<ManifestAsset> = {}): ManifestAsset {
  return { ...manifest.assets[0], ...overrides };
}

const fixtureTable = (atlas: string, ids: string[]): Map<string, LabelTable> =>
  new Map([[atlas, { schema_version: 1, atlas, labels: ids.map((id) => ({ id, name: id, hemisphere: 'both' as const })) }]]);

describe('asset guards on bad fixtures', () => {
  const asset = fixtureAsset();
  const bytes = readAsset(asset.path) as Uint8Array;

  it('fails a file whose bytes were changed, shortened or removed', () => {
    const flipped = Uint8Array.from(bytes);
    flipped[flipped.length - 1] ^= 0xff;
    const only = { ...manifest, assets: [asset] };
    expect(findHashProblems(only, () => bytes)).toEqual([]);
    expect(findHashProblems(only, () => flipped)).toEqual([`${asset.path}: sha256 on disk differs from the manifest`]);
    expect(findHashProblems(only, () => bytes.subarray(0, bytes.length - 4))[0]).toContain('bytes on disk');
    expect(findHashProblems(only, () => null)).toEqual([`${asset.path}: listed in the manifest but not on disk`]);
  });

  it('fails an orphan file and a missing asset in the served folder', () => {
    const complete = [MANIFEST_NAME, ...manifest.assets.map((item) => item.path), 'open/NOTICE.txt', 'by-sa/LICENSE.txt', 'open/labels-fixture_atlas.json'];
    expect(findListingProblems(manifest, complete)).toEqual([]);
    expect(findListingProblems(manifest, [...complete, 'open/stray.glb'])).toEqual(['open/stray.glb: on disk but not in the manifest']);
    expect(findListingProblems(manifest, [...complete, 'open/volume.nii.gz'])).toEqual(['open/volume.nii.gz: on disk but not in the manifest']);
    expect(findListingProblems(manifest, complete.filter((item) => item !== asset.path))).toEqual([`${asset.path}: in the manifest but not on disk`]);
  });

  it('fails a GLB that holds more than geometry, or is not a GLB', () => {
    const parsed = readGlbJson(bytes);
    if ('problem' in parsed) throw new Error(parsed.problem);
    const withTexture = JSON.stringify({ ...parsed.document, images: [{ uri: 'https://example.org/a.png' }], materials: [{}] });
    const padded = withTexture + ' '.repeat((4 - (new TextEncoder().encode(withTexture).length % 4)) % 4);
    const json = new TextEncoder().encode(padded);
    const rebuilt = new Uint8Array(20 + json.length);
    const view = new DataView(rebuilt.buffer);
    view.setUint32(0, 0x46546c67, true);
    view.setUint32(4, 2, true);
    view.setUint32(8, rebuilt.length, true);
    view.setUint32(12, json.length, true);
    view.setUint32(16, 0x4e4f534a, true);
    rebuilt.set(json, 20);
    expect(findGeometryOnlyProblems('fixture.glb', rebuilt)).toEqual(expect.arrayContaining([
      'fixture.glb: holds "images"; assets are geometry only', 'fixture.glb: holds "materials"; assets are geometry only',
    ]));
    expect(findGeometryOnlyProblems('fixture.glb', new Uint8Array(64))).toEqual(['fixture.glb: not a GLB file']);
    expect(findGeometryOnlyProblems('fixture.glb', bytes.subarray(0, bytes.length - 4))).toEqual(['fixture.glb: the GLB length field differs from the file length']);
    expect(BANNED_GLTF_KEYS.length).toBeGreaterThan(3);
  });

  it('fails a node whose id is not a label, a node the manifest does not list, a wrong count and a mesh out of bounds', async () => {
    const nodes = await loadNodes(bytes);
    const first = nodes[0];
    expect(findNodeProblems(asset, nodes, data.labelTables)).toEqual([]);
    expect(findNodeProblems(asset, nodes, fixtureTable(String(first.extras.atlas), ['some_other_label']))[0]).toContain('not in its atlas\'s label table');
    expect(findNodeProblems(asset, [{ ...first, extras: { ...first.extras, label_id: 'not_listed' } }], data.labelTables).join(' ')).toContain('the manifest lists no mesh for it');
    expect(findNodeProblems(asset, [{ ...first, vertexCount: first.vertexCount + 1 }], data.labelTables).join(' ')).toContain('vertices, the manifest says');
    const shifted: LoadedNode = { ...first, boundsMm: [first.boundsMm[0], [first.boundsMm[1][0] + 40, first.boundsMm[1][1], first.boundsMm[1][2]]] };
    expect(findNodeProblems(asset, [shifted], data.labelTables).join(' ')).toContain('outside the bounds');
    expect(findNodeProblems(asset, [], data.labelTables).join(' ')).toContain('but the file has none');
  });

  it('fails a manifest node, mesh or marker, whose label is not in its atlas\'s table', () => {
    const [node] = asset.nodes;
    const stray = { ...manifest, assets: [fixtureAsset({ nodes: [{ ...node, extras: { ...node.extras, label_id: 'not_a_label' } }] })] };
    expect(findUnknownLabelProblems(stray, data.labelTables)).toHaveLength(1);
    expect(findUnknownLabelProblems(stray, new Map())).toHaveLength(1);
  });
});

describe('the committed atlas assets (guards)', () => {
  it('ship at least the five built files, inside the byte budget', () => {
    expect(manifest.assets.length).toBeGreaterThanOrEqual(5);
    const totalBytes = manifest.assets.reduce((sum, asset) => sum + asset.bytes, 0);
    expect(totalBytes).toBeGreaterThan(0);
    expect(totalBytes).toBeLessThan(TOTAL_ASSET_BUDGET_BYTES);
  });

  it('hash to what the manifest says, and the served folder holds nothing else', () => {
    const listing = listServedFiles(ASSET_DIRECTORY);
    expect(listing.length).toBeGreaterThan(manifest.assets.length);
    expect(findHashProblems(manifest, readAsset)).toEqual([]);
    expect(findListingProblems(manifest, listing)).toEqual([]);
    expect(listing.filter((file) => !SERVED_EXTENSIONS.includes(path.extname(file)))).toEqual([]);
  });

  it('come only from sources that may build today, each from the folder its license requires', () => {
    const sourceIds = manifest.assets.flatMap((asset) => asset.source_ids);
    expect(sourceIds.length).toBeGreaterThan(0);
    expect(sourceIds.filter((sourceId) => data.buildabilityBySource.get(sourceId)?.buildable !== true)).toEqual([]);
    const shareAlike = manifest.assets.filter((asset) => asset.license_id === 'cc-by-sa-4.0');
    expect(shareAlike.length).toBeGreaterThan(0);
    expect(shareAlike.filter((asset) => !asset.path.startsWith('by-sa/'))).toEqual([]);
    expect(manifest.assets.filter((asset) => asset.license_id !== 'cc-by-sa-4.0' && !asset.path.startsWith('open/'))).toEqual([]);
  });

  it('parse with the real loader as geometry only, with every node id in its label table and counts and bounds as recorded', async () => {
    let meshCount = 0;
    for (const asset of manifest.assets) {
      const bytes = readAsset(asset.path) as Uint8Array;
      expect(findGeometryOnlyProblems(asset.path, bytes)).toEqual([]);
      const nodes = await loadNodes(bytes);
      meshCount += nodes.length;
      expect(findNodeProblems(asset, nodes, data.labelTables)).toEqual([]);
    }
    expect(meshCount).toBeGreaterThan(200);
    expect(findUnknownLabelProblems(manifest, data.labelTables)).toEqual([]);
  });

  it('never give a mesh to a structure too small to outline, and do ship such structures as markers', () => {
    const nodes = manifest.assets.flatMap((asset) => asset.nodes);
    const unresolved = nodes.filter((node) => node.size_class === 'unresolved');
    expect(unresolved.length).toBeGreaterThan(0);
    expect(unresolved.filter((node) => node.vertex_count > 0)).toEqual([]);
    expect(nodes.filter((node) => node.size_class !== 'unresolved' && node.size_class !== 'not_drawn' && node.vertex_count === 0)).toEqual([]);
  });

  it('record a mirrored hemisphere for every Allen asset and an independent position check only where one passed', () => {
    const allen = manifest.assets.filter((asset) => asset.source_ids.includes('allen_hra_3d_2020'));
    expect(allen.length).toBe(2);
    expect(allen.filter((asset) => asset.delineation.hemispheres !== 'mirrored')).toEqual([]);
    const checked = manifest.assets.filter((asset) => asset.position_check === 'independently checked');
    expect(checked.map((asset) => asset.id)).toEqual(['cortex-allen']);
    expect(checked.every((asset) => asset.checks.some((check) => check.id === 'V1' && check.status === 'pass'))).toBe(true);
    expect(manifest.assets.find((asset) => asset.id === 'deep-allen')?.checks.find((check) => check.id === 'V2')?.status).toBe('fail');
  });
});

describe('the pipeline\'s buildability rule (guard)', () => {
  const pipelineAnswers = (JSON.parse(fs.readFileSync(PIPELINE_BUILDABILITY_FILE, 'utf-8')) as { sources: Record<string, string[]> }).sources;
  const fromRegistry = (sourceId: string): string[] => pipelineAnswers[sourceId];

  it('agrees with the site\'s rule on every source in the registry', () => {
    const fromPipeline = pipelineAnswers;
    const fromSite = Object.fromEntries(data.sources.sources.map((source) => {
      const verdict = data.verdictBySource.get(source.id);
      if (verdict === undefined) throw new Error(`no verdict for ${source.id}`);
      return [source.id, assessBuildability(source, verdict, { agreementAccepted: isAgreementAccepted(verdict, data.ledger) }).blockers];
    }));
    expect(Object.keys(fromPipeline).length).toBeGreaterThan(10);
    expect(fromPipeline).toEqual(fromSite);
  });

  it('would notice a rule that drifted', () => {
    const [source] = data.sources.sources;
    const verdict = data.verdictBySource.get(source.id);
    if (verdict === undefined) throw new Error('fixture source has no verdict');
    const drifted = assessBuildability({ ...source, redistribute: false }, verdict, { agreementAccepted: false }).blockers;
    expect(drifted).toContain('not_redistributable');
    expect(drifted).not.toEqual(fromRegistry(source.id));
  });
});
