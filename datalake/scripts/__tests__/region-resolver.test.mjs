import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { computeImpactChains } from '../compute-impact-chains.mjs';
import { DATALAKE_DIR } from '../datalake-cli.mjs';
import { derivePathwayBands } from '../derive-pathway-bands.mjs';
import {
  ALIAS_KINDS,
  AmbiguousAliasKindError,
  LIGHTING_MATCHES,
  REGION_MATCH,
  UnclassifiedRegionAliasError,
  createClassifiedRegionResolver,
  createRegionResolver,
  listAliasKinds,
} from '../region-resolver.mjs';
import { FIXTURE_ATLAS } from './atlas-fixture.mjs';

const UNCLASSIFIED_ALIAS = 'claustrum_complex';
const ATLAS_WITH_UNCLASSIFIED_ALIAS = Object.freeze({
  ...FIXTURE_ATLAS,
  region_aliases: { ...FIXTURE_ATLAS.region_aliases, [UNCLASSIFIED_ALIAS]: 'pfc' },
});

/**
 * Every alias in qif-brain-bci-atlas.json with the kind it is classified as.
 * The kinds are an AI judgment from the atlas file's own names; no anatomist
 * has reviewed them. A new alias, or a changed kind, must be added here by
 * hand, so no alias can take a kind by default.
 */
const PINNED_ALIAS_KINDS = Object.freeze({
  prefrontal_cortex: 'synonym',
  primary_motor_cortex: 'synonym',
  primary_visual_cortex: 'synonym',
  primary_auditory_cortex: 'synonym',
  primary_somatosensory_cortex: 'synonym',
  premotor_cortex: 'synonym',
  supplementary_motor_area: 'synonym',
  posterior_parietal_cortex: 'synonym',
  anterior_cingulate_cortex: 'synonym',
  insular_cortex: 'synonym',
  basolateral_amygdala: 'synonym',
  central_amygdala: 'synonym',
  ventral_tegmental_area: 'synonym',
  subthalamic_nucleus: 'synonym',
  globus_pallidus_internus: 'synonym',
  ventral_intermediate_nucleus: 'synonym',
  cerebellar_cortex: 'synonym',
  deep_cerebellar_nuclei: 'synonym',
  cerebellar_vermis: 'synonym',
  medulla_oblongata: 'synonym',
  cervical_spinal_cord: 'synonym',
  thoracic_spinal_cord: 'synonym',
  lumbar_spinal_cord: 'synonym',
  sacral_spinal_cord: 'synonym',
  nucleus_accumbens: 'part_to_whole',
  cortex: 'whole_to_part',
  brainstem: 'whole_to_part',
  cerebellum: 'whole_to_part',
  amygdala: 'whole_to_part',
  basal_ganglia: 'whole_to_part',
  lateral_hypothalamus: 'part_to_whole',
  PVN_hypothalamus: 'part_to_whole',
  SON_hypothalamus: 'part_to_whole',
  tuberomammillary_nucleus: 'part_to_whole',
  'C1-C3_medullary_neurons': 'part_to_whole',
  spinal_cord: 'whole_to_part',
  spinal_dorsal_horn: 'whole_to_part',
  PAG: 'part_to_whole',
});

function readAtlas() {
  return JSON.parse(readFileSync(path.join(DATALAKE_DIR, 'qif-brain-bci-atlas.json'), 'utf-8'));
}

