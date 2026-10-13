import { describe, expect, it } from 'vitest';
import taraChains from '@shared/tara-chains.json';
import { INITIAL_EXPLORER_STATE } from '@/components/atlas-scene/atlas-state';
import { loadCompanionJson } from '@/components/atlas-scene/load-anatomy-data';
import { AnatomyDataError } from '@/lib/anatomy/errors';
import { ATLAS_CHAINS_PATH, buildAtlasChains, parseAtlasChains, type AtlasChain, type AtlasChains } from '../chain-file';
import { INITIAL_PLAYBACK, playbackReducer } from '../chain-playback';
import { buildChainFrame, buildChainShapes, buildChainSteps, describeChainFrame, stageStepNumbers, tallyChainSteps } from '../chain-steps';
import { buildSceneShapes } from '../scene-shapes';
import { FIXTURE_IDS, buildFixtureModel, loadRealModel } from './explorer-fixtures';

/**
 * What the curated threat models light on the brain today, counted from the data. It changes when a threat model is
 * added or a technique's region links are re-drafted. The page states the same counts, from the same functions.
 */
const PINNED_CHAIN_STATE = { chains: 7, steps: 35, stepsLightingARegion: 1, stepsWithADeviceStage: 31 } as const;
/** Words that would mean something passes from one step's place to the next. No key of anything a step or a frame holds may contain one. */
const TRAVEL_KEY_PATTERN = /path|route|line|arrow|edge|from|to[A-Z_]|direction|flow|segment|trajectory/;

const realModel = loadRealModel();
const served = parseAtlasChains(JSON.parse(loadCompanionJson(ATLAS_CHAINS_PATH)));
const fixtureModel = buildFixtureModel();
const fixtureChain: AtlasChain = {
  chain_id: 'CHAIN-FIX-001', chain_name: 'Fixture chain', evidence_label: 'projected',
  steps: [FIXTURE_IDS.deviceOnlyTechnique, FIXTURE_IDS.linkedTechnique, FIXTURE_IDS.bandLevelTechnique].map((techniqueId, at) => (
    { position: at + 1, technique_id: techniqueId, role: 'pivot' as const, action: `Fixture action ${at + 1}`, evidence_label: null }
  )),
};
const fixtureSteps = buildChainSteps(fixtureModel, fixtureChain);
const allKeysOf = (value: unknown): string[] => (typeof value !== 'object' || value === null ? [] : Object.entries(value).flatMap(([key, child]) => [...(Array.isArray(value) ? [] : [key]), ...allKeysOf(child)]));

describe('the threat models file', () => {
  it('is served from the datalake file, word for word, with every step naming a catalog technique', () => {
    const raw = taraChains as { chains: Array<{ chain_id: string; steps: Array<{ action: string; technique_id: string }> }> };
    expect(served.chains.map((chain) => chain.chain_id)).toEqual(raw.chains.map((chain) => chain.chain_id));
    expect(served.chains.flatMap((chain) => chain.steps.map((step) => step.action))).toEqual(raw.chains.flatMap((chain) => chain.steps.map((step) => step.action)));
    for (const step of served.chains.flatMap((chain) => chain.steps)) {
      expect(realModel.techniquesById.has(step.technique_id) || realModel.deviceOnlyTechniquesById.has(step.technique_id), step.technique_id).toBe(true);
    }
    expect(Object.values(served.label_rules).every((rule) => rule.length > 20)).toBe(true);
  });

  it.each([
    ['a step naming a technique the catalog does not hold', (file: AtlasChains) => { file.chains[0].steps[0].technique_id = 'QIF-T9999'; }, true],
    ['steps out of order', (file: AtlasChains) => { file.chains[0].steps[1].position = 5; }, false],
    ['a threat model with no step', (file: AtlasChains) => { file.chains[0].steps = []; }, false],
    ['a generated chain passed off as curated', (file: AtlasChains) => { file.chains[0].chain_id = 'GEN-1'; }, false],
    ['the same threat model twice', (file: AtlasChains) => { file.chains[1].chain_id = file.chains[0].chain_id; }, false],
    ['an evidence label the page cannot name', (file: AtlasChains) => { (file.chains[0].steps[0] as { evidence_label: string }).evidence_label = 'observed'; }, false],
    ['an unknown field', (file: AtlasChains) => { (file.chains[0] as unknown as Record<string, unknown>).regions = ['v1']; }, false],
  ])('refuses %s', (_case, corrupt, onlyAtBuild) => {
    const file: AtlasChains = structuredClone(served);
    corrupt(file);
    if (onlyAtBuild) {
      const raw = structuredClone(taraChains) as { chains: Array<{ steps: Array<{ technique_id: string }> }> };
      raw.chains[0].steps[0].technique_id = 'QIF-T9999';
      expect(() => buildAtlasChains(raw, new Set(realModel.techniquesById.keys()))).toThrow(AnatomyDataError);
    } else {
      expect(() => parseAtlasChains(file)).toThrow(AnatomyDataError);
    }
  });
});

