import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  IMPACT_CHAINS_PATH,
  computeImpactChains,
  indexPathwaysByRegion,
  loadChainSources,
  serializeImpactChains,
} from '../compute-impact-chains.mjs';
import {
  REGION_MATCH,
  UnresolvedRegionError,
  createRegionResolver,
  listPathwayEndpoints,
} from '../region-resolver.mjs';
import { FIXTURE_ATLAS } from './atlas-fixture.mjs';

const ALIAS_NOTE_KEY = '_note';

function buildFixtureSources(pathways) {
  return {
    registrar: {
      techniques: [
        { id: 'QIF-T9001', attack: 'Cortical probe', severity: 'high', niss: { score: 6.1 }, band_ids: ['N7', 'N6'] },
        { id: 'QIF-T9002', attack: 'Firmware tamper', severity: 'low', niss: { score: 2 }, band_ids: ['S2'] },
      ],
    },
    atlas: FIXTURE_ATLAS,
    pathways: { pathways },
    dsm: { diagnostic_clusters: { mood: { label: 'Mood', conditions: [{ code: 'F32.x', name: 'Major depression' }] } } },
    neuro: { conditions: [{ code: 'G20', name: 'Parkinson disease', category: 'movement' }] },
  };
}

const LIMBIC_PATHWAY = Object.freeze({
  id: 'fixture_limbic',
  name: 'Fixture Limbic Pathway',
  neurotransmitter: 'serotonin',
  origin: ['prefrontal_cortex'],
  targets: ['hippocampus', 'amygdala'],
  dsm_conditions: ['F32.x', 'G20', 'Z99'],
});

describe('computeImpactChains on a fixture', () => {
  const chains = computeImpactChains(buildFixtureSources([LIMBIC_PATHWAY]));

  it('joins a pathway to a region it names by a long alias id', () => {
    const cortexRows = chains.filter((chain) => chain.region_id === 'pfc');
    expect(cortexRows.map((chain) => chain.dsm_code)).toEqual(['F32.x', 'G20', 'Z99']);
    expect(cortexRows.every((chain) => chain.region_match === REGION_MATCH.SYNONYM)).toBe(true);
  });

  it('labels how each region was reached', () => {
    const matchByRegion = Object.fromEntries(chains.map((chain) => [chain.region_id, chain.region_match]));
    expect(matchByRegion).toEqual({
      pfc: REGION_MATCH.SYNONYM,
      hippocampus: REGION_MATCH.ID,
      bla: REGION_MATCH.WHOLE_TO_PART,
    });
  });

  it('names conditions from the DSM table, then the neurological table, then falls back to the code', () => {
    const [depression, parkinson, unknown] = chains.filter((chain) => chain.region_id === 'hippocampus');
    expect([depression.dsm_name, depression.dsm_cluster]).toEqual(['Major depression', 'Mood']);
    expect([parkinson.dsm_name, parkinson.dsm_cluster]).toEqual(['Parkinson disease', 'Neurological/movement']);
    expect([unknown.dsm_name, unknown.dsm_cluster]).toEqual(['Z99', '']);
  });

  it('gives no rows to a technique with no neural band', () => {
    expect(chains.some((chain) => chain.technique_id === 'QIF-T9002')).toBe(false);
  });

  it('keeps the most exact match when two endpoints reach the same region', () => {
    const pathway = { ...LIMBIC_PATHWAY, targets: ['amygdala', 'basolateral_amygdala'] };
    const [{ match }] = indexPathwaysByRegion([pathway], FIXTURE_ATLAS).get('bla');
    expect(match).toBe(REGION_MATCH.SYNONYM);
  });

  it('counts a pathway once for a region it both starts and ends in', () => {
    const pathway = { ...LIMBIC_PATHWAY, origin: ['hippocampus'], targets: ['hippocampus'] };
    expect(indexPathwaysByRegion([pathway], FIXTURE_ATLAS).get('hippocampus')).toHaveLength(1);
  });

  it('refuses a pathway endpoint the atlas cannot resolve instead of dropping it', () => {
    const pathway = { ...LIMBIC_PATHWAY, targets: ['claustrum'] };
    expect(() => computeImpactChains(buildFixtureSources([pathway]))).toThrow(UnresolvedRegionError);
  });

  it('does not treat the alias note or inherited object keys as aliases', () => {
    const resolver = createRegionResolver(FIXTURE_ATLAS);
    expect(resolver.canResolve(ALIAS_NOTE_KEY)).toBe(false);
    expect(resolver.canResolve('constructor')).toBe(false);
  });

  it('reports a sub-structure alias as part_to_whole', () => {
    const { region, match } = createRegionResolver(FIXTURE_ATLAS).resolve('locus_coeruleus', 'test');
    expect([region.id, match]).toEqual(['pons', REGION_MATCH.PART_TO_WHOLE]);
  });
});

