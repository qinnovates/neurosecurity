import { describe, expect, it } from 'vitest';
import { ATLAS_EXPLORER_PATH } from '@/components/brain/AtlasExplorerLink';
import { loadRealModel } from '@/lib/atlas-explorer/__tests__/explorer-fixtures';
import { LENS_KINDS, SUBJECT_FREE_LENS_KINDS, lensNeedsSubject } from '@/lib/atlas-explorer/lens-state';
import { LENS_QUERY_PARAM, REGION_QUERY_PARAM, buildRegionDeepLink, readLensDeepLink, readRegionDeepLink } from '../atlas-deep-link';

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
