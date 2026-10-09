import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DATALAKE_DIR } from '../datalake-cli.mjs';
import { AmbiguousRegionTermError, createCatalogTermResolver, findRegionKey, indexRegionKeys, normaliseRegionTerm } from '../region-term.mjs';
import { FIXTURE_ATLAS } from './atlas-fixture.mjs';

const REAL_ATLAS = JSON.parse(readFileSync(path.join(DATALAKE_DIR, 'qif-brain-bci-atlas.json'), 'utf-8'));

describe('normaliseRegionTerm', () => {
  it.each([
    ['Prefrontal Cortex', 'prefrontal_cortex'],
    ['  spinal   cord ', 'spinal_cord'],
    ['C1-C3_medullary neurons', 'c1_c3_medullary_neurons'],
    ['PFC', 'pfc'],
  ])('writes "%s" as "%s"', (term, normalised) => {
    expect(normaliseRegionTerm(term)).toBe(normalised);
  });

  it('does not stem, strip punctuation or expand anything', () => {
    expect(normaliseRegionTerm('hippocampal')).toBe('hippocampal');
    expect(normaliseRegionTerm("Broca's area")).toBe("broca's_area");
  });
});

describe('findRegionKey', () => {
  const keyByNormalised = indexRegionKeys(FIXTURE_ATLAS);

  it('finds an id or an alias whatever its case and separators, and returns the key as the atlas writes it', () => {
    expect(findRegionKey('PFC', keyByNormalised)).toBe('pfc');
    expect(findRegionKey('Prefrontal-Cortex', keyByNormalised)).toBe('prefrontal_cortex');
    expect(findRegionKey('locus coeruleus', keyByNormalised)).toBe('locus_coeruleus');
  });

  it('reads one trailing s as a plural only when the term as written names nothing', () => {
    expect(findRegionKey('amygdalas', keyByNormalised)).toBe('amygdala');
    expect(findRegionKey('pons', keyByNormalised)).toBe('pons');
    expect(findRegionKey('pon', keyByNormalised)).toBeUndefined();
  });

  it.each(['hippocampal', 'prefrontal', 'cortex of the frontal lobe', 'Pons (brainstem)', 'hippo', ''])('finds nothing for "%s"', (term) => {
    expect(findRegionKey(term, keyByNormalised)).toBeUndefined();
  });

  it('never finds the alias table\'s note key', () => {
    expect(findRegionKey('_note', keyByNormalised)).toBeUndefined();
    expect(findRegionKey('note', keyByNormalised)).toBeUndefined();
  });
});

describe('indexRegionKeys', () => {
  it('refuses two keys that normalise to the same text', () => {
    const atlas = { ...FIXTURE_ATLAS, region_aliases: { ...FIXTURE_ATLAS.region_aliases, PONS: 'pfc' } };
    expect(() => indexRegionKeys(atlas)).toThrow(AmbiguousRegionTermError);
  });

  it('indexes the real atlas without a collision, and no key is another key plus an s (guard)', () => {
    const keys = [...indexRegionKeys(REAL_ATLAS).keys()];
    expect(keys.length).toBeGreaterThan(REAL_ATLAS.brain_regions.length);
    expect(keys.filter((key) => keys.includes(`${key}s`))).toEqual([]);
  });
});

describe('createCatalogTermResolver', () => {
  const resolveTerm = createCatalogTermResolver(REAL_ATLAS);
  const resolve = (term) => {
    const resolved = resolveTerm(term, 'test');
    return resolved === null ? null : `${resolved.region.id}:${resolved.match}`;
  };

  it.each([
    ['spinal cord', 'cervical_cord:whole_to_part'],
    ['PFC', 'pfc:id'],
    ['M1', 'm1:id'],
    ['STN', 'stn:id'],
    ['prefrontal cortex', 'pfc:synonym'],
    ['amygdala', 'bla:whole_to_part'],
    ['PAG', 'midbrain:part_to_whole'],
    ['nucleus_accumbens', 'striatum:part_to_whole'],
  ])('resolves "%s" against the real atlas as %s (guard)', (term, expected) => {
    expect(resolve(term)).toBe(expected);
  });

  it.each(["Broca's area", 'motor cortex', 'DLPFC', 'NTS', 'HIPP', 'hippocampal', 'cochlea', 'M1_larynx', 'anterior insula'])(
    'resolves nothing for "%s": a display name, a wider or narrower name, an unlisted abbreviation or an adjective (guard)', (term) => {
      expect(resolve(term)).toBeNull();
    });
});
