import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const EXPLORER_DIRECTORIES = ['src/components/atlas-scene', 'src/lib/atlas-explorer'];
const EXPLORER_FILES = ['src/lib/anatomy/limits-copy.ts', 'src/pages/atlas/anatomy.astro'];
const PAGE_PATH = 'src/pages/atlas/anatomy.astro';
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.css', '.astro'];
/** three.js and its React bindings. The explorer has no 3D view and must not pull them into its page. */
const THREE_IMPORT_PATTERN = /(from|import\(|import)\s*['"](three|three\/[^'"]*|@react-three\/[^'"]*)['"]/;
/** Labels are set in the sans face: no monospace utility, variable or family. */
const MONOSPACE_PATTERN = /\bfont-mono\b|--font-mono|--lab-mono|\bmonospace\b|\btm-mono\b|\bui-monospace\b|\b(Menlo|Monaco|Consolas|Courier|SFMono|JetBrains Mono|Fira Code|Source Code Pro)\b/i;
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
    for (const family of ['Menlo', 'Consolas', '"Courier New"', 'SFMono-Regular']) expect(MONOSPACE_PATTERN.test(`font-family: ${family};`), family).toBe(true);
    expect(THREE_IMPORT_PATTERN.test("import 'three';")).toBe(true);
    expect(THREE_IMPORT_PATTERN.test("import '@react-three/fiber';")).toBe(true);
  });

  it('imports no three.js anywhere in the explorer', () => {
    expect(matching(THREE_IMPORT_PATTERN)).toEqual([]);
  });

  it('sets no label in a monospace face', () => {
    expect(matching(MONOSPACE_PATTERN)).toEqual([]);
  });

  it('builds the page with no anatomy: the island takes no props and the page imports no data', () => {
    const page = fs.readFileSync(PAGE_PATH, 'utf-8');
    const island = ISLAND_PATTERN.exec(page);
    expect(island?.[1].trim()).toBe('client:only="react"');
    expect(page).not.toMatch(/load-anatomy-data|@shared\/|\.json['"]/);
    expect(ISLAND_PATTERN.exec('<AtlasExplorer client:only="react" index={index} />')?.[1].trim()).not.toBe('client:only="react"');
  });

  it('stops moving under reduced motion, in the stylesheet and in the script that slides rows', () => {
    const css = fs.readFileSync('src/components/atlas-scene/atlas-scene.css', 'utf-8');
    const reduced = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
    expect(reduced).toMatch(/\.atlas-lens-thumb, \.atlas-stage, \.atlas-chevron \{ transition: none; \}/);
    expect(reduced).toMatch(/\.atlas-cell-lens, \.atlas-inspector \{ animation-name: atlas-fade;/);
    const flip = fs.readFileSync('src/components/atlas-scene/use-row-flip.ts', 'utf-8');
    expect(flip).toContain("'(prefers-reduced-motion: reduce)'");
    expect(flip).toMatch(/\|\| prefersLessMotion\(\)\) continue;/);
  });
});
