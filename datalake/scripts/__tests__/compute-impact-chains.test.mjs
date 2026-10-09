import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  IMPACT_CHAINS_PATH,
  computeImpactChains,
  findTechniquesWithUnknownBands,
  indexPathwaysByRegion,
  listChainWarnings,
  loadChainSources,
  serializeImpactChains,
} from '../compute-impact-chains.mjs';
import {
  DanglingRegionAliasError,
  REGION_MATCH,
  SCOPE_CHANGING_MATCHES,
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
    dsm: {
      diagnostic_clusters: {
        mood: { label: 'Mood', conditions: [{ code: 'F32.x', name: 'Major depression' }, { code: 'G47.x', name: 'Sleep-wake disorder' }] },
      },
    },
    neuro: {
      conditions: [
        { code: 'G20', name: 'Parkinson disease', category: 'movement' },
        { code: 'G47.x', name: 'Sleep disorder', category: 'sleep' },
      ],
    },
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

  it('prefers the DSM name and cluster when a code is in both condition tables', () => {
    const pathway = { ...LIMBIC_PATHWAY, dsm_conditions: ['G47.x'] };
    const [row] = computeImpactChains(buildFixtureSources([pathway]));
    expect([row.dsm_name, row.dsm_cluster]).toEqual(['Sleep-wake disorder', 'Mood']);
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
    const resolveRegion = createRegionResolver(FIXTURE_ATLAS);
    expect(() => resolveRegion(ALIAS_NOTE_KEY, 'test')).toThrow(UnresolvedRegionError);
    expect(() => resolveRegion('constructor', 'test')).toThrow(UnresolvedRegionError);
  });

  it('says so when an alias points at a region that does not exist', () => {
    const atlas = { ...FIXTURE_ATLAS, region_aliases: { ...FIXTURE_ATLAS.region_aliases, claustrum: 'cla' } };
    const resolveClaustrum = () => createRegionResolver(atlas)('claustrum', 'pathway "fixture"');
    expect(resolveClaustrum).toThrow(DanglingRegionAliasError);
    expect(resolveClaustrum).toThrow(/is a region_aliases key .* points at "cla", which is not a brain_regions id/);
  });

  it('reports a sub-structure alias as part_to_whole', () => {
    const { region, match } = createRegionResolver(FIXTURE_ATLAS)('locus_coeruleus', 'test');
    expect([region.id, match]).toEqual(['pons', REGION_MATCH.PART_TO_WHOLE]);
  });
});

describe('chain warnings', () => {
  const sources = buildFixtureSources([LIMBIC_PATHWAY]);

  it('finds a technique whose band the atlas does not define', () => {
    const registrar = { techniques: [...sources.registrar.techniques, { id: 'QIF-T9003', band_ids: ['N7', 'N9', 'X1'] }] };
    expect(findTechniquesWithUnknownBands(registrar, FIXTURE_ATLAS)).toEqual([
      { technique_id: 'QIF-T9002', unknown_band_ids: ['S2'] },
      { technique_id: 'QIF-T9003', unknown_band_ids: ['N9', 'X1'] },
    ]);
  });

  it('warns about unknown bands and about rows joined through a scope-changing alias', () => {
    const warnings = listChainWarnings(computeImpactChains(sources), sources);
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toMatch(/^3 rows join through an alias that changes anatomical scope \(pathways: fixture_limbic\)/);
    expect(warnings[1]).toMatch(/^QIF-T9002 names band\(s\) S2/);
  });

  it('stays silent when every band is known and every join keeps its scope', () => {
    const pathway = { ...LIMBIC_PATHWAY, targets: ['hippocampus'] };
    const registrar = { techniques: [sources.registrar.techniques[0]] };
    const quietSources = { ...buildFixtureSources([pathway]), registrar };
    expect(listChainWarnings(computeImpactChains(quietSources), quietSources)).toEqual([]);
  });
});

describe('serializeImpactChains', () => {
  const rows = computeImpactChains(buildFixtureSources([LIMBIC_PATHWAY]));
  const BRACKET_LINE_COUNT = 2;

  it('writes one row per line, a trailing newline, and JSON that parses back to the rows', () => {
    const serialized = serializeImpactChains(rows);
    expect(JSON.parse(serialized)).toEqual(rows);
    expect(serialized.endsWith(']\n')).toBe(true);
    expect(serialized.trimEnd().split('\n')).toHaveLength(rows.length + BRACKET_LINE_COUNT);
  });

  it('writes an empty table as valid JSON', () => {
    expect(JSON.parse(serializeImpactChains([]))).toEqual([]);
  });
});

