import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { readModuleStatements } from '../../../scripts/source-imports.mjs';
import { findIndexPinProblems } from '../../../scripts/tool-page-imports.mjs';
import { REGION_VIEW_PAGES, TOOL_PAGES } from '../../../scripts/tool-pages.mjs';

const SCENE_DIRECTORY = 'src/components/atlas-scene';
/** Each page that mounts the view, the file that holds the mount, and how the page hands it over. */
const MOUNTS = [
  { page: 'src/pages/atlas/model.astro', host: 'src/components/threat-model/TargetRegionsPanel.tsx', builtPath: '/atlas/model/' },
  { page: 'src/pages/atlas/tara/[id].astro', host: 'src/components/brain/BandViewPanel.tsx', builtPath: '/atlas/tara/QIF-T0001/' },
  { page: 'src/pages/atlas/clinical.astro', host: 'src/components/atlas/brainmap/RegionPicker.tsx', builtPath: '/atlas/clinical/' },
  { page: 'src/pages/atlas/index.astro', host: 'src/components/brain/BandViewPanel.tsx', builtPath: '/atlas/' },
];
const SOURCE_EXTENSIONS = ['.astro', '.ts', '.tsx'];
/** three.js, the canvas chunk's modules, and the two lazy chunks that lead to them. A page or a host may name none of them in a static import. */
const HEAVY_MODULES = ['AtlasCanvas', 'scene-renderer', 'scene-objects', 'scene-marks', 'device-objects', 'TractLines', 'OpenViewport', 'RegionViewPanel', 'AtlasRegionView', 'AtlasViewport', 'explorer-data'];
const STATIC_HEAVY_IMPORT = new RegExp(String.raw`^\s*import (?!type )[^;]*from ['"](three|three/[^'"]*|@react-three/[^'"]*|[^'"]*/(${HEAVY_MODULES.join('|')})(\.tsx?)?)['"]`, 'm');
const read = (filePath: string): string => fs.readFileSync(filePath, 'utf-8');

function listSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(entryPath);
    return SOURCE_EXTENSIONS.includes(path.extname(entry.name)) ? [entryPath] : [];
  });
}

