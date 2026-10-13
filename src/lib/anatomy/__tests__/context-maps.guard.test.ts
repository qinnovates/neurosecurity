/**
 * The atlas directories' CONTEXT.md files are a map a maintainer follows step
 * by step, so a path in one that leads nowhere is a defect. This holds every
 * back-ticked path, pattern and npm script in them to the repository.
 *
 * A back-ticked token is read as a path when it ends in a known extension or a
 * slash. One that starts with a top-level directory is taken from the
 * repository root; any other is taken from the map's own directory. A token
 * with `*` must match at least one file.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MAIN_MAP = 'src/lib/anatomy/CONTEXT.md';
const ATLAS_MAPS = [
  MAIN_MAP,
  'src/lib/atlas-explorer/CONTEXT.md',
  'src/components/atlas-scene/CONTEXT.md',
  'src/scripts/atlas-pipeline/CONTEXT.md',
];
/** The datalake map covers more than the atlas; only its anatomy section is held to this rule. */
const DATALAKE_MAP = 'datalake/CONTEXT.md';
const DATALAKE_SECTION = /^## Anatomy files[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m;
const ROOT_DIRECTORIES = ['src/', 'datalake/', 'governance/', '.github/'];
const PATH_PATTERN = /^[\w.*/-]+(\.(ts|tsx|mjs|py|json|md|css|sh|astro|txt|yml|parquet|glb)|\/)$/;
/** Paths the built site serves, not files in the repository. */
const URL_PATH_PATTERN = /^\/atlas/;
const BACK_TICKED = /`([^`\n]+)`/g;
const NPM_SCRIPT = /^npm run ([a-z:-]+)/;
/** A command that runs a file: the file is held to the same rule as a bare path. */
const RUN_COMMAND = /^(?:node|bash) (\S+)/;
const WILDCARD = '*';
/** All the maps together stay short enough to read in one sitting. */
const MAX_TOTAL_LINES = 420;
const BUILD_REWRITTEN_FILES = [
  'datalake/parquet/catalog.json', 'datalake/parquet/intel_feed.parquet', 'governance/DECISION-LOG.md', 'governance/TRANSPARENCY.md', 'src/data/external-news-cache.json',
];

const readMap = (file: string): string => fs.readFileSync(file, 'utf-8');
const listTokens = (text: string): string[] => [...text.matchAll(BACK_TICKED)].map(([, token]) => token);

function resolveToken(token: string, mapFile: string): string {
  return ROOT_DIRECTORIES.some((root) => token.startsWith(root)) ? token : path.posix.join(path.posix.dirname(mapFile), token);
}

/** Whether a path, or a pattern with `*` in its last segment, names something that exists. */
function existsInRepository(resolved: string): boolean {
  if (!resolved.includes(WILDCARD)) return fs.existsSync(resolved);
  const directory = path.posix.dirname(resolved);
  if (directory.includes(WILDCARD) || !fs.existsSync(directory)) return false;
  const pattern = new RegExp(`^${path.posix.basename(resolved).split(WILDCARD).map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);
  return fs.readdirSync(directory).some((name) => pattern.test(name));
}

function findMissingPaths(text: string, mapFile: string): string[] {
  return listTokens(text)
    .map((token) => RUN_COMMAND.exec(token)?.[1] ?? token)
    .filter((token) => PATH_PATTERN.test(token) && !URL_PATH_PATTERN.test(token))
    .filter((token) => !existsInRepository(resolveToken(token, mapFile)))
    .map((token) => `${mapFile}: \`${token}\` does not exist`);
}

function findMissingScripts(text: string, mapFile: string, scripts: Record<string, unknown>): string[] {
  return listTokens(text)
    .flatMap((token) => NPM_SCRIPT.exec(token)?.[1] ?? [])
    .filter((name) => !Object.hasOwn(scripts, name))
    .map((name) => `${mapFile}: package.json has no script "${name}"`);
}

function readScripts(): Record<string, unknown> {
  const manifest: unknown = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  if (typeof manifest !== 'object' || manifest === null || !('scripts' in manifest) || typeof manifest.scripts !== 'object' || manifest.scripts === null) {
    throw new Error('package.json holds no scripts object. Restore it before running this guard.');
  }
  return { ...manifest.scripts };
}

const datalakeSection = DATALAKE_SECTION.exec(readMap(DATALAKE_MAP))?.[1] ?? '';
const maps: Array<[file: string, text: string]> = [...ATLAS_MAPS.map((file): [string, string] => [file, readMap(file)]), [DATALAKE_MAP, datalakeSection]];

describe('the atlas maintainer\'s maps', () => {
  it('catches a path that leads nowhere, a pattern that matches nothing and a script that does not exist', () => {
    const sample = 'See `src/lib/anatomy/no-such-file.ts`, `parse-nothing-*.ts`, `licence-rules.ts`, `parse-*.ts`, `/atlas/anatomy-index.json`, '
      + '`node datalake/scripts/no-such-script.mjs --check`, `node datalake/scripts/draft-technique-regions.mjs --check` and `npm run no-such-script`.';
    expect(findMissingPaths(sample, MAIN_MAP)).toEqual([
      `${MAIN_MAP}: \`src/lib/anatomy/no-such-file.ts\` does not exist`,
      `${MAIN_MAP}: \`parse-nothing-*.ts\` does not exist`,
      `${MAIN_MAP}: \`datalake/scripts/no-such-script.mjs\` does not exist`,
    ]);
    expect(findMissingScripts(sample, MAIN_MAP, readScripts())).toEqual([`${MAIN_MAP}: package.json has no script "no-such-script"`]);
  });

  it.each(maps)('%s names only paths and npm scripts that exist', (file, text) => {
    expect(listTokens(text).filter((token) => PATH_PATTERN.test(token)).length).toBeGreaterThan(5);
    expect([...findMissingPaths(text, file), ...findMissingScripts(text, file, readScripts())]).toEqual([]);
  });

  it('keeps the recipes in one map, which every other map points to', () => {
    expect(readMap(MAIN_MAP)).toContain('## Recipes');
    for (const [file, text] of maps.filter(([mapFile]) => mapFile !== MAIN_MAP)) expect(text, file).toContain(`\`${MAIN_MAP}\``);
  });

  it('opens the main map with the rules that never bend, naming each file the build rewrites', () => {
    const rules = /^## Rules that never bend\n([\s\S]*?)^## /m.exec(readMap(MAIN_MAP))?.[1] ?? '';
    expect(rules.trim().split('\n')).toHaveLength(5);
    for (const file of BUILD_REWRITTEN_FILES) expect(rules).toContain(`\`${file}\``);
  });

  it('stays short, and names no home directory', () => {
    const texts = maps.map(([, text]) => text);
    expect(texts.reduce((total, text) => total + text.split('\n').length, 0)).toBeLessThan(MAX_TOTAL_LINES);
    for (const text of texts) expect(text).not.toMatch(/\/(Users|home)\/[A-Za-z]/);
  });
});
