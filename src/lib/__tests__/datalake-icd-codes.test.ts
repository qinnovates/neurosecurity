/**
 * Guards ICD-10-CM codes across the data lake (datalake/*.json):
 *   1. no wildcard notation (`F20.x`) where a code belongs;
 *   2. fields named for DSM-5-TR (`dsm_conditions`, registrar `tara.dsm5`) hold
 *      chapter F codes only; other codes belong in `icd10_conditions` / `tara.icd10`;
 *   3. every labelled code carries its official title from the committed
 *      reference list, which covers exactly the codes the data uses.
 *
 * On the allow-lists below. Rule 3 asserts that a code's label is its official
 * ICD-10-CM title. That is right for every record where the code and the
 * record's clinical concept already agree — but where they disagree, asserting
 * it in CI makes the wrong code the cheap path: restoring the record's concept
 * to its label would fail the build. So the known disagreements are not blessed
 * by the rule. They are listed, dated and owned, and the tests assert the lists
 * are EXACT — a new exception fails, and so does a stale one. The lists can
 * only shrink.
 *
 * When a data file gains a code, rebuild the reference list with
 * src/scripts/build-icd10cm-reference.mjs (pass --fetch to download and
 * hash-verify the CDC release).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  collectBareCodes,
  collectDsmFieldCodes,
  collectDsmTableCodes,
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

/**
 * Non-chapter-F codes still sitting in the two band-level tables named for
 * DSM-5-TR. Opened 2026-10-16, tracked as ATLAS-F40, which owns the decision on
 * whether those tables keep a DSM-5-TR name at all. Shrinks to empty when
 * ATLAS-F40 lands; every entry removed here is one table reconciled.
 */
const ATLAS_F40_NON_F_IN_DSM_TABLES: readonly string[] = [
  // qif-dsm-mappings.json — the cluster is named motor_neurocognitive and holds
  // ICD-10-CM chapter G codes plus one R code. Deferred, untouched by PR #185.
  'qif-dsm-mappings.json $.diagnostic_clusters.motor_neurocognitive.conditions[0] = G20',
  'qif-dsm-mappings.json $.diagnostic_clusters.motor_neurocognitive.conditions[1] = G35',
  'qif-dsm-mappings.json $.diagnostic_clusters.motor_neurocognitive.conditions[2] = G40',
  'qif-dsm-mappings.json $.diagnostic_clusters.motor_neurocognitive.conditions[3] = G30',
  'qif-dsm-mappings.json $.diagnostic_clusters.motor_neurocognitive.conditions[4] = G12.21',
  'qif-dsm-mappings.json $.diagnostic_clusters.motor_neurocognitive.conditions[5] = G11',
  'qif-dsm-mappings.json $.diagnostic_clusters.motor_neurocognitive.conditions[6] = G24',
  'qif-dsm-mappings.json $.diagnostic_clusters.motor_neurocognitive.conditions[7] = G25.0',
  'qif-dsm-mappings.json $.diagnostic_clusters.motor_neurocognitive.conditions[8] = G25',
  'qif-dsm-mappings.json $.diagnostic_clusters.motor_neurocognitive.conditions[9] = G44',
  'qif-dsm-mappings.json $.diagnostic_clusters.motor_neurocognitive.conditions[10] = G47.2',
  'qif-dsm-mappings.json $.diagnostic_clusters.motor_neurocognitive.conditions[11] = G47',
  'qif-dsm-mappings.json $.diagnostic_clusters.motor_neurocognitive.conditions[12] = G89',
  'qif-dsm-mappings.json $.diagnostic_clusters.motor_neurocognitive.conditions[13] = G93.1',
  'qif-dsm-mappings.json $.diagnostic_clusters.motor_neurocognitive.conditions[14] = R41.3',
  // qtara-registrar.json dsm5_spec.band_profiles — served whole on the public
  // /api/qif.json endpoint. Status is an owner decision, not a deferral tag.
  'qtara-registrar.json $.dsm5_spec.band_profiles.N5.secondary_codes[2] = G25.89',
  'qtara-registrar.json $.dsm5_spec.band_profiles.N4.primary_codes[1] = G47',
  'qtara-registrar.json $.dsm5_spec.band_profiles.N2.primary_codes[0] = G47',
];

