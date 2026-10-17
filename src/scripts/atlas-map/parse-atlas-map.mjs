/**
 * Reads the atlas feature map (`atlas-map.json`) into checked records. The map is
 * hand-edited and read by tools, so it is treated as untrusted input: every
 * failure names the file, the place in it, what is wrong and how to fix it, in
 * the manner of the anatomy parsers in src/lib/anatomy/.
 *
 * This module checks the map on its own (shapes, ids, references, the module
 * graph). Whether its paths, scripts and workflows exist in the repository is
 * checked by check-atlas-map.mjs. Types: parse-atlas-map.d.mts.
 */

export const ATLAS_MAP_FILE = 'src/scripts/atlas-map/atlas-map.json';
export const SCHEMA_VERSION = 1;
export const OWNERS = ['kevin', 'data', 'engineering', 'domain-review'];
export const STATUSES = ['open', 'done'];

const ROOT_PATH = '(top level)';
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const FOLLOWUP_ID_PATTERN = /^(ATLAS|FRAME)-F\d{2,3}$/;
const MAX_LINE_LENGTH = 600;
const MAX_SHOWN_LENGTH = 60;
/** Control characters and the marks that reorder or hide text. */
const UNSAFE_CHARACTER_PATTERN = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u2069\uFEFF]/;
/** A workstation home directory never belongs in a committed file. */
const HOME_PATH_PATTERN = /\/(Users|home)\/[A-Za-z]|[A-Za-z]:\\Users\\/;

/** The map is malformed. The message says where and what to do. */
export class AtlasMapError extends Error {
  /** @param {string} location @param {string} problem @param {string} remedy */
  constructor(location, problem, remedy) {
    super(`${ATLAS_MAP_FILE}: ${location}: ${problem}. ${remedy}`);
    this.name = 'AtlasMapError';
    this.location = location;
  }
}

/** @param {unknown} value */
function show(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value) ?? typeof value;
  const visible = text.replace(new RegExp(UNSAFE_CHARACTER_PATTERN, 'g'), '?');
  return visible.length > MAX_SHOWN_LENGTH ? `${visible.slice(0, MAX_SHOWN_LENGTH)}...` : visible;
}

/** @param {string} location @param {string} problem @param {string} remedy @returns {never} */
function failAt(location, problem, remedy) {
  throw new AtlasMapError(location, problem, remedy);
}

/** @param {string} parent @param {string} segment */
const childOf = (parent, segment) => (parent === ROOT_PATH ? segment : `${parent}.${segment}`);

/** @param {unknown} value @returns {value is Record<string, unknown>} */
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

/** An object with every required key and no key outside the two lists. */
function readRecord(value, location, required, optional = []) {
  if (!isRecord(value)) return failAt(location, 'expected an object', 'Write a JSON object here.');
  const allowed = [...required, ...optional];
  const unexpected = Object.keys(value).find((key) => !allowed.includes(key));
  if (unexpected !== undefined) return failAt(location, `unexpected key "${unexpected}"`, `Remove it; the keys allowed here are ${allowed.join(', ')}.`);
  const missing = required.find((key) => !Object.hasOwn(value, key));
  if (missing !== undefined) return failAt(location, `missing key "${missing}"`, `Add "${missing}".`);
  return value;
}

/** One line of text: non-empty, bounded, no hidden characters, no home path. */
function readText(value, location) {
  if (typeof value !== 'string' || value.trim() === '') return failAt(location, `expected non-empty text, found ${show(value)}`, 'Write one line of text.');
  if (value.length > MAX_LINE_LENGTH) return failAt(location, `text is ${value.length} characters long`, `Keep it under ${MAX_LINE_LENGTH}; detail belongs in the file it points to.`);
  if (UNSAFE_CHARACTER_PATTERN.test(value)) return failAt(location, 'text holds a control or direction character', 'Retype it as plain text.');
  if (HOME_PATH_PATTERN.test(value)) return failAt(location, 'text names a home directory', 'Write a repository-relative path or <staging>.');
  return value;
}

function readTextList(value, location, minimum = 0) {
  if (!Array.isArray(value)) return failAt(location, `expected a list, found ${show(value)}`, 'Write a JSON array of strings.');
  if (value.length < minimum) return failAt(location, `expected at least ${minimum} entries`, 'Add the missing entries.');
  return value.map((item, index) => readText(item, `${location}[${index}]`));
}

