import { describe, expect, it } from 'vitest';
import { findBandKey, rejectBandKeys } from '../band-key-scan';
import { AnatomyDataError } from '../errors';
import { readInteger, readNullable, readRecord, readString, rejectDuplicates, rootOf } from '../field-readers';

const FILE = 'datalake/fixture.json';
const KEYS = { required: ['id'], optional: ['note'] };

describe('readRecord', () => {
  it('returns an object that has every required key and no unknown key', () => {
    expect(readRecord({ id: 'a', note: 'n' }, rootOf(FILE), KEYS)).toEqual({ id: 'a', note: 'n' });
  });

  it('says which file, which key and what to do when a key is unknown', () => {
    expect(() => readRecord({ id: 'a', extra: 1 }, rootOf(FILE), KEYS))
      .toThrow('datalake/fixture.json: (top level): unexpected key "extra". Remove it; the keys allowed here are id, note.');
  });

  it('rejects a missing required key, an array and a prototype key', () => {
    expect(() => readRecord({ note: 'n' }, rootOf(FILE), KEYS)).toThrow(/missing key "id"/);
    expect(() => readRecord([], rootOf(FILE), KEYS)).toThrow(/expected an object/);
    expect(() => readRecord(JSON.parse('{"id":"a","__proto__":{}}'), rootOf(FILE), KEYS)).toThrow(/unexpected key "__proto__"/);
  });

  it('throws the typed error', () => {
    expect(() => readRecord(null, rootOf(FILE), KEYS)).toThrow(AnatomyDataError);
  });
});

describe('field readers', () => {
  it('names the field path in the message', () => {
    expect(() => readString({ id: '' }, 'id', { dataFile: FILE, path: 'rows[2]' }, 10)).toThrow(/rows\[2\]\.id: expected a non-empty string/);
  });

  it('rejects blank and over-long text, fractions and numbers under the minimum', () => {
    expect(() => readString({ id: '   ' }, 'id', rootOf(FILE), 10)).toThrow(AnatomyDataError);
    expect(() => readString({ id: 'x'.repeat(11) }, 'id', rootOf(FILE), 10)).toThrow(AnatomyDataError);
    expect(() => readInteger({ n: 1.5 }, 'n', rootOf(FILE), 1)).toThrow(/whole number/);
    expect(() => readInteger({ n: 0 }, 'n', rootOf(FILE), 1)).toThrow(/at least 1/);
  });

  it('reads null as null and anything else through the reader', () => {
    expect(readNullable({ a: null }, 'a', () => 'read')).toBeNull();
    expect(readNullable({ a: 'x' }, 'a', () => 'read')).toBe('read');
  });

  it('names a duplicated value', () => {
    expect(() => rejectDuplicates(['a', 'b', 'a'], rootOf(FILE), 'source id')).toThrow(/source id "a" appears twice/);
  });
});

describe('band key scan', () => {
  it.each(['band', 'bands', 'band_id', 'band_ids', 'qif_band', 'qif_bands', 'qif_band_ids'])('finds the key "%s" at any depth', (key) => {
    expect(findBandKey({ rows: [{ evidence: { [key]: 'N7' } }] })).toBe(`rows[0].evidence.${key}`);
  });

  it('ignores band words in values and in other keys', () => {
    expect(findBandKey({ rationale: 'tagged to band N6', band_note: 'x', broadband: 1 })).toBeNull();
  });

  it('stops the build on a band key and says what to do', () => {
    expect(() => rejectBandKeys({ rows: [{ qif_band: 'N7' }] }, FILE))
      .toThrow(/rows\[0\]\.qif_band: this file must not store a QIF band\. Remove the key/);
  });
});
