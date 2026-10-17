#!/usr/bin/env node
/**
 * The cheap lookup: which files to edit, which commands to run and which
 * checks must pass for a change to the atlas or its framing.
 *
 * Usage: npm run atlas:where -- <words>
 * Matches the words against the keywords of the map's `changes` records and
 * the ids of its modules and data files. Exit 1, with every known keyword,
 * when nothing matches.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAtlasMap } from './load-atlas-map.mjs';

const MAX_CHANGES_SHOWN = 3;
const MIN_PARTIAL_LENGTH = 3;
const EXACT_BONUS = 100;
const INDENT = '          ';

/** How well a query matches one term: exact beats contained beats partial; 0 is no match. */
export function scoreTerm(query, term) {
  if (query === term) return EXACT_BONUS + term.length;
  if (` ${query} `.includes(` ${term} `)) return term.length;
  return query.length >= MIN_PARTIAL_LENGTH && term.includes(query) ? query.length : 0;
}

const bestScore = (query, terms) => Math.max(0, ...terms.map((term) => scoreTerm(query, term)));

/** Joins the words into one lower-case query with single spaces. */
export function normaliseQuery(words) {
  return words.join(' ').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * The records a query matches, best first: the top-scoring changes (at most three),
 * then every module and data file whose id matches.
 * @param {import('./parse-atlas-map.d.mts').AtlasMap} map
 * @param {string} query
 */
export function findMatches(map, query) {
  if (query === '') return { changes: [], modules: [], data: [] };
  const scored = map.changes.map((change) => ({ change, score: bestScore(query, [...change.keywords, change.id]) })).filter(({ score }) => score > 0);
  const top = Math.max(0, ...scored.map(({ score }) => score));
  const changes = scored.filter(({ score }) => score === top).slice(0, MAX_CHANGES_SHOWN).map(({ change }) => change);
  const idMatches = (record) => scoreTerm(query, record.id) > 0;
  return { changes, modules: map.modules.filter(idMatches), data: map.data.filter(idMatches) };
}

function describeCheck(map, checkId) {
  const check = map.checks.find((candidate) => candidate.id === checkId);
  if (check === undefined) return checkId;
  const command = check.script === 'test' ? 'npm test' : `npm run ${check.script}`;
  return check.ci === null ? `${command} (not in CI)` : `${command} (CI: ${path.posix.basename(check.ci.workflow)} ${check.ci.job})`;
}

/** Label, then one value per line under it. */
function block(label, values) {
  if (values.length === 0) return [];
  return values.map((value, index) => `${index === 0 ? `  ${label.padEnd(INDENT.length - 2)}` : INDENT}${value}`);
}

function formatChange(map, change) {
  const recipe = change.recipe === null ? [] : [`${change.recipe.map} recipe ${change.recipe.number}`];
  const pendingLine = change.pending_pr === undefined ? [] : [`files live on #${change.pending_pr} until it merges`];
  return [`${change.id}: ${change.summary}`, ...block('recipe', recipe), ...block('edit', change.edit), ...block('note', [change.note]),
    ...block('run', change.commands), ...block('checks', [...new Set(change.checks.map((id) => describeCheck(map, id)))]), ...block('pending', pendingLine)];
}

const formatModule = (module) => [`module ${module.id}: ${module.path}`, ...block('does', [module.responsibility]), ...block('map', [module.map_file]), ...block('entry', module.entry_files)];
const formatData = (data) => [`data ${data.id}: ${data.path}`, ...block('holds', [data.holds]), ...block('checked', [data.validated_by]), ...block('written', [data.generator === 'source' ? 'by hand (source)' : data.generator])];

/** Every word a query can match, sorted. */
export function listKnownTerms(map) {
  return [...new Set([...map.changes.flatMap((change) => change.keywords), ...map.modules.map((module) => module.id), ...map.data.map((data) => data.id)])].sort();
}

/** The text to print and the exit code for one invocation. */
export function runWhere(map, words) {
  const query = normaliseQuery(words);
  const { changes, modules, data } = findMatches(map, query);
  if (changes.length + modules.length + data.length === 0) {
    const asked = query === '' ? 'No words given.' : `Nothing in the atlas map matches "${query}".`;
    return { exitCode: 1, output: `${asked} Usage: npm run atlas:where -- <words>\nKnown keywords and ids: ${listKnownTerms(map).join(', ')}\n` };
  }
  const sections = [...changes.map((change) => formatChange(map, change)), ...modules.map(formatModule), ...data.map(formatData)];
  return { exitCode: 0, output: `${sections.map((lines) => lines.join('\n')).join('\n\n')}\n` };
}

const isRunDirectly = process.argv[1] !== undefined
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isRunDirectly) {
  const { exitCode, output } = runWhere(loadAtlasMap(), process.argv.slice(2));
  (exitCode === 0 ? process.stdout : process.stderr).write(output);
  process.exitCode = exitCode;
}
