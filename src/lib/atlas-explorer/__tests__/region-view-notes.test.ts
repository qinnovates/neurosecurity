import { describe, expect, it } from 'vitest';
import { matchesLimitTemplate } from '@/lib/anatomy/limits-copy';
import { INITIAL_EXPLORER_STATE } from '@/components/atlas-scene/atlas-state';
import { toColourMode } from '../lens-state';
import { NAMED_REGIONS_HEADING, buildRegionViewNotes, noteRegionById, withoutCaptionCopies } from '../region-view-notes';
import { buildViewportCaption } from '../viewport-caption';
import { buildSceneShapes } from '../scene-shapes';
import { summariseTechnique } from '../technique-summary';
import { loadRealModel } from './explorer-fixtures';

const model = loadRealModel();
const BAND_LENS = { kind: 'band' } as const;
const drawn = model.regions.find((region) => region.geometry.state === 'drawn');
const contained = model.regions.find((region) => region.geometry.state === 'contained');
const shapeless = model.regions.find((region) => region.geometry.state === 'no_geometry');
const linked = model.index.techniques.find((technique) => technique.scope === 'regions' && technique.links.some((link) => link.lit));
const bandLevel = model.index.techniques.find((technique) => technique.scope === 'band_level');
const limitIds = (notes: ReturnType<typeof buildRegionViewNotes>): string[] => notes.limits.map((limit) => limit.id);

describe('buildRegionViewNotes: the regions a visitor chose', () => {
  it('finds a region of each kind in the real data, so the cases below are not empty', () => {
    expect([drawn, contained, shapeless, linked, bandLevel].every((found) => found !== undefined)).toBe(true);
  });

  it('lists the same regions as the page, in the page\'s order and number, and brackets each as its own group', () => {
    const chosenIds = [shapeless?.id ?? '', drawn?.id ?? '', contained?.id ?? ''];
    const notes = buildRegionViewNotes(model, BAND_LENS, { regionIds: chosenIds, bandId: null });
    expect(notes.lists).toHaveLength(1);
    expect(notes.lists[0].heading).toBe('Regions you chose');
    expect(notes.lists[0].regions.map((region) => region.id)).toEqual(chosenIds);
    expect(notes.bracketGroups).toEqual(chosenIds.map((regionId) => [regionId]));
  });

  it('says the brackets are the visitor\'s choice, what the fill means, and that the shapes are a group average', () => {
    const notes = buildRegionViewNotes(model, BAND_LENS, { regionIds: [drawn?.id ?? ''], bandId: null });
    expect(limitIds(notes)).toEqual(['view_chosen_regions', 'lens_band', 'region_matching', 'outline_shape']);
    expect(notes.limits[0].text).toContain('They show your choice and nothing the data says about those regions');
    expect(notes.reviewState?.state).toBe('ai_drafted_unreviewed');
  });

  it('names, in words, every chosen region that has no shape of its own', () => {
    const notes = buildRegionViewNotes(model, BAND_LENS, { regionIds: [drawn?.id ?? '', contained?.id ?? '', shapeless?.id ?? ''], bandId: null });
    const sentence = notes.limits.find((limit) => limit.id === 'view_regions_without_shape');
    expect(sentence?.text).toContain('for 2 of these');
    expect(sentence?.text).toContain(`${contained?.name} (inside a larger shape)`);
    expect(sentence?.text).toContain(`${shapeless?.name} (no shape)`);
    expect(sentence?.text).not.toContain(drawn?.name ?? 'missing');
    expect(notes.lists[0].regions.map((region) => region.hasOwnShape)).toEqual([true, false, false]);
  });

  it('reports an id the atlas does not hold and never drops it in silence', () => {
    const notes = buildRegionViewNotes(model, BAND_LENS, { regionIds: ['not-a-region', drawn?.id ?? ''], bandId: null });
    expect(notes.lists[0].regions.map((region) => region.id)).toEqual([drawn?.id]);
    expect(notes.limits.find((limit) => limit.id === 'view_region_unknown')?.text).toContain('not-a-region');
    expect(noteRegionById(model, 'not-a-region')).toBeNull();
  });

  it('adds nothing about a selection when the visitor chose nothing', () => {
    const notes = buildRegionViewNotes(model, BAND_LENS);
    expect(notes.lists).toEqual([]);
    expect(notes.bracketGroups).toEqual([]);
    expect(limitIds(notes)).toEqual(['lens_band', 'region_matching', 'outline_shape']);
  });
});

describe('buildRegionViewNotes: a band the visitor chose', () => {
  it('reads the band\'s regions from the index and brackets them as one group', () => {
    const bandId = drawn?.band_ids[0] ?? '';
    const inBand = model.regions.filter((region) => region.band_ids.includes(bandId)).map((region) => region.id);
    const notes = buildRegionViewNotes(model, BAND_LENS, { regionIds: [], bandId });
    expect(notes.lists[0].regions.map((region) => region.id)).toEqual(inBand);
    expect(notes.lists[0].heading).toContain(bandId);
    expect(notes.bracketGroups).toEqual([inBand]);
    expect(matchesLimitTemplate('view_chosen_band', notes.limits[0].text)).toBe(true);
  });

  it('marks nothing for a band the catalog does not name, or for a device band that holds no region', () => {
    expect(buildRegionViewNotes(model, BAND_LENS, { regionIds: [], bandId: 'N99' }).bracketGroups).toEqual([]);
    expect(buildRegionViewNotes(model, BAND_LENS, { regionIds: [], bandId: 'I0' }).bracketGroups).toEqual([]);
  });
});

