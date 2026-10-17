/**
 * Finds the hand-placed brain geometry the atlas work replaces: the named coordinate
 * tables, references to the old model file, and any file that places several brain
 * regions at numeric positions, whatever the table is called or shaped like.
 * Used by src/components/__tests__/legacy-geometry-ratchet.test.ts, whose header lists
 * what this scan cannot see.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** A named sign of old geometry, and the pattern that finds it in a file's text. */
export const LEGACY_NAME_PATTERNS: Readonly<Record<string, RegExp>> = {
  BRAIN_REGION_COORDS: /\bBRAIN_REGION_COORDS\b/,
  REGION_HOTSPOTS: /\bREGION_HOTSPOTS\b/,
  REGION_3D_POS: /\bREGION_3D_POS\b/,
  'brain.glb': /brain\.glb/i,
  'brain-regions module': /brain-regions/,
};

/** The mark given to a file that places several regions at numeric positions. */
export const REGION_TABLE_MARK = 'region-to-coordinate table';

/** Fewer distinct regions than this beside positions could be a coincidence. */
const MIN_PLACED_REGIONS = 3;
/** How far from a region's name its position may be and still belong to it. Covers a multi-line record. */
const PLACEMENT_WINDOW_CHARS = 160;

/** Region names used as keys by older code that are not ids or aliases in the atlas data. */
export const INFORMAL_REGION_NAMES: readonly string[] = [
  'prefrontal', 'motor', 'somatosensory', 'visual', 'auditory', 'temporal', 'parietal',
  'frontal', 'occipital', 'amygdala', 'basal_ganglia', 'cerebellum', 'brainstem', 'cortex',
];

/** What the scan looks for names of. Region names match in any letter case; band ids only as written. */
export interface RegionVocabulary {
  regionNames: readonly string[];
  bandIds: readonly string[];
}

const SCANNED_DIRECTORY = 'src';
const SCANNED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.astro', '.html', '.md', '.mdx', '.json', '.yaml', '.yml', '.csv', '.css', '.svg', '.py', '.sh',
]);
/** Generated or out-of-scope trees: the new atlas assets and the search index. */
const EXCLUDED_PREFIXES = ['src/site/atlas-assets/', 'src/site/pagefind/'];
const GIT_LIST_ARGUMENTS = ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--'];
const GIT_OUTPUT_LIMIT_BYTES = 64 * 1024 * 1024;

const NUMBER = String.raw`-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?`;
const NUMBER_PAIR = String.raw`\s*${NUMBER}\s*,\s*${NUMBER}`;
/**
 * A numeric position in any of the shapes code uses: `[n, n]` or `[n, n, n]`; `Vector2(n, n` or
 * `Vector3(n, n`; `position.set(n, n`; or a named x, y, cx or cy.
 */
const POSITION_PATTERN = new RegExp([
  String.raw`\[${NUMBER_PAIR}\s*(?:,\s*${NUMBER}\s*)?\]`,
  String.raw`Vector[23]\s*\(${NUMBER_PAIR}`,
  String.raw`position\.set\s*\(${NUMBER_PAIR}`,
  String.raw`\bc?[xy]["']?\s*[:=]\s*${NUMBER}`,
].join('|'));
/** A left or right marker on a region name: `thalamus_l`, `thalamus-right`, `thalamusRH`. */
const HEMISPHERE_SUFFIX = String.raw`(?:[_-]?(?:left|right|lh|rh|l|r))?`;

export class LegacyScanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LegacyScanError';
  }
}

