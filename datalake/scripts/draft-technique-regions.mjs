#!/usr/bin/env node
/**
 * Writes datalake/qif-technique-regions.json from the curation record in
 * technique-region-curation.json.
 *
 * Why two files: the data file's shape belongs to the parser in
 * src/lib/anatomy/parse-technique-regions.ts and holds nothing but the
 * catalog's word, the quoted text and a rationale. The curation record is where
 * a reader's decisions are written down, including the ones the data file has
 * no place for: every mention that was read and deliberately not linked, with
 * the reason. Generating the data file keeps the two from drifting and lets the
 * shape change without retyping 111 entries.
 *
 * Every link is AI-drafted and unreviewed. This script never writes a review:
 * a review exists only as an owner's entry in qif-anatomy-review-ledger.json.
 *
 * Usage:
 *   node datalake/scripts/draft-technique-regions.mjs           # rewrite the data file
 *   node datalake/scripts/draft-technique-regions.mjs --check   # exit 1 if it is stale
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { DATALAKE_DIR, runAsCli } from './datalake-cli.mjs';
import { REGISTRAR_FILE, hasNeuralBand, isTemplatedPathway } from './technique-region-candidates.mjs';

export const CURATION_PATH = path.join(DATALAKE_DIR, 'scripts', 'technique-region-curation.json');
export const TECHNIQUE_REGIONS_PATH = path.join(DATALAKE_DIR, 'qif-technique-regions.json');
export const REGISTRAR_PATH = path.join(DATALAKE_DIR, 'qtara-registrar.json');

const SCHEMA_VERSION = 2;
/** Must equal TECHNIQUE_REGIONS_STATUS in src/lib/anatomy/status-sentences.ts; the parser stops the build if it differs. */
const STATUS_SENTENCE = 'AI-drafted. Links are a reading of the catalog\'s own words, not new evidence.';
/** The atlas file declares no addressing version yet, which the anatomy library reads as version 1. */
const DRAFTED_FOR_ADDRESSING = Object.freeze([1]);
const DRAFTER = 'ai';
const UNCHECKED = 'unchecked';
const SCOPE = Object.freeze({ REGIONS: 'regions', BAND_LEVEL: 'band_level' });
/** Every link quotes the registrar's own words, whichever field they sit in. */
const CLAIM_BASIS = 'catalog_text';
/** Appended to a band-level reason when the only structures in the entry's text are the generated band summary's. */
const TEMPLATED_NOTE = ' Its generated band summary is not counted.';
const REASON_SEPARATOR = ': ';
const POINTER_SEPARATOR = '/';
const LIST_INDEX = /^\d+$/;
const JSON_INDENT = 2;

export class CurationError extends Error {
  constructor(techniqueId, problem, remedy) {
    super(`technique-region-curation.json: ${techniqueId}: ${problem}. ${remedy}`);
    this.name = 'CurationError';
    this.techniqueId = techniqueId;
  }
}

function unescapeToken(token) {
  return token.replaceAll('~1', '/').replaceAll('~0', '~');
}

/**
 * The value at `field`, a JSON Pointer relative to the technique. A list is
 * stepped into by position, which a source reference cannot do, so the result
 * says whether the path stayed citable.
 */
export function readTechniqueField(technique, field) {
  let current = technique;
  let isCitable = true;
  for (const token of field.split(POINTER_SEPARATOR).slice(1).map(unescapeToken)) {
    if (Array.isArray(current) && LIST_INDEX.test(token)) {
      isCitable = false;
      current = current[Number(token)];
    } else if (current !== null && typeof current === 'object' && Object.hasOwn(current, token)) {
      current = current[token];
    } else {
      return { text: undefined, citable: false };
    }
  }
  return { text: typeof current === 'string' ? current : undefined, citable: isCitable };
}

function readQuotedField(technique, curatedLink) {
  const { text, citable } = readTechniqueField(technique, curatedLink.field);
  if (text === undefined) {
    throw new CurationError(technique.id, `link "${curatedLink.term}" cites ${curatedLink.field}, which is not text in the registrar`,
      'Point at a field that holds a string.');
  }
  if (!citable) {
    throw new CurationError(technique.id, `link "${curatedLink.term}" cites ${curatedLink.field}, which is inside a list`,
      'A source reference cannot address a list item that has no id. Quote a field outside a list, or record the mention as skipped.');
  }
  return text;
}

