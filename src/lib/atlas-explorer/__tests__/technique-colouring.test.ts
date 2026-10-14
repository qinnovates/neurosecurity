import { describe, expect, it } from 'vitest';
import { LIMIT_TEMPLATES } from '@/lib/anatomy/limits-copy';
import { INITIAL_EXPLORER_STATE } from '@/components/atlas-scene/atlas-state';
import { buildSceneShapes } from '../scene-shapes';
import { TECHNIQUE_COLOURINGS, classifyTechniqueColouring, limitsForUncolouredTechnique, listNamedRegionIds, type TechniqueColouring } from '../technique-colouring';
import { buildViewportCaption } from '../viewport-caption';
import { loadRealModel } from './explorer-fixtures';

const model = loadRealModel();
const techniqueIds = model.index.techniques.map((technique) => technique.id);
const byColouring = new Map<TechniqueColouring, string[]>(TECHNIQUE_COLOURINGS.map((colouring) => [colouring, techniqueIds.filter((techniqueId) => classifyTechniqueColouring(model, techniqueId) === colouring)]));
const idsOf = (colouring: TechniqueColouring): string[] => byColouring.get(colouring) ?? [];
/** The technique the verifier saw draw an all-grey brain: it names one region, which lies inside a larger shape. */
const CONTAINED_ONLY_TECHNIQUE = 'QIF-T0034';
const lensOf = (techniqueId: string) => ({ kind: 'technique', techniqueId }) as const;
const namedStates = (techniqueId: string): string[] => listNamedRegionIds(model.techniquesById.get(techniqueId)).map((regionId) => model.regionsById.get(regionId)?.geometry.state ?? 'missing');
/** Whether the picture a page mounts, with the layers it starts with, fills any shape for the technique. */
const fillsInMountedView = (techniqueId: string): boolean => buildSceneShapes(model, lensOf(techniqueId), INITIAL_EXPLORER_STATE.layers).some((shape) => shape.fill === 'solid');

describe('classifyTechniqueColouring, on the data the site serves', () => {
  it('finds techniques of all three kinds, and puts every technique in exactly one', () => {
    for (const colouring of TECHNIQUE_COLOURINGS) expect(idsOf(colouring).length, colouring).toBeGreaterThan(0);
    expect(TECHNIQUE_COLOURINGS.flatMap(idsOf).sort()).toEqual([...techniqueIds].sort());
  });

  it('agrees with the picture a page mounts: "coloured" exactly when a shape is filled there', () => {
    for (const techniqueId of techniqueIds) expect(fillsInMountedView(techniqueId), techniqueId).toBe(classifyTechniqueColouring(model, techniqueId) === 'coloured');
  });

  it('lit: a technique whose links name a region with a mark of its own fills it, and gets no sentence', () => {
    const [techniqueId] = idsOf('coloured');
    expect(namedStates(techniqueId).some((state) => state === 'drawn' || state === 'marker_only')).toBe(true);
    expect(limitsForUncolouredTechnique(model, lensOf(techniqueId))).toEqual([]);
    expect(buildViewportCaption(model, lensOf(techniqueId), []).lensLimits.map((limit) => limit.id)).toEqual(['lens_technique', 'whole_scene']);
  });

  it('named but contained: no named region has a shape of its own, so the sentence says exactly that', () => {
    expect(idsOf('named_none_coloured')).toContain(CONTAINED_ONLY_TECHNIQUE);
    for (const techniqueId of idsOf('named_none_coloured')) {
      expect(namedStates(techniqueId).length, techniqueId).toBeGreaterThan(0);
      expect(namedStates(techniqueId), techniqueId).not.toContain('drawn');
    }
    expect(namedStates(CONTAINED_ONLY_TECHNIQUE)).toEqual(['contained']);
    expect(limitsForUncolouredTechnique(model, lensOf(CONTAINED_ONLY_TECHNIQUE))).toEqual([{ id: 'view_nothing_coloured_no_own_shape', text: LIMIT_TEMPLATES.view_nothing_coloured_no_own_shape }]);
    expect(buildViewportCaption(model, lensOf(CONTAINED_ONLY_TECHNIQUE), []).lensLimits.map((limit) => limit.id)).toEqual(['lens_technique', 'view_nothing_coloured_no_own_shape', 'whole_scene']);
  });

  it('none: a technique whose links name no region says so, and so does one this build does not hold', () => {
    for (const techniqueId of idsOf('none_named')) expect(namedStates(techniqueId), techniqueId).toEqual([]);
    const [techniqueId] = idsOf('none_named');
    expect(limitsForUncolouredTechnique(model, lensOf(techniqueId))).toEqual([{ id: 'view_nothing_coloured_none_named', text: LIMIT_TEMPLATES.view_nothing_coloured_none_named }]);
    expect(buildViewportCaption(model, lensOf(techniqueId), []).lensLimits.map((limit) => limit.id)).toContain('view_nothing_coloured_none_named');
    expect(classifyTechniqueColouring(model, 'QIF-T-none')).toBe('none_named');
  });

  it('says nothing under any other lens, or before a technique is chosen', () => {
    expect(limitsForUncolouredTechnique(model, { kind: 'band' })).toEqual([]);
    expect(limitsForUncolouredTechnique(model, { kind: 'technique', techniqueId: null })).toEqual([]);
  });

  it('holds the two sentences word for word', () => {
    expect(LIMIT_TEMPLATES.view_nothing_coloured_no_own_shape).toBe('No region is coloured for this technique: its drafted links name no region that has a shape of its own in this atlas.');
    expect(LIMIT_TEMPLATES.view_nothing_coloured_none_named).toBe('No region is coloured for this technique: its drafted links name no single region.');
  });
});
