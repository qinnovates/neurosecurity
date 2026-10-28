/**
 * The honest distinction, pinned.
 *
 * The registrar does not score every technique, and it says so: a technique it
 * scored `none` was measured and holds a severity word, a vector, a score and a
 * PINS flag, while a technique it has not scored holds none of the four. Both
 * reach the browser through the index, and nothing between here and there may
 * turn the second into the first. These tests fail if a reader defaults an
 * absent field, and if the registrar's own counts move without being read.
 */

import { describe, expect, it } from 'vitest';
import registrar from '@shared/qtara-registrar.json';
import { parseAnatomyFiles } from '../anatomy-inputs';
import { buildAnatomyBundle } from '../build-anatomy-index';
import { parseAnatomyIndex } from '../parse-anatomy-index';
import { readNeurorightsTaxonomy, readTechniqueTags, type TechniqueTags } from '../technique-tags';
import { buildIndex, buildTechnique } from './index-fixtures';
import { FIXTURE_NISS_SCORE, FIXTURE_NISS_VECTOR, TECHNIQUE_ID, buildRawFiles, buildRegistrarFile } from './raw-files-fixture';

/**
 * WHAT THE COMMITTED REGISTRAR HOLDS TODAY. Each count changes only when the
 * registrar changes, in the same reviewed diff. A count that moves because a
 * reader started filling absent fields in is the failure these pin.
 */
const PINNED_REGISTRAR_STATE = {
  /** Changes when a technique is added or removed. */
  techniqueCount: 178,
  /** Changes when NISS SCORES A TECHNIQUE. These hold no severity word at all, which is not a severity of `none`. */
  unscoredCount: 47,
  /** Changes when a technique is MEASURED AT ZERO. A severity word of `none` is a measurement, and comes with a vector and a score. */
  scoredNoneCount: 1,
  /** Changes when a technique is TAGGED WITH ITS FIRST NEURORIGHT. These hold no neurorights record, which is not a record naming no right. */
  noNeurorightsRecordCount: 32,
  /** Changes when a technique's record is EMPTIED or FILLED. A record naming no right is a reading; no record is an absence of one. */
  emptyNeurorightsRecordCount: 1,
} as const;

const SCORED_FIELDS = ['vector', 'score', 'pins'] as const;

function tagsOf(): TechniqueTags[] {
  const techniques = (registrar as { techniques: ReadonlyArray<{ id: string }> }).techniques;
  return techniques.map((technique) => readTechniqueTags(registrar, technique.id));
}

describe('the registrar\'s own NISS fields, carried as they are', () => {
  const tags = tagsOf();

  it('holds exactly the pinned number of techniques', () => {
    expect(tags).toHaveLength(PINNED_REGISTRAR_STATE.techniqueCount);
  });

  it('keeps a technique with no severity word distinguishable from one scored "none"', () => {
    const unscored = tags.filter((entry) => entry.niss_severity === null);
    const scoredNone = tags.filter((entry) => entry.niss_severity === 'none');
    expect(unscored).toHaveLength(PINNED_REGISTRAR_STATE.unscoredCount);
    expect(scoredNone).toHaveLength(PINNED_REGISTRAR_STATE.scoredNoneCount);
    expect(unscored.every((entry) => entry.niss.scoring_state !== 'scored')).toBe(true);
    expect(unscored.every((entry) => SCORED_FIELDS.every((field) => entry.niss[field] === null))).toBe(true);
    expect(scoredNone.every((entry) => entry.niss.scoring_state === 'scored')).toBe(true);
    expect(scoredNone.every((entry) => SCORED_FIELDS.every((field) => entry.niss[field] !== null))).toBe(true);
  });

  it('carries the vector, the score and the PINS flag for every technique NISS scored, and nothing for the rest', () => {
    const scored = tags.filter((entry) => entry.niss.scoring_state === 'scored');
    expect(scored.length).toBe(PINNED_REGISTRAR_STATE.techniqueCount - PINNED_REGISTRAR_STATE.unscoredCount);
    expect(scored.every((entry) => entry.niss.vector !== null && entry.niss.score !== null && entry.niss.pins !== null)).toBe(true);
    expect(tags.every((entry) => entry.niss.scoring_state !== null)).toBe(true);
  });

  it('carries no consent complexity index: the file gives it a range and no definition', () => {
    expect(tags.every((entry) => entry.neurorights === null || Object.keys(entry.neurorights).join() === 'affected')).toBe(true);
  });
});

describe('the registrar\'s own neurorights codes, carried raw', () => {
  const tags = tagsOf();

  it('keeps a technique with no record distinguishable from one whose record names no right', () => {
    expect(tags.filter((entry) => entry.neurorights === null)).toHaveLength(PINNED_REGISTRAR_STATE.noNeurorightsRecordCount);
    expect(tags.filter((entry) => entry.neurorights?.affected.length === 0)).toHaveLength(PINNED_REGISTRAR_STATE.emptyNeurorightsRecordCount);
  });

  it('folds nothing: the raw codes reach the index, and the glossary carries the folds the registrar states', () => {
    const taxonomy = readNeurorightsTaxonomy(registrar);
    expect(taxonomy.map((entry) => `${entry.code}->${entry.folds_into ?? ''}`)).toEqual(['MP->', 'CL->', 'MI->', 'PC->', 'DI->MI', 'IDA->MP']);
    expect(taxonomy.find((entry) => entry.code === 'DI')?.name).toBe('Dynamical Integrity');
    const folded = new Set(taxonomy.filter((entry) => entry.folds_into !== null).map((entry) => entry.code));
    expect(tags.some((entry) => entry.neurorights?.affected.some((code) => folded.has(code)))).toBe(true);
  });
});

