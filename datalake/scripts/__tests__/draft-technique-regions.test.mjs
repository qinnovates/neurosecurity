import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CURATION_PATH, CurationError, REGISTRAR_PATH, TECHNIQUE_REGIONS_PATH,
  ENTRY_RATIONALES, LINK_ROLES, buildTechniqueRegions, readTechniqueField, renderLinkRationale, serialiseTechniqueRegions,
} from '../draft-technique-regions.mjs';
import { FIXTURE_CURATION, FIXTURE_REGISTRAR } from './technique-region-fixture.mjs';

const STIMULATION_ID = 'QIF-T9001';
const withEntry = (techniqueId, entry) => ({ techniques: { ...FIXTURE_CURATION.techniques, [techniqueId]: entry } });
const withLink = (link) => withEntry(STIMULATION_ID, { links: [{ ...FIXTURE_CURATION.techniques[STIMULATION_ID].links[0], ...link }] });
const build = (curation) => buildTechniqueRegions(curation, FIXTURE_REGISTRAR);

describe('buildTechniqueRegions', () => {
  const built = build(FIXTURE_CURATION);

  it('writes one entry per neural-band technique, in registrar order, and none for a device-side technique', () => {
    expect(Object.keys(built.techniques)).toEqual(['QIF-T9001', 'QIF-T9002']);
  });

  it('writes a link as the catalog\'s word, its quote and pointer, unchecked and AI-drafted, with nothing derived', () => {
    expect(built.techniques[STIMULATION_ID]).toEqual({
      scope: 'regions',
      rationale: 'Each link quotes this technique\'s own registrar text; nothing is added from outside it.',
      links: [{
        term: 'prefrontal cortex',
        valid_for_addressing: [1],
        evidence: {
          claim_basis: 'catalog_text',
          source_ref: { file: 'datalake/qtara-registrar.json', pointer: '/techniques/QIF-T9001/notes', quote: 'Targets the prefrontal cortex' },
          check_status: 'unchecked',
          rationale: 'Named in notes as what the technique stimulates, disrupts or otherwise acts on.',
        },
        drafted_by: 'ai',
      }],
    });
  });

  it('opens a band-level rationale with its reason and says when a generated band summary was not counted', () => {
    expect(built.techniques['QIF-T9002']).toEqual({
      scope: 'band_level',
      rationale: 'no_structure_named: No field of this technique\'s registrar text names a structure. Its generated band summary is not counted.',
      links: [],
    });
  });

  it('refuses a quote that is not in the named field', () => {
    expect(() => build(withLink({ quote: 'Targets the prefrontal cortex directly' }))).toThrow(/the quote "Targets the prefrontal cortex directly" is not in \/notes/);
  });

  it('refuses a term its quote does not contain', () => {
    expect(() => build(withLink({ term: 'hippocampus' }))).toThrow(/does not contain the term "hippocampus"/);
  });

  it('refuses a field that is missing, and a field inside a list', () => {
    expect(() => build(withLink({ field: '/tara/target' }))).toThrow(/which is not text in the registrar/);
    expect(() => build(withLink({ field: '/sources/0', term: 'Hippocampus', quote: '(Hippocampus)' }))).toThrow(/which is inside a list/);
  });

  it('refuses an entry with both links and a band-level reason, and one with neither', () => {
    const both = { ...FIXTURE_CURATION.techniques[STIMULATION_ID], band_level: 'no_structure_named' };
    expect(() => build(withEntry(STIMULATION_ID, both))).toThrow(/either links or a band_level reason, and not both/);
    expect(() => build(withEntry(STIMULATION_ID, { links: [] }))).toThrow(CurationError);
  });

  it('has no place for free prose: a rationale, a note or any other key on an entry or a link is refused', () => {
    const claim = 'Independent verification by a neurologist found this correct';
    expect(() => build(withLink({ rationale: claim }))).toThrow(/link "prefrontal cortex" has the key "rationale"/);
    expect(() => build(withLink({ note: 'signed off by Dr. Smith' }))).toThrow(/has the key "note"/);
    expect(() => build(withEntry(STIMULATION_ID, { ...FIXTURE_CURATION.techniques[STIMULATION_ID], rationale: 'Reviewer agreed' }))).toThrow(/the entry has the key "rationale"/);
    expect(() => build(withEntry('QIF-T9002', { band_level: 'no_structure_named', rationale: 'Vetted by a specialist' }))).toThrow(/the entry has the key "rationale"/);
  });

  it('refuses a role outside the closed list and a band-level reason outside it', () => {
    expect(() => build(withLink({ role: 'Human-audited and accurate' }))).toThrow(/has the role "Human-audited and accurate"/);
    expect(() => build(withLink({ role: 'toString' }))).toThrow(/has the role "toString"/);
    expect(() => build(withEntry('QIF-T9002', { band_level: 'reviewed_and_confirmed' }))).toThrow(/"reviewed_and_confirmed" is not a band-level reason/);
    expect(() => build(withEntry('QIF-T9002', { band_level: 'regions' }))).toThrow(/"regions" is not a band-level reason/);
  });

  it('writes each role as its one sentence, filling in only the term and the field name', () => {
    expect(Object.keys(LINK_ROLES)).toEqual(['action_target', 'recording_site', 'delivery_route', 'pathway_stage', 'target_field', 'adjective']);
    expect(renderLinkRationale('target_field', 'VTA', '/tara/engineering/parameters/target')).toBe('The value of the catalog\'s own target field (tara.engineering.parameters.target).');
    expect(renderLinkRationale('adjective', 'cortical', '/attack')).toBe('"cortical" is an adjective for a structure that attack presents as acted on, read from or passed through.');
    expect(Object.keys(ENTRY_RATIONALES)).toEqual(['regions', 'no_structure_named', 'structure_named_only_as_context', 'only_whole_structures_named', 'text_contradicts_band_tags']);
  });

  it('refuses a link whose evidence is the generated band summary, even though the quote and term are really there', () => {
    const generated = { term: 'PFC', field: '/tara/dsm5/pathway', quote: 'N7 (PFC/M1) → executive function', role: 'pathway_stage' };
    expect(() => build(withLink(generated))).toThrow(/cites \/tara\/dsm5\/pathway, which here is the generated band summary/);
  });

  it('refuses a neural-band technique with no entry and an entry for a technique with no neural band', () => {
    const { [STIMULATION_ID]: _omitted, ...rest } = FIXTURE_CURATION.techniques;
    expect(() => build({ techniques: rest })).toThrow(/QIF-T9001: has a neural band and no curation entry/);
    expect(() => build(withEntry('QIF-T9003', FIXTURE_CURATION.techniques['QIF-T9002']))).toThrow(/QIF-T9003: is not a registrar technique with a neural band/);
  });
});

