import { describe, expect, it } from 'vitest';
import { INITIAL_EXPLORER_STATE } from '@/components/atlas-scene/atlas-state';
import { OWNERSHIP_MARKS, type ColourMode } from '@/lib/anatomy/colour-modes';
import { matchesLimitTemplate } from '@/lib/anatomy/limits-copy';
import { resolvePick } from '../resolve-pick';
import { ringParamsFor } from '../scene-drawing';
import { BAND_COLOURS, BAND_COLOURS_DARK, NEUTRAL_COLOUR, NISS_COLOURS, NISS_COLOURS_DARK, buildSceneShapes, describeFill, listLegendSteps, type SceneShape } from '../scene-shapes';
import { buildViewportCaption, readDisagreementRange } from '../viewport-caption';
import { FIXTURE_IDS, buildFixtureModel, loadRealModel } from './explorer-fixtures';

const real = loadRealModel();
const fixture = buildFixtureModel();
const ALL_LAYERS = { outline: true, cortical: true, deep: true, tracts: true, networks: true, devices: true };
const firstLitTechnique = real.index.techniques.find((technique) => technique.links.some((link) => link.lit));
const MODES: ColourMode[] = [
  { kind: 'band' }, { kind: 'niss' }, { kind: 'technique', techniqueId: firstLitTechnique?.id ?? '' }, { kind: 'dsm', cluster: 'mood_trauma' },
  { kind: 'stated_targets', deviceId: real.index.devices.stated_targets[0]?.device_id ?? '' },
];
const HEX = /^#[0-9a-f]{6}$/;

describe('describeFill', () => {
  it('fills a shape only where the style functions say solid, in a colour keyed by the step', () => {
    expect(describeFill(fixture, 'fixture_atlas:10', { kind: 'band' }, 'light')).toMatchObject({ fill: 'solid', colour: BAND_COLOURS.N7, step: 'N7' });
    expect(describeFill(fixture, 'fixture_atlas:10', { kind: 'niss' }, 'light')).toMatchObject({ fill: 'solid', colour: NISS_COLOURS.high, step: 'high' });
    expect(describeFill(fixture, 'fixture_atlas:20', { kind: 'band' }, 'light')).toMatchObject({ fill: 'translucent', colour: NEUTRAL_COLOUR, step: null });
  });

  it('keys the colour to the surface the canvas is on, never to one palette for both', () => {
    for (const mode of [{ kind: 'band' } as const, { kind: 'niss' } as const]) {
      const light = describeFill(fixture, 'fixture_atlas:10', mode, 'light');
      const dark = describeFill(fixture, 'fixture_atlas:10', mode, 'dark');
      // The same step and the same fill: only the ink follows the surface.
      expect(dark, mode.kind).toMatchObject({ fill: light.fill, step: light.step });
      expect(dark.colour, mode.kind).not.toBe(light.colour);
    }
    expect(describeFill(fixture, 'fixture_atlas:10', { kind: 'band' }, 'dark').colour).toBe(BAND_COLOURS_DARK.N7);
    expect(describeFill(fixture, 'fixture_atlas:10', { kind: 'niss' }, 'dark').colour).toBe(NISS_COLOURS_DARK.high);
  });

  it('draws no data as lines, never as the lowest step, and colours nothing while the lens waits for a subject', () => {
    const unlit = describeFill(fixture, 'fixture_atlas:10', { kind: 'technique', techniqueId: FIXTURE_IDS.bandLevelTechnique }, 'light');
    expect(unlit).toMatchObject({ fill: 'lines', colour: NEUTRAL_COLOUR, step: null });
    expect(unlit.colour).not.toBe(NISS_COLOURS.low);
    expect(describeFill(fixture, 'fixture_atlas:10', null, 'light')).toMatchObject({ fill: 'neutral', step: null });
  });

  it('never fills a real shape that the style functions do not mark solid, in any mode (guard)', () => {
    let solid = 0;
    for (const mode of MODES) {
      for (const structure of real.index.structures) {
        const mark = real.styleStructure(structure.key, mode).mark;
        const look = describeFill(real, structure.key, mode, 'light');
        expect(OWNERSHIP_MARKS).toContain(mark);
        expect(look.fill === 'solid', `${structure.key} ${mode.kind}`).toBe(mark === 'solid');
        expect(look.colour).toMatch(HEX);
        if (mark !== 'solid') expect(look.colour).toBe(NEUTRAL_COLOUR);
        if (mark === 'solid') solid += 1;
      }
    }
    expect(solid).toBeGreaterThan(20);
  });

  it('keys every colour by step as a hex string, with five distinct NISS steps and seven distinct bands', () => {
    expect(Object.keys(BAND_COLOURS)).toEqual(['N7', 'N6', 'N5', 'N4', 'N3', 'N2', 'N1']);
    expect(new Set(Object.values(BAND_COLOURS)).size).toBe(7);
    expect(Object.keys(NISS_COLOURS)).toEqual(['none', 'low', 'medium', 'high', 'critical']);
    expect(new Set(Object.values(NISS_COLOURS)).size).toBe(5);
    expect([...Object.values(BAND_COLOURS), ...Object.values(NISS_COLOURS)].every((colour) => HEX.test(colour))).toBe(true);
  });
});

