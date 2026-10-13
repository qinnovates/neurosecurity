import { afterEach, describe, expect, it, vi } from 'vitest';
import { ANATOMY_TABLE_NAMES } from '@/lib/anatomy/table-names';
import { SiteDatabaseError, loadSiteDatabase, withoutAnatomyTables } from '../load-site-database';

describe('withoutAnatomyTables', () => {
  const siteTables = { techniques: [{ id: 'QIF-T0001' }], brain_regions: [{ id: 'pfc' }], ...Object.fromEntries(ANATOMY_TABLE_NAMES.map((name) => [name, [{ review_state: 'ai_drafted_unreviewed' }]])) };

  it('keeps every anatomy table out of the Lab\'s query database, which has nowhere to show their caveats', () => {
    expect(Object.keys(siteTables)).toHaveLength(ANATOMY_TABLE_NAMES.length + 2);
    expect(Object.keys(withoutAnatomyTables(siteTables))).toEqual(['techniques', 'brain_regions']);
  });

  it('leaves every other table and its rows as they were', () => {
    expect(withoutAnatomyTables(siteTables).techniques).toBe(siteTables.techniques);
    expect(withoutAnatomyTables({ anatomy_added_later: [] })).toEqual({});
  });
});

describe('loadSiteDatabase', () => {
  const served = { techniques: [{ id: 'QIF-T0001' }], ...Object.fromEntries(ANATOMY_TABLE_NAMES.map((name) => [name, [{ review_state: 'ai_drafted_unreviewed' }]])) };
  const respondWith = (body: unknown, ok = true): void => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok, status: ok ? 200 : 404, json: async () => body })));
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the site tables it fetched without any anatomy table', async () => {
    respondWith(served);
    const tables = await loadSiteDatabase(new AbortController().signal);
    expect(Object.keys(served)).toHaveLength(ANATOMY_TABLE_NAMES.length + 1);
    expect(Object.keys(tables)).toEqual(['techniques']);
    expect(fetch).toHaveBeenCalledWith('/data/kql-tables.json', expect.objectContaining({ credentials: 'omit' }));
  });

  it('still refuses a missing or malformed file', async () => {
    respondWith(served, false);
    await expect(loadSiteDatabase(new AbortController().signal)).rejects.toThrow(SiteDatabaseError);
    respondWith(['not', 'tables']);
    await expect(loadSiteDatabase(new AbortController().signal)).rejects.toThrow('unexpected format');
  });
});
