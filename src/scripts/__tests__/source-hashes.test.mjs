import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { HashError, buildSourceHashes, countUnpinnedRows, hashFileSha256, serialiseSourceHashes, verifyCache } from '../source-hashes.mjs';

const SOURCE_ID = 'fixture_source';
const MEMBER_BYTES = Buffer.from('extracted member bytes');
const MEMBER_SHA256 = createHash('sha256').update(MEMBER_BYTES).digest('hex');
const DOWNLOAD_SHA256 = 'a'.repeat(64);

const sourcesDoc = () => ({
  sources: [
    {
      id: 'zeta_unpinned', name: 'Unpinned', license_id: 'mit', redistribute: true,
      files: [{ name: 'b.txt', url: 'https://example.invalid/b', sha256: null, bytes: null, digest_origin: null }],
    },
    {
      id: SOURCE_ID, name: 'Fixture', license_id: 'cc0-1.0', redistribute: true,
      files: [{ name: 'dl.csv', url: 'https://example.invalid/dl', sha256: DOWNLOAD_SHA256, bytes: 10, digest_origin: 'publisher' }],
    },
  ],
});
const inputsDoc = () => ({
  fetch: { [SOURCE_ID]: { members: { 'pack.zip': [{ path: 'dir/member.nii', save_as: 'member.nii', sha256: MEMBER_SHA256 }] } } },
});

function makeCache(fileBytes) {
  const cacheDir = mkdtempSync(join(tmpdir(), 'source-hashes-'));
  mkdirSync(join(cacheDir, 'raw', SOURCE_ID), { recursive: true });
  writeFileSync(join(cacheDir, 'raw', SOURCE_ID, 'member.nii'), fileBytes);
  return cacheDir;
}

describe('buildSourceHashes', () => {
  it('is deterministic and independent of input ordering', () => {
    const first = serialiseSourceHashes(buildSourceHashes(sourcesDoc(), inputsDoc()));
    const reversed = sourcesDoc();
    reversed.sources.reverse();
    expect(serialiseSourceHashes(buildSourceHashes(reversed, inputsDoc()))).toBe(first);
    expect(first).not.toMatch(/\/Users\/|\/home\/|20\d\d-\d\d-\d\dT/);
    const withSecond = sourcesDoc();
    withSecond.sources.push({ id: 'aaa_second', name: 'Second', license_id: 'mit', redistribute: true, files: [{ name: 'x.csv', sha256: 'b'.repeat(64), bytes: 1, digest_origin: 'publisher' }] });
    expect(buildSourceHashes(withSecond, inputsDoc()).sources.map((s) => s.id)).toEqual(['aaa_second', SOURCE_ID]);
  });

  it('lists pinned files only, omits a source with no pins, and tags members with their archive', () => {
    const document = buildSourceHashes(sourcesDoc(), inputsDoc());
    expect(document.sources.map((s) => s.id)).toEqual([SOURCE_ID]);
    const serialised = serialiseSourceHashes(document);
    expect(serialised).not.toMatch(/not_yet_pinned|pin_status|zeta_unpinned|b\.txt/);
    const mixed = sourcesDoc();
    mixed.sources[1].files.push({ name: 'later.csv', sha256: null, bytes: null, digest_origin: null });
    expect(buildSourceHashes(mixed, inputsDoc()).sources[0].files.map((f) => f.name)).toEqual(['dl.csv', 'member.nii']);
    const [fixture] = document.sources;
    expect(fixture.files.map((f) => f.kind)).toEqual(['download', 'extracted_member']);
    expect(fixture.files[1]).toMatchObject({ archive: 'pack.zip', sha256: MEMBER_SHA256 });
    expect(countUnpinnedRows(mixed, inputsDoc())).toBe(2);
  });

  it('refuses to publish when nothing is pinned', () => {
    const none = { sources: [sourcesDoc().sources[0]] };
    expect(() => buildSourceHashes(none, { fetch: {} })).toThrow(HashError);
  });

  it('refuses a fetch entry for an unknown source and a malformed digest', () => {
    expect(() => buildSourceHashes(sourcesDoc(), { fetch: { ghost: { members: {} } } })).toThrow(HashError);
    const bad = sourcesDoc();
    bad.sources[1].files[0].sha256 = 'ABC';
    expect(() => buildSourceHashes(bad, inputsDoc())).toThrow(HashError);
  });
});

describe('verifyCache', () => {
  it('matches an untouched file and reports absent rows', async () => {
    const { counts } = await verifyCache(buildSourceHashes(sourcesDoc(), inputsDoc()), makeCache(MEMBER_BYTES));
    expect(counts).toEqual({ matched: 1, mismatched: 0, missing: 1 });
  });

  it('detects a tampered file', async () => {
    const cacheDir = makeCache(Buffer.from('extracted member bytez'));
    const { counts, results } = await verifyCache(buildSourceHashes(sourcesDoc(), inputsDoc()), cacheDir);
    expect(counts.mismatched).toBe(1);
    expect(results.find((r) => r.status === 'mismatched')).toMatchObject({ label: `${SOURCE_ID}/member.nii`, expected: MEMBER_SHA256 });
  });

  it('refuses a file name that would escape the cache directory', async () => {
    const doc = buildSourceHashes(sourcesDoc(), inputsDoc());
    doc.sources[0].files[0].name = '../escape';
    await expect(verifyCache(doc, makeCache(MEMBER_BYTES))).rejects.toThrow(HashError);
  });
});

describe('hashFileSha256', () => {
  it('streams a file to the same digest as an in-memory hash', async () => {
    const cacheDir = makeCache(MEMBER_BYTES);
    expect(await hashFileSha256(join(cacheDir, 'raw', SOURCE_ID, 'member.nii'))).toBe(MEMBER_SHA256);
  });
});