function readChoice(value, location, choices) {
  if (typeof value !== 'string' || !choices.includes(value)) return failAt(location, `expected one of ${choices.join(', ')}, found ${show(value)}`, 'Use one of the listed values.');
  return value;
}

function readId(value, location, pattern = ID_PATTERN) {
  const id = readText(value, location);
  return pattern.test(id) ? id : failAt(location, `id ${show(id)} does not match ${pattern}`, 'Use lowercase words joined by hyphens, or ATLAS-F01 / FRAME-F01 for a follow-up.');
}

function readPendingPr(record, location) {
  if (!Object.hasOwn(record, 'pending_pr')) return undefined;
  const value = record.pending_pr;
  return Number.isInteger(value) && value > 0 ? value : failAt(childOf(location, 'pending_pr'), `expected a pull request number, found ${show(value)}`, 'Write the number of the open PR the paths live on, or remove the key.');
}

function readList(root, key, readItem) {
  const value = root[key];
  if (!Array.isArray(value) || value.length === 0) return failAt(key, 'expected a non-empty list', `Write "${key}" as a JSON array of records.`);
  return value.map((item, index) => readItem(item, `${key}[${index}]`));
}

function readModule(value, location) {
  const record = readRecord(value, location, ['id', 'path', 'responsibility', 'entry_files', 'depends_on', 'map_file'], ['pending_pr']);
  return {
    id: readId(record.id, childOf(location, 'id')),
    path: readText(record.path, childOf(location, 'path')),
    responsibility: readText(record.responsibility, childOf(location, 'responsibility')),
    entry_files: readTextList(record.entry_files, childOf(location, 'entry_files'), 1),
    depends_on: readTextList(record.depends_on, childOf(location, 'depends_on')),
    map_file: readText(record.map_file, childOf(location, 'map_file')),
    pending_pr: readPendingPr(record, location),
  };
}

function readData(value, location) {
  const record = readRecord(value, location, ['id', 'path', 'holds', 'validated_by', 'generator', 'consumers'], ['pending_pr']);
  return {
    id: readId(record.id, childOf(location, 'id')),
    path: readText(record.path, childOf(location, 'path')),
    holds: readText(record.holds, childOf(location, 'holds')),
    validated_by: readText(record.validated_by, childOf(location, 'validated_by')),
    generator: readText(record.generator, childOf(location, 'generator')),
    consumers: readTextList(record.consumers, childOf(location, 'consumers')),
    pending_pr: readPendingPr(record, location),
  };
}

function readCiReference(value, location) {
  if (value === null) return null;
  const record = readRecord(value, location, ['workflow', 'job', 'runs']);
  return {
    workflow: readText(record.workflow, childOf(location, 'workflow')),
    job: readText(record.job, childOf(location, 'job')),
    runs: readText(record.runs, childOf(location, 'runs')),
  };
}

function readCheck(value, location) {
  const record = readRecord(value, location, ['id', 'script', 'guards', 'ci'], ['pending_pr']);
  return {
    id: readId(record.id, childOf(location, 'id')),
    script: readText(record.script, childOf(location, 'script')),
    guards: readText(record.guards, childOf(location, 'guards')),
    ci: readCiReference(record.ci, childOf(location, 'ci')),
    pending_pr: readPendingPr(record, location),
  };
}

function readRecipe(value, location) {
  if (value === null) return null;
  const record = readRecord(value, location, ['map', 'number']);
  const number = Number.isInteger(record.number) && record.number > 0 ? record.number : failAt(childOf(location, 'number'), `expected a recipe number, found ${show(record.number)}`, 'Write the number of the "### N." heading in the map.');
  return { map: readText(record.map, childOf(location, 'map')), number };
}

function readChange(value, location) {
  const record = readRecord(value, location, ['id', 'summary', 'keywords', 'recipe', 'edit', 'note', 'commands', 'checks'], ['pending_pr']);
  return {
    id: readId(record.id, childOf(location, 'id')),
    summary: readText(record.summary, childOf(location, 'summary')),
    keywords: readTextList(record.keywords, childOf(location, 'keywords'), 1).map((keyword) => keyword.toLowerCase()),
    recipe: readRecipe(record.recipe, childOf(location, 'recipe')),
    edit: readTextList(record.edit, childOf(location, 'edit')),
    note: readText(record.note, childOf(location, 'note')),
    commands: readTextList(record.commands, childOf(location, 'commands')),
    checks: readTextList(record.checks, childOf(location, 'checks'), 1),
    pending_pr: readPendingPr(record, location),
  };
}

