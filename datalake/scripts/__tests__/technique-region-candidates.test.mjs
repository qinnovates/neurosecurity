import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DATALAKE_DIR } from '../datalake-cli.mjs';
import {
  TEMPLATED_PATHWAY_CLAUSES, buildMentionPattern, buildRegionLexicon, findCandidates,
  hasNeuralBand, isTemplatedField, isTemplatedPathway, listTextFields,
} from '../technique-region-candidates.mjs';
import { FIXTURE_ATLAS } from './atlas-fixture.mjs';
import { FIXTURE_REGISTRAR, TEMPLATED_PATHWAY } from './technique-region-fixture.mjs';

const [STIMULATION, EAVESDROPPING, FIRMWARE] = FIXTURE_REGISTRAR.techniques;
const lexicon = buildRegionLexicon(FIXTURE_ATLAS);
const readDatalake = (fileName) => JSON.parse(readFileSync(path.join(DATALAKE_DIR, fileName), 'utf-8'));
const describeHit = (candidate) => `${candidate.pointer}@${candidate.start}:${candidate.matched}:${candidate.kind}:${candidate.region_id}`;

describe('isTemplatedPathway', () => {
  it('recognises a string made only of generated band clauses', () => {
    expect(isTemplatedPathway(TEMPLATED_PATHWAY)).toBe(true);
    expect(isTemplatedPathway(TEMPLATED_PATHWAY_CLAUSES[0])).toBe(true);
  });

  it.each([
    'N3 (amygdala) → N4 (hypothalamus/PAG) → N1 (autonomic nervous system) — acute fear circuit activation',
    'N7 (PFC/M1) → executive function; N4 (Broca\'s area) → speech',
    'S-domain only — no neural pathway',
    '',
  ])('treats "%s" as the technique\'s own text', (text) => {
    expect(isTemplatedPathway(text)).toBe(false);
  });

  it('applies only to the dsm5 pathway field', () => {
    expect(isTemplatedField('/techniques/QIF-T9001/tara/dsm5/pathway', TEMPLATED_PATHWAY)).toBe(true);
    expect(isTemplatedField('/techniques/QIF-T9001/notes', TEMPLATED_PATHWAY)).toBe(false);
  });

  it('matches what build_pathway() in populate-dsm5.py prints for each band profile (guard)', () => {
    const generator = readFileSync(path.join(DATALAKE_DIR, 'scripts', 'populate-dsm5.py'), 'utf-8');
    expect(generator).toContain('parts.append(f"{band} ({struct_str}) → {func_str}")');
    for (const clause of TEMPLATED_PATHWAY_CLAUSES) {
      const [, , structures, firstFunction] = /^(\S+) \((.+)\) → (.+)$/.exec(clause);
      for (const structure of structures.split('/')) expect(generator).toContain(`"${structure}"`);
      expect(generator).toContain(`"${firstFunction}"`);
    }
  });
});

describe('listTextFields', () => {
  it('lists every string with a pointer, and marks a string inside a list as not citable', () => {
    const fields = listTextFields(STIMULATION);
    expect(fields.find((field) => field.pointer === '/techniques/QIF-T9001/tara/mechanism')).toMatchObject({ citable: true });
    expect(fields.find((field) => field.pointer === '/techniques/QIF-T9001/sources/0')).toMatchObject({ citable: false, text: 'Fixture et al. 2020 (Hippocampus)' });
    expect(fields.map((field) => field.pointer)).toContain('/techniques/QIF-T9001/band_ids/0');
  });
});

describe('buildMentionPattern', () => {
  it('finds a term whatever its case and separators, with a plural s, and never inside a longer word', () => {
    const count = (text) => [...text.matchAll(buildMentionPattern('prefrontal_cortex'))].length;
    expect(count('The Prefrontal Cortex and prefrontal-cortex and prefrontal_cortexs')).toBe(3);
    expect(count('nonprefrontal cortex, prefrontal cortexes, prefrontalcortex')).toBe(0);
  });

  it('keeps the written case when asked to', () => {
    expect('RF and rf'.match(buildMentionPattern('RF', true))).toEqual(['RF']);
  });
});

describe('findCandidates', () => {
  it('finds ids, names and aliases in every field with their offsets, and flags generated text', () => {
    const hits = findCandidates(STIMULATION, lexicon).map(describeHit);
    expect(hits).toContain('/techniques/QIF-T9001/notes@12:prefrontal cortex:synonym:pfc');
    expect(hits).toContain('/techniques/QIF-T9001/notes@12:prefrontal cortex:name:pfc');
    expect(hits).toContain('/techniques/QIF-T9001/notes@50:pons:id:pons');
    expect(hits).toContain('/techniques/QIF-T9001/tara/mechanism@15:Prefrontal-Cortex:synonym:pfc');
    expect(hits).toContain('/techniques/QIF-T9001/sources/0@21:Hippocampus:id:hippocampus');
    const templatedHits = findCandidates(STIMULATION, lexicon).filter((candidate) => candidate.templated);
    expect(templatedHits.map((candidate) => candidate.matched)).toEqual(expect.arrayContaining(['PFC', 'hippocampus', 'amygdala']));
    expect(templatedHits.every((candidate) => candidate.pointer.endsWith('/tara/dsm5/pathway'))).toBe(true);
  });

  it('finds nothing in text that names no structure, apart from the generated band summary', () => {
    expect(findCandidates(EAVESDROPPING, lexicon).filter((candidate) => !candidate.templated)).toEqual([]);
  });

});

describe('the real registrar (guards)', () => {
  const registrar = readDatalake('qtara-registrar.json');
  const realLexicon = buildRegionLexicon(readDatalake('qif-brain-bci-atlas.json'));

  it('tells neural-band techniques from device-side ones', () => {
    expect(hasNeuralBand(STIMULATION)).toBe(true);
    expect(hasNeuralBand(FIRMWARE)).toBe(false);
    expect(registrar.techniques.filter(hasNeuralBand).length).toBeGreaterThan(0);
    expect(registrar.techniques.filter((technique) => !hasNeuralBand(technique)).length).toBeGreaterThan(0);
  });

  it('holds a word for every region and finds candidates in the registrar text', () => {
    expect(new Set(realLexicon.map((term) => term.region_id)).size).toBe(readDatalake('qif-brain-bci-atlas.json').brain_regions.length);
    const candidates = registrar.techniques.filter(hasNeuralBand).flatMap((technique) => findCandidates(technique, realLexicon));
    expect(candidates.filter((candidate) => candidate.templated).length).toBeGreaterThan(0);
    expect(candidates.filter((candidate) => !candidate.templated).length).toBeGreaterThan(0);
  });
});