describe('buildRegionViewNotes: a technique', () => {
  it('lists exactly the regions the technique\'s drafted links name, under a heading that says "name", and says its band tags as band tags', () => {
    const techniqueId = linked?.id ?? '';
    const notes = buildRegionViewNotes(model, { kind: 'technique', techniqueId });
    expect(NAMED_REGIONS_HEADING).toBe('Regions this technique\'s drafted links name');
    expect(notes.lists[0].heading).toBe(NAMED_REGIONS_HEADING);
    expect(notes.lists[0].regions.map((region) => region.id)).toEqual(summariseTechnique(model, techniqueId)?.linkedRegions.map((region) => region.id));
    expect(notes.bracketGroups).toEqual([]);
    expect(limitIds(notes)).toContain('lens_technique');
    const reach = notes.limits.find((limit) => limit.id === 'view_technique_band_reach');
    expect(reach?.text).toContain('A band tag is about the band as a whole');
    for (const bandId of linked?.band_ids.filter((id) => id.startsWith('N')) ?? []) expect(reach?.text).toContain(bandId);
    expect(notes.reviewState?.state).toBe('ai_drafted_unreviewed');
  });

  it('lists no region for a band-level technique: its lens sentence already says the catalog names none', () => {
    const notes = buildRegionViewNotes(model, { kind: 'technique', techniqueId: bandLevel?.id ?? '' });
    expect(notes.lists).toEqual([]);
    expect(limitIds(notes)).toContain('lens_technique_band_only');
    expect(limitIds(notes)).not.toContain('view_technique_band_reach');
  });

  it('says so for a technique this build does not hold', () => {
    expect(limitIds(buildRegionViewNotes(model, { kind: 'technique', techniqueId: 'QIF-T-none' }))).toContain('lens_technique_unknown');
  });
});

describe('the selection and the fill are separate channels', () => {
  it('builds the same shapes, fills and colours whatever the visitor chose: the selection is not an input to them', () => {
    const shapes = buildSceneShapes(model, toColourMode(BAND_LENS), INITIAL_EXPLORER_STATE.layers);
    // The only inputs are the model, the colour mode and the layers.
    expect(buildSceneShapes).toHaveLength(3);
    expect(shapes.length).toBeGreaterThan(0);
    const notes = buildRegionViewNotes(model, BAND_LENS, { regionIds: model.regions.map((region) => region.id), bandId: null });
    expect(Object.keys(notes)).toEqual(['lists', 'bracketGroups', 'limits', 'reviewState']);
  });
});

describe('withoutCaptionCopies: what the open picture already says is not said again beside it', () => {
  const lens = { kind: 'technique', techniqueId: 'QIF-T0034' } as const;
  const notes = buildRegionViewNotes(model, lens);
  const shapes = buildSceneShapes(model, toColourMode(lens), INITIAL_EXPLORER_STATE.layers);
  const caption = buildViewportCaption(model, lens, shapes);

  it('takes nothing out while no picture is open, so no sentence loses its last copy', () => {
    expect(withoutCaptionCopies(notes, null)).toBe(notes);
    expect(limitIds(notes)).toEqual(['lens_technique', 'view_nothing_coloured_no_own_shape', 'view_technique_band_reach', 'view_regions_without_shape', 'region_matching', 'outline_shape']);
  });

  it('leaves each sentence and the review mark standing once between the caption and the notes', () => {
    const beside = withoutCaptionCopies(notes, caption);
    const captioned = [...caption.lensLimits, ...caption.positionLimits, ...caption.markLimits].map((limit) => limit.text);
    expect(limitIds(beside)).toEqual(['view_technique_band_reach', 'view_regions_without_shape', 'region_matching']);
    for (const limit of notes.limits) expect([...captioned, ...beside.limits.map((kept) => kept.text)].filter((text) => text === limit.text), limit.id).toHaveLength(1);
    expect(caption.reviewState?.mark).toBe('AI-drafted, unreviewed');
    expect(beside.reviewState).toBeNull();
    expect(beside.lists).toBe(notes.lists);
  });

  it('keeps the notes\' mark when the caption carries none or a different one', () => {
    expect(withoutCaptionCopies(notes, { ...caption, reviewState: null }).reviewState).toBe(notes.reviewState);
    expect(withoutCaptionCopies(notes, { ...caption, reviewState: { state: 'reviewed', reviewer_role: 'neuroanatomist', reviewed_on: '2026-01-01', mark: 'Reviewed' } }).reviewState).toBe(notes.reviewState);
  });
});
