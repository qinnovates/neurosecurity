import { describe, expect, it } from 'vitest';
import { AnatomyDataError } from '../errors';
import { parseLabelTable } from '../parse-label-table';
import { parseManifest } from '../parse-manifest';
import { FIXTURE_ATLAS_ID, OTHER_SHA256 } from './anatomy-fixtures';
import { FIXTURE_ASSET_PATH, buildAsset, buildManifest, buildManifestContext, buildNode } from './manifest-fixtures';

const CONTEXT = buildManifestContext();
const parseWith = (asset: unknown): unknown => parseManifest(buildManifest([asset as never]), CONTEXT);

describe('parseManifest', () => {
  it('accepts a valid manifest', () => {
    expect(parseManifest(buildManifest(), CONTEXT).assets.map((asset) => asset.path)).toEqual([FIXTURE_ASSET_PATH]);
  });

  it('rejects an unknown schema version', () => {
    expect(() => parseManifest({ ...buildManifest(), schema_version: 3 }, CONTEXT)).toThrow(/schema_version: version 3 is not one this build understands/);
  });

  it.each([
    ['../secrets.glb', 'a parent path'],
    ['open/../by-sa/x.glb', 'a parent segment'],
    ['gated/deep.aaaaaaaaaaaa.glb', 'a folder that is not open or by-sa'],
    ['open/sub/deep.aaaaaaaaaaaa.glb', 'a nested folder'],
    ['open/Deep.aaaaaaaaaaaa.glb', 'an upper-case name'],
    ['/open/deep.aaaaaaaaaaaa.glb', 'an absolute path'],
    ['https://example.org/deep.aaaaaaaaaaaa.glb', 'a URL'],
  ])('rejects the asset path "%s" (%s)', (path) => {
    expect(() => parseWith(buildAsset({ path }))).toThrow(/assets\[0\]\.path: .* is not an allowed asset path/);
  });

  it('rejects a file name that does not carry the start of the file\'s own hash', () => {
    expect(() => parseWith(buildAsset({ sha256: OTHER_SHA256 }))).toThrow(/assets\[0\]\.path: the file name must contain "bbbbbbbbbbbb"/);
  });

  it('rejects an asset in the wrong folder for its licence', () => {
    const context = buildManifestContext({ effectiveLicenceBySource: new Map([[FIXTURE_ATLAS_ID, 'cc-by-sa-4.0']]) });
    expect(() => parseManifest(buildManifest([buildAsset({ license_id: 'cc-by-sa-4.0' })]), context))
      .toThrow(/assets\[0\]\.path: an asset under "cc-by-sa-4\.0" belongs in "by-sa\/"/);
  });

  it('rejects an asset whose source is not buildable today', () => {
    const context = buildManifestContext({ buildableSourceIds: new Set() });
    expect(() => parseManifest(buildManifest(), context))
      .toThrow(/assets\[0\]\.source_ids: source "fixture_atlas" is not buildable, so no file made from it may ship/);
  });

  it('rejects a source the registry does not hold, and an asset with no source', () => {
    expect(() => parseWith(buildAsset({ source_ids: ['stray_atlas'] }))).toThrow(/"stray_atlas" is not a source in the registry/);
    expect(() => parseWith(buildAsset({ source_ids: [] }))).toThrow(/source_ids: an asset must name the sources its material comes from/);
  });

  it('rejects a licence id that is not the one its source is handled under', () => {
    expect(() => parseWith(buildAsset({ license_id: 'cc0-1.0' }))).toThrow(/license_id: "cc0-1\.0" is not the licence "cc-by-4\.0" that source "fixture_atlas" is handled under/);
    expect(() => parseWith(buildAsset({ stated_license_id: 'mit' }))).toThrow(/stated_license_id/);
  });

  it('rejects a template space other than the declared one', () => {
    expect(() => parseManifest({ ...buildManifest(), template_space: 'ElsewhereSpace' }, CONTEXT)).toThrow(/template_space/);
  });

  it('rejects an unresolved structure that has a mesh, and a resolved one that has none', () => {
    expect(() => parseWith(buildAsset({ nodes: [buildNode({ size_class: 'unresolved' })] })))
      .toThrow(/nodes\[0\]\.vertex_count: an "unresolved" structure must have no mesh/);
    expect(() => parseWith(buildAsset({ nodes: [buildNode({ vertex_count: 0 })] })))
      .toThrow(/nodes\[0\]\.vertex_count: a "resolved" structure must have a mesh/);
  });

  it('rejects a node whose atlas is not one of the asset\'s sources, and a node listed twice', () => {
    const strayNode = buildNode({ extras: { atlas: 'stray_atlas', label_id: '7', hemisphere: 'both' } });
    expect(() => parseWith(buildAsset({ nodes: [strayNode] }))).toThrow(/extras\.atlas: "stray_atlas" is not one of this asset's sources/);
    expect(() => parseWith(buildAsset({ nodes: [buildNode(), buildNode()] }))).toThrow(/node "fixture_atlas:7:both" appears twice/);
  });

  it('rejects a check that did not run and gives no reason', () => {
    const checks = [{ id: 'K6', status: 'not_run', measured: null, threshold: null }];
    expect(() => parseWith(buildAsset({ checks: checks as never }))).toThrow(/checks\[0\]\.reason: a check that did not run must say why/);
  });

  it('rejects two assets with one id or one path, a malformed hash and an unknown key', () => {
    expect(() => parseManifest(buildManifest([buildAsset(), buildAsset()]), CONTEXT)).toThrow(/asset id "deep-fixture" appears twice/);
    expect(() => parseWith(buildAsset({ sha256: 'not-a-hash' }))).toThrow(/assets\[0\]\.sha256/);
    expect(() => parseWith({ ...buildAsset(), visual_check: { state: 'done' } })).toThrow(/unexpected key "visual_check"/);
  });

  describe('stage fingerprints', () => {
    const stages = buildAsset().stage_fingerprints;
    const withStages = (overrides: object): unknown => parseWith(buildAsset({ stage_fingerprints: { ...stages, ...overrides } as never }));
    const register = {
      archive_sha256: { 'fixture_warp.h5': OTHER_SHA256 }, setting: 'fixture-setting', tool: 'fixture-tool', tool_version: '1.0.0', seed: 7,
      parameters: { metric: 'fixture', iterations: 100, verbose: false },
    };

    it('accepts fetched files that match the registry pins, with or without a registration record', () => {
      expect(() => withStages({})).not.toThrow();
      expect((withStages({ register }) as { assets: Array<{ stage_fingerprints: { register: unknown } }> }).assets[0].stage_fingerprints.register).toEqual(register);
    });

    it('rejects a fetched file whose sha256 differs from the registry pin', () => {
      expect(() => withStages({ fetch: { 'labels.nii.gz': OTHER_SHA256 } })).toThrow(/stage_fingerprints\.fetch\.labels\.nii\.gz: the sha256 differs from the registry's pin/);
    });

    it('rejects a fetched file the registry does not list for the asset\'s sources, or has not pinned', () => {
      expect(() => withStages({ fetch: { 'stray.nii.gz': OTHER_SHA256 } })).toThrow(/fetch\.stray\.nii\.gz: this file is not listed in the registry/);
      const unpinned = buildManifestContext({ filePinsBySource: new Map([[FIXTURE_ATLAS_ID, new Map([['labels.nii.gz', null]])]]) });
      expect(() => parseManifest(buildManifest(), unpinned)).toThrow(/fetch\.labels\.nii\.gz: the registry has no sha256 pin for this file/);
    });

    it('rejects an empty fetch stage, a digest where the fetch map belongs, and a malformed registration record', () => {
      expect(() => withStages({ fetch: {} })).toThrow(/stage_fingerprints\.fetch: expected file names with their sha256 digests/);
      expect(() => withStages({ fetch: OTHER_SHA256 })).toThrow(/stage_fingerprints\.fetch/);
      expect(() => withStages({ register: OTHER_SHA256 })).toThrow(/stage_fingerprints\.register: expected an object/);
      expect(() => withStages({ register: { ...register, seed: 1.5 } })).toThrow(/register\.seed/);
      expect(() => withStages({ register: { ...register, parameters: { nested: { a: 1 } } } })).toThrow(/register\.parameters/);
      expect(() => withStages({ register: { ...register, archive_sha256: {} } })).toThrow(/register\.archive_sha256/);
      expect(() => withStages({ mesh: 'not-a-digest' })).toThrow(/stage_fingerprints\.mesh/);
    });
  });

  it('rejects an asset with no modification note, an empty one, or one holding a line break or a hidden mark', () => {
    const { modification_note: _omitted, ...withoutNote } = buildAsset();
    expect(() => parseWith(withoutNote)).toThrow(/assets\[0\]: missing key "modification_note"/);
    expect(() => parseWith(buildAsset({ modification_note: '   ' }))).toThrow(/assets\[0\]\.modification_note: expected a non-empty string/);
    expect(() => parseWith(buildAsset({ modification_note: 'Thresholded.\nThen meshed.' }))).toThrow(/modification_note: the text holds a control character/);
    expect(() => parseWith(buildAsset({ modification_note: 'x'.repeat(601) }))).toThrow(/modification_note/);
    expect((parseWith(buildAsset()) as { assets: Array<{ modification_note: string }> }).assets[0].modification_note).toContain('Thresholded');
  });

  it('rejects a source listed both as material and as a pipeline-only input', () => {
    expect(() => parseWith(buildAsset({ computed_with_source_ids: [FIXTURE_ATLAS_ID] }))).toThrow(/computed_with_source_ids: "fixture_atlas" is also in source_ids/);
  });

  it('throws the typed error', () => {
    expect(() => parseManifest([], CONTEXT)).toThrow(AnatomyDataError);
  });
});

describe('parseLabelTable', () => {
  const FILE = `src/site/atlas-assets/open/labels-${FIXTURE_ATLAS_ID}.json`;
  const table = { schema_version: 1, atlas: FIXTURE_ATLAS_ID, labels: [{ id: '7', name: 'Fixture Nucleus', hemisphere: 'both' }] };
  const sourceIds = new Set([FIXTURE_ATLAS_ID]);

  it('accepts a valid label table', () => {
    expect(parseLabelTable(table, FILE, sourceIds).labels).toHaveLength(1);
  });

  it('rejects an empty table, a duplicate label id and an unknown hemisphere', () => {
    expect(() => parseLabelTable({ ...table, labels: [] }, FILE, sourceIds)).toThrow(/labels: a label table must list at least one label/);
    expect(() => parseLabelTable({ ...table, labels: [table.labels[0], table.labels[0]] }, FILE, sourceIds)).toThrow(/label id "7" appears twice/);
    expect(() => parseLabelTable({ ...table, labels: [{ ...table.labels[0], hemisphere: 'centre' }] }, FILE, sourceIds)).toThrow(/hemisphere/);
  });

  it('rejects a table for an atlas the registry does not hold, or filed under another atlas\'s name', () => {
    expect(() => parseLabelTable({ ...table, atlas: 'stray_atlas' }, FILE, sourceIds)).toThrow(/atlas: "stray_atlas" is not a source in the registry/);
    expect(() => parseLabelTable(table, 'src/site/atlas-assets/open/labels-other_atlas.json', sourceIds)).toThrow(/atlas: the file name says "other_atlas"/);
  });

  it('rejects an unknown schema version', () => {
    expect(() => parseLabelTable({ ...table, schema_version: 9 }, FILE, sourceIds)).toThrow(/schema_version/);
  });

  it('names the label table file in its messages', () => {
    expect(() => parseLabelTable(null, FILE, sourceIds)).toThrow(new RegExp(`^${FILE.replaceAll('.', '\\.')}:`));
  });
});
