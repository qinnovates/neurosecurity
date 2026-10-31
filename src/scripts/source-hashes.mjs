#!/usr/bin/env node
/**
 * Publishes a SHA-256 view of every third-party source the anatomy pipeline ingests,
 * and verifies the locally cached copies against it, offline.
 *
 * Why this exists: the pins live in two registries (datalake/qif-anatomy-sources.json for
 * downloads, src/scripts/atlas-pipeline/registry/pipeline-inputs.json for files extracted
 * from archives). Nobody should have to read both to answer "which bytes did we ingest?".
 * datalake/source-hashes.json is derived from them, never hand-maintained, and carries no
 * timestamps, so an unchanged registry always regenerates byte-identical output.
 *
 * A match proves identical bytes to what was ingested. It does not show the publisher's
 * copy is safe.
 *
 * Usage:
 *   node src/scripts/source-hashes.mjs            # write datalake/source-hashes.json
 *   node src/scripts/source-hashes.mjs --check    # exit 1 if the committed file is stale
 *   node src/scripts/source-hashes.mjs verify     # hash cached files, exit 1 on any mismatch
 *
 * verify reads <ATLAS_CACHE_DIR>/raw/<sourceId>/<file> (default ~/.cache/qinnovate-atlas),
 * streams each file, and never touches the network. Missing files are reported, not failed:
 * a cache is allowed to be partial. A mismatch is always a failure.
 *
 * Only pinned rows are published; unpinned registry rows are counted in verify output but never written.
 *
 * Fails loudly: an unreadable registry, a source named in one registry but not the other,
 * or a file name that could escape the cache directory aborts the run.
 */
import { createHash } from 'node:crypto';
import { createReadStream, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCES_PATH = 'datalake/qif-anatomy-sources.json';
const INPUTS_PATH = 'src/scripts/atlas-pipeline/registry/pipeline-inputs.json';
const OUTPUT_PATH = 'datalake/source-hashes.json';
const DEFAULT_CACHE_SUBDIR = '.cache/qinnovate-atlas';
const MEMBER_DIGEST_ORIGIN = 'pipeline_inputs_registry';
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

const SCHEMA_DESCRIPTION =
  'SHA-256 digests of the third-party files the anatomy pipeline ingests, derived from ' +
  `${SOURCES_PATH} (downloads) and ${INPUTS_PATH} (files extracted from archives). ` +
  'Only ingested files, meaning rows with a recorded sha256 pin, are listed. Candidate sources in the registry ' +
  'that have not been downloaded are intentionally not listed.';
const SCHEMA_STATEMENT =
  'A matching digest shows the bytes are identical to what was ingested. ' +
  "It does not show that the publisher's copy is safe.";

export class HashError extends Error {}

/** Read and parse a required JSON file, naming it in every failure path. */
function loadJson(relativePath, root = ROOT) {
  let raw;
  try {
    raw = readFileSync(resolve(root, relativePath), 'utf8');
  } catch (cause) {
    throw new HashError(`Cannot read "${relativePath}": ${cause.code ?? cause.message}. Restore the file; the hash view is derived from it.`);
  }
  try {
    return JSON.parse(raw);
  } catch (cause) {
    throw new HashError(`"${relativePath}" is not valid JSON: ${cause.message}`);
  }
}

/** Reject digests that are not 64 lowercase hex characters; null means "not pinned". */
function normaliseDigest(digest, where) {
  if (digest == null) return null;
  if (typeof digest !== 'string' || !SHA256_PATTERN.test(digest)) {
    throw new HashError(`${where} has a sha256 that is not 64 lowercase hex characters.`);
  }
  return digest;
}

function downloadRow(file, sourceId) {
  const sha256 = normaliseDigest(file.sha256, `${sourceId}/${file.name}`);
  return {
    name: file.name,
    kind: 'download',
    sha256,
    bytes: sha256 === null ? null : (file.bytes ?? null),
    pin_status: sha256 === null ? 'not_yet_pinned' : 'pinned',
    digest_origin: sha256 === null ? null : (file.digest_origin ?? null),
  };
}

function memberRow(member, archive, sourceId) {
  const sha256 = normaliseDigest(member.sha256, `${sourceId}/${archive}/${member.save_as}`);
  return {
    name: member.save_as,
    kind: 'extracted_member',
    archive,
    member_path: member.path,
    sha256,
    bytes: null,
    pin_status: sha256 === null ? 'not_yet_pinned' : 'pinned',
    digest_origin: sha256 === null ? null : MEMBER_DIGEST_ORIGIN,
  };
}

function memberRowsFor(sourceId, fetchEntry) {
  const members = fetchEntry?.members ?? {};
  return Object.entries(members).flatMap(([archive, list]) => list.map((member) => memberRow(member, archive, sourceId)));
}

function rowSortKey(row) {
  return [row.kind, row.archive ?? '', row.name].join('\u0000');
}

function compareStrings(left, right) {
  if (left < right) return -1;
  return left > right ? 1 : 0;
}

/** Recursively order object keys so the serialised file has no incidental ordering. */
function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort(compareStrings)
      .map((key) => [key, sortKeys(value[key])]),
  );
}

