import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const EXPLORER_DIRECTORIES = ['src/components/atlas-scene', 'src/lib/atlas-explorer'];
const EXPLORER_FILES = ['src/lib/anatomy/limits-copy.ts', 'src/pages/atlas/anatomy.astro'];
const PAGE_PATH = 'src/pages/atlas/anatomy.astro';
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.css', '.astro'];
/** three.js and its React bindings. The explorer has no 3D view and must not pull them into its page. */
const THREE_IMPORT_PATTERN = /(from|import\()\s*['"](three|three\/[^'"]*|@react-three\/[^'"]*)['"]/;
/** Labels are set in the sans face: no monospace utility, variable or family. */
const MONOSPACE_PATTERN = /\bfont-mono\b|--font-mono|--lab-mono|\bmonospace\b|\btm-mono\b|\bui-monospace\b/;
const ISLAND_PATTERN = /<AtlasExplorer\b([^>]*)\/>/;

function listSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : listSourceFiles(entryPath);
    return SOURCE_EXTENSIONS.includes(path.extname(entry.name)) ? [entryPath] : [];
  });
}

const files = [...EXPLORER_DIRECTORIES.flatMap(listSourceFiles), ...EXPLORER_FILES];
const matching = (pattern: RegExp, source: (filePath: string) => string = (filePath) => fs.readFileSync(filePath, 'utf-8')): string[] => files.filter((filePath) => pattern.test(source(filePath)));

describe('explorer source rules', () => {
  it('finds the explorer\'s files, and the patterns catch what they are for', () => {
    expect(files.length).toBeGreaterThan(30);
    expect(files).toContain(path.join('src/components/atlas-scene', 'atlas-scene.css'));
    expect(THREE_IMPORT_PATTERN.test('import { Vector3 } from \'three\';')).toBe(true);
    expect(THREE_IMPORT_PATTERN.test('const scene = await import("@react-three/fiber");')).toBe(true);
    expect(THREE_IMPORT_PATTERN.test('import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";')).toBe(true);
    expect(MONOSPACE_PATTERN.test('.label { font-family: var(--font-mono); }')).toBe(true);
    expect(MONOSPACE_PATTERN.test('<span className="font-mono text-xs">')).toBe(true);
    expect(MONOSPACE_PATTERN.test('font-family: ui-monospace, monospace;')).toBe(true);
  });

  it('imports no three.js anywhere in the explorer', () => {
    expect(matching(THREE_IMPORT_PATTERN)).toEqual([]);
  });

  it('sets no label in a monospace face', () => {
    expect(matching(MONOSPACE_PATTERN)).toEqual([]);
  });

  it('builds the page with no anatomy: the island takes the index pin alone and the page imports no data file', () => {
    const page = fs.readFileSync(PAGE_PATH, 'utf-8');
    const island = ISLAND_PATTERN.exec(page);
    expect(island?.[1].trim()).toBe('client:only="react" indexPin={indexPin}');
    expect(page).toContain('const { indexPin } = loadAnatomyBundle();');
    expect(page.match(/loadAnatomyBundle\(\)/g)).toHaveLength(1);
    expect(page).not.toMatch(/@shared\/|\.json['"]|\.index\b|indexJson|evidenceJson/);
    expect(ISLAND_PATTERN.exec('<AtlasExplorer client:only="react" indexPin={indexPin} index={index} />')?.[1].trim()).not.toBe('client:only="react" indexPin={indexPin}');
  });
});