/**
 * Records whose ICD-10-CM code and whose own `definition` describe different
 * clinical entities, left standing because the code is a join key in the
 * deferred `qif-dsm-mappings.json` table. Opened 2026-10-16 with a recommended
 * recode for each, awaiting an owner ruling; see the PR body for #185.
 *
 * This list is why rule 3 does not bless a wrong code: each entry names a
 * record where the label is right and the CODE is the open question. Removing
 * an entry means the ruling landed.
 */
const PENDING_CODE_RULINGS: readonly { code: string; recommendation: string }[] = [
  { code: 'G20', recommendation: 'recode the acetylcholine record to F02.80; keep G20 on the motor record' },
  { code: 'G47.2', recommendation: 'drop the 4-character code; the G47 category reference already carries the band mapping' },
  { code: 'G93.1', recommendation: 'recode to the R40 category reference; G93.1 asserts an anoxic aetiology no signal-layer attacker can produce' },
];

/**
 * Two records legitimately share `R48.1` / "Agnosia": ICD-10-CM FY2027 offers a
 * modality-specific agnosia code only for vision (R48.3), so auditory and
 * tactile agnosia both code to R48.1. The duplicate is correct at the code
 * level and is asserted here so that a code+name view showing two identical
 * rows is a known property rather than a surprise. `subcategory` distinguishes
 * them.
 */
const DUPLICATE_CODE_NAME_PAIRS: readonly string[] = ['R48.1 Agnosia'];

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

describe('DSM-named band tables (ATLAS-F40)', () => {
  const offenders = files.flatMap(({ file, doc }) =>
    collectDsmTableCodes(doc)
      .filter(({ code }) => !code.startsWith('F'))
      .map(({ path, code }) => `${file} ${path} = ${code}`),
  );

  // Exact, not a subset: an unlisted offender fails, and so does a listed one
  // that has since been reconciled. That is what makes the list shrink.
  it('holds exactly the non-chapter-F codes on the dated allow-list', () => {
    expect(offenders.slice().sort()).toEqual([...ATLAS_F40_NON_F_IN_DSM_TABLES].sort());
  });

  it('never grows the allow-list past its 2026-10-16 baseline', () => {
    expect(ATLAS_F40_NON_F_IN_DSM_TABLES.length).toBeLessThanOrEqual(18);
  });
});

describe('codes pending an owner ruling', () => {
  const titled = files.flatMap(({ file, doc }) =>
    collectTitledCodes(doc).map(({ path, code, title }) => ({ file, path, code, title })),
  );

  // Each pending ruling names a code that is still in the data. When the ruling
  // lands and the code changes, this fails until the entry is removed.
  it('still carries every code whose ruling is open, so a landed ruling clears it', () => {
    for (const { code, recommendation } of PENDING_CODE_RULINGS) {
      expect(
        titled.some((hit) => hit.code === code),
        `${code} is no longer in the data: the ruling landed ("${recommendation}") — remove it from PENDING_CODE_RULINGS`,
      ).toBe(true);
    }
  });

  it('records a recommendation for each open ruling', () => {
    for (const entry of PENDING_CODE_RULINGS) {
      expect(entry.recommendation.length, entry.code).toBeGreaterThan(20);
    }
  });
});

describe('neurological condition records', () => {
  const mappings = files.find((f) => f.file === 'qif-neurological-mappings.json');

  it('is in the data lake', () => {
    expect(mappings).toBeDefined();
  });

  it('shares a code and name between records only where the allow-list says so', () => {
    const conditions = (mappings!.doc as { conditions: { id: string; code: string; name: string; subcategory?: string }[] })
      .conditions;
    const seen = new Map<string, string[]>();
    for (const record of conditions) {
      const key = `${record.code} ${record.name}`;
      seen.set(key, [...(seen.get(key) ?? []), record.id]);
    }
    const duplicates = [...seen.entries()].filter(([, ids]) => ids.length > 1).map(([key]) => key);
    expect(duplicates.sort()).toEqual([...DUPLICATE_CODE_NAME_PAIRS].sort());
  });

  it('keeps an allow-listed duplicate distinguishable by subcategory', () => {
    const conditions = (mappings!.doc as { conditions: { id: string; code: string; name: string; subcategory?: string }[] })
      .conditions;
    for (const key of DUPLICATE_CODE_NAME_PAIRS) {
      const records = conditions.filter((record) => `${record.code} ${record.name}` === key);
      const subcategories = records.map((record) => record.subcategory);
      expect(new Set(subcategories).size, key).toBe(records.length);
    }
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
