import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SKIP_CATEGORIES, TECHNIQUE_OUTCOME, auditMentions, describeLinks, listBandDisagreements,
  listPathwayBandConflicts, listTemplatedStrings, summariseDistribution,
} from '../audit-technique-regions.mjs';
import { DATALAKE_DIR } from '../datalake-cli.mjs';
import { CURATION_PATH, REGISTRAR_PATH, TECHNIQUE_REGIONS_PATH, buildTechniqueRegions } from '../draft-technique-regions.mjs';
import { FIXTURE_ATLAS } from './atlas-fixture.mjs';
import { FIXTURE_CURATION, FIXTURE_REGISTRAR, TEMPLATED_PATHWAY } from './technique-region-fixture.mjs';

const STIMULATION_ID = 'QIF-T9001';
const EAVESDROPPING_ID = 'QIF-T9002';
const readJson = (filePath) => JSON.parse(readFileSync(filePath, 'utf-8'));
const audit = (curation, registrar = FIXTURE_REGISTRAR) => auditMentions(buildTechniqueRegions(curation, registrar), curation, registrar, FIXTURE_ATLAS);
const withStimulation = (entry) => ({ techniques: { ...FIXTURE_CURATION.techniques, [STIMULATION_ID]: { ...FIXTURE_CURATION.techniques[STIMULATION_ID], ...entry } } });
const withTechnique = (technique) => ({ techniques: FIXTURE_REGISTRAR.techniques.map((existing) => (existing.id === technique.id ? technique : existing)) });

describe('auditMentions', () => {
  it('accounts for a mention inside a linked term, a repeat of it in another field, a recorded skip and generated text', () => {
    expect(audit(FIXTURE_CURATION)).toEqual([]);
  });

  it('reports a mention that is neither linked nor skipped', () => {
    const [negation] = FIXTURE_CURATION.techniques[STIMULATION_ID].skipped;
    expect(audit(withStimulation({ skipped: [negation] }))).toEqual([
      { technique_id: STIMULATION_ID, field: '/sources/0', matched: 'Hippocampus', kind: 'id', region_id: 'hippocampus' },
      { technique_id: STIMULATION_ID, field: '/sources/0', matched: 'Hippocampus', kind: 'name', region_id: 'hippocampus' },
    ]);
  });

  it('fails a band-level entry whose registrar text names a region or a synonym, in any field', () => {
    const [, eavesdropping] = FIXTURE_REGISTRAR.techniques;
    const naming = withTechnique({ ...eavesdropping, notes: 'Passive capture from the basolateral amygdala.' });
    expect(audit(FIXTURE_CURATION, naming).map((mention) => `${mention.technique_id}:${mention.matched}:${mention.kind}`)).toEqual([
      `${EAVESDROPPING_ID}:basolateral amygdala:name`, `${EAVESDROPPING_ID}:basolateral amygdala:synonym`, `${EAVESDROPPING_ID}:amygdala:whole_to_part`,
    ]);
  });

  it('does not let a link to one region excuse a mention of another', () => {
    const [stimulation] = FIXTURE_REGISTRAR.techniques;
    const naming = withTechnique({ ...stimulation, tara: { ...stimulation.tara, mechanism: 'Stimulation of PFC and Hippocampus' } });
    expect(audit(FIXTURE_CURATION, naming).map((mention) => mention.matched)).toEqual(['Hippocampus', 'Hippocampus']);
  });

  it('refuses a skip that names an unknown category or words the field no longer holds', () => {
    const skip = FIXTURE_CURATION.techniques[STIMULATION_ID].skipped[0];
    expect(() => audit(withStimulation({ skipped: [{ ...skip, category: 'unimportant' }] }))).toThrow(/skip category "unimportant" is not one of/);
    expect(() => audit(withStimulation({ skipped: [{ ...skip, text: 'medulla' }] }))).toThrow(/the skipped mention "medulla" is not in \/notes/);
  });
});

