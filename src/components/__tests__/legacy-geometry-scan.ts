/**
 * Finds the hand-placed brain geometry the atlas work replaces: the named coordinate
 * tables, references to the old model file, and any object literal that maps brain
 * regions to numeric positions. Used by legacy-geometry-ratchet.test.ts.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** A named sign of old geometry, and the pattern that finds it in a file's text. */
export const LEGACY_NAME_PATTERNS: Readonly<Record<string, RegExp>> = {
  BRAIN_REGION_COORDS: /\bBRAIN_REGION_COORDS\b/,
  REGION_HOTSPOTS: /\bREGION_HOTSPOTS\b/,
  REGION_3D_POS: /\bREGION_3D_POS\b/,
  'brain.glb': /brain\.glb/,
  'brain-regions module': /brain-regions/,
};

/** The mark given to a file holding a region-to-coordinate table under any name. */
export const REGION_TABLE_MARK = 'region-to-coordinate table';

/** Two entries make a table; one could be a coincidence. */
const MIN_REGION_TABLE_ENTRIES = 2;

/** Region names used as keys by older code that are not ids or aliases in the atlas data. */
export const INFORMAL_REGION_NAMES: readonly string[] = [
  'prefrontal', 'motor', 'somatosensory', 'visual', 'auditory', 'temporal', 'parietal',
  'frontal', 'occipital', 'amygdala', 'basal_ganglia', 'cerebellum', 'brainstem', 'cortex',
];

const SCANNED_DIRECTORY = 'src';
const SCANNED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.astro', '.html', '.md', '.json', '.css', '.svg', '.py', '.sh',
]);
/** Generated or out-of-scope trees: the new atlas assets and the search index. */
const EXCLUDED_PREFIXES = ['src/site/atlas-assets/', 'src/site/pagefind/'];
const TEST_DIRECTORY_SEGMENT = '__tests__';
const GIT_LIST_ARGUMENTS = ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--'];
const GIT_OUTPUT_LIMIT_BYTES = 64 * 1024 * 1024;

const NUMBER = String.raw`-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?`;
/** A value that places something: `[n, n]`, `[n, n, n]`, or an object opening with x, y, cx or cy. */
const POSITION_VALUE = String.raw`(?:\[\s*${NUMBER}\s*,\s*${NUMBER}\s*(?:,\s*${NUMBER}\s*)?\]|\{\s*["']?c?[xy]["']?\s*:\s*${NUMBER})`;

export class LegacyScanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LegacyScanError';
  }
}

function escapeForPattern(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const TUPLE_START = String.raw`\[\s*${NUMBER}\s*,\s*${NUMBER}`;
/** Later in the same record: a tuple under a position-like name, or a named x, y, cx or cy. A bare tuple could be a colour. */
const NAMED_POSITION = String.raw`(?:\b(?:position|pos|coords?|coordinates?|cent(?:er|re)|point|xyz)["']?\s*:\s*${TUPLE_START}|\bc?[xy]["']?\s*:\s*${NUMBER})`;
/** How far past a quoted region name a position may start and still be the same record. */
const SAME_RECORD_SPAN = 80;

/**
 * Matches one region-to-position entry in any of three shapes, spaced or minified:
 * a property (`thalamus: [0, 1, 2]`), a pair (`['thalamus', [0, 1, 2]]`),
 * or a record (`{ id: 'thalamus', x: 0, y: 1 }`).
 */
export function buildRegionEntryPattern(regionKeys: readonly string[]): RegExp {
  if (regionKeys.length === 0) {
    throw new LegacyScanError('No region keys were given, so no region table could ever be found. Pass the atlas region ids.');
  }
  const keys = [...regionKeys].sort((left, right) => right.length - left.length).map(escapeForPattern).join('|');
  const property = String.raw`(?<![\w$.-])["']?(?:${keys})["']?\s*:\s*${POSITION_VALUE}`;
  const pair = String.raw`["'](?:${keys})["']\s*,\s*${TUPLE_START}`;
  const record = String.raw`["'](?:${keys})["']\s*,[^{}\n]{0,${SAME_RECORD_SPAN}}?${NAMED_POSITION}`;
  return new RegExp(`${property}|${pair}|${record}`, 'g');
}

/** The sorted marks one file's text earns; empty when it holds no old geometry. */
export function findLegacyMarks(source: string, regionEntryPattern: RegExp): string[] {
  const marks = Object.entries(LEGACY_NAME_PATTERNS).filter(([, pattern]) => pattern.test(source)).map(([mark]) => mark);
  const entryCount = [...source.matchAll(regionEntryPattern)].length;
  if (entryCount >= MIN_REGION_TABLE_ENTRIES) marks.push(REGION_TABLE_MARK);
  return marks.sort();
}

function isScanned(repoPath: string): boolean {
  return SCANNED_EXTENSIONS.has(path.posix.extname(repoPath).toLowerCase())
    && !repoPath.split('/').includes(TEST_DIRECTORY_SEGMENT)
    && !EXCLUDED_PREFIXES.some((prefix) => repoPath.startsWith(prefix));
}

/** Every file git tracks or would track under `directory`, as repository-relative paths. */
export function listRepositoryFiles(repoRoot: string, directory: string = SCANNED_DIRECTORY): string[] {
  try {
    const output = execFileSync('git', [...GIT_LIST_ARGUMENTS, directory], { cwd: repoRoot, encoding: 'utf-8', maxBuffer: GIT_OUTPUT_LIMIT_BYTES });
    return output.split('\0').filter((repoPath) => repoPath !== '').sort();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new LegacyScanError(`Could not list files with git in the repository root (${detail}). This check needs a git checkout.`);
  }
}

/** Marks for each listed file that has any; files without old geometry are left out. */
export function scanFiles(repoRoot: string, repoPaths: readonly string[], regionKeys: readonly string[]): Record<string, string[]> {
  const regionEntryPattern = buildRegionEntryPattern(regionKeys);
  const found: Record<string, string[]> = {};
  for (const repoPath of repoPaths) {
    const filePath = path.join(repoRoot, repoPath);
    if (!existsSync(filePath)) continue;
    const marks = findLegacyMarks(readFileSync(filePath, 'utf-8'), regionEntryPattern);
    if (marks.length > 0) found[repoPath] = marks;
  }
  return found;
}

/** Scans the source tree, leaving out tests, the new atlas assets and the search index. */
export function scanLegacyGeometry(repoRoot: string, regionKeys: readonly string[]): Record<string, string[]> {
  return scanFiles(repoRoot, listRepositoryFiles(repoRoot).filter(isScanned), regionKeys);
}

function describeEntries(marksByFile: Record<string, string[]>): Set<string> {
  return new Set(Object.entries(marksByFile).flatMap(([repoPath, marks]) => marks.map((mark) => `${repoPath}: ${mark}`)));
}

/**
 * Compares what the scan found with the recorded list.
 * `unrecorded` is old geometry that appeared; `resolved` is a recorded entry that is gone
 * and must now be deleted from the list. Both empty means the two are equal.
 */
export function compareWithRecorded(found: Record<string, string[]>, recorded: Record<string, readonly string[]>): { unrecorded: string[]; resolved: string[] } {
  const foundEntries = describeEntries(found);
  const recordedEntries = describeEntries(Object.fromEntries(Object.entries(recorded).map(([repoPath, marks]) => [repoPath, [...marks]])));
  return {
    unrecorded: [...foundEntries].filter((entry) => !recordedEntries.has(entry)).sort(),
    resolved: [...recordedEntries].filter((entry) => !foundEntries.has(entry)).sort(),
  };
}
