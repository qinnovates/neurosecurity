import { describe, expect, it } from 'vitest';
import { REGION_MATCH } from '@shared/scripts/region-resolver.mjs';
import { FIXTURE_ATLAS } from '@shared/scripts/__tests__/atlas-fixture.mjs';
import { RESOLUTIONS, createTermResolver, lightsRegion } from '../resolve-region-term';

const ATLAS_WITH_UNCLASSIFIED_ALIAS = { ...FIXTURE_ATLAS, region_aliases: { ...FIXTURE_ATLAS.region_aliases, claustrum_complex: 'pfc' } };

describe('createTermResolver', () => {
  const resolveTerm = createTermResolver(ATLAS_WITH_UNCLASSIFIED_ALIAS);

  it('uses the same match vocabulary as the datalake resolver', () => {
    expect([...RESOLUTIONS].sort()).toEqual(Object.values(REGION_MATCH).sort());
  });

  it.each([
    ['hippocampus', 'hippocampus', 'id', true],
    ['prefrontal_cortex', 'pfc', 'synonym', true],
    ['amygdala', 'bla', 'whole_to_part', false],
    ['locus_coeruleus', 'pons', 'part_to_whole', false],
    ['claustrum_complex', 'pfc', 'unclassified', false],
  ] as const)('resolves "%s" to %s as %s (lights a region: %s)', (term, regionId, resolution, lights) => {
    expect(resolveTerm(term)).toEqual({ resolved_region_id: regionId, resolution });
    expect(lightsRegion(resolution)).toBe(lights);
  });

  it('resolves a word the atlas does not know as unclassified, with no region', () => {
    expect(resolveTerm('claustrum')).toEqual({ resolved_region_id: null, resolution: 'unclassified' });
    expect(resolveTerm('_note')).toEqual({ resolved_region_id: null, resolution: 'unclassified' });
  });

  it('does not hide an alias that points at a missing region', () => {
    const atlas = { ...FIXTURE_ATLAS, region_aliases: { ...FIXTURE_ATLAS.region_aliases, claustrum: 'cla' } };
    expect(() => createTermResolver(atlas)('claustrum')).toThrow(/points at "cla", which is not a brain_regions id/);
  });
});
