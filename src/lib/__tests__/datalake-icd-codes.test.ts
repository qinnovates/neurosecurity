/**
 * Guards ICD-10-CM codes across the data lake (datalake/*.json):
 *   1. no wildcard notation (`F20.x`) where a code belongs;
 *   2. fields named for DSM-5-TR (`dsm_conditions`, registrar `tara.dsm5`) hold
 *      chapter F codes only; other codes belong in `icd10_conditions` / `tara.icd10`;
 *   3. every labelled code carries its official title from the committed
 *      reference list, which covers exactly the codes the data uses.
 *
 * Known non-chapter-F codes outside these fields, left for follow-ups:
 * the band-level tables (qif-dsm-mappings.json, registrar dsm5_spec.band_profiles;
 * ATLAS-F40), impact-chains.json `dsm_code` (derived; column rename after PR #164),
 * and eeg-samples.json `dsm5Code` (one G40.909 value).
 *
 * When a data file gains a code, rebuild the reference list with
 * src/scripts/build-icd10cm-reference.mjs.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  collectBareCodes,
  collectDsmFieldCodes,
  collectTitledCodes,
  findWildcards,
  ICD_CODE,
  loadDatalakeJson,
  usedCodes,
} from '../../scripts/datalake-icd-codes.mjs';

interface ReferenceEntry {
  title: string;
  kind: 'billable' | 'category';
}

interface Reference {
  _metadata: { source: { release: string; file: string; retrieved: string } };
  codes: Record<string, ReferenceEntry>;
}

const DATALAKE = fileURLToPath(new URL('../../../datalake', import.meta.url));
const REFERENCE_PATH = fileURLToPath(
  new URL('../../../datalake/validation/icd10cm-fy2027-titles.json', import.meta.url),
);

const files = loadDatalakeJson(DATALAKE);
const reference: Reference = JSON.parse(readFileSync(REFERENCE_PATH, 'utf-8'));

describe('data lake ICD-10-CM codes', () => {
  it('reads the data lake', () => {
    expect(files.map((f) => f.file)).toContain('qif-neural-pathways.json');
    expect(files.map((f) => f.file)).toContain('qtara-registrar.json');
  });

  it('holds no wildcard codes such as F20.x', () => {
    const hits = files.flatMap(({ file, doc }) => findWildcards(doc).map((hit) => `${file} ${hit}`));
    expect(hits).toEqual([]);
  });

  it('keeps codes outside ICD-10-CM chapter F out of DSM-named fields', () => {
    const offenders = files.flatMap(({ file, doc }) =>
      collectDsmFieldCodes(doc)
        .filter(({ code }) => !code.startsWith('F'))
        .map(({ path, code }) => `${file} ${path} = ${code}`),
    );
    expect(offenders).toEqual([]);
  });

  it('gives every labelled code its official ICD-10-CM title', () => {
    const mismatches = files.flatMap(({ file, doc }) =>
      collectTitledCodes(doc)
        .filter(({ code }) => ICD_CODE.test(code))
        .filter(({ code, title }) => reference.codes[code]?.title !== title)
        .map(({ path, code, title }) => `${file} ${path}: ${code} "${title}" != "${reference.codes[code]?.title}"`),
    );
    expect(mismatches).toEqual([]);
  });

  it('lists every code-only entry in the reference', () => {
    const unknown = files.flatMap(({ file, doc }) =>
      collectBareCodes(doc)
        .filter(({ code }) => !reference.codes[code])
        .map(({ path, code }) => `${file} ${path} = ${code}`),
    );
    expect(unknown).toEqual([]);
  });
});

describe('ICD-10-CM reference list', () => {
  it('covers exactly the codes the data lake uses', () => {
    expect(Object.keys(reference.codes).sort()).toEqual(usedCodes(files));
  });

  it('names its source release and retrieval date', () => {
    expect(reference._metadata.source.release).toBe('ICD-10-CM FY2027');
    expect(reference._metadata.source.file).toBe('icd10cm-order-2027.txt');
    expect(reference._metadata.source.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('holds only a title and a kind per code, so no DSM-5-TR text can ride along', () => {
    for (const [code, entry] of Object.entries(reference.codes)) {
      expect(ICD_CODE.test(code), code).toBe(true);
      expect(Object.keys(entry).sort(), code).toEqual(['kind', 'title']);
      expect(['billable', 'category'], code).toContain(entry.kind);
      expect(entry.title.length, code).toBeGreaterThan(0);
    }
  });
});