function buildLink(technique, curatedLink) {
  const fieldText = readQuotedField(technique, curatedLink);
  if (!fieldText.includes(curatedLink.quote)) {
    throw new CurationError(technique.id, `the quote "${curatedLink.quote}" is not in ${curatedLink.field}`,
      'Copy the words from the registrar exactly; if the registrar text changed, read it again before re-drafting.');
  }
  if (!curatedLink.quote.includes(curatedLink.term)) {
    throw new CurationError(technique.id, `the quote "${curatedLink.quote}" does not contain the term "${curatedLink.term}"`,
      'Write the term exactly as the catalog writes it.');
  }
  return {
    term: curatedLink.term,
    valid_for_addressing: [...DRAFTED_FOR_ADDRESSING],
    evidence: {
      claim_basis: CLAIM_BASIS,
      source_ref: { file: REGISTRAR_FILE, pointer: `/techniques/${technique.id}${curatedLink.field}`, quote: curatedLink.quote },
      check_status: UNCHECKED,
      rationale: curatedLink.rationale,
    },
    drafted_by: DRAFTER,
  };
}

function buildEntry(technique, curated) {
  const hasLinks = Array.isArray(curated.links) && curated.links.length > 0;
  if (hasLinks === (curated.band_level !== undefined)) {
    throw new CurationError(technique.id, 'an entry needs either links or a band_level reason, and not both',
      'Give the links the text supports, or the reason no region could be drafted.');
  }
  if (!hasLinks) {
    const templatedNote = isTemplatedPathway(technique.tara?.dsm5?.pathway ?? '') ? TEMPLATED_NOTE : '';
    return { scope: SCOPE.BAND_LEVEL, rationale: `${curated.band_level}${REASON_SEPARATOR}${curated.rationale}${templatedNote}`, links: [] };
  }
  return { scope: SCOPE.REGIONS, rationale: curated.rationale, links: curated.links.map((link) => buildLink(technique, link)) };
}

function rejectCoverageGaps(curatedById, neuralTechniques) {
  const neuralIds = new Set(neuralTechniques.map((technique) => technique.id));
  const strayId = Object.keys(curatedById).find((techniqueId) => !neuralIds.has(techniqueId));
  if (strayId !== undefined) {
    throw new CurationError(strayId, 'is not a registrar technique with a neural band', 'Remove the entry or correct the id.');
  }
  const missing = neuralTechniques.find((technique) => curatedById[technique.id] === undefined);
  if (missing !== undefined) {
    throw new CurationError(missing.id, 'has a neural band and no curation entry',
      'Read its registrar text, then add its links or the reason none could be drafted.');
  }
}

/** The data file's content: one entry per registrar technique with a neural band, in registrar order. */
export function buildTechniqueRegions(curation, registrar) {
  const neuralTechniques = registrar.techniques.filter(hasNeuralBand);
  rejectCoverageGaps(curation.techniques, neuralTechniques);
  return {
    schema_version: SCHEMA_VERSION,
    status: STATUS_SENTENCE,
    techniques: Object.fromEntries(neuralTechniques.map((technique) => [technique.id, buildEntry(technique, curation.techniques[technique.id])])),
  };
}

export function serialiseTechniqueRegions(techniqueRegions) {
  return `${JSON.stringify(techniqueRegions, null, JSON_INDENT)}\n`;
}

function runCli() {
  const curation = JSON.parse(readFileSync(CURATION_PATH, 'utf-8'));
  const registrar = JSON.parse(readFileSync(REGISTRAR_PATH, 'utf-8'));
  const generatedText = serialiseTechniqueRegions(buildTechniqueRegions(curation, registrar));
  if (readFileSync(TECHNIQUE_REGIONS_PATH, 'utf-8') === generatedText) {
    process.stdout.write('[draft-technique-regions] datalake/qif-technique-regions.json matches the curation record.\n');
    return;
  }
  if (process.argv.includes('--check')) {
    process.stderr.write('[draft-technique-regions] the data file is stale; run `node datalake/scripts/draft-technique-regions.mjs`.\n');
    process.exit(1);
  }
  writeFileSync(TECHNIQUE_REGIONS_PATH, generatedText);
  process.stdout.write('[draft-technique-regions] rewrote datalake/qif-technique-regions.json.\n');
}

runAsCli(import.meta.url, 'draft-technique-regions', runCli);
