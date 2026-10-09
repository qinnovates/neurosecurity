import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_MANIFEST_FILE, LICENSE_READING_STATEMENT, findAssetCoherenceFailures, findAttributionFailures, visibleText,
} from '../check-atlas-assets.mjs';

const ASSET_BYTES = Buffer.from('fixture mesh bytes');
const ASSET_PATH = 'open/fixture.0123456789ab.glb';
const REQUIRED_WORDING = 'Copyright (C) Fixture & Sons. Keep this "notice" in all copies.';
const ATTRIBUTION_TEXT = 'Fixture A, Fixture B (2020). An atlas.';
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

let root;
let files;

function writeFixture({ assetBytes = ASSET_BYTES, pageBody } = {}) {
  const manifest = { assets: [{ path: ASSET_PATH, bytes: ASSET_BYTES.length, sha256: sha256(ASSET_BYTES), source_ids: ['fixture_atlas'], computed_with_source_ids: [] }] };
  const sources = { sources: [{ id: 'fixture_atlas', name: 'Fixture atlas', attribution_text: ATTRIBUTION_TEXT, required_text: [REQUIRED_WORDING] }] };
  const dist = path.join(root, 'dist');
  fs.mkdirSync(path.join(dist, 'atlas-assets', 'open'), { recursive: true });
  fs.mkdirSync(path.join(dist, 'atlas', 'attribution'), { recursive: true });
  fs.writeFileSync(files.manifestFile, JSON.stringify(manifest));
  fs.writeFileSync(files.sourcesFile, JSON.stringify(sources));
  fs.writeFileSync(path.join(dist, 'atlas-assets', 'manifest.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(dist, 'atlas-assets', ASSET_PATH), assetBytes);
  const body = pageBody ?? `<p>${LICENSE_READING_STATEMENT}</p><p>Fixture A, Fixture B (2020).\n   An atlas.</p><p>Copyright (C) Fixture &amp; Sons. Keep this &quot;notice&quot; in <b>all</b> copies.</p>`;
  fs.writeFileSync(path.join(dist, 'atlas', 'attribution', 'index.html'), `<html><head><style>p{}</style></head><body>${body}</body></html>`);
  return dist;
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-assets-'));
  files = { manifestFile: path.join(root, 'manifest.json'), sourcesFile: path.join(root, 'sources.json') };
});

afterEach(() => {
  fs.rmSync(root, { recursive: true });
});

describe('visibleText', () => {
  it('keeps what a reader sees and drops scripts, styles, tags and comments', () => {
    expect(visibleText('<p>a &amp; b</p><script>hidden()</script><!-- note --><style>x{}</style><p>c&#39;s&nbsp;&#x41;</p>')).toBe("a & b c's A");
  });
});

describe('findAssetCoherenceFailures', () => {
  it('passes when the built site serves the manifest and its files unchanged', () => {
    expect(findAssetCoherenceFailures(writeFixture(), files.manifestFile)).toEqual([]);
  });

  it('fails a changed file, a missing file, a missing manifest and an empty manifest', () => {
    expect(findAssetCoherenceFailures(writeFixture({ assetBytes: Buffer.from('fixture mesh bytez') }), files.manifestFile))
      .toEqual([`${ASSET_PATH}: the built file's length or sha256 differs from the manifest`]);
    const dist = writeFixture();
    fs.rmSync(path.join(dist, 'atlas-assets', ASSET_PATH));
    expect(findAssetCoherenceFailures(dist, files.manifestFile)).toEqual([`${ASSET_PATH}: listed in the manifest but not in the built site`]);
    fs.rmSync(path.join(dist, 'atlas-assets', 'manifest.json'));
    expect(findAssetCoherenceFailures(dist, files.manifestFile)[0]).toBe('/atlas-assets/manifest.json is not in the built site');
    fs.writeFileSync(files.manifestFile, JSON.stringify({ assets: [] }));
    expect(findAssetCoherenceFailures(dist, files.manifestFile)).toEqual([`${files.manifestFile} lists no asset`]);
    expect(findAssetCoherenceFailures(dist, path.join(root, 'absent.json'))[0]).toContain('is missing');
  });

  it('refuses a manifest path that climbs out of the asset folder', () => {
    const dist = writeFixture();
    fs.writeFileSync(files.manifestFile, JSON.stringify({ assets: [{ path: '../../outside.glb', bytes: 1, sha256: 'x', source_ids: [], computed_with_source_ids: [] }] }));
    expect(findAssetCoherenceFailures(dist, files.manifestFile)).toContain('../../outside.glb: resolves outside the asset folder');
  });
});

describe('findAttributionFailures', () => {
  it('passes when the page shows every wording as text, whatever the markup around it', () => {
    expect(findAttributionFailures(writeFixture(), files)).toEqual([]);
  });

  it('fails a page that lacks a required wording, the attribution, or the AI statement', () => {
    const withoutWording = writeFixture({ pageBody: `<p>${LICENSE_READING_STATEMENT}</p><p>${ATTRIBUTION_TEXT}</p>` });
    expect(findAttributionFailures(withoutWording, files)).toEqual(['/atlas/attribution/: missing wording for "fixture_atlas": Copyright (C) Fixture & Sons. Keep this "notice" in all copies.']);
    const onlyInScript = writeFixture({ pageBody: `<p>${LICENSE_READING_STATEMENT}</p><p>${ATTRIBUTION_TEXT}</p><script>${JSON.stringify(REQUIRED_WORDING)}</script>` });
    expect(findAttributionFailures(onlyInScript, files)).toHaveLength(1);
    const withoutStatement = writeFixture({ pageBody: `<p>${ATTRIBUTION_TEXT}</p><p>Copyright (C) Fixture &amp; Sons. Keep this &quot;notice&quot; in all copies.</p>` });
    expect(findAttributionFailures(withoutStatement, files)).toEqual(['/atlas/attribution/: the statement that license readings were made by AI is missing']);
  });

  it('fails when the page was not built, and when the manifest names a source the registry lacks', () => {
    const dist = writeFixture();
    fs.writeFileSync(files.sourcesFile, JSON.stringify({ sources: [] }));
    expect(findAttributionFailures(dist, files)).toContain('source "fixture_atlas" is named by the manifest but is not in ' + files.sourcesFile);
    fs.rmSync(path.join(dist, 'atlas', 'attribution'), { recursive: true });
    expect(findAttributionFailures(dist, files)).toEqual(['/atlas/attribution/ was not built']);
  });
});

describe('the committed manifest (guard)', () => {
  it('exists and lists assets, so the post-build checks cannot pass on nothing', () => {
    const manifest = JSON.parse(fs.readFileSync(DEFAULT_MANIFEST_FILE, 'utf-8'));
    expect(manifest.assets.length).toBeGreaterThanOrEqual(5);
  });
});