describe('buildChainSteps', () => {
  it('counts what the curated threat models light, from the data, and it is very little', () => {
    const steps = served.chains.flatMap((chain) => buildChainSteps(realModel, chain));
    expect({
      chains: served.chains.length, steps: steps.length, stepsLightingARegion: tallyChainSteps(steps).lit, stepsWithADeviceStage: steps.filter((step) => step.stageIds.length > 0).length,
    }).toEqual(PINNED_CHAIN_STATE);
  });

  it('gives a step its technique, its device stages in rail order and the regions the technique lens counts, and nothing else', () => {
    expect(fixtureSteps.map((step) => [step.position, step.techniqueId, step.stageIds, step.litRegions.map((region) => region.id)])).toEqual([
      [1, FIXTURE_IDS.deviceOnlyTechnique, ['S3', 'S2'], []],
      [2, FIXTURE_IDS.linkedTechnique, ['S1'], ['pfc']],
      [3, FIXTURE_IDS.bandLevelTechnique, ['I0'], []],
    ]);
    expect(tallyChainSteps(fixtureSteps)).toEqual({ total: 3, lit: 1 });
  });

  it('holds nothing that could join one step to the next: no path, line, arrow or direction in a step or a frame', () => {
    const frame = buildChainFrame(fixtureChain, fixtureSteps, 2, false);
    const keys = [...allKeysOf(frame), ...allKeysOf(buildChainShapes(fixtureModel, frame, INITIAL_EXPLORER_STATE.layers)), ...allKeysOf(served)];
    expect(keys.length).toBeGreaterThan(40);
    expect(keys.filter((key) => TRAVEL_KEY_PATTERN.test(key))).toEqual([]);
    for (const word of ['path', 'fromPosition', 'toPosition', 'edges', 'arrow_to', 'direction']) expect(TRAVEL_KEY_PATTERN.test(word), word).toBe(true);
  });
});

