/**
 * Holds a parsed atlas map to the repository: every path exists (unless its
 * record carries `pending_pr`), every npm script is in package.json, every CI
 * reference names a real workflow job that runs the check, every recipe
 * reference names a real "### N." heading, and every module sits under its map.
 *
 * The repository is passed in as a small reader, so tests can use a fake one.
 * Returns every problem found, one line each, rather than stopping at the first.
 */

import fs from 'node:fs';
import path from 'node:path';

const WILDCARD = '*';
const FLAG_PREFIX = '-';
const MAP_FILE_NAME = 'CONTEXT.md';
const NPM_TEST = /^npm test$/;
const NPM_RUN = /^npm run ([a-z0-9:-]+)$/;
const RUNS_FILE = /^(?:node|bash) (\S+)/;
const VITEST_RUN = /^npx vitest run (.+)$/;
const JOBS_LINE = /^jobs:\s*$/;
const JOB_LINE = /^ {2}([A-Za-z0-9_-]+):\s*$/;

/**
 * @typedef {object} RepositoryReader
 * @property {(relativePath: string) => boolean} exists
 * @property {(relativeDirectory: string) => string[]} listDirectory
 * @property {(relativePath: string) => string} readText
 * @property {Record<string, unknown>} scripts
 */

/** A reader over the real checkout rooted at `root`. @returns {RepositoryReader} */
export function createRepositoryReader(root) {
  const resolve = (relativePath) => path.join(root, relativePath);
  const manifest = JSON.parse(fs.readFileSync(resolve('package.json'), 'utf-8'));
  return {
    exists: (relativePath) => fs.existsSync(resolve(relativePath)),
    listDirectory: (relativeDirectory) => fs.readdirSync(resolve(relativeDirectory)),
    readText: (relativePath) => fs.readFileSync(resolve(relativePath), 'utf-8'),
    scripts: { ...manifest.scripts },
  };
}

/** Repository-relative, forward slashes, no way out of the checkout. */
function isRepositoryRelative(candidate) {
  return !candidate.startsWith('/') && !candidate.includes('\\') && !candidate.split('/').includes('..');
}

/** Whether a path, a directory ending in `/`, or a pattern with `*` in its last segment names something. */
export function pathExists(candidate, repo) {
  if (!isRepositoryRelative(candidate)) return false;
  if (!candidate.includes(WILDCARD)) return repo.exists(candidate);
  const directory = path.posix.dirname(candidate);
  if (directory.includes(WILDCARD) || !repo.exists(directory)) return false;
  const escaped = path.posix.basename(candidate).split(WILDCARD).map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`^${escaped.join('.*')}$`);
  return repo.listDirectory(directory).some((name) => pattern.test(name));
}

function missingPaths(paths, where, repo) {
  return paths.filter((candidate) => !pathExists(candidate, repo)).map((candidate) => `${where}: path "${candidate}" does not exist`);
}

/** Problems with one command: an npm script that is not defined, or a file it runs that does not exist. */
export function commandProblems(command, where, repo) {
  if (NPM_TEST.test(command)) return Object.hasOwn(repo.scripts, 'test') ? [] : [`${where}: package.json has no "test" script`];
  const script = NPM_RUN.exec(command)?.[1];
  if (script !== undefined) return Object.hasOwn(repo.scripts, script) ? [] : [`${where}: package.json has no script "${script}"`];
  const vitestArguments = VITEST_RUN.exec(command)?.[1];
  if (vitestArguments !== undefined) return missingPaths(vitestArguments.split(/\s+/).filter((argument) => !argument.startsWith(FLAG_PREFIX)), where, repo);
  const file = RUNS_FILE.exec(command)?.[1];
  if (file !== undefined) return missingPaths([file], where, repo);
  return [`${where}: command "${command}" is not npm test, npm run <script>, npx vitest run, node <file> or bash <file>`];
}

/** The lines of one job in a workflow file, or undefined when the file has no such job. */
export function readJobBlock(workflowText, job) {
  const lines = workflowText.split('\n');
  const jobsIndex = lines.findIndex((line) => JOBS_LINE.test(line));
  if (jobsIndex === -1) return undefined;
  const start = lines.findIndex((line, index) => index > jobsIndex && JOB_LINE.exec(line)?.[1] === job);
  if (start === -1) return undefined;
  const nextJob = lines.findIndex((line, index) => index > start && JOB_LINE.test(line));
  return lines.slice(start, nextJob === -1 ? undefined : nextJob).join('\n');
}

function ciProblems(check, where, repo) {
  if (check.ci === null) return [];
  const { workflow, job, runs } = check.ci;
  if (!pathExists(workflow, repo)) return [`${where}.ci: workflow "${workflow}" does not exist`];
  const block = readJobBlock(repo.readText(workflow), job);
  if (block === undefined) return [`${where}.ci: ${workflow} has no job "${job}"`];
  return block.includes(runs) ? [] : [`${where}.ci: job "${job}" in ${workflow} does not run "${runs}"`];
}

function moduleProblems(module, where, repo) {
  const problems = missingPaths([module.path, ...module.entry_files, module.map_file], where, repo);
  const mapDirectory = `${path.posix.dirname(module.map_file)}/`;
  if (path.posix.basename(module.map_file) !== MAP_FILE_NAME || !module.path.startsWith(mapDirectory)) {
    problems.push(`${where}: map_file "${module.map_file}" must be a ${MAP_FILE_NAME} in "${module.path}" or a directory above it`);
  }
  return problems;
}

function dataProblems(data, where, repo) {
  const generatorProblems = data.generator === 'source' ? [] : commandProblems(data.generator, `${where}.generator`, repo);
  return [...missingPaths([data.path, data.validated_by], where, repo), ...generatorProblems];
}

function recipeProblems(recipe, where, repo) {
  if (recipe === null) return [];
  if (!pathExists(recipe.map, repo)) return [`${where}.recipe: map "${recipe.map}" does not exist`];
  const heading = new RegExp(`^### ${recipe.number}\\. `, 'm');
  return heading.test(repo.readText(recipe.map)) ? [] : [`${where}.recipe: ${recipe.map} has no recipe "### ${recipe.number}."`];
}

function changeProblems(change, where, repo) {
  return [
    ...recipeProblems(change.recipe, where, repo),
    ...missingPaths(change.edit, `${where}.edit`, repo),
    ...change.commands.flatMap((command) => commandProblems(command, `${where}.commands`, repo)),
  ];
}

function checkProblems(check, where, repo) {
  const scriptProblems = Object.hasOwn(repo.scripts, check.script) ? [] : [`${where}: package.json has no script "${check.script}"`];
  return [...scriptProblems, ...ciProblems(check, where, repo)];
}

const SECTION_CHECKERS = {
  modules: moduleProblems,
  data: dataProblems,
  checks: checkProblems,
  changes: changeProblems,
  provenance: (record, where, repo) => missingPaths([record.path], where, repo),
};

/**
 * Every way the map disagrees with the repository. A record with `pending_pr`
 * is skipped: its paths live on that open PR, not here.
 * @param {import('./parse-atlas-map.d.mts').AtlasMap} map
 * @param {RepositoryReader} repo
 * @returns {string[]}
 */
export function findRepositoryProblems(map, repo) {
  return Object.entries(SECTION_CHECKERS).flatMap(([section, checkRecord]) => map[section]
    .map((record, index) => [record, `${section}[${index}] (${record.id})`])
    .filter(([record]) => record.pending_pr === undefined)
    .flatMap(([record, where]) => checkRecord(record, where, repo)));
}
