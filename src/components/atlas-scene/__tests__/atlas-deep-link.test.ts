import { describe, expect, it } from 'vitest';
import { ATLAS_EXPLORER_PATH } from '@/components/brain/AtlasExplorerLink';
import { loadRealModel } from '@/lib/atlas-explorer/__tests__/explorer-fixtures';
import { LENS_KINDS, SUBJECT_FREE_LENS_KINDS, lensNeedsSubject } from '@/lib/atlas-explorer/lens-state';
import { HIGHLIGHT_QUERY_PARAM, LENS_QUERY_PARAM, REGION_QUERY_PARAM, buildExplorerSearch, buildRegionDeepLink, readHighlightDeepLink, readLensDeepLink, readRegionDeepLink } from '../atlas-deep-link';

const model = loadRealModel();
const [firstRegion] = model.regions;

describe('the explorer\'s region deep link', () => {
  it('selects the region an address names when the index holds it, with or without the leading "?"', () => {
    expect(readRegionDeepLink(`?${REGION_QUERY_PARAM}=${firstRegion.id}`, model.regionsById)).toEqual({ kind: 'region', id: firstRegion.id });
    expect(readRegionDeepLink(`${REGION_QUERY_PARAM}=${firstRegion.id}&other=1`, model.regionsById)).toEqual({ kind: 'region', id: firstRegion.id });
  });

  it.each([
    ['no query at all', ''],
    ['a query without the parameter', '?lens=niss'],
    ['an empty id', `?${REGION_QUERY_PARAM}=`],
    ['an id the index does not hold', `?${REGION_QUERY_PARAM}=not-a-region`],
    ['an id with markup in it', `?${REGION_QUERY_PARAM}=${encodeURIComponent('<script>alert(1)</script>')}`],
    ['a region id in another case', `?${REGION_QUERY_PARAM}=${firstRegion.id.toUpperCase()}`],
    ['a path where the id should be', `?${REGION_QUERY_PARAM}=${encodeURIComponent('../atlas-index.json')}`],
  ])('selects nothing, and throws nothing, for %s', (_case, search) => {
    expect(readRegionDeepLink(search, model.regionsById)).toBeNull();
  });

  it('matches the exact set it is given and nothing else', () => {
    expect(readRegionDeepLink(`?${REGION_QUERY_PARAM}=pfc`, new Set(['pfc']))).toEqual({ kind: 'region', id: 'pfc' });
    expect(readRegionDeepLink(`?${REGION_QUERY_PARAM}=pfc`, new Set(['m1']))).toBeNull();
  });

  it('builds the address the explorer reads back, encoding the id, and reads back every real region', () => {
    expect(buildRegionDeepLink('pfc')).toBe(`${ATLAS_EXPLORER_PATH}?${REGION_QUERY_PARAM}=pfc`);
    expect(buildRegionDeepLink('a b&c')).toBe(`${ATLAS_EXPLORER_PATH}?${REGION_QUERY_PARAM}=a+b%26c`);
    for (const region of model.regions) {
      const url = new URL(buildRegionDeepLink(region.id), 'https://example.test');
      expect(url.pathname).toBe(ATLAS_EXPLORER_PATH);
      expect(readRegionDeepLink(url.search, model.regionsById)).toEqual({ kind: 'region', id: region.id });
    }
  });
});

describe('the explorer\'s lens deep link', () => {
  it('reads only a lens the explorer can open on: the kinds that are whole without a subject, spelt exactly', () => {
    expect(SUBJECT_FREE_LENS_KINDS).toEqual(['band', 'niss']);
    expect(readLensDeepLink(`?${LENS_QUERY_PARAM}=niss`)).toEqual({ kind: 'niss' });
    expect(readLensDeepLink(`${LENS_QUERY_PARAM}=band&${REGION_QUERY_PARAM}=pfc`)).toEqual({ kind: 'band' });
    for (const kind of LENS_KINDS.filter(lensNeedsSubject)) expect(readLensDeepLink(`?${LENS_QUERY_PARAM}=${kind}`), kind).toBeNull();
    for (const search of ['', `?${LENS_QUERY_PARAM}=`, `?${LENS_QUERY_PARAM}=NISS`, `?${LENS_QUERY_PARAM}=${encodeURIComponent('<b>x</b>')}`, `?${REGION_QUERY_PARAM}=pfc`]) {
      expect(readLensDeepLink(search), search).toBeNull();
    }
  });

  it('writes the lens after the region, only for a lens it would read back, and reads both back together', () => {
    expect(buildRegionDeepLink('pfc', { kind: 'niss' })).toBe(`${ATLAS_EXPLORER_PATH}?${REGION_QUERY_PARAM}=pfc&${LENS_QUERY_PARAM}=niss`);
    // A lens that waits for a subject is not carried: the explorer would open on nothing coloured.
    expect(buildRegionDeepLink('pfc', { kind: 'technique', techniqueId: 'QIF-T0001' })).toBe(buildRegionDeepLink('pfc'));
    const url = new URL(buildRegionDeepLink('pfc', { kind: 'band' }), 'https://example.test');
    expect(readLensDeepLink(url.search)).toEqual({ kind: 'band' });
    expect(readRegionDeepLink(url.search, new Set(['pfc']))).toEqual({ kind: 'region', id: 'pfc' });
  });
});