describe('impact chains against the datalake', () => {
  const sources = loadChainSources();
  const { atlas, registrar } = sources;
  const pathways = sources.pathways.pathways;
  const resolver = createRegionResolver(atlas);
  const chains = computeImpactChains(sources);
  const regionIds = new Set(atlas.brain_regions.map((region) => region.id));
  const aliasKeys = Object.keys(atlas.region_aliases).filter((key) => key !== ALIAS_NOTE_KEY);

  it('resolves every pathway origin and target to an atlas region', () => {
    const unresolved = pathways.flatMap((pathway) =>
      listPathwayEndpoints(pathway)
        .filter((endpointId) => !resolver.canResolve(endpointId))
        .map((endpointId) => `${pathway.id}: ${endpointId}`));
    expect(unresolved).toEqual([]);
  });

  it('points every alias at a region that exists', () => {
    expect(aliasKeys.filter((alias) => !regionIds.has(atlas.region_aliases[alias]))).toEqual([]);
  });

  it('classifies only real aliases as scope-changing, and each one once', () => {
    const { whole_to_part: wholeToPart, part_to_whole: partToWhole } = atlas.region_alias_relations;
    const classified = [...wholeToPart, ...partToWhole];
    expect(classified.filter((alias) => !aliasKeys.includes(alias))).toEqual([]);
    expect(new Set(classified).size).toBe(classified.length);
  });

  it('gives chain rows to every region that a pathway with conditions runs through', () => {
    const targetedBands = new Set(registrar.techniques.flatMap((technique) => technique.band_ids ?? []));
    const regionsWithRows = new Set(chains.map((chain) => chain.region_id));
    const expectedRegionIds = new Set(
      pathways
        .filter((pathway) => (pathway.dsm_conditions ?? []).length > 0)
        .flatMap((pathway) => listPathwayEndpoints(pathway).map((endpointId) => resolver.resolve(endpointId, pathway.id).region))
        .filter((region) => targetedBands.has(region.qif_band))
        .map((region) => region.id),
    );
    expect(expectedRegionIds.size).toBeGreaterThan(0);
    expect([...expectedRegionIds].filter((regionId) => !regionsWithRows.has(regionId))).toEqual([]);
  });

  it('gives chain rows to every technique whose band holds a region with a pathway', () => {
    const bandsWithRows = new Set(chains.map((chain) => chain.band_id));
    const techniquesWithRows = new Set(chains.map((chain) => chain.technique_id));
    const missing = registrar.techniques
      .filter((technique) => (technique.band_ids ?? []).some((bandId) => bandsWithRows.has(bandId)))
      .filter((technique) => !techniquesWithRows.has(technique.id))
      .map((technique) => technique.id);
    expect(missing).toEqual([]);
  });

  it('matches the committed impact-chains.json (regenerate with `npm run compute:chains`)', () => {
    const isCommittedFileCurrent = readFileSync(IMPACT_CHAINS_PATH, 'utf-8') === serializeImpactChains(chains);
    expect(isCommittedFileCurrent).toBe(true);
  });
});
