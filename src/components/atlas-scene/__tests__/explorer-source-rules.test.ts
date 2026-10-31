import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const EXPLORER_DIRECTORIES = ['src/components/atlas-scene', 'src/lib/atlas-explorer'];
const EXPLORER_FILES = ['src/lib/anatomy/limits-copy.ts', 'src/pages/atlas/anatomy.astro'];
const PAGE_PATH = 'src/pages/atlas/anatomy.astro';
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.css', '.astro'];
/** three.js. Only the files of the gated canvas chunk may import it. */
const THREE_IMPORT_PATTERN = /(from|import\(|import)\s*['"](three|three\/[^'"]*)['"]/;
/** Labels are set in the sans face: no monospace utility, variable or family. */
const MONOSPACE_PATTERN = /\bfont-mono\b|--font-mono|--lab-mono|\bmonospace\b|\btm-mono\b|\bui-monospace\b|\b(Menlo|Monaco|Consolas|Courier|SFMono|JetBrains Mono|Fira Code|Source Code Pro)\b/i;
/** The modules that import three.js, and the canvas that is their only way in. */
const THREE_FILES = ['scene-renderer.ts', 'scene-objects.ts', 'scene-brackets.ts', 'scene-marks.ts', 'device-objects.ts', 'TractLines.tsx'];
const CANVAS_CHUNK_FILES = ['AtlasCanvas.tsx', ...THREE_FILES];
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
    expect(THREE_IMPORT_PATTERN.test('const scene = await import("three/examples/jsm/controls/OrbitControls.js");')).toBe(true);
    expect(THREE_IMPORT_PATTERN.test('import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";')).toBe(true);
    expect(MONOSPACE_PATTERN.test('.label { font-family: var(--font-mono); }')).toBe(true);
    expect(MONOSPACE_PATTERN.test('<span className="font-mono text-xs">')).toBe(true);
    expect(MONOSPACE_PATTERN.test('font-family: ui-monospace, monospace;')).toBe(true);
    for (const family of ['Menlo', 'Consolas', '"Courier New"', 'SFMono-Regular']) expect(MONOSPACE_PATTERN.test(`font-family: ${family};`), family).toBe(true);
    expect(THREE_IMPORT_PATTERN.test("import 'three';")).toBe(true);
  });

  it('imports three.js only in the modules that draw for the canvas, and the tract lines no build mounts yet', () => {
    expect(matching(THREE_IMPORT_PATTERN).map((filePath) => path.basename(filePath)).sort()).toEqual([...THREE_FILES].sort());
  });

  it('reaches those files only through import(), or for their types: no static import pulls three.js into the first load', () => {
    const staticValueImport = new RegExp(String.raw`^import (?!type )[^;]*from '\./(${CANVAS_CHUNK_FILES.map((name) => name.replace(/\.tsx?$/, '')).join('|')})';`, 'm');
    const importers = files.filter((filePath) => !CANVAS_CHUNK_FILES.includes(path.basename(filePath)) && staticValueImport.test(fs.readFileSync(filePath, 'utf-8')));
    expect(importers).toEqual([]);
    expect(staticValueImport.test("import { createSceneRenderer } from './scene-renderer';")).toBe(true);
    expect(staticValueImport.test("import type { AxisDirections } from './scene-renderer';")).toBe(false);
    expect(fs.readFileSync('src/components/atlas-scene/OpenViewport.tsx', 'utf-8')).toContain("import('./AtlasCanvas')");
    expect(fs.readFileSync('src/components/atlas-scene/AtlasViewport.tsx', 'utf-8')).toContain("import('./OpenViewport')");
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

  it('stops moving under reduced motion, in the stylesheet and in the script that slides rows', () => {
    const css = fs.readFileSync('src/components/atlas-scene/atlas-scene.css', 'utf-8');
    const reduced = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
    expect(reduced).toMatch(/\.atlas-lens-thumb, \.atlas-stage, \.atlas-chevron \{ transition: none; \}/);
    expect(reduced).toMatch(/\.atlas-cell-lens, \.atlas-inspector \{ animation-name: atlas-fade;/);
    const flip = fs.readFileSync('src/components/atlas-scene/use-row-flip.ts', 'utf-8');
    expect(flip).toContain("'(prefers-reduced-motion: reduce)'");
    expect(flip).toMatch(/\|\| prefersLessMotion\(\)\) continue;/);
  });

  it('sets every font family from the Lab\'s two families or by inheritance, in the stylesheet and in inline styles', () => {
    const ALLOWED_FAMILIES = [/^var\(--font-body(, [a-z-]+(, [a-z-]+)*)?\)$/, /^var\(--font-heading(, [a-z-]+)?\)$/, /^inherit$/];
    const declared = files.flatMap((filePath) => [...fs.readFileSync(filePath, 'utf-8').matchAll(/font-family:\s*([^;}]+)[;}]|fontFamily:\s*['"`]([^'"`]+)['"`]/g)].map((match) => ({ filePath, family: (match[1] ?? match[2]).trim() })));
    expect(declared.length).toBeGreaterThan(3);
    expect(declared.filter(({ family }) => !ALLOWED_FAMILIES.some((allowed) => allowed.test(family)))).toEqual([]);
    for (const family of ['Menlo', '"Comic Mono", sans-serif', 'var(--font-mono)', 'system-ui']) expect(ALLOWED_FAMILIES.some((allowed) => allowed.test(family)), family).toBe(false);
  });

  it('keeps the 3D view\'s class names to the 3D view: none is used by another explorer component, and none restyles an earlier class', () => {
    const css = fs.readFileSync('src/components/atlas-scene/atlas-scene.css', 'utf-8');
    const [before, viewport] = css.split('/* The 3D view.');
    const classesIn = (text: string): Set<string> => new Set([...text.matchAll(/\.(atlas-[a-z0-9-]+)/g)].map((match) => match[1]));
    const earlier = classesIn(before);
    /** Classes the 3D view may share on purpose: buttons, toggles, notes and lists that look the same everywhere. */
    const SHARED = ['atlas-button', 'atlas-root', 'atlas-toggle', 'atlas-limit', 'atlas-link-button'];
    const viewportOnly = [...classesIn(viewport)].filter((name) => !earlier.has(name));
    expect(viewportOnly.length).toBeGreaterThan(15);
    expect([...classesIn(viewport)].filter((name) => earlier.has(name) && !SHARED.includes(name))).toEqual([]);
    const VIEWPORT_FILES = ['AtlasViewport.tsx', 'OpenViewport.tsx', 'ViewportStage.tsx', 'ViewportControls.tsx', 'ViewportLegend.tsx', 'AtlasCanvas.tsx', 'AtlasRegionView.tsx'];
    const others = files.filter((filePath) => filePath.endsWith('.tsx') && !VIEWPORT_FILES.includes(path.basename(filePath)));
    const collisions = others.flatMap((filePath) => viewportOnly.filter((name) => new RegExp(`["' ]${name}["' ]`).test(fs.readFileSync(filePath, 'utf-8'))).map((name) => `${path.basename(filePath)}: ${name}`));
    expect(collisions).toEqual([]);
    expect(fs.readFileSync('src/components/atlas-scene/SignalChainRail.tsx', 'utf-8')).toContain('"atlas-stage"');
    expect(viewportOnly).not.toContain('atlas-stage');
  });
});