describe('the index the build emits', () => {
  const { index } = buildAnatomyBundle(parseAnatomyFiles(buildRawFiles()));
  const techniqueOf = (id: string): (typeof index.techniques)[number] | undefined => index.techniques.find((candidate) => candidate.id === id);

  it('carries the scored technique\'s vector, score and PINS flag unchanged', () => {
    expect(techniqueOf(TECHNIQUE_ID)?.niss).toEqual({ scoring_state: 'scored', vector: FIXTURE_NISS_VECTOR, score: FIXTURE_NISS_SCORE, pins: false });
    expect(techniqueOf(TECHNIQUE_ID)?.neurorights).toEqual({ affected: ['MP', 'DI'] });
  });

  it('carries nulls, not defaults, for a technique the registrar has not scored', () => {
    expect(techniqueOf('QIF-T9002')).toMatchObject({ niss_severity: null, niss: { scoring_state: 'unscored', vector: null, score: null, pins: null }, neurorights: { affected: [] } });
  });

  it('carries a null scoring state for a technique the registrar holds nothing for', () => {
    const absent = buildAnatomyBundle(parseAnatomyFiles(buildRawFiles({ registrar: buildRegistrarFile([]) }))).index;
    expect(absent.techniques.map((technique) => technique.niss.scoring_state)).toEqual([null, null]);
  });

  it('defines every code a technique names', () => {
    const declared = new Set(index.neurorights_taxonomy.map((entry) => entry.code));
    expect(index.techniques.flatMap((technique) => technique.neurorights?.affected ?? []).every((code) => declared.has(code))).toBe(true);
  });
});

describe('parseAnatomyIndex: the scored fields stand or fall together', () => {
  const indexWith = (overrides: Parameters<typeof buildTechnique>[1]): unknown => buildIndex({ techniques: [buildTechnique(TECHNIQUE_ID, overrides)] });
  const NO_NISS = { scoring_state: null, vector: null, score: null, pins: null } as const;
  const UNSCORED = { ...NO_NISS, scoring_state: 'unscored' } as const;

  it('refuses an index whose absent severity word was defaulted to "none"', () => {
    expect(() => parseAnatomyIndex(indexWith({ niss_severity: 'none', niss: { ...UNSCORED } })))
      .toThrow(/present exactly when the scoring state reads "scored"/);
  });

  it('accepts the honest unscored technique and the one measured at "none"', () => {
    expect(() => parseAnatomyIndex(indexWith({ niss_severity: null, niss: { ...UNSCORED } }))).not.toThrow();
    expect(() => parseAnatomyIndex(indexWith({ niss_severity: null, niss: { ...NO_NISS } }))).not.toThrow();
    expect(() => parseAnatomyIndex(indexWith({ niss_severity: 'none', niss: { scoring_state: 'scored', vector: FIXTURE_NISS_VECTOR, score: 0, pins: false } }))).not.toThrow();
  });

  it('refuses a scored technique missing any one of the measured fields', () => {
    for (const field of SCORED_FIELDS) {
      const niss = { scoring_state: 'scored' as const, vector: FIXTURE_NISS_VECTOR, score: 0, pins: false, [field]: null };
      expect(() => parseAnatomyIndex(indexWith({ niss }))).toThrow(/present exactly when the scoring state reads "scored"/);
    }
  });

  it('refuses a vector that is not written in the NISS format', () => {
    expect(() => parseAnatomyIndex(indexWith({ niss: { ...buildTechnique(TECHNIQUE_ID).niss, vector: 'NISS:1.1/BI:Z/CR:H/CD:H/CV:E/RV:P/NP:T' } })))
      .toThrow(/is not written in the required format/);
  });

  it('reads a registrar with no glossary as having none, and refuses a code named without one', () => {
    expect(readNeurorightsTaxonomy({ techniques: [] })).toEqual([]);
    const undefinedCode = buildIndex({ neurorights_taxonomy: [], techniques: [buildTechnique(TECHNIQUE_ID, { neurorights: { affected: ['MP'] } })] });
    expect(() => parseAnatomyIndex(undefinedCode)).toThrow(/"MP" is not defined in neurorights_taxonomy/);
    expect(() => parseAnatomyIndex(buildIndex({ neurorights_taxonomy: [], techniques: [buildTechnique(TECHNIQUE_ID, { neurorights: null })] }))).not.toThrow();
  });

  it('refuses a neurorights code the glossary does not define', () => {
    expect(() => parseAnatomyIndex(buildIndex({ techniques: [buildTechnique(TECHNIQUE_ID, { neurorights: { affected: ['IDA'] } })] })))
      .toThrow(/"IDA" is not defined in neurorights_taxonomy/);
  });
});
