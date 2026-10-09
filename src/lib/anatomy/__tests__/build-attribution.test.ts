import { describe, expect, it } from 'vitest';
import { loadAnatomyData } from '@/components/atlas-scene/load-anatomy-data';
import { ATTRIBUTION_STATEMENTS, buildAttributionEntries, listRequiredWordings } from '../build-attribution';

const data = loadAnatomyData();
const entries = buildAttributionEntries(data.sources, data.effectiveLicenceBySource, data.manifest);
const HCP_ACKNOWLEDGEMENT_START = 'Data were provided [in part] by the Human Connectome Project';

describe('buildAttributionEntries', () => {
  it('returns nothing when nothing ships', () => {
    expect(buildAttributionEntries(data.sources, data.effectiveLicenceBySource, null)).toEqual([]);
  });

  it('drops a source once no asset names it, and its wording with it', () => {
    const manifest = data.manifest;
    if (manifest === null) throw new Error('the manifest is missing');
    const withoutCit168 = { ...manifest, assets: manifest.assets.filter((asset) => !asset.source_ids.includes('cit168_rl')) };
    const remaining = buildAttributionEntries(data.sources, data.effectiveLicenceBySource, withoutCit168);
    expect(remaining.map((entry) => entry.source_id)).not.toContain('cit168_rl');
    expect(remaining.length).toBe(entries.length - 1);
  });

  it('fails the wording check on a page text that lacks one required sentence', () => {
    const wordings = listRequiredWordings(entries);
    const pageText = wordings.join(' ');
    const missing = (text: string): string[] => wordings.filter((wording) => !text.includes(wording));
    expect(missing(pageText)).toEqual([]);
    expect(missing(pageText.replaceAll(HCP_ACKNOWLEDGEMENT_START, ''))).toHaveLength(2);
  });
});

describe('attribution for the committed assets (guard)', () => {
  it('names every source of every shipped asset, material first, then inputs used only to compute', () => {
    const named = new Set(data.manifest?.assets.flatMap((asset) => [...asset.source_ids, ...asset.computed_with_source_ids]));
    expect(named.size).toBeGreaterThan(0);
    expect(new Set(entries.map((entry) => entry.source_id))).toEqual(named);
    expect(entries.filter((entry) => entry.redistributed).map((entry) => entry.source_id)).toEqual(
      ['mni_icbm152_2009c_asym', 'allen_hra_3d_2020', 'cit168_rl', 'neudorfer_hypothalamus']);
    expect(entries.filter((entry) => !entry.redistributed).map((entry) => entry.source_id)).toEqual(['mni_icbm152_2009b_sym']);
    expect(entries.filter((entry) => !entry.redistributed && entry.assets.length > 0)).toEqual([]);
  });

  it('carries the template copyright line, the HCP acknowledgement beside both HCP-derived sources, and each file\'s changes', () => {
    const wordings = listRequiredWordings(entries);
    expect(wordings.some((wording) => wording.includes('Louis Collins, McConnell Brain Imaging Centre'))).toBe(true);
    for (const sourceId of ['cit168_rl', 'neudorfer_hypothalamus']) {
      expect(entries.find((entry) => entry.source_id === sourceId)?.required_text.some((wording) => wording.startsWith(HCP_ACKNOWLEDGEMENT_START))).toBe(true);
    }
    expect(Object.values(ATTRIBUTION_STATEMENTS).every((statement) => wordings.includes(statement))).toBe(true);
    const assets = entries.flatMap((entry) => entry.assets);
    expect(assets.length).toBe(data.manifest?.assets.length);
    expect(assets.filter((asset) => !asset.modification_note.includes('decimated'))).toEqual([]);
  });

  it('shows share-alike handling where the publisher states something looser', () => {
    const cit168 = entries.find((entry) => entry.source_id === 'cit168_rl');
    expect(cit168?.license.id).toBe('cc-by-sa-4.0');
    expect(cit168?.stated_license?.id).toBe('cc-by-4.0');
    expect(entries.filter((entry) => entry.source_id !== 'cit168_rl' && entry.stated_license !== null)).toEqual([]);
  });
});