describe('describeLinks and summariseDistribution', () => {
  const curation = {
    techniques: {
      [STIMULATION_ID]: {
        rationale: 'Fixture.',
        links: [
          { term: 'prefrontal cortex', field: '/notes', quote: 'Targets the prefrontal cortex', rationale: 'Target.' },
          { term: 'pons', field: '/notes', quote: 'Does not reach the pons', rationale: 'Fixture link outside the band tags.' },
          { term: 'Prefrontal-Cortex circuits', field: '/tara/mechanism', quote: 'Stimulation of Prefrontal-Cortex circuits', rationale: 'Fixture unresolved term.' },
        ],
      },
      [EAVESDROPPING_ID]: FIXTURE_CURATION.techniques[EAVESDROPPING_ID],
    },
  };
  const techniqueRegions = buildTechniqueRegions(curation, FIXTURE_REGISTRAR);
  const described = describeLinks(techniqueRegions, FIXTURE_REGISTRAR, FIXTURE_ATLAS);

  it('resolves each term, and lights only an id or synonym whose band is among the tags', () => {
    expect(described.map((link) => [link.term, link.resolution, link.region_id, link.band_agrees, link.lights])).toEqual([
      ['prefrontal cortex', 'synonym', 'pfc', true, true],
      ['pons', 'id', 'pons', false, false],
      ['Prefrontal-Cortex circuits', 'unresolved', null, false, false],
    ]);
  });

  it('lists a link outside the band tags instead of dropping it', () => {
    expect(listBandDisagreements(described)).toMatchObject([{ technique_id: STIMULATION_ID, term: 'pons', region_band: 'N2', technique_bands: ['N7', 'N6'] }]);
  });

  it('counts each technique once, by its best link, and each band-level reason', () => {
    expect(summariseDistribution(techniqueRegions, described)).toEqual({
      techniques: 2, linked: 1, band_level: 1,
      outcomes: { [TECHNIQUE_OUTCOME.LIT]: 1 },
      band_level_reasons: { no_structure_named: 1 },
      links: 3, link_resolutions: { synonym: 1, id: 1, unresolved: 1 }, lighting_links: 1,
    });
  });
});

describe('listTemplatedStrings and listPathwayBandConflicts', () => {
  it('groups the neural-band techniques by the generated string they carry', () => {
    expect(listTemplatedStrings(FIXTURE_REGISTRAR)).toEqual([{ text: TEMPLATED_PATHWAY, techniques: 2, technique_ids: [STIMULATION_ID, EAVESDROPPING_ID] }]);
  });

  it('reports a band label in a technique\'s own pathway text that the technique is not tagged with, and ignores generated text', () => {
    const [stimulation] = FIXTURE_REGISTRAR.techniques;
    const ownText = 'N3 (amygdala) → N6 (hippocampus)';
    const registrar = withTechnique({ ...stimulation, tara: { ...stimulation.tara, dsm5: { pathway: ownText } } });
    expect(listPathwayBandConflicts(registrar)).toEqual([{ technique_id: STIMULATION_ID, band_ids: ['N7', 'N6'], untagged_bands_in_text: ['N3'], text: ownText }]);
    expect(listPathwayBandConflicts(FIXTURE_REGISTRAR)).toEqual([]);
  });
});

describe('the committed files (guards)', () => {
  const [techniqueRegions, curation, registrar] = [readJson(TECHNIQUE_REGIONS_PATH), readJson(CURATION_PATH), readJson(REGISTRAR_PATH)];
  const atlas = readJson(path.join(DATALAKE_DIR, 'qif-brain-bci-atlas.json'));

  it('leave no mention of an atlas word unaccounted for in any technique, band-level entries included', () => {
    expect(Object.keys(techniqueRegions.techniques).length).toBeGreaterThan(0);
    expect(auditMentions(techniqueRegions, curation, registrar, atlas)).toEqual([]);
  });

  it('record skips only under a listed category, each with a note', () => {
    const skips = Object.values(curation.techniques).flatMap((entry) => entry.skipped ?? []);
    expect(skips.length).toBeGreaterThan(0);
    expect(skips.filter((skip) => !SKIP_CATEGORIES.includes(skip.category) || typeof skip.note !== 'string' || skip.note.trim() === '')).toEqual([]);
  });
});
