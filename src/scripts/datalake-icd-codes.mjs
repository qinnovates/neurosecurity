/**
 * Where ICD-10-CM codes live in the data lake, and how to read them.
 *
 * Shared by the reference-list builder (build-icd10cm-reference.mjs) and the
 * test that guards the codes (src/lib/__tests__/datalake-icd-codes.test.ts),
 * so both look at exactly the same fields.
 *
 *   titled codes : an object with `code` plus `name` or `condition`; the pathway
 *                  file's parallel arrays (dsm_conditions/dsm_names,
 *                  icd10_conditions/icd10_names); impact-chain rows
 *                  (dsm_code/dsm_name). The label must be the official title.
 *   bare codes   : band tables (qif-dsm-mappings band_conditions, registrar
 *                  dsm5_spec.band_profiles) and eeg-samples dsm5Code. They must
 *                  exist in the reference list.
 *   DSM fields   : `dsm_conditions` (any file) and the registrar's `tara.dsm5`.
 *                  They may hold ICD-10-CM chapter F codes only.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** `F20.x`, `F43.1x`, `G47.0x`: wildcard notation, not an ICD-10-CM code. */
export const WILDCARD_CODE = /^[A-Z]\d{2}\.[0-9A-Z]{0,3}[xX]$/;
/** One ICD-10-CM code. FY2027 allows a letter in the second position (QA0). */
export const ICD_CODE = /^[A-Z](\d[0-9A-Z]|[A-Z]\d)(\.[0-9A-Z]{1,4})?$/;

const LABEL_KEYS = ['name', 'condition'];
const PARALLEL_ARRAYS = [
  ['dsm_conditions', 'dsm_names'],
  ['icd10_conditions', 'icd10_names'],
];

/** Every root-level datalake JSON file, parsed: [{ file, doc }]. */
export function loadDatalakeJson(datalakeDir) {
  return readdirSync(datalakeDir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((file) => ({ file, doc: JSON.parse(readFileSync(join(datalakeDir, file), 'utf-8')) }));
}

function walk(value, path, visit) {
  visit(value, path);
  if (Array.isArray(value)) {
    value.forEach((child, index) => walk(child, `${path}[${index}]`, visit));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`, visit);
  }
}

/** Paths of string values that are wildcard codes, including inside comma lists. */
export function findWildcards(doc) {
  const hits = [];
  walk(doc, '$', (value, path) => {
    if (typeof value !== 'string') return;
    const parts = value.includes(',') && value.length < 64 ? value.split(',').map((p) => p.trim()) : [value];
    if (parts.some((part) => WILDCARD_CODE.test(part))) hits.push(`${path} = ${value}`);
  });
  return hits;
}

/** [{ path, code, title }] for every code that carries a label. */
export function collectTitledCodes(doc) {
  const out = [];
  walk(doc, '$', (value, path) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    if (typeof value.code === 'string' && ICD_CODE.test(value.code)) {
      const labelKey = LABEL_KEYS.find((key) => typeof value[key] === 'string');
      if (labelKey) out.push({ path: `${path}.code`, code: value.code, title: value[labelKey] });
    }
    if (typeof value.dsm_code === 'string' && typeof value.dsm_name === 'string') {
      out.push({ path: `${path}.dsm_code`, code: value.dsm_code, title: value.dsm_name });
    }
    for (const [codesKey, namesKey] of PARALLEL_ARRAYS) {
      const codes = value[codesKey];
      const names = value[namesKey];
      if (!Array.isArray(codes) || !Array.isArray(names)) continue;
      codes.forEach((code, index) => {
        out.push({ path: `${path}.${codesKey}[${index}]`, code, title: names[index] ?? null });
      });
    }
  });
  return out;
}

/** [{ path, code }] for code-only lists (band tables, EEG sample codes). */
export function collectBareCodes(doc) {
  const out = [];
  const add = (code, path) => out.push({ path, code });
  for (const [band, codes] of Object.entries(doc.band_conditions ?? {})) {
    codes.forEach((code, index) => add(code, `$.band_conditions.${band}[${index}]`));
  }
  for (const [band, profile] of Object.entries(doc.dsm5_spec?.band_profiles ?? {})) {
    for (const key of ['primary_codes', 'secondary_codes']) {
      (profile[key] ?? []).forEach((code, index) => add(code, `$.dsm5_spec.band_profiles.${band}.${key}[${index}]`));
    }
  }
  (doc.samples ?? []).forEach((sample, index) => {
    if (typeof sample.dsm5Code !== 'string') return;
    sample.dsm5Code.split(',').map((code) => code.trim()).filter(Boolean)
      .forEach((code) => add(code, `$.samples[${index}].dsm5Code`));
  });
  return out;
}

/** [{ path, code }] for codes in fields named for DSM-5-TR. */
export function collectDsmFieldCodes(doc) {
  const out = [];
  walk(doc, '$', (value, path) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    if (Array.isArray(value.dsm_conditions)) {
      value.dsm_conditions.forEach((entry, index) => {
        const code = typeof entry === 'string' ? entry : entry?.code;
        if (typeof code === 'string') out.push({ path: `${path}.dsm_conditions[${index}]`, code });
      });
    }
    const dsm5 = value.tara?.dsm5;
    for (const rank of ['primary', 'secondary']) {
      (dsm5?.[rank] ?? []).forEach((entry, index) => {
        out.push({ path: `${path}.tara.dsm5.${rank}[${index}]`, code: entry.code });
      });
    }
  });
  return out;
}

/** Sorted unique codes used anywhere this module looks. */
export function usedCodes(files) {
  const codes = new Set();
  for (const { doc } of files) {
    for (const { code } of [...collectTitledCodes(doc), ...collectBareCodes(doc)]) {
      if (ICD_CODE.test(code)) codes.add(code);
    }
  }
  return [...codes].sort();
}
