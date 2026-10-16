#!/usr/bin/env node
/**
 * Build datalake/validation/icd10cm-fy2027-titles.json: every ICD-10-CM code
 * the data lake uses, with its official title and whether it is a header
 * (category, non-billable) or billable code. Official titles only; no DSM-5-TR
 * text. Run it again whenever a data file gains a code.
 *
 * The CDC/NCHS order file is not committed. Download the FY2027 code
 * descriptions zip (URL and SHA-256 in SOURCE below), unzip it, and pass
 * the order file:
 *
 *   node src/scripts/build-icd10cm-reference.mjs --order-file <dir>/icd10cm-order-2027.txt
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDatalakeJson, usedCodes } from './datalake-icd-codes.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DATALAKE = join(ROOT, 'datalake');
const OUTPUT = join(DATALAKE, 'validation', 'icd10cm-fy2027-titles.json');
const SOURCE = {
  publisher: 'CDC/NCHS',
  release: 'ICD-10-CM FY2027',
  file: 'icd10cm-order-2027.txt',
  url: 'https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Publications/ICD10CM/2027/icd10cm-code-descriptions-2027.zip',
  zip_sha256: '93e3ad6004badf470c55bfe679b748ae88fd9b2b421851e409eec382c7713b9a',
  retrieved: '2026-10-16',
};

function readOrderFile(path) {
  if (basename(path) !== SOURCE.file) {
    throw new Error(`Expected ${SOURCE.file}, got ${basename(path)}. Pass the FY2027 order file.`);
  }
  const titles = new Map();
  for (const line of readFileSync(path, 'latin1').split('\n')) {
    if (line.trim() === '') continue;
    const raw = line.slice(6, 13).trim();
    const flag = line.slice(14, 15);
    if (!/^[A-Z][0-9A-Z]{2,6}$/.test(raw) || !['0', '1'].includes(flag)) {
      throw new Error(`Unexpected order-file line: ${line.slice(0, 40)}`);
    }
    const code = raw.length <= 3 ? raw : `${raw.slice(0, 3)}.${raw.slice(3)}`;
    titles.set(code, { title: line.slice(77).trim(), kind: flag === '1' ? 'billable' : 'category' });
  }
  return titles;
}

function main() {
  const flagIndex = process.argv.indexOf('--order-file');
  if (flagIndex === -1 || !process.argv[flagIndex + 1]) {
    throw new Error('Usage: build-icd10cm-reference.mjs --order-file <path to icd10cm-order-2027.txt>');
  }
  const titles = readOrderFile(resolve(process.argv[flagIndex + 1]));
  const codes = {};
  const missing = [];
  for (const code of usedCodes(loadDatalakeJson(DATALAKE))) {
    const entry = titles.get(code);
    if (entry) codes[code] = entry;
    else missing.push(code);
  }
  if (missing.length > 0) {
    throw new Error(`Codes used in the data lake but absent from ${SOURCE.release}: ${missing.join(', ')}`);
  }
  const reference = {
    _metadata: {
      title: 'ICD-10-CM codes used in the QIF data lake, with official titles',
      source: SOURCE,
      generator: 'src/scripts/build-icd10cm-reference.mjs',
      note: 'Official ICD-10-CM titles only. No DSM-5-TR names or criteria text. kind "category" marks a header (non-billable) code used as a category reference.',
    },
    codes,
  };
  writeFileSync(OUTPUT, `${JSON.stringify(reference, null, 2)}\n`);
  console.log(`Wrote ${Object.keys(codes).length} codes to ${OUTPUT.slice(ROOT.length + 1)}`);
}

main();