describe('readTechniqueField', () => {
  it('reads a nested string and says a list item is not citable', () => {
    const [stimulation] = FIXTURE_REGISTRAR.techniques;
    expect(readTechniqueField(stimulation, '/tara/mechanism')).toEqual({ text: 'Stimulation of Prefrontal-Cortex circuits', citable: true });
    expect(readTechniqueField(stimulation, '/sources/0')).toEqual({ text: 'Fixture et al. 2020 (Hippocampus)', citable: false });
    expect(readTechniqueField(stimulation, '/tara')).toEqual({ text: undefined, citable: true });
    expect(readTechniqueField(stimulation, '/missing/field')).toEqual({ text: undefined, citable: false });
  });
});

describe('the committed data file (guard)', () => {
  it('is exactly what the curation record generates, so neither can be edited alone', () => {
    const curation = JSON.parse(readFileSync(CURATION_PATH, 'utf-8'));
    const registrar = JSON.parse(readFileSync(REGISTRAR_PATH, 'utf-8'));
    const generated = buildTechniqueRegions(curation, registrar);
    expect(Object.keys(generated.techniques).length).toBeGreaterThan(0);
    expect(readFileSync(TECHNIQUE_REGIONS_PATH, 'utf-8')).toBe(serialiseTechniqueRegions(generated));
  });
});