describe('alias kinds on a fixture', () => {
  it('reports an alias listed under synonym as a synonym', () => {
    const { region, match } = createRegionResolver(FIXTURE_ATLAS)('prefrontal_cortex', 'test');
    expect([region.id, match]).toEqual(['pfc', REGION_MATCH.SYNONYM]);
  });

  it('reports an alias in no kind list as unclassified, never as a synonym', () => {
    const { region, match } = createRegionResolver(ATLAS_WITH_UNCLASSIFIED_ALIAS)(UNCLASSIFIED_ALIAS, 'test');
    expect([region.id, match]).toEqual(['pfc', REGION_MATCH.UNCLASSIFIED]);
  });

  it('lets only an id or a synonym light a region', () => {
    expect(LIGHTING_MATCHES).toEqual([REGION_MATCH.ID, REGION_MATCH.SYNONYM]);
    expect(LIGHTING_MATCHES).not.toContain(REGION_MATCH.UNCLASSIFIED);
  });

  it('refuses an alias listed under two kinds', () => {
    const atlas = {
      ...FIXTURE_ATLAS,
      region_alias_relations: { ...FIXTURE_ATLAS.region_alias_relations, synonym: ['prefrontal_cortex', 'amygdala'] },
    };
    expect(() => createRegionResolver(atlas)).toThrow(AmbiguousAliasKindError);
    expect(() => createRegionResolver(atlas)).toThrow(/"amygdala" is listed under both "synonym" and "whole_to_part"/);
  });

  it('lists every alias with its kind, unclassified included', () => {
    expect(listAliasKinds(ATLAS_WITH_UNCLASSIFIED_ALIAS)).toEqual({
      prefrontal_cortex: 'synonym',
      basolateral_amygdala: 'synonym',
      amygdala: 'whole_to_part',
      locus_coeruleus: 'part_to_whole',
      [UNCLASSIFIED_ALIAS]: 'unclassified',
    });
  });
});

describe('joins that must not drop an endpoint', () => {
  const pathway = { id: 'fixture_unclassified', origin: [UNCLASSIFIED_ALIAS], targets: ['hippocampus'], dsm_conditions: ['F32.x'] };

  it('refuses an unclassified alias and says how to classify it', () => {
    const resolveRegion = createClassifiedRegionResolver(ATLAS_WITH_UNCLASSIFIED_ALIAS);
    expect(() => resolveRegion(UNCLASSIFIED_ALIAS, 'pathway "fixture"')).toThrow(UnclassifiedRegionAliasError);
    expect(() => resolveRegion(UNCLASSIFIED_ALIAS, 'pathway "fixture"')).toThrow(/Add it to exactly one of synonym, part_to_whole, whole_to_part/);
  });

  it('still resolves a classified alias', () => {
    expect(createClassifiedRegionResolver(FIXTURE_ATLAS)('amygdala', 'test').match).toBe(REGION_MATCH.WHOLE_TO_PART);
  });

  it('stops the impact chain build on a pathway that uses an unclassified alias', () => {
    const sources = { registrar: { techniques: [] }, atlas: ATLAS_WITH_UNCLASSIFIED_ALIAS, pathways: { pathways: [pathway] }, dsm: {}, neuro: {} };
    expect(() => computeImpactChains(sources)).toThrow(UnclassifiedRegionAliasError);
  });

  it('stops pathway band derivation on an unclassified alias', () => {
    const resolveRegion = createClassifiedRegionResolver(ATLAS_WITH_UNCLASSIFIED_ALIAS);
    expect(() => derivePathwayBands(pathway, resolveRegion)).toThrow(UnclassifiedRegionAliasError);
  });
});

describe('alias kinds against the datalake', () => {
  it('pins the kind of every alias (guard: edit PINNED_ALIAS_KINDS when an alias is added or reclassified)', () => {
    const aliasKinds = listAliasKinds(readAtlas());
    expect(Object.keys(aliasKinds).length).toBeGreaterThan(0);
    expect(aliasKinds).toEqual(PINNED_ALIAS_KINDS);
  });

  it('leaves no alias unclassified (guard)', () => {
    const kinds = Object.values(listAliasKinds(readAtlas()));
    expect(kinds.length).toBeGreaterThan(0);
    expect(kinds.filter((kind) => kind === REGION_MATCH.UNCLASSIFIED)).toEqual([]);
  });

  it('lists only real aliases under a kind (guard)', () => {
    const atlas = readAtlas();
    const listed = ALIAS_KINDS.flatMap((kind) => atlas.region_alias_relations[kind]);
    expect(listed.length).toBeGreaterThan(0);
    expect(listed.filter((alias) => !Object.hasOwn(atlas.region_aliases, alias))).toEqual([]);
  });

  it('says in the data that the kinds are an unreviewed AI judgment (guard)', () => {
    expect(readAtlas().region_alias_relations._classification).toEqual({
      drafted_by: 'ai',
      human_reviewed: false,
      basis: 'An AI judgment from the region and alias names in this file. No anatomist has reviewed it.',
    });
  });
});
