/**
 * The 6-to-4 fold, against hand-made glossaries and against the registrar
 * itself. The registrar tags techniques with six codes while the ethics file
 * defines four, and it states the two folds inside the glossary; the fold is
 * read from `folds_into`, never from the name text.
 */

import { describe, expect, it } from 'vitest';
import registrar from '@shared/qtara-registrar.json';
import { foldNeurorights, NeurorightsFoldError } from '@/lib/neurorights-fold';
import { readNeurorightsTaxonomy, type IndexNeurorightCode, type NeurorightCode } from '@/lib/anatomy/technique-tags';

const GLOSSARY: IndexNeurorightCode[] = [
  { code: 'MP', name: 'Mental Privacy', folds_into: null },
  { code: 'CL', name: 'Cognitive Liberty', folds_into: null },
  { code: 'MI', name: 'Mental Integrity', folds_into: null },
  { code: 'PC', name: 'Psychological Continuity', folds_into: null },
  { code: 'DI', name: 'Dynamical Integrity', folds_into: 'MI' },
  { code: 'IDA', name: 'Informational Disassociation', folds_into: 'MP' },
];

function rightsByCode(fold: ReturnType<typeof foldNeurorights>) {
  return new Map(fold.rights.map((right) => [right.code, right]));
}

describe('foldNeurorights', () => {
  it('draws one axis per code that stands on its own, and none for a code that folds', () => {
    const fold = foldNeurorights(GLOSSARY, [['MP'], ['DI']]);
    expect(fold.rights.map((right) => right.code)).toEqual(['MP', 'CL', 'MI', 'PC']);
  });

  it('counts a folded code towards its target', () => {
    const fold = foldNeurorights(GLOSSARY, [['DI'], ['IDA']]);
    const rights = rightsByCode(fold);
    expect(rights.get('MI')?.total).toBe(1);
    expect(rights.get('MP')?.total).toBe(1);
    expect(rights.get('CL')?.total).toBe(0);
  });

  it('counts a technique once when it carries both a right and a code folded into it', () => {
    const fold = foldNeurorights(GLOSSARY, [['MI', 'DI']]);
    const mentalIntegrity = rightsByCode(fold).get('MI');
    expect(mentalIntegrity?.total).toBe(1);
    expect(mentalIntegrity?.reachedOnlyByFold).toBe(0);
  });

  it('says how many techniques reach a right only through a fold', () => {
    const fold = foldNeurorights(GLOSSARY, [['MI'], ['DI'], ['MI', 'DI']]);
    const mentalIntegrity = rightsByCode(fold).get('MI');
    expect(mentalIntegrity?.total).toBe(3);
    expect(mentalIntegrity?.reachedOnlyByFold).toBe(1);
    expect(mentalIntegrity?.foldedIn).toEqual([{ code: 'DI', name: 'Dynamical Integrity', count: 2 }]);
  });

  it('passes over a technique with no record, and counts the ones that have one', () => {
    const fold = foldNeurorights(GLOSSARY, [['MP'], null, null]);
    expect(fold.recordedTechniqueCount).toBe(1);
    expect(fold.techniqueCount).toBe(3);
    expect(rightsByCode(fold).get('MP')?.total).toBe(1);
  });

  it('counts a record that names no right as recorded, with nothing on any axis', () => {
    const fold = foldNeurorights(GLOSSARY, [[]]);
    expect(fold.recordedTechniqueCount).toBe(1);
    expect(fold.rights.every((right) => right.total === 0)).toBe(true);
  });

  it('states each fold in words, for the chart to print', () => {
    const fold = foldNeurorights(GLOSSARY, [['DI']]);
    expect(fold.foldStatements).toEqual([
      'The registrar folds DI (Dynamical Integrity) into MI (Mental Integrity): 1 techniques carry it.',
      'The registrar folds IDA (Informational Disassociation) into MP (Mental Privacy): 0 techniques carry it.',
    ]);
  });

  it('refuses a code the glossary does not define', () => {
    expect(() => foldNeurorights(GLOSSARY, [['XX' as NeurorightCode]])).toThrow(NeurorightsFoldError);
  });

  it('refuses a fold target that folds again', () => {
    const chained: IndexNeurorightCode[] = [
      { code: 'MI', name: 'Mental Integrity', folds_into: null },
      { code: 'MP', name: 'Mental Privacy', folds_into: 'MI' },
      { code: 'DI', name: 'Dynamical Integrity', folds_into: 'MP' },
    ];
    expect(() => foldNeurorights(chained, [])).toThrow(/folds again/);
  });

  it('refuses a fold target the glossary does not define', () => {
    expect(() => foldNeurorights([{ code: 'DI', name: 'Dynamical Integrity', folds_into: 'MI' }], [])).toThrow(NeurorightsFoldError);
  });
});

describe('the registrar as it stands', () => {
  const taxonomy = readNeurorightsTaxonomy(registrar);
  const techniques = (registrar as { techniques: { neurorights?: { affected?: NeurorightCode[] } | null }[] }).techniques;
  const records = techniques.map((technique) => (technique.neurorights == null ? null : (technique.neurorights.affected ?? [])));
  const fold = foldNeurorights(taxonomy, records);

  it('states two folds in the glossary, read as fields and not as prose', () => {
    expect(taxonomy.filter((entry) => entry.folds_into !== null).map((entry) => [entry.code, entry.folds_into])).toEqual([
      ['DI', 'MI'],
      ['IDA', 'MP'],
    ]);
    expect(taxonomy.every((entry) => !entry.name.includes('folded into'))).toBe(true);
  });

  it('folds six codes onto the four the ethics file defines', () => {
    expect(fold.rights).toHaveLength(4);
    expect(fold.rights.map((right) => right.code).sort()).toEqual(['CL', 'MI', 'MP', 'PC']);
  });

  it('counts every technique that carries a record, and no other', () => {
    expect(fold.recordedTechniqueCount).toBe(records.filter((record) => record !== null).length);
    expect(fold.techniqueCount).toBe(techniques.length);
  });

  it('never counts more techniques on an axis than carry a record', () => {
    for (const right of fold.rights) expect(right.total).toBeLessThanOrEqual(fold.recordedTechniqueCount);
  });

  it('raises a fold target by exactly the techniques that reach it only through the folded code', () => {
    for (const right of fold.rights) {
      const direct = records.filter((record) => record !== null && record.includes(right.code)).length;
      expect(right.total - direct).toBe(right.reachedOnlyByFold);
    }
  });

  it('leaves no folded code without an axis to land on', () => {
    const landed = new Set(fold.rights.flatMap((right) => right.foldedIn.map((folded) => folded.code)));
    expect([...landed].sort()).toEqual(['DI', 'IDA']);
  });

  it('carries nothing named cci out of the registrar', () => {
    expect(JSON.stringify(fold)).not.toMatch(/cci/i);
  });
});