/**
 * Sources and chains are loaded inside the tests, not while the file is collected,
 * so bad data fails the test that names the problem instead of the whole file.
 */
describe('impact chains against the datalake', () => {
  let cachedSources;
  let cachedChains;
  const getSources = () => (cachedSources ??= loadChainSources());
  const getChains = () => (cachedChains ??= computeImpactChains(getSources()));
  const listAliasKeys = (atlas) => Object.keys(atlas.region_aliases).filter((key) => key !== ALIAS_NOTE_KEY);

  function describeResolutionFailure(resolveRegion, endpointId, context) {
    try {
      resolveRegion(endpointId, context);
      return undefined;
    } catch (error) {
      return error.message;
    }
  }

  it('resolves every pathway origin and target to an atlas region', () => {
    const { atlas, pathways } = getSources();
    const resolveRegion = createRegionResolver(atlas);
    const failures = pathways.pathways.flatMap((pathway) =>
      listPathwayEndpoints(pathway)
        .map((endpointId) => describeResolutionFailure(resolveRegion, endpointId, `pathway "${pathway.id}"`))
        .filter((failure) => failure !== undefined));
    expect(failures).toEqual([]);
  });

  it('points every alias at a region that exists', () => {
    const { atlas } = getSources();
    const regionIds = new Set(atlas.brain_regions.map((region) => region.id));
    expect(listAliasKeys(atlas).filter((alias) => !regionIds.has(atlas.region_aliases[alias]))).toEqual([]);
  });

  it('classifies only real aliases as scope-changing, and each one once', () => {
    const { atlas } = getSources();
    const aliasKeys = listAliasKeys(atlas);
    const classified = SCOPE_CHANGING_MATCHES.flatMap((relation) => atlas.region_alias_relations[relation]);
    expect(classified.filter((alias) => !aliasKeys.includes(alias))).toEqual([]);
    expect(new Set(classified).size).toBe(classified.length);
  });

  it('names no band in the registrar that the atlas does not define', () => {
    const { atlas, registrar } = getSources();
    expect(findTechniquesWithUnknownBands(registrar, atlas)).toEqual([]);
  });

  it('gives chain rows to every region that a pathway with conditions runs through', () => {
    const { atlas, pathways, registrar } = getSources();
    const resolveRegion = createRegionResolver(atlas);
    const targetedBands = new Set(registrar.techniques.flatMap((technique) => technique.band_ids ?? []));
    const regionsWithRows = new Set(getChains().map((chain) => chain.region_id));
    const expectedRegionIds = new Set(
      pathways.pathways
        .filter((pathway) => (pathway.dsm_conditions ?? []).length > 0)
        .flatMap((pathway) => listPathwayEndpoints(pathway).map((endpointId) => resolveRegion(endpointId, pathway.id).region))
        .filter((region) => targetedBands.has(region.qif_band))
        .map((region) => region.id),
    );
    expect(expectedRegionIds.size).toBeGreaterThan(0);
    expect([...expectedRegionIds].filter((regionId) => !regionsWithRows.has(regionId))).toEqual([]);
  });

  it('gives chain rows to every technique whose band holds a region with a pathway', () => {
    const chains = getChains();
    const bandsWithRows = new Set(chains.map((chain) => chain.band_id));
    const techniquesWithRows = new Set(chains.map((chain) => chain.technique_id));
    const missing = getSources().registrar.techniques
      .filter((technique) => (technique.band_ids ?? []).some((bandId) => bandsWithRows.has(bandId)))
      .filter((technique) => !techniquesWithRows.has(technique.id))
      .map((technique) => technique.id);
    expect(missing).toEqual([]);
  });

  it('matches the committed impact-chains.json byte for byte (regenerate with `npm run compute:chains`)', () => {
    const isCommittedFileCurrent = readFileSync(IMPACT_CHAINS_PATH, 'utf-8') === serializeImpactChains(getChains());
    expect(isCommittedFileCurrent).toBe(true);
  });
});
