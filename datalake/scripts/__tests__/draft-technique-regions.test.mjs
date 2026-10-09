import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CURATION_PATH, CurationError, REGISTRAR_PATH, TECHNIQUE_REGIONS_PATH,
  buildTechniqueRegions, findRationaleProblem, readTechniqueField, serialiseTechniqueRegions,
} from '../draft-technique-regions.mjs';
import { FIXTURE_CURATION, FIXTURE_REGISTRAR } from './technique-region-fixture.mjs';

const STIMULATION_ID = 'QIF-T9001';
const withEntry = (techniqueId, entry) => ({ techniques: { ...FIXTURE_CURATION.techniques, [techniqueId]: entry } });
const withLink = (link) => withEntry(STIMULATION_ID, { rationale: 'Fixture.', links: [{ ...FIXTURE_CURATION.techniques[STIMULATION_ID].links[0], ...link }] });
const build = (curation) => buildTechniqueRegions(curation, FIXTURE_REGISTRAR);

describe('buildTechniqueRegions', () => {
  const built = build(FIXTURE_CURATION);

  it('writes one entry per neural-band technique, in registrar order, and none for a device-side technique', () => {
    expect(Object.keys(built.techniques)).toEqual(['QIF-T9001', 'QIF-T9002']);
  });

  it('writes a link as the catalog\'s word, its quote and pointer, unchecked and AI-drafted, with nothing derived', () => {
    expect(built.techniques[STIMULATION_ID]).toEqual({
      scope: 'regions',
      rationale: 'The notes name one target.',
      links: [{
        term: 'prefrontal cortex',
        valid_for_addressing: [1],
        evidence: {
          claim_basis: 'catalog_text',
          source_ref: { file: 'datalake/qtara-registrar.json', pointer: '/techniques/QIF-T9001/notes', quote: 'Targets the prefrontal cortex' },
          check_status: 'unchecked',
          rationale: 'Named as the target.',
        },
        drafted_by: 'ai',
      }],
    });
  });

  it('opens a band-level rationale with its reason and says when a generated band summary was not counted', () => {
    expect(built.techniques['QIF-T9002']).toEqual({
      scope: 'band_level',
      rationale: 'no_structure_named: The text describes passive capture and names no structure. Its generated band summary is not counted.',
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
    expect(() => build(withEntry(STIMULATION_ID, { rationale: 'Fixture.', links: [] }))).toThrow(CurationError);
  });

  it.each([
    'Named as the target. Reviewed and confirmed by a neuroscientist.',
    'Named as the target; verified against the literature.',
    'Named as the target (expert reading).',
  ])('refuses a link rationale that claims a check or an authority: "%s"', (rationale) => {
    expect(() => build(withLink({ rationale }))).toThrow(/claims a check or an authority/);
  });

  it('refuses a link rationale that does not open with the structure\'s role, and the same claims in an entry rationale or a skip note', () => {
    expect(() => build(withLink({ rationale: 'Plausibly affected by the stimulation.' }))).toThrow(/must open with one of: Named as/);
    const entry = FIXTURE_CURATION.techniques[STIMULATION_ID];
    expect(() => build(withEntry(STIMULATION_ID, { ...entry, rationale: 'Validated by a clinician.' }))).toThrow(/claims a check or an authority/);
    expect(() => build(withEntry(STIMULATION_ID, { ...entry, skipped: [{ ...entry.skipped[0], note: 'Peer reviewed.' }] }))).toThrow(/claims a check or an authority/);
    expect(findRationaleProblem('Named as the stimulation target.', true)).toBeNull();
    expect(findRationaleProblem('The text is unchecked prose about a demonstrated method.', false)).toBeNull();
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