describe('a frame of a threat model', () => {
  it('shows one step while stepping and every step, numbered, under reduced motion', () => {
    const one = buildChainFrame(fixtureChain, fixtureSteps, 2, false);
    expect(one.steps.map((step) => step.position)).toEqual([2]);
    expect(describeChainFrame(one)).toBe(`Threat model CHAIN-FIX-001, Fixture chain: step 2 of 3, ${FIXTURE_IDS.linkedTechnique}, Fixture injection.`);
    const whole = buildChainFrame(fixtureChain, fixtureSteps, 2, true);
    expect(whole.steps.map((step) => step.position)).toEqual([1, 2, 3]);
    expect(describeChainFrame(whole)).toBe('Threat model CHAIN-FIX-001, Fixture chain: all 3 steps, numbered in order.');
  });

  it('marks each device stage with the numbers of the steps on screen that carry it', () => {
    expect([...stageStepNumbers(buildChainFrame(fixtureChain, fixtureSteps, 1, false))]).toEqual([['S3', [1]], ['S2', [1]]]);
    expect([...stageStepNumbers(buildChainFrame(fixtureChain, fixtureSteps, 1, true))]).toEqual([['S3', [1]], ['S2', [1]], ['S1', [2]], ['I0', [3]]]);
    expect([...stageStepNumbers(null)]).toEqual([]);
  });

  it('draws a step with exactly the technique lens\'s marks, and numbers only the shapes that lens marks', () => {
    const layers = { ...INITIAL_EXPLORER_STATE.layers, cortical: true, deep: true };
    const frame = buildChainFrame(fixtureChain, fixtureSteps, 2, false);
    const underLens = buildSceneShapes(fixtureModel, { kind: 'technique', techniqueId: FIXTURE_IDS.linkedTechnique }, layers);
    const shapes = buildChainShapes(fixtureModel, frame, layers);
    expect(shapes.map(({ stepNumbers: _numbers, ...shape }) => shape)).toEqual(underLens);
    expect(shapes.filter((shape) => shape.stepNumbers.length > 0).every((shape) => shape.fill === 'solid' || shape.fill === 'translucent')).toBe(true);
    expect(shapes.filter((shape) => shape.fill === 'solid').every((shape) => shape.stepNumbers.join() === '2')).toBe(true);
  });

  it('draws the whole threat model as the strongest mark any step gives each shape, numbered by the steps that give it', () => {
    const layers = { ...INITIAL_EXPLORER_STATE.layers, cortical: true, deep: true };
    const whole = buildChainShapes(fixtureModel, buildChainFrame(fixtureChain, fixtureSteps, 1, true), layers);
    const alone = buildChainShapes(fixtureModel, buildChainFrame(fixtureChain, fixtureSteps, 2, false), layers);
    expect(whole.map((shape) => [shape.id, shape.fill, shape.stepNumbers])).toEqual(alone.map((shape) => [shape.id, shape.fill, shape.stepNumbers]));
  });
});

describe('playbackReducer', () => {
  const at = (position: number, isPlaying = false) => ({ position, isPlaying });
  it('plays, pauses, steps and seeks within the threat model, and playing only ever goes to the next step', () => {
    expect(playbackReducer(INITIAL_PLAYBACK, { type: 'play' }, 5)).toEqual(at(1, true));
    expect(playbackReducer(at(1, true), { type: 'tick' }, 5)).toEqual(at(2, true));
    expect(playbackReducer(at(4, true), { type: 'tick' }, 5)).toEqual(at(5, false));
    expect(playbackReducer(at(3, false), { type: 'tick' }, 5)).toEqual(at(3, false));
    expect(playbackReducer(at(2, true), { type: 'pause' }, 5)).toEqual(at(2, false));
    expect(playbackReducer(at(5), { type: 'play' }, 5)).toEqual(at(1, true));
    expect(playbackReducer(at(2, true), { type: 'next' }, 5)).toEqual(at(3));
    expect(playbackReducer(at(5), { type: 'next' }, 5)).toEqual(at(5));
    expect(playbackReducer(at(1), { type: 'previous' }, 5)).toEqual(at(1));
    expect(playbackReducer(at(3), { type: 'previous' }, 5)).toEqual(at(2));
    expect(playbackReducer(at(1, true), { type: 'seek', position: 4 }, 5)).toEqual(at(4));
    expect(playbackReducer(at(1), { type: 'seek', position: 99 }, 5)).toEqual(at(5));
    expect(playbackReducer(at(1), { type: 'seek', position: -3 }, 5)).toEqual(at(1));
    expect(playbackReducer(at(4, true), { type: 'reset' }, 5)).toEqual(INITIAL_PLAYBACK);
    expect(playbackReducer(INITIAL_PLAYBACK, { type: 'play' }, 1)).toEqual(at(1, false));
  });
});