function escapeForPattern(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Matches a name used as data: a quoted string, a bare property key, or a declared variable.
 * Not any identifier that happens to share it, which minified code is full of.
 */
function buildNamePattern(names: readonly string[], flags: string): RegExp {
  const alternatives = [...names].sort((left, right) => right.length - left.length).map(escapeForPattern).join('|');
  const quoted = String.raw`["'\`](${alternatives})${HEMISPHERE_SUFFIX}["'\`]`;
  const propertyKey = String.raw`(?<![\w$.?"'\`-])(${alternatives})${HEMISPHERE_SUFFIX}(?=\s*:)`;
  const declaration = String.raw`\b(?:const|let|var)\s+(${alternatives})${HEMISPHERE_SUFFIX}(?=\s*=)`;
  return new RegExp(`${quoted}|${propertyKey}|${declaration}`, flags);
}

interface NameOccurrence {
  name: string;
  start: number;
  end: number;
}

function findNameOccurrences(source: string, vocabulary: RegionVocabulary): NameOccurrence[] {
  const patterns = [buildNamePattern(vocabulary.regionNames, 'gi'), buildNamePattern(vocabulary.bandIds, 'g')];
  return patterns
    .flatMap((pattern) => [...source.matchAll(pattern)])
    .map((match) => ({ name: (match[1] ?? match[2] ?? match[3]).toLowerCase(), start: match.index, end: match.index + match[0].length }))
    .sort((left, right) => left.start - right.start);
}

/**
 * The distinct region names that have a numeric position near them, before or after,
 * with no other region name in between.
 */
export function findPlacedRegions(source: string, vocabulary: RegionVocabulary): string[] {
  if (vocabulary.regionNames.length + vocabulary.bandIds.length === 0) {
    throw new LegacyScanError('No region names were given, so no region table could ever be found. Pass the atlas region ids.');
  }
  const occurrences = findNameOccurrences(source, vocabulary);
  const placed = new Set<string>();
  occurrences.forEach((occurrence, index) => {
    const previousEnd = index > 0 ? occurrences[index - 1].end : 0;
    const nextStart = index + 1 < occurrences.length ? occurrences[index + 1].start : source.length;
    const before = source.slice(Math.max(previousEnd, occurrence.start - PLACEMENT_WINDOW_CHARS), occurrence.start);
    const after = source.slice(occurrence.end, Math.min(nextStart, occurrence.end + PLACEMENT_WINDOW_CHARS));
    if (POSITION_PATTERN.test(after) || POSITION_PATTERN.test(before)) placed.add(occurrence.name);
  });
  return [...placed].sort();
}

/** The sorted marks one file's text earns; empty when it holds no old geometry. */
export function findLegacyMarks(source: string, vocabulary: RegionVocabulary): string[] {
  const marks = Object.entries(LEGACY_NAME_PATTERNS).filter(([, pattern]) => pattern.test(source)).map(([mark]) => mark);
  if (findPlacedRegions(source, vocabulary).length >= MIN_PLACED_REGIONS) marks.push(REGION_TABLE_MARK);
  return marks.sort();
}

function isScanned(repoPath: string, skippedPaths: readonly string[]): boolean {
  return SCANNED_EXTENSIONS.has(path.posix.extname(repoPath).toLowerCase())
    && !EXCLUDED_PREFIXES.some((prefix) => repoPath.startsWith(prefix))
    && !skippedPaths.some((skipped) => repoPath === skipped || repoPath.startsWith(`${skipped}/`));
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

/** Marks for each listed file that has one or more; files without old geometry are left out. */
export function scanFiles(repoRoot: string, repoPaths: readonly string[], vocabulary: RegionVocabulary): Record<string, string[]> {
  const found: Record<string, string[]> = {};
  for (const repoPath of repoPaths) {
    const filePath = path.join(repoRoot, repoPath);
    if (!existsSync(filePath)) continue;
    const marks = findLegacyMarks(readFileSync(filePath, 'utf-8'), vocabulary);
    if (marks.length > 0) found[repoPath] = marks;
  }
  return found;
}

/**
 * Scans the source tree, tests included.
 * @param skippedPaths files or directories left out: the ratchet's own files, which must name what they look for
 */
export function scanLegacyGeometry(repoRoot: string, vocabulary: RegionVocabulary, skippedPaths: readonly string[]): Record<string, string[]> {
  return scanFiles(repoRoot, listRepositoryFiles(repoRoot).filter((repoPath) => isScanned(repoPath, skippedPaths)), vocabulary);
}

function describeEntries(marksByFile: Record<string, readonly string[]>): Set<string> {
  return new Set(Object.entries(marksByFile).flatMap(([repoPath, marks]) => marks.map((mark) => `${repoPath}: ${mark}`)));
}

/**
 * Compares what the scan found with the recorded list.
 * `unrecorded` is old geometry that appeared; `resolved` is a recorded entry that is gone
 * and must now be deleted from the list. Both empty means the two are equal.
 */
export function compareWithRecorded(found: Record<string, readonly string[]>, recorded: Record<string, readonly string[]>): { unrecorded: string[]; resolved: string[] } {
  const foundEntries = describeEntries(found);
  const recordedEntries = describeEntries(recorded);
  return {
    unrecorded: [...foundEntries].filter((entry) => !recordedEntries.has(entry)).sort(),
    resolved: [...recordedEntries].filter((entry) => !foundEntries.has(entry)).sort(),
  };
}