describe('buildSceneShapes on the real index (guard)', () => {
  const shapes = buildSceneShapes(real, { kind: 'band' }, INITIAL_EXPLORER_STATE.layers, 'light');

  it('draws only layers that are both asked for and available, one shape per structure and side', () => {
    expect(new Set(shapes.map((shape) => shape.layer))).toEqual(new Set(['outline', 'cortical', 'deep']));
    expect(new Set(shapes.map((shape) => shape.id)).size).toBe(shapes.length);
    expect(shapes.length).toBeGreaterThan(150);
    expect(buildSceneShapes(real, { kind: 'band' }, { ...INITIAL_EXPLORER_STATE.layers, cortical: false }, 'light').some((shape) => shape.layer === 'cortical')).toBe(false);
    expect(buildSceneShapes(real, { kind: 'band' }, ALL_LAYERS, 'light').some((shape) => shape.layer === 'tracts' || shape.layer === 'networks')).toBe(false);
  });

  it('marks structures too small to outline with a ring alone, and coarse ones with a mesh and a ring', () => {
    const ringOnly = shapes.filter((shape) => shape.sizeMark === 'ring_only');
    expect(ringOnly.length).toBeGreaterThan(0);
    const markerNodes = real.index.structures.flatMap((structure) => structure.nodes.filter((node) => node.vertex_count === 0).map((node) => `${structure.key}:${node.hemisphere}`));
    expect(ringOnly.map((shape) => shape.id).sort()).toEqual(markerNodes.sort());
    expect(shapes.some((shape) => shape.sizeMark === 'mesh_and_ring')).toBe(true);
  });

  it('says which shapes are one side mirrored, and never the brain outline', () => {
    expect(shapes.some((shape) => shape.mirrored)).toBe(true);
    expect(shapes.filter((shape) => shape.layer === 'outline' && shape.mirrored)).toEqual([]);
  });

  it('lists the steps on screen for the legend', () => {
    expect(listLegendSteps(shapes).map((entry) => entry.step)).toEqual(expect.arrayContaining(['N7', 'N6']));
    expect(listLegendSteps(buildSceneShapes(real, null, INITIAL_EXPLORER_STATE.layers, 'light'))).toEqual([]);
  });

  /**
   * The rings sit on the structures the atlas resolves worst -- the hypothalamic
   * nuclei, the subthalamic nucleus, the two parts of the substantia nigra and the
   * ventral tegmental area -- which is exactly where a reader most needs to know
   * what the lens says. A ring that looked the same under every lens was the lens
   * quietly stopping at the hardest cases.
   */
  it('shows the lens on every ring, and never one look for every lens state', () => {
    const ringsUnder = (mode: ColourMode | null): SceneShape[] => buildSceneShapes(real, mode, INITIAL_EXPLORER_STATE.layers, 'light').filter((shape) => shape.sizeMark !== 'mesh');
    const looksUnder = (mode: ColourMode | null): Set<string> => new Set(ringsUnder(mode).map((shape) => JSON.stringify(ringParamsFor(shape))));
    expect(ringsUnder({ kind: 'band' }).length).toBeGreaterThan(20);
    expect(ringsUnder({ kind: 'band' }).some((shape) => shape.sizeMark === 'ring_only')).toBe(true);
    for (const mode of MODES) {
      for (const shape of ringsUnder(mode)) {
        const ring = ringParamsFor(shape);
        expect(ring, `${shape.id} ${mode.kind}`).not.toBeNull();
        // The ring is the fill's own colour wherever the lens fills the shape, and the shared neutral wherever it does not.
        expect(ring?.colour, `${shape.id} ${mode.kind}`).toBe(shape.fill === 'solid' ? shape.colour : NEUTRAL_COLOUR);
      }
    }
    // Under a lens that reaches these structures the rings differ; with no lens chosen the only difference left is why each ring is there.
    expect(looksUnder({ kind: 'band' }).size).toBeGreaterThan(looksUnder(null).size);
    expect(new Set(ringsUnder(null).map((shape) => ringParamsFor(shape)?.reason)).size).toBe(looksUnder(null).size);
  });
});