describe('the 3D view on other pages: what may import what', () => {
  it('has a pattern that catches a static import of three.js or of a lazy chunk, and lets a type import pass', () => {
    expect(STATIC_HEAVY_IMPORT.test("import * as THREE from 'three';")).toBe(true);
    expect(STATIC_HEAVY_IMPORT.test("import AtlasCanvas from '@/components/atlas-scene/AtlasCanvas';")).toBe(true);
    expect(STATIC_HEAVY_IMPORT.test("import RegionViewPanel from './RegionViewPanel';")).toBe(true);
    expect(STATIC_HEAVY_IMPORT.test("import type { RegionViewPanelProps } from './RegionViewPanel';")).toBe(false);
    expect(STATIC_HEAVY_IMPORT.test("import RegionViewMount from '@/components/atlas-scene/RegionViewMount';")).toBe(false);
  });

  it('lets no page file import three.js, the canvas or a lazy chunk statically', () => {
    const pages = listSourceFiles('src/pages');
    expect(pages.length).toBeGreaterThan(50);
    expect(pages.filter((filePath) => STATIC_HEAVY_IMPORT.test(read(filePath)))).toEqual([]);
  });

  it('lets each host reach the view only through the mount, which reaches the rest only through import()', () => {
    for (const { host } of MOUNTS) {
      expect(STATIC_HEAVY_IMPORT.test(read(host)), host).toBe(false);
      expect(read(host), host).toMatch(/import RegionViewMount(, \{ BAND_LENS \})? from '[^']*atlas-scene\/RegionViewMount';/);
    }
    const mount = read(path.join(SCENE_DIRECTORY, 'RegionViewMount.tsx'));
    expect(mount).toContain("import('./RegionViewPanel')");
    expect(STATIC_HEAVY_IMPORT.test(mount)).toBe(false);
    // What ships with a page is the button and its own few sentences: no limit table, no parser, no data loader.
    expect(mount.match(/^import .*$/gm)).toEqual([
      "import { useEffect, useRef, useState, type ComponentType } from 'react';",
      "import type { LimitId, LimitSentence } from '@/lib/anatomy/limits-copy';",
      "import { MOUNT_COPY } from '@/lib/anatomy/mount-copy';",
      "import type { IndexReviewState } from '@/lib/anatomy/anatomy-index-types';",
      "import type { Lens } from '@/lib/atlas-explorer/lens-state';",
      "import type { RegionViewPanelProps } from './RegionViewPanel';",
      "import ReviewMark from './ReviewMark';",
      "import './region-view-mount.css';",
    ]);
    // The mark the button shows must not pull the limit table, the review ledger parser or three.js into a first load: type imports only.
    const reviewMark = read(path.join(SCENE_DIRECTORY, 'ReviewMark.tsx'));
    expect(reviewMark.match(/^import .*$/gm)).toEqual(["import type { IndexReviewState } from '@/lib/anatomy/anatomy-index-types';"]);
  });

  it('adds the view\'s stylesheets by address, so no page links them on its first load', () => {
    const panel = read(path.join(SCENE_DIRECTORY, 'RegionViewPanel.tsx'));
    expect(panel.match(/^import .*\.css.*$/gm)).toEqual(["import mountStylesUrl from './atlas-region-mount.css?url';", "import sceneStylesUrl from './atlas-scene.css?url';"]);
  });

  it('gives every mounting page the index pin, and through the one module that exports nothing else', () => {
    for (const { page } of MOUNTS) {
      expect(read(page), page).toContain("import AtlasIndexPin from '@/components/atlas-scene/AtlasIndexPin.astro';");
      expect(read(page).match(/<AtlasIndexPin \/>/g), page).toHaveLength(1);
    }
    // Parsed, not matched by line: every statement of the pin module, however it is laid out. The walk's own check is findIndexPinProblems.
    const pinModulePath = path.join(SCENE_DIRECTORY, 'build-index-pin.ts');
    expect(readModuleStatements(pinModulePath, read(pinModulePath)), 'build-index-pin.ts must stay a bare pin: two imports and the one export').toEqual([
      "import type { PinnedFile } from '@/lib/anatomy/anatomy-index-types'",
      "import { loadAnatomyBundle } from './load-anatomy-data'",
      'export const INDEX_PIN = loadAnatomyBundle().indexPin',
    ]);
    expect(findIndexPinProblems(pinModulePath, read(pinModulePath))).toEqual([]);
    const pinElement = read(path.join(SCENE_DIRECTORY, 'AtlasIndexPin.astro'));
    expect(pinElement).toContain('JSON.stringify(INDEX_PIN)');
    expect(pinElement).not.toMatch(/loadAnatomyBundle|\.index\b|indexJson|@shared\//);
  });

  it('builds a technique page with the sentence for a picture with nothing coloured, from the module that chooses it as the view does', () => {
    const page = read('src/pages/atlas/tara/[id].astro');
    expect(page).toContain("import { readLinksReview, readUncolouredLimit } from '@/components/atlas-scene/build-technique-colouring';");
    expect(page.match(/regionViewLinksReview=\{readLinksReview\(threat\.id\)\}/g)).toHaveLength(1);
    expect(page.match(/regionViewNothingColoured=\{readUncolouredLimit\(threat\.id\)\}/g)).toHaveLength(1);
    const buildModule = read(path.join(SCENE_DIRECTORY, 'build-technique-colouring.ts'));
    expect(buildModule.match(/^export .*$/gm)).toEqual(['export function readUncolouredLimit(techniqueId: string): LimitSentence | null {', 'export function readLinksReview(techniqueId: string): IndexReviewState | null {']);
    expect(buildModule).toContain("limitsForUncolouredTechnique(COLOURING_SOURCE, { kind: 'technique', techniqueId })");
    // No client file may import a build-time module: each leads to the anatomy loader.
    const clientFiles = [...listSourceFiles('src/components'), ...listSourceFiles('src/lib')].filter((filePath) => !filePath.includes('__tests__') && !filePath.endsWith('.astro'));
    expect(clientFiles.filter((filePath) => /from ['"][^'"]*\/build-(technique-colouring|index-pin)['"]/.test(read(filePath)))).toEqual([]);
  });

  it('embeds nothing in a frame', () => {
    const files = [...listSourceFiles(SCENE_DIRECTORY).filter((filePath) => !filePath.includes('__tests__')), ...MOUNTS.flatMap(({ page, host }) => [page, host])];
    expect(files.filter((filePath) => /<iframe|<frame\b|<embed\b|<object\b/i.test(read(filePath)))).toEqual([]);
  });

  it('keeps the button\'s sentences in a module that imports nothing, and writes none in the button itself', () => {
    expect(read('src/lib/anatomy/mount-copy.ts')).not.toMatch(/^import /m);
    const mount = read(path.join(SCENE_DIRECTORY, 'RegionViewMount.tsx'));
    // Text between tags, apart from the two button labels: every sentence comes from MOUNT_COPY.
    expect(mount.match(/<span[^>]*>[^<{]+<\/span>/g)).toBeNull();
    expect([...new Set(mount.match(/MOUNT_COPY\.[a-z_]+/g))].sort()).toEqual(['MOUNT_COPY.ask', 'MOUNT_COPY.choose_in_list', 'MOUNT_COPY.failed', 'MOUNT_COPY.links_review', 'MOUNT_COPY.loading']);
    // The one sentence about the atlas that the button shows is a limit sentence the page was built with.
    expect(mount).toContain('{nothingColoured.text}');
  });

  it('writes no limit sentence of its own: the notes show only what limits-copy.ts made', () => {
    const notes = read(path.join(SCENE_DIRECTORY, 'RegionViewNotes.tsx'));
    expect(notes).toContain('notes.limits.map((limit) => <LimitNote');
    expect(read('src/lib/atlas-explorer/region-view-notes.ts')).not.toMatch(/text: ['"`]/);
  });
});

describe('the declarations the post-build check reads', () => {
  it('names the Lab\'s way in to the view as interaction-gated and leaves its anatomy setting as it was', () => {
    const lab = TOOL_PAGES.find((page) => page.urlPath === '/atlas/model/');
    expect(lab?.interactionGatedEntryNames).toEqual(['RegionViewPanel']);
    expect(lab?.scriptsMayCarryAnatomy).toBe(false);
  });

  it('lists every other page that mounts the view, each with the same one gate', () => {
    const listed = [...REGION_VIEW_PAGES.map((page) => page.urlPath), '/atlas/model/'].sort();
    expect(listed).toEqual(MOUNTS.map((mount) => mount.builtPath).sort());
    for (const page of REGION_VIEW_PAGES) expect(page.interactionGatedEntryNames, page.urlPath).toEqual(['RegionViewPanel']);
  });
});