describe('the explorer\'s highlight deep link', () => {
  const kindById = new Map([['QIF-T0030', 'technique'], ['neuralink-n1', 'stated_targets']] as const);

  it('reads a technique or a device the page holds, and gives it the lens that shows it', () => {
    expect(readHighlightDeepLink(`?${HIGHLIGHT_QUERY_PARAM}=QIF-T0030`, kindById)).toEqual({ kind: 'technique', techniqueId: 'QIF-T0030' });
    expect(readHighlightDeepLink(`${HIGHLIGHT_QUERY_PARAM}=neuralink-n1&${REGION_QUERY_PARAM}=pfc`, kindById)).toEqual({ kind: 'stated_targets', deviceId: 'neuralink-n1' });
  });

  it.each([
    ['no parameter', ''],
    ['an empty id', `?${HIGHLIGHT_QUERY_PARAM}=`],
    ['an id the page does not hold', `?${HIGHLIGHT_QUERY_PARAM}=QIF-T9999`],
    ['an id with markup in it', `?${HIGHLIGHT_QUERY_PARAM}=${encodeURIComponent('<b>x</b>')}`],
  ])('reads nothing for %s', (_case, search) => {
    expect(readHighlightDeepLink(search, kindById)).toBeNull();
  });
});

describe('the explorer\'s state as an address', () => {
  it('writes the region, the lens and the highlight, and leaves the default lens out', () => {
    expect(buildExplorerSearch('', { regionId: null, lens: { kind: 'band' } })).toBe('');
    expect(buildExplorerSearch('', { regionId: 'pfc', lens: { kind: 'band' } })).toBe(`?${REGION_QUERY_PARAM}=pfc`);
    expect(buildExplorerSearch('', { regionId: 'pfc', lens: { kind: 'niss' } })).toBe(`?${REGION_QUERY_PARAM}=pfc&${LENS_QUERY_PARAM}=niss`);
    expect(buildExplorerSearch('', { regionId: 'pfc', lens: { kind: 'technique', techniqueId: 'QIF-T0030' } })).toBe(`?${REGION_QUERY_PARAM}=pfc&${HIGHLIGHT_QUERY_PARAM}=QIF-T0030`);
    expect(buildExplorerSearch('', { regionId: null, lens: { kind: 'stated_targets', deviceId: 'neuralink-n1' } })).toBe(`?${HIGHLIGHT_QUERY_PARAM}=neuralink-n1`);
  });

  it('writes no lens that waits for a subject, and no lens it could not read back', () => {
    expect(buildExplorerSearch('', { regionId: null, lens: { kind: 'technique', techniqueId: null } })).toBe('');
    expect(buildExplorerSearch('', { regionId: null, lens: { kind: 'dsm', cluster: 'mood' } })).toBe('');
  });

  it('replaces its own parameters and keeps every other one', () => {
    expect(buildExplorerSearch(`?from=hero&${REGION_QUERY_PARAM}=m1&${LENS_QUERY_PARAM}=niss&${HIGHLIGHT_QUERY_PARAM}=QIF-T0030`, { regionId: 'pfc', lens: { kind: 'band' } })).toBe(`?from=hero&${REGION_QUERY_PARAM}=pfc`);
  });

  it('reads back what it wrote', () => {
    const search = buildExplorerSearch('', { regionId: firstRegion.id, lens: { kind: 'niss' } });
    expect(readRegionDeepLink(search, model.regionsById)).toEqual({ kind: 'region', id: firstRegion.id });
    expect(readLensDeepLink(search)).toEqual({ kind: 'niss' });
  });
});