function readFollowup(value, location) {
  const record = readRecord(value, location, ['id', 'what', 'ref', 'owner', 'status', 'from']);
  return {
    id: readId(record.id, childOf(location, 'id'), FOLLOWUP_ID_PATTERN),
    what: readText(record.what, childOf(location, 'what')),
    ref: readText(record.ref, childOf(location, 'ref')),
    owner: readChoice(record.owner, childOf(location, 'owner'), OWNERS),
    status: readChoice(record.status, childOf(location, 'status'), STATUSES),
    from: readText(record.from, childOf(location, 'from')),
  };
}

function readProvenance(value, location) {
  const record = readRecord(value, location, ['id', 'path', 'justifies']);
  return {
    id: readId(record.id, childOf(location, 'id')),
    path: readText(record.path, childOf(location, 'path')),
    justifies: readText(record.justifies, childOf(location, 'justifies')),
  };
}

/** Every id in the map is unique across all sections, so a lookup by id is never ambiguous. */
function assertUniqueIds(map) {
  const seen = new Map();
  for (const section of ['modules', 'data', 'checks', 'changes', 'followups', 'provenance']) {
    map[section].forEach((record, index) => {
      const previous = seen.get(record.id);
      if (previous !== undefined) failAt(`${section}[${index}].id`, `id "${record.id}" is already used at ${previous}`, 'Give this record a new id; never reuse or renumber one.');
      seen.set(record.id, `${section}[${index}]`);
    });
  }
}

function assertReferences(records, section, key, knownIds, target) {
  records.forEach((record, index) => record[key].forEach((id, position) => {
    if (!knownIds.has(id)) failAt(`${section}[${index}].${key}[${position}]`, `no ${target} has id "${id}"`, `Use an id from "${target}".`);
  }));
}

/** Depth-first search over depends_on; a back edge is a cycle. */
function assertAcyclic(modules) {
  const edges = new Map(modules.map((module) => [module.id, module.depends_on]));
  const state = new Map();
  const visit = (id, trail) => {
    if (state.get(id) === 'done') return;
    if (state.get(id) === 'open') failAt('modules', `dependency cycle ${[...trail, id].join(' -> ')}`, 'Imports point one way only; remove one depends_on entry.');
    state.set(id, 'open');
    for (const next of edges.get(id) ?? []) visit(next, [...trail, id]);
    state.set(id, 'done');
  };
  for (const module of modules) visit(module.id, []);
}

function assertCrossReferences(map) {
  assertUniqueIds(map);
  const moduleIds = new Set(map.modules.map((module) => module.id));
  assertReferences(map.modules, 'modules', 'depends_on', moduleIds, 'modules');
  assertReferences(map.data, 'data', 'consumers', moduleIds, 'modules');
  assertReferences(map.changes, 'changes', 'checks', new Set(map.checks.map((check) => check.id)), 'checks');
  assertAcyclic(map.modules);
}

/**
 * Parses the map's JSON value. Throws AtlasMapError on the first problem.
 * @param {unknown} value
 * @returns {import('./parse-atlas-map.d.mts').AtlasMap}
 */
export function parseAtlasMap(value) {
  const root = readRecord(value, ROOT_PATH, ['schema_version', 'summary', 'modules', 'data', 'checks', 'changes', 'followups', 'provenance']);
  if (root.schema_version !== SCHEMA_VERSION) failAt('schema_version', `expected ${SCHEMA_VERSION}, found ${show(root.schema_version)}`, 'Update the parser together with the map.');
  const map = {
    schema_version: SCHEMA_VERSION,
    summary: readText(root.summary, 'summary'),
    modules: readList(root, 'modules', readModule),
    data: readList(root, 'data', readData),
    checks: readList(root, 'checks', readCheck),
    changes: readList(root, 'changes', readChange),
    followups: readList(root, 'followups', readFollowup),
    provenance: readList(root, 'provenance', readProvenance),
  };
  assertCrossReferences(map);
  return map;
}