function assertNoDuplicateRows(sourceId, rows) {
  const seen = new Set();
  for (const row of rows) {
    const key = rowSortKey(row);
    if (seen.has(key)) throw new HashError(`Source "${sourceId}" lists "${row.name}" (${row.kind}) twice. Remove the duplicate.`);
    seen.add(key);
  }
}

function assertFetchSourcesKnown(sourceIds, inputsDoc) {
  const unknown = Object.keys(inputsDoc.fetch ?? {}).filter((id) => !sourceIds.has(id));
  if (unknown.length > 0) {
    throw new HashError(`${INPUTS_PATH} names source(s) absent from ${SOURCES_PATH}: ${unknown.sort().join(', ')}.`);
  }
}

function buildSourceEntry(source, inputsDoc) {
  const downloads = (source.files ?? []).map((file) => downloadRow(file, source.id));
  const members = memberRowsFor(source.id, inputsDoc.fetch?.[source.id]);
  const files = [...downloads, ...members].sort((a, b) => compareStrings(rowSortKey(a), rowSortKey(b)));
  assertNoDuplicateRows(source.id, files);
  return { id: source.id, name: source.name, license_id: source.license_id, redistribute: source.redistribute, files };
}

/** Every registry row, pinned or not, grouped by source. Pure: no I/O, no clock. */
function deriveRegistryEntries(sourcesDoc, inputsDoc) {
  const sources = sourcesDoc?.sources;
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new HashError(`${SOURCES_PATH} has no sources. Refusing to publish an empty hash view.`);
  }
  assertFetchSourcesKnown(new Set(sources.map((source) => source.id)), inputsDoc);
  return sources.map((source) => buildSourceEntry(source, inputsDoc)).sort((a, b) => compareStrings(a.id, b.id));
}

/** Registry rows that have no recorded pin yet. Informational only; never published. */
export function countUnpinnedRows(sourcesDoc, inputsDoc) {
  return deriveRegistryEntries(sourcesDoc, inputsDoc).flatMap((entry) => entry.files).filter((row) => row.pin_status !== 'pinned').length;
}

function toPublishedRow({ pin_status: _pinStatus, ...row }) {
  return row;
}

/** Derive the published document: ingested (pinned) files only, sources with no pin omitted. */
export function buildSourceHashes(sourcesDoc, inputsDoc) {
  const entries = deriveRegistryEntries(sourcesDoc, inputsDoc)
    .map((entry) => ({ ...entry, files: entry.files.filter((row) => row.pin_status === 'pinned').map(toPublishedRow) }))
    .filter((entry) => entry.files.length > 0);
  if (entries.length === 0) throw new HashError('No source has a pinned file. Refusing to publish an empty hash view.');
  return sortKeys({
    _schema: { description: SCHEMA_DESCRIPTION, statement: SCHEMA_STATEMENT, hash_algorithm: 'sha256', version: 2 },
    sources: entries,
  });
}

export function serialiseSourceHashes(document) {
  return `${JSON.stringify(document, null, 2)}\n`;
}

/** Stream a file through SHA-256 so large NIfTI volumes never sit in memory whole. */
export async function hashFileSha256(absolutePath) {
  const hash = createHash('sha256');
  try {
    for await (const chunk of createReadStream(absolutePath)) hash.update(chunk);
  } catch (cause) {
    throw new HashError(`Cannot read "${basename(absolutePath)}" for hashing: ${cause.code ?? cause.message}.`);
  }
  return hash.digest('hex');
}

