import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadAnatomyBundle } from '../load-anatomy-data';
import { AtlasFetchError, fetchAtlasJson, fetchPinnedJson } from '../fetch-atlas-json';

const signal = new AbortController().signal;
afterEach(() => vi.unstubAllGlobals());

describe('fetchAtlasJson', () => {
  it.each(['https://evil.example/atlas/anatomy-index.json', '//evil.example/atlas/x.json', '/atlas/../secrets.json', '/data/qtara-registrar.json', '/atlas/anatomy-index.json?x=1'])(
    'refuses %s without asking the network: only this site\'s own atlas files are fetched', async (path) => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      await expect(fetchAtlasJson(path, signal)).rejects.toBeInstanceOf(AtlasFetchError);
      expect(fetchMock).not.toHaveBeenCalled();
    });

  it('fetches a site path with no credentials and no redirect', async () => {
    const fetchMock = vi.fn(async () => new Response('{"ok":true}'));
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchAtlasJson('/atlas/anatomy-index.json', signal)).toEqual({ ok: true });
    expect((fetchMock.mock.calls[0] as unknown[])[1]).toMatchObject({ credentials: 'omit', redirect: 'error' });
  });
});

describe('the index\'s pins for the files served beside it', () => {
  const bundle = loadAnatomyBundle();

  it('pins the catalog, the literature statements and the H01 card by the exact bytes served (guard)', () => {
    expect(bundle.index.companions.map((pin) => pin.path).sort()).toEqual(['/atlas/anatomy-catalog.json', '/atlas/anatomy-h01-card.json', '/atlas/anatomy-region-evidence.json']);
    for (const pin of bundle.index.companions) expect(new TextEncoder().encode(bundle.companionJsonByPath[pin.path]).length, pin.path).toBe(pin.bytes);
  });

  it('accepts the served file and refuses one that differs, after one more fetch past the cache', async () => {
    const [pin] = bundle.index.companions;
    const served = bundle.companionJsonByPath[pin.path];
    vi.stubGlobal('fetch', vi.fn(async () => new Response(served)));
    expect(JSON.stringify(await fetchPinnedJson(pin, signal))).toBe(served);
    const changed = vi.fn(async () => new Response(served.replace('"schema_version":1', '"schema_version":2')));
    vi.stubGlobal('fetch', changed);
    await expect(fetchPinnedJson(pin, signal)).rejects.toMatchObject({ failure: 'pin_mismatch' });
    expect(changed.mock.calls.map((call) => (call as unknown[])[1])).toMatchObject([{ cache: 'default' }, { cache: 'reload' }]);
  });
});
