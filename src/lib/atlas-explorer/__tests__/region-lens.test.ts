import { describe, expect, it } from 'vitest';
import { describeRegionUnderLens, describeUncountedLink, NO_DATA_VALUE } from '../region-lens';
import { buildIndexLink } from '@/lib/anatomy/__tests__/index-fixtures';
import { FIXTURE_IDS, buildFixtureModel, loadRealModel, regionOf } from './explorer-fixtures';

const model = buildFixtureModel();
const under = (regionId: string, mode: Parameters<typeof describeRegionUnderLens>[2]) => describeRegionUnderLens(model, regionOf(model, regionId), mode);

describe('describeRegionUnderLens', () => {
  it('reads the band as a value that rests on no drafted link', () => {
    expect(under('pfc', { kind: 'band' })).toMatchObject({ standing: 'value', value: 'N7 Band N7', reviewState: null, mark: 'solid' });
  });

  it('reads a counted link as linked, with the basis in words and the review mark', () => {
    const fact = under('pfc', { kind: 'technique', techniqueId: FIXTURE_IDS.linkedTechnique });
    expect(fact).toMatchObject({ standing: 'value', value: 'linked', reason: 'named in the catalog\'s text', entryCount: 1, mark: 'solid' });
    expect(fact.reviewState?.mark).toBe('AI-drafted, unreviewed');
  });

  it('keeps a link the catalog names but that may not count apart from both linked and no data', () => {
    const fact = under('hippocampus', { kind: 'technique', techniqueId: FIXTURE_IDS.linkedTechnique });
    expect(fact).toMatchObject({ standing: 'named_not_counted', value: 'named, not counted', reason: 'the technique\'s own band tags do not include this region\'s band' });
    expect(fact.reviewState).not.toBeNull();
  });

  it('says why a region has no data: band tag only, nothing drafted, not named, or a device-only technique', () => {
    expect(under('hippocampus', { kind: 'technique', techniqueId: FIXTURE_IDS.bandLevelTechnique })).toMatchObject({ standing: 'no_data', value: NO_DATA_VALUE, reason: 'tagged to band N6 only; no region assessed' });
    expect(under('pfc', { kind: 'technique', techniqueId: FIXTURE_IDS.notDraftedTechnique }).reason).toBe('no region link has been drafted for this technique');
    expect(under('cord', { kind: 'technique', techniqueId: FIXTURE_IDS.linkedTechnique }).reason).toBe('the catalog\'s text does not name this region');
    expect(under('pfc', { kind: 'technique', techniqueId: FIXTURE_IDS.deviceOnlyTechnique })).toMatchObject({ standing: 'no_data', reason: 'this technique acts on the device, not on a brain region', reviewState: null });
  });

  it('takes the highest NISS step among linked techniques and never reads an unlinked region as low', () => {
    expect(under('pfc', { kind: 'niss' })).toMatchObject({ standing: 'value', value: 'high', entryCount: 2, reason: 'highest NISS step among 2 linked catalog entries' });
    const unlinked = under('cord', { kind: 'niss' });
    expect(unlinked).toMatchObject({ standing: 'no_data', value: NO_DATA_VALUE });
    expect(unlinked.value).not.toBe('low');
    expect(under('hippocampus', { kind: 'niss' }).standing).toBe('no_data');
  });

  it('reads a DSM cluster and a device\'s stated targets from their own records', () => {
    expect(under('pfc', { kind: 'dsm', cluster: 'cognitive_psychotic' })).toMatchObject({ standing: 'value', value: 'linked', entryCount: 1 });
    expect(under('pfc', { kind: 'dsm', cluster: 'motor_neurocognitive' }).standing).toBe('no_data');
    expect(under('m1', { kind: 'stated_targets', deviceId: FIXTURE_IDS.device })).toMatchObject({ standing: 'value', value: 'named', reviewState: null });
    expect(under('pfc', { kind: 'stated_targets', deviceId: FIXTURE_IDS.device }).standing).toBe('no_data');
  });

  it('does not fill a shape that holds more than this region, and marks a region with no shape as such', () => {
    const shared = under('m1', { kind: 'stated_targets', deviceId: FIXTURE_IDS.device });
    expect(shared.mark).toBe('inside_or_mixed');
    expect(shared.shapes[0].words).toBe('somewhere inside this shape');
    expect(under('cord', { kind: 'band' })).toMatchObject({ mark: 'no_shape', shapes: [] });
  });

  it('waits, marking nothing, while the lens has no subject', () => {
    expect(under('pfc', null)).toMatchObject({ standing: 'awaiting_subject', mark: 'no_shape', shapes: [], reviewState: null });
  });

  it('never reports "low" for a region without a linked technique on the real data (guard)', () => {
    const real = loadRealModel();
    const facts = real.regions.map((region) => ({ region, fact: describeRegionUnderLens(real, region, { kind: 'niss' }) }));
    const unlinked = facts.filter(({ region }) => !(real.linksByRegion.get(region.id) ?? []).some((link) => link.link.lit));
    expect(facts.length).toBe(38);
    expect(unlinked.length).toBeGreaterThan(0);
    expect(unlinked.filter(({ fact }) => fact.standing !== 'no_data' || fact.value !== NO_DATA_VALUE)).toEqual([]);
    expect(facts.some(({ fact }) => fact.standing === 'value')).toBe(true);
  });
});

describe('describeUncountedLink', () => {
  it('gives the most basic reason first', () => {
    const base = { ...buildIndexLink('pfc', false), resolution: 'id' as const };
    expect(describeUncountedLink({ ...base, valid_for_current_addressing: false, quote_state: 'quote_missing' })).toBe('drafted for an older version of the region list');
    expect(describeUncountedLink({ ...base, quote_state: 'quote_missing' })).toBe('the quoted words are no longer in the catalog entry');
    expect(describeUncountedLink({ ...base, resolution: 'whole_to_part' })).toBe('the catalog names a larger structure, of which this region is one part');
    expect(describeUncountedLink({ ...base, resolution: 'part_to_whole' })).toBe('the catalog names a part of this region, not the region');
    expect(describeUncountedLink({ ...base, band_agrees: false })).toBe('the technique\'s own band tags do not include this region\'s band');
  });
});
