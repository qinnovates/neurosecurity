import { describe, expect, it } from 'vitest';
import { loadAnatomyData } from '@/components/atlas-scene/load-anatomy-data';
import {
  POSITION_CHECK_SENTENCES as CHECKED_POSITION_SENTENCES, SHARE_ALIKE_STATEMENT as CHECKED_SHARE_ALIKE_STATEMENT, LICENSE_READING_STATEMENT, SHIPPING_LICENSE_NAMES,
} from '../../../scripts/check-atlas-assets.mjs';
import { ATTRIBUTION_STATEMENTS, LICENSE_LINKS, POSITION_CHECK_SENTENCES, SHARE_ALIKE_STATEMENT, buildAttributionEntries, listRequiredWordings } from '../build-attribution';

const data = loadAnatomyData();
const entries = buildAttributionEntries(data.sources, data.effectiveLicenceBySource, data.manifest);
const HCP_ACKNOWLEDGEMENT_START = 'Data were provided [in part] by the Human Connectome Project';

/** No share-alike asset ships today. These entries add one, from a source handled that way, to hold what such a file would say. */
function withShareAlikeAsset(): ReturnType<typeof buildAttributionEntries> {
  const manifest = data.manifest;
  if (manifest === null) throw new Error('the manifest is missing');
  const shareAlikeAsset = { ...manifest.assets[0], id: 'deep-cit168', path: 'by-sa/deep-cit168.abc.glb', source_ids: ['cit168_rl'], computed_with_source_ids: [], license_id: 'cc-by-sa-4.0' as const };
  return buildAttributionEntries(data.sources, data.effectiveLicenceBySource, { ...manifest, assets: [...manifest.assets, shareAlikeAsset] });
}

describe('buildAttributionEntries', () => {
  it('returns nothing when nothing ships', () => {
    expect(buildAttributionEntries(data.sources, data.effectiveLicenceBySource, null)).toEqual([]);
  });

  it('drops a source once no asset names it, and its wording with it', () => {
    const manifest = data.manifest;
    if (manifest === null) throw new Error('the manifest is missing');
    const withoutHypothalamusAtlas = { ...manifest, assets: manifest.assets.filter((asset) => !asset.source_ids.includes('neudorfer_hypothalamus')) };
    const remaining = buildAttributionEntries(data.sources, data.effectiveLicenceBySource, withoutHypothalamusAtlas);
    expect(remaining.map((entry) => entry.source_id)).not.toContain('neudorfer_hypothalamus');
    expect(remaining.length).toBe(entries.length - 1);
  });

  it('fails the wording check on a page text that lacks one required sentence', () => {
    const wordings = listRequiredWordings(entries);
    const pageText = wordings.join(' ');
    const missing = (text: string): string[] => wordings.filter((wording) => !text.includes(wording));
    expect(missing(pageText)).toEqual([]);
    expect(missing(pageText.replaceAll(HCP_ACKNOWLEDGEMENT_START, ''))).toHaveLength(1);
  });
});

describe('attribution for the committed assets (guard)', () => {
  it('names every source of every shipped asset, material first, then inputs used only to compute', () => {
    const named = new Set(data.manifest?.assets.flatMap((asset) => [...asset.source_ids, ...asset.computed_with_source_ids]));
    expect(named.size).toBeGreaterThan(0);
    expect(new Set(entries.map((entry) => entry.source_id))).toEqual(named);
    expect(entries.filter((entry) => entry.redistributed).map((entry) => entry.source_id)).toEqual(
      ['mni_icbm152_2009c_asym', 'allen_hra_3d_2020', 'neudorfer_hypothalamus']);
    expect(entries.filter((entry) => !entry.redistributed).map((entry) => entry.source_id)).toEqual(['mni_icbm152_2009b_sym']);
    expect(entries.filter((entry) => !entry.redistributed && entry.assets.length > 0)).toEqual([]);
  });

  it('carries the template copyright line, the HCP acknowledgement beside the HCP-derived source, and each file\'s changes', () => {
    const wordings = listRequiredWordings(entries);
    expect(wordings.some((wording) => wording.includes('Louis Collins, McConnell Brain Imaging Centre'))).toBe(true);
    expect(entries.find((entry) => entry.source_id === 'neudorfer_hypothalamus')?.required_text.some((wording) => wording.startsWith(HCP_ACKNOWLEDGEMENT_START))).toBe(true);
    expect(Object.values(ATTRIBUTION_STATEMENTS).every((statement) => wordings.includes(statement))).toBe(true);
    const assets = entries.flatMap((entry) => entry.assets);
    expect(assets.length).toBe(data.manifest?.assets.length);
    expect(assets.filter((asset) => !asset.modification_note.includes('decimated'))).toEqual([]);
  });

  it('shows share-alike handling where the publisher states something looser', () => {
    expect(entries.filter((entry) => entry.stated_license !== null)).toEqual([]);
    const shareAlike = withShareAlikeAsset().find((entry) => entry.source_id === 'cit168_rl');
    expect(shareAlike?.license.id).toBe('cc-by-sa-4.0');
    expect(shareAlike?.stated_license?.id).toBe('cc-by-4.0');
  });

  it('says what each position check showed, and gives share-alike files their sentence', () => {
    const assets = entries.flatMap((entry) => entry.assets);
    expect(assets.find((asset) => asset.path.includes('cortex-allen'))?.position_sentence).toBe(POSITION_CHECK_SENTENCES['checked in aggregate']);
    expect(assets.filter((asset) => !asset.path.includes('cortex-allen')).every((asset) => asset.position_sentence === POSITION_CHECK_SENTENCES['not independently checked'])).toBe(true);
    expect(entries.filter((entry) => entry.share_alike_statement !== null)).toEqual([]);
    expect(withShareAlikeAsset().filter((entry) => entry.share_alike_statement !== null).map((entry) => entry.source_id)).toEqual(['cit168_rl']);
    expect(entries.find((entry) => entry.source_id === 'mni_icbm152_2009c_asym')?.attribution_text).toContain('10.1016/S1053-8119(09)70884-5');
  });

  it('keeps the post-build check\'s wording equal to the page\'s', () => {
    expect(LICENSE_READING_STATEMENT).toBe(ATTRIBUTION_STATEMENTS.licenseReading);
    expect(CHECKED_SHARE_ALIKE_STATEMENT).toBe(SHARE_ALIKE_STATEMENT);
    expect(CHECKED_POSITION_SENTENCES).toEqual(POSITION_CHECK_SENTENCES);
    for (const [licenseId, name] of Object.entries(SHIPPING_LICENSE_NAMES)) {
      expect(LICENSE_LINKS[licenseId as keyof typeof LICENSE_LINKS].name).toBe(name);
    }
  });
});