export function resolveCacheDir(env = process.env) {
  return env.ATLAS_CACHE_DIR ? resolve(env.ATLAS_CACHE_DIR) : join(homedir(), DEFAULT_CACHE_SUBDIR);
}

/** Cache path for a row, refusing any name that is not a plain file name. */
function cachePathFor(cacheDir, sourceId, fileName) {
  if (fileName !== basename(fileName) || fileName === '..' || fileName === '.' || fileName === '') {
    throw new HashError(`File name "${fileName}" in source "${sourceId}" is not a plain file name; refusing to look it up in the cache.`);
  }
  return join(cacheDir, 'raw', sourceId, fileName);
}

function isRegularFile(absolutePath) {
  try {
    return statSync(absolutePath).isFile();
  } catch (cause) {
    if (cause.code === 'ENOENT' || cause.code === 'ENOTDIR') return false;
    throw new HashError(`Cannot stat cached file "${basename(absolutePath)}": ${cause.code ?? cause.message}.`);
  }
}

async function verifyRow(cacheDir, source, row) {
  const label = `${source.id}/${row.name}`;
  const absolute = cachePathFor(cacheDir, source.id, row.name);
  if (!isRegularFile(absolute)) return { label, status: 'missing' };
  const actual = await hashFileSha256(absolute);
  return { label, status: actual === row.sha256 ? 'matched' : 'mismatched', expected: row.sha256, actual };
}

/** Check every row of the document against the cache. Offline; sequential so memory stays flat. */
export async function verifyCache(document, cacheDir) {
  const results = [];
  for (const source of document.sources) {
    for (const row of source.files) results.push(await verifyRow(cacheDir, source, row));
  }
  const counts = { matched: 0, mismatched: 0, missing: 0 };
  for (const result of results) counts[result.status] += 1;
  return { counts, results };
}

function loadRegistries(root = ROOT) {
  return { sourcesDoc: loadJson(SOURCES_PATH, root), inputsDoc: loadJson(INPUTS_PATH, root) };
}

function runCheck(content) {
  let current = null;
  try {
    current = readFileSync(resolve(ROOT, OUTPUT_PATH), 'utf8');
  } catch (cause) {
    if (cause.code !== 'ENOENT') throw new HashError(`Cannot read "${OUTPUT_PATH}": ${cause.code ?? cause.message}.`);
  }
  if (current !== content) {
    console.error(`${OUTPUT_PATH} is stale or missing. Run \`npm run datalake:hashes\` and commit the result.`);
    return 1;
  }
  console.log(`${OUTPUT_PATH} is current.`);
  return 0;
}

function summarise(document) {
  const rowCount = document.sources.reduce((total, source) => total + source.files.length, 0);
  return `${document.sources.length} sources, ${rowCount} pinned files`;
}

async function runVerify(document, unpinnedCount) {
  const cacheDir = resolveCacheDir();
  const { counts, results } = await verifyCache(document, cacheDir);
  for (const result of results.filter((entry) => entry.status === 'mismatched')) {
    console.error(`MISMATCH ${result.label}\n  pinned  ${result.expected}\n  on disk ${result.actual}`);
  }
  console.log(`verify: ${counts.matched} matched, ${counts.mismatched} mismatched, ${counts.missing} missing`);
  console.log(`info: ${unpinnedCount} registry rows have no pin yet and are not part of the hash view`);
  return counts.mismatched > 0 ? 1 : 0;
}

async function main(argv) {
  const { sourcesDoc, inputsDoc } = loadRegistries();
  const document = buildSourceHashes(sourcesDoc, inputsDoc);
  if (argv.includes('verify') || argv.includes('--verify')) return runVerify(document, countUnpinnedRows(sourcesDoc, inputsDoc));
  const content = serialiseSourceHashes(document);
  if (argv.includes('--check')) return runCheck(content);
  writeFileSync(resolve(ROOT, OUTPUT_PATH), content);
  console.log(`Wrote ${OUTPUT_PATH}: ${summarise(document)}`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      if (error instanceof HashError) {
        console.error(`source-hashes: ${error.message}`);
        process.exit(1);
      }
      throw error;
    },
  );
}