describe('resolvePick', () => {
  it('selects a region only when the shape is that one region\'s own', () => {
    expect(resolvePick(fixture, 'fixture_atlas:10')).toMatchObject({ selectedRegionId: 'pfc', regions: [{ id: 'pfc', name: 'pfc' }], label: 'Label 10' });
  });

  it('selects the shape, and lists what it holds, when several regions share it or one only lies inside it', () => {
    expect(resolvePick(fixture, 'fixture_atlas:20')).toMatchObject({ selectedRegionId: null, regions: [{ id: 'm1', name: 'm1' }, { id: 'sma', name: 'sma' }] });
    expect(resolvePick(fixture, 'fixture_atlas:99')).toBeNull();
  });

  it('never selects a region through a shape it is only contained in, or a shape nobody owns, on the real index (guard)', () => {
    const picks = real.index.structures.map((structure) => ({ structure, pick: resolvePick(real, structure.key) }));
    expect(picks.filter(({ pick }) => pick?.selectedRegionId !== null).length).toBeGreaterThan(10);
    for (const { structure, pick } of picks) {
      const rowOwners = structure.owners.filter((owner) => owner.subject_kind === 'region');
      const isShared = new Set(rowOwners.map((owner) => owner.subject_id)).size !== 1 || rowOwners[0].via !== 'row' || rowOwners[0].extent_match === 'contained';
      if (isShared) expect(pick?.selectedRegionId, structure.key).toBeNull();
    }
    expect(picks.some(({ structure }) => structure.owners.length === 0)).toBe(true);
  });
});

describe('buildViewportCaption', () => {
  const shapes = buildSceneShapes(real, { kind: 'niss' }, INITIAL_EXPLORER_STATE.layers, 'light');
  const caption = buildViewportCaption(real, { kind: 'niss' }, shapes);

  it('carries the review mark, the lens with its own limit, and a position sentence for every layer drawn', () => {
    expect(caption.reviewState?.mark).toBe('AI-drafted, unreviewed');
    expect(caption.lensLabel).toBe('NISS severity lens.');
    const technique = real.index.techniques[0];
    expect(buildViewportCaption(real, { kind: 'technique', techniqueId: technique.id }, shapes).lensLabel).toBe(`Technique lens: ${technique.id}, ${technique.name}.`);
    expect(buildViewportCaption(real, { kind: 'dsm', cluster: 'mood_trauma' }, shapes).lensLabel).toBe('DSM cluster lens: mood trauma.');
    expect(caption.lensLimits.map((limit) => limit.id)).toEqual(['lens_niss', 'whole_scene']);
    expect(caption.positionLimits.filter((limit) => limit.id.startsWith('position_'))).toHaveLength(3);
    expect(caption.positionLimits.find((limit) => limit.id === 'mirrored_scene')?.text).toMatch(/^The Allen .+ shapes were drawn on one side/);
    expect(caption.templateSpace).toBe(real.index.template_space);
  });

  it('reads each layer\'s position from its files, taking the worst among them', () => {
    const byLayer = (layer: string): string => caption.positionLimits.find((limit) => limit.text.includes(layer))?.id ?? '';
    const worstOf = (layer: string): string[] => real.index.assets.filter((asset) => asset.layer === layer).map((asset) => asset.position_check);
    expect(worstOf('deep')).toContain('not independently checked');
    const deepLimit = caption.positionLimits.find((limit) => limit.text.includes('deep structures'));
    const noteRange = readDisagreementRange(real.index.assets.filter((asset) => asset.layer === 'deep').map((asset) => asset.modification_note));
    expect(deepLimit?.id).toBe(noteRange === null ? 'position_not_checked' : 'position_not_checked_with_range');
    // The figure is the one the files' own notes carry, never one typed in the code.
    if (noteRange !== null) expect(deepLimit?.text).toContain(`differ by about ${noteRange} mm`);
    expect(byLayer('brain outline')).toBe('position_not_checked');
    expect(worstOf('cortical')).toEqual(['checked in aggregate']);
    expect(byLayer('cortical shapes')).toBe('position_checked_in_aggregate');
    expect(caption.positionLimits.every((limit) => matchesLimitTemplate(limit.id, limit.text))).toBe(true);
  });

  it('explains only the marks that are on screen, and nothing for a layer that is off', () => {
    expect(caption.markLimits.map((limit) => limit.id)).toEqual(expect.arrayContaining(['outline_shape', 'unfilled_shape', 'marker_ring', 'coarse_ring']));
    const outlineOnly = buildViewportCaption(real, { kind: 'band' }, shapes.filter((shape) => shape.layer === 'outline'));
    expect(outlineOnly.markLimits.map((limit) => limit.id)).toEqual(['outline_shape']);
    expect(outlineOnly.positionLimits).toHaveLength(1);
    expect(readDisagreementRange(['Atlases differ: surfaces 0.7 to 2.5 mm apart.'])).toBe('0.7 to 2.5');
    expect(readDisagreementRange(['No figure here.', 'Position not checked.'])).toBeNull();
    const fillsNothing = buildViewportCaption(real, { kind: 'band' }, shapes.filter((shape) => shape.fill === 'translucent'));
    expect(fillsNothing.markLimits.map((limit) => limit.id)).toContain('lens_fills_nothing');
    expect(caption.markLimits.map((limit) => limit.id).includes('lens_fills_nothing')).toBe(!shapes.some((shape) => shape.fill === 'solid'));
    expect(buildViewportCaption(real, { kind: 'band' }, [])).toMatchObject({ reviewState: null, positionLimits: [], markLimits: [] });
  });
});
