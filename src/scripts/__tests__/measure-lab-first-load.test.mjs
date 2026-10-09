import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  chunkStem,
  extractDynamicImportSpecifiers,
  extractPageEntries,
  extractStaticImportSpecifiers,
  resolveSiteUrlPath,
  traceImportChain,
  walkImportGraph,
  walkStaticImportClosure,
} from '../first-load-closure.mjs';
import { parseAttributes } from '../built-html.mjs';
import { LAZY_ONLY_LIBRARIES, checkFirstLoadBudgets, findFirstLoadFailures, measureFirstLoad } from '../measure-lab-first-load.mjs';
import {
  CODE_HEADROOM_GZIP_BYTES,
  DOCUMENT_HEADROOM_GZIP_BYTES,
  LAB_CODE_BASELINE_GZIP_BYTES,
  LAB_DOCUMENT_BASELINE_GZIP_BYTES,
  TOOL_PAGES,
  ToolPageCheckError,
  resolveBuiltFile,
} from '../tool-pages.mjs';

const FIXTURE_DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'lab-first-load');
const FIXTURE_PAGE = '/tool/';
const ROOMY_BYTES = 1_000_000;
const roomyBudgets = { codeGzipBudgetBytes: ROOMY_BYTES, documentGzipBudgetBytes: ROOMY_BYTES };
const toolPage = { urlPath: FIXTURE_PAGE, islandEntryName: 'entry', onMountLazyEntryNames: [], interactionGatedEntryNames: [] };

describe('extractStaticImportSpecifiers', () => {
  it('finds named, side-effect and re-export imports in minified output', () => {
    const source = 'import{a as b}from"./a.js";import"./b.js";import c from\'./c.js\';export{d}from"./d.js";export*from"./e.js";';
    expect(extractStaticImportSpecifiers(source)).toEqual(['./a.js', './b.js', './c.js', './d.js', './e.js']);
  });

  it('ignores dynamic imports, preload lists and plain exports', () => {
    const source = 'const deps=["_astro/x.js"];const load=()=>import("./lazy.js");export{load as default};export const from="./not-an-import.js";';
    expect(extractStaticImportSpecifiers(source)).toEqual([]);
  });

  it('finds an import whose braced list has quoted names', () => {
    const source = 'import{"not-an-identifier" as a,b}from"./quoted.js";export{c as "kebab-name"}from"./requoted.js";';
    expect(extractStaticImportSpecifiers(source)).toEqual(['./quoted.js', './requoted.js']);
  });

  it('ignores a property that happens to be called import', () => {
    expect(extractStaticImportSpecifiers('loader.import"./x.js";meta$import"./y.js"')).toEqual([]);
  });
});

describe('extractDynamicImportSpecifiers', () => {
  it('finds literal dynamic import targets only', () => {
    const source = 'import"./eager.js";const a=()=>import("./lazy.js");const b=()=>import(`./other.js`);const c=(name)=>import(name);';
    expect(extractDynamicImportSpecifiers(source)).toEqual(['./lazy.js', './other.js']);
  });
});

describe('resolveSiteUrlPath', () => {
  it('resolves relative and root-relative specifiers against the importing file', () => {
    expect(resolveSiteUrlPath('/_astro/entry.js', './shared.js')).toBe('/_astro/shared.js');
    expect(resolveSiteUrlPath('/_astro/nested/entry.js', '../shared.js?v=1')).toBe('/_astro/shared.js');
    expect(resolveSiteUrlPath('/tool/', '/_astro/page.css')).toBe('/_astro/page.css');
  });

  it('resolves a relative specifier against a page path that ends in "/" as that directory', () => {
    expect(resolveSiteUrlPath('/atlas/model/', './local.js')).toBe('/atlas/model/local.js');
    expect(resolveSiteUrlPath('/atlas/model/', '../shared.js')).toBe('/atlas/shared.js');
  });

  it('returns null for bare names and other origins', () => {
    expect(resolveSiteUrlPath('/_astro/entry.js', 'react')).toBeNull();
    expect(resolveSiteUrlPath('/_astro/entry.js', 'https://cdn.example/x.js')).toBeNull();
    expect(resolveSiteUrlPath('/_astro/entry.js', '//cdn.example/x.js')).toBeNull();
  });
});

describe('chunkStem', () => {
  it('drops the directory, the build hash and the extension', () => {
    expect(chunkStem('/_astro/ExploreMode.4yAgh4jt.js')).toBe('ExploreMode');
    expect(chunkStem('/_astro/Search.astro_astro_type_script_index_0_lang.mkdr79ir.js')).toBe('Search.astro_astro_type_script_index_0_lang');
    expect(chunkStem('/_astro/entry.js')).toBe('entry');
  });
});

describe('resolveBuiltFile', () => {
  it('maps a directory URL to its index file', () => {
    expect(resolveBuiltFile(FIXTURE_DIST, FIXTURE_PAGE)).toBe(path.join(FIXTURE_DIST, 'tool', 'index.html'));
  });

  it('keeps a path that climbs upward inside the build directory', () => {
    expect(resolveBuiltFile(FIXTURE_DIST, '/../../outside.js')).toBe(path.join(FIXTURE_DIST, 'outside.js'));
  });
});

describe('walkImportGraph', () => {
  it('follows static imports through a cycle and stops at dynamic imports', () => {
    const walk = walkStaticImportClosure(FIXTURE_DIST, ['/_astro/entry.js', '/_astro/client.js']);
    expect(walk.closure).toEqual([
      '/_astro/entry.js',
      '/_astro/client.js',
      '/_astro/shared.js',
      '/_astro/side-effect.js',
      '/_astro/reexport.js',
    ]);
    expect(walk.lazyTargets).toEqual(['/_astro/lazy.js']);
    expect(walk.missing).toEqual([]);
    expect(walk.unresolved).toEqual([]);
  });

  it('does not report a chunk as lazy when it is also imported statically', () => {
    const walk = walkStaticImportClosure(FIXTURE_DIST, ['/_astro/entry.js', '/_astro/lazy.js']);
    expect(walk.closure).toContain('/_astro/lazy.js');
    expect(walk.lazyTargets).toEqual([]);
  });

  it('reports imported files that are absent and specifiers that name no site file', () => {
    const walk = walkStaticImportClosure(FIXTURE_DIST, ['/_astro/broken.js']);
    expect(walk.closure).toEqual(['/_astro/broken.js']);
    expect(walk.missing).toEqual(['/_astro/absent.js']);
    expect(walk.unresolved).toEqual(['react']);
  });

  it('walks into dynamic imports when asked, and records how each chunk was reached', () => {
    const walk = walkImportGraph(FIXTURE_DIST, ['/_astro/shell-module-start.js'], { followDynamicImports: true });
    expect(walk.closure).toEqual(['/_astro/shell-module-start.js', '/_astro/lazy-scene.js', '/_astro/heavy-3d.js']);
    expect(traceImportChain(walk.importedBy, '/_astro/heavy-3d.js')).toEqual([
      '/_astro/shell-module-start.js', '/_astro/lazy-scene.js', '/_astro/heavy-3d.js',
    ]);
  });

  it('stops at a named gate and reports it', () => {
    const walk = walkImportGraph(FIXTURE_DIST, ['/_astro/shell-gated.js'], { followDynamicImports: true, gatedEntryStems: ['scene-gate'] });
    expect(walk.closure).toEqual(['/_astro/shell-gated.js']);
    expect(walk.gatedEntries).toEqual(['/_astro/scene-gate.js']);
  });
});

describe('parseAttributes and extractPageEntries', () => {
  it('reads exact attribute names, lower-cased, first occurrence winning', () => {
    const attributes = parseAttributes(' data-component-url="/wrong.js" Component-URL="/right.js" component-url="/late.js" defer');
    expect(attributes.get('component-url')).toBe('/right.js');
    expect(attributes.get('data-component-url')).toBe('/wrong.js');
    expect(attributes.get('defer')).toBe('');
  });

  it('counts a stylesheet whose rel has more than one word', () => {
    expect(extractPageEntries('<link rel="preload stylesheet" href="/_astro/a.css">', '/tool/').stylesheets).toEqual(['/_astro/a.css']);
  });

  it('reads island entries, stylesheets, script tags and inline module imports', () => {
    const html = [
      '<link rel="stylesheet" href="/_astro/a.css"><link rel="modulepreload" href="/_astro/pre.js"><link rel="icon" href="/favicon.svg">',
      '<script type="module" src="/_astro/tag.js"></script>',
      '<script type="module">import"/_astro/inline.js";</script>',
      '<script>var text = \'import "/_astro/classic.js"\';</script>',
      '<astro-island component-url="/_astro/entry.js" renderer-url="/_astro/client.js" before-hydration-url="/_astro/before.js"></astro-island>',
    ].join('');
    expect(extractPageEntries(html, '/tool/')).toEqual({
      stylesheets: ['/_astro/a.css'],
      scriptEntries: ['/_astro/pre.js', '/_astro/tag.js', '/_astro/entry.js', '/_astro/client.js', '/_astro/before.js', '/_astro/inline.js'],
      islandComponents: ['/_astro/entry.js'],
      offOrigin: [],
    });
  });

  it('finds the island entry when an earlier attribute value contains ">"', () => {
    const html = '<astro-island props="{&quot;note&quot;:&quot;a > b&quot;}" title=\'x > y\' component-url="/_astro/entry.js" renderer-url="/_astro/client.js"></astro-island>';
    expect(extractPageEntries(html, '/tool/').scriptEntries).toEqual(['/_astro/entry.js', '/_astro/client.js']);
  });

  it('does not take a differently named attribute for the island entry', () => {
    const html = '<astro-island data-component-url="/_astro/entry.js" renderer-urls="/_astro/client.js"></astro-island>';
    expect(extractPageEntries(html, '/tool/').scriptEntries).toEqual([]);
  });

  it('reads an inline module script whose end tag has a space before the bracket', () => {
    const html = '<script type="module">import"/_astro/spaced.js";</script ><p>after</p>';
    expect(extractPageEntries(html, '/tool/').scriptEntries).toEqual(['/_astro/spaced.js']);
  });

  it('separates references to other origins, including a bare name in an inline module', () => {
    const html = '<script src="https://cdn.example/x.js"></script><link rel="stylesheet" href="//cdn.example/x.css"><script type="module">import"react";</script>';
    expect(extractPageEntries(html, '/tool/').offOrigin).toEqual(['https://cdn.example/x.js', '//cdn.example/x.css', 'react']);
  });
});

describe('measureFirstLoad', () => {
  it('counts the page, its stylesheet and the static closure, and nothing lazy', () => {
    const measurement = measureFirstLoad(FIXTURE_DIST, toolPage);
    expect(measurement.files.map((file) => [file.part, file.kind, file.urlPath])).toEqual([
      ['document', 'html', '/tool/'],
      ['static', 'stylesheet', '/_astro/page.css'],
      ['static', 'script', '/_astro/entry.js'],
      ['static', 'script', '/_astro/client.js'],
      ['static', 'script', '/_astro/shared.js'],
      ['static', 'script', '/_astro/side-effect.js'],
      ['static', 'script', '/_astro/reexport.js'],
    ]);
    const [documentFile, ...codeFiles] = measurement.files;
    expect(measurement.totals.documentGzipBytes).toBe(documentFile.gzipBytes);
    expect(measurement.totals.codeGzipBytes).toBe(codeFiles.reduce((sum, file) => sum + file.gzipBytes, 0));
    expect(measurement.totals.onMountCodeGzipBytes).toBe(0);
    expect(measurement.totals.gzipBytes).toBe(measurement.totals.codeGzipBytes + measurement.totals.documentGzipBytes);
    expect(measurement.lazyTargets).toEqual(['/_astro/lazy.js']);
    expect(findFirstLoadFailures(measurement)).toEqual([]);
  });

  it('counts a declared on-mount chunk and its imports as code, apart from the static closure', () => {
    const measurement = measureFirstLoad(FIXTURE_DIST, { ...toolPage, onMountLazyEntryNames: ['lazy'] });
    const onMountFiles = measurement.files.filter((file) => file.part === 'on-mount');
    expect(onMountFiles.map((file) => file.urlPath)).toEqual(['/_astro/lazy.js']);
    expect(measurement.totals.onMountCodeGzipBytes).toBe(onMountFiles[0].gzipBytes);
    expect(measurement.totals.codeGzipBytes).toBe(measurement.totals.staticCodeGzipBytes + measurement.totals.onMountCodeGzipBytes);
    expect(measurement.lazyTargets).toEqual([]);
  });

  it('fails with a typed error and the next step when the page was not built', () => {
    expect(() => measureFirstLoad(FIXTURE_DIST, { urlPath: '/absent/' })).toThrow(ToolPageCheckError);
    expect(() => measureFirstLoad(FIXTURE_DIST, { urlPath: '/absent/' })).toThrow(/No built page for "\/absent\/".*npm run build/);
  });
});

describe('three.js must not load before the visitor asks', () => {
  const failuresFor = (page) => findFirstLoadFailures(measureFirstLoad(FIXTURE_DIST, { onMountLazyEntryNames: [], interactionGatedEntryNames: [], ...page }));

  it('fails when the island imports it statically', () => {
    expect(failuresFor({ urlPath: '/eager/' })).toEqual([
      'three.js can load without the visitor asking for it, through /_astro/eager-3d.js -> /_astro/heavy-3d.js; it may sit only behind a chunk named in interactionGatedEntryNames',
    ]);
  });

  it('fails when the default mode, imported on mount, imports it statically', () => {
    const failures = failuresFor({ urlPath: '/mount-static-three/', onMountLazyEntryNames: ['default-mode'] });
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('/_astro/shell-default-mode.js -> /_astro/default-mode.js -> /_astro/heavy-3d.js');
  });

  it('fails the same way when the on-mount import is not even declared', () => {
    expect(failuresFor({ urlPath: '/mount-static-three/' })).toHaveLength(1);
  });

  it('fails when a chunk that leads to it is imported at module start', () => {
    const failures = failuresFor({ urlPath: '/module-start-import/' });
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('/_astro/shell-module-start.js -> /_astro/lazy-scene.js -> /_astro/heavy-3d.js');
  });

  it('passes when it sits behind a chunk the page names as interaction-gated', () => {
    const measurement = measureFirstLoad(FIXTURE_DIST, { urlPath: '/gated/', interactionGatedEntryNames: ['scene-gate'] });
    expect(findFirstLoadFailures(measurement)).toEqual([]);
    expect(measurement.gatedEntries).toEqual(['/_astro/scene-gate.js']);
  });

  it('fails the same page when the gate is not named', () => {
    expect(failuresFor({ urlPath: '/gated/' })).toHaveLength(1);
  });

  it('does not mistake a chunk that mentions or awaits the renderer for the library itself', () => {
    const measurement = measureFirstLoad(FIXTURE_DIST, { urlPath: '/gated/', interactionGatedEntryNames: ['scene-gate'] });
    expect(measurement.files.map((file) => file.urlPath)).toContain('/_astro/shell-gated.js');
    expect(measurement.ungatedLazyLibraries).toEqual([]);
  });

  it('recognises the library by the chunk that defines it, whatever the chunk is called', () => {
    const measurement = measureFirstLoad(FIXTURE_DIST, { urlPath: '/eager/' });
    expect(measurement.ungatedLazyLibraries.map(({ library, chunk }) => [library, chunk])).toEqual([['three.js', '/_astro/heavy-3d.js']]);
  });
});

describe('how three.js is recognised', () => {
  const threeEntryPath = createRequire(import.meta.url).resolve('three');
  const threeBuildDirectory = path.dirname(threeEntryPath);
  const { definedBy } = LAZY_ONLY_LIBRARIES.find(({ library }) => library === 'three.js');

  it('matches the installed three.js core, so an upgrade that drops the marker fails here and not silently', () => {
    expect(definedBy.test(readFileSync(path.join(threeBuildDirectory, 'three.core.js'), 'utf-8'))).toBe(true);
  });

  it('does not match the part of three.js that only uses the core', () => {
    expect(definedBy.test(readFileSync(path.join(threeBuildDirectory, 'three.module.js'), 'utf-8'))).toBe(false);
  });
});

describe('a declared name must identify one chunk', () => {
  it('fails a gate name that two chunks share', () => {
    const page = { urlPath: '/two-scenes/', interactionGatedEntryNames: ['Scene'] };
    expect(findFirstLoadFailures(measureFirstLoad(FIXTURE_DIST, page))).toEqual([
      '"Scene" matches 2 chunks (/_astro/Scene.aaaaaaaa.js, /_astro/Scene.bbbbbbbb.js); rename a module so the name identifies one chunk',
    ]);
  });
});

describe('a measurement that would be empty is a failure', () => {
  it('fails a page with no script entry', () => {
    const measurement = measureFirstLoad(FIXTURE_DIST, { urlPath: '/no-island/', islandEntryName: 'entry' });
    expect(findFirstLoadFailures(measurement)).toEqual([
      'the page names no script entry, so nothing was measured',
      'the page has no "entry" island (found: none); the measurement would be empty',
    ]);
  });

  it('fails a page whose island is not the expected one', () => {
    const failures = findFirstLoadFailures(measureFirstLoad(FIXTURE_DIST, { ...toolPage, islandEntryName: 'WorkbenchShell' }));
    expect(failures).toEqual(['the page has no "WorkbenchShell" island (found: entry); the measurement would be empty']);
  });

  it('fails a declared on-mount entry or gate that the page does not import', () => {
    const failures = findFirstLoadFailures(measureFirstLoad(FIXTURE_DIST, { ...toolPage, onMountLazyEntryNames: ['renamed-mode'], interactionGatedEntryNames: ['renamed-gate'] }));
    expect(failures).toEqual([
      'declared interaction gate "renamed-gate" is not a dynamic import of this page; remove or correct it in tool-pages.mjs',
      'declared on-mount entry "renamed-mode" is not a dynamic import of the page\'s first-load scripts; correct its name in tool-pages.mjs',
    ]);
  });
});

describe('a chunk cannot be both on-mount and interaction-gated', () => {
  it('fails a page that names the same chunk in both lists, which would hide what sits behind it', () => {
    const page = { urlPath: '/mount-static-three/', onMountLazyEntryNames: ['default-mode'], interactionGatedEntryNames: ['default-mode'] };
    expect(findFirstLoadFailures(measureFirstLoad(FIXTURE_DIST, page))).toContain(
      '"default-mode" is declared both as loading on mount and as interaction-gated; it cannot be both',
    );
  });
});

describe('findFirstLoadFailures', () => {
  const totals = { rawBytes: 10, gzipBytes: 1500, codeGzipBytes: 1000, documentGzipBytes: 500 };
  const passing = { missing: [], offOrigin: [], structureProblems: [], ungatedLazyLibraries: [], totals };

  it('passes the code part at its budget and fails it one byte over', () => {
    expect(findFirstLoadFailures(passing, { codeGzipBudgetBytes: 1000, documentGzipBudgetBytes: null })).toEqual([]);
    expect(findFirstLoadFailures(passing, { codeGzipBudgetBytes: 999, documentGzipBudgetBytes: null })).toEqual([
      'code (stylesheets and scripts) is 1000 bytes gzip, over its budget of 999',
    ]);
  });

  it('passes the document part at its budget and fails it one byte over', () => {
    expect(findFirstLoadFailures(passing, { codeGzipBudgetBytes: null, documentGzipBudgetBytes: 500 })).toEqual([]);
    expect(findFirstLoadFailures(passing, { codeGzipBudgetBytes: null, documentGzipBudgetBytes: 499 })).toEqual([
      'document (HTML with its catalog data) is 500 bytes gzip, over its budget of 499',
    ]);
  });

  it('does not let room in one part pay for the other', () => {
    expect(findFirstLoadFailures(passing, { codeGzipBudgetBytes: 999, documentGzipBudgetBytes: ROOMY_BYTES })).toHaveLength(1);
    expect(findFirstLoadFailures(passing, { codeGzipBudgetBytes: ROOMY_BYTES, documentGzipBudgetBytes: 499 })).toHaveLength(1);
  });

  it('fails on missing files and references to other origins', () => {
    const failures = findFirstLoadFailures({ ...passing, missing: ['/_astro/absent.js'], offOrigin: ['https://cdn.example/x.js'] });
    expect(failures).toEqual([
      'referenced file is missing from the build: /_astro/absent.js',
      'first load references another origin: https://cdn.example/x.js',
    ]);
  });
});

describe('checkFirstLoadBudgets', () => {
  const fixtureTotals = measureFirstLoad(FIXTURE_DIST, toolPage).totals;
  const atBudget = { ...toolPage, codeGzipBudgetBytes: fixtureTotals.codeGzipBytes, documentGzipBudgetBytes: fixtureTotals.documentGzipBytes };

  it('passes a page whose two parts are each exactly at budget', () => {
    const { measurements, failures } = checkFirstLoadBudgets(FIXTURE_DIST, [atBudget]);
    expect(failures).toEqual([]);
    expect(measurements).toHaveLength(1);
  });

  it('names the page and the code part when the code is one byte over', () => {
    const { failures } = checkFirstLoadBudgets(FIXTURE_DIST, [{ ...atBudget, codeGzipBudgetBytes: fixtureTotals.codeGzipBytes - 1 }]);
    expect(failures).toEqual([
      `/tool/: code (stylesheets and scripts) is ${fixtureTotals.codeGzipBytes} bytes gzip, over its budget of ${fixtureTotals.codeGzipBytes - 1}`,
    ]);
  });

  it('counts the on-mount chunk against the code budget', () => {
    const withOnMount = { ...atBudget, onMountLazyEntryNames: ['lazy'] };
    expect(checkFirstLoadBudgets(FIXTURE_DIST, [withOnMount]).failures).toHaveLength(1);
  });

  it('names the page and the document part when the document is one byte over', () => {
    const { failures } = checkFirstLoadBudgets(FIXTURE_DIST, [{ ...atBudget, documentGzipBudgetBytes: fixtureTotals.documentGzipBytes - 1 }]);
    expect(failures).toEqual([
      `/tool/: document (HTML with its catalog data) is ${fixtureTotals.documentGzipBytes} bytes gzip, over its budget of ${fixtureTotals.documentGzipBytes - 1}`,
    ]);
  });

  it('fails a page whose budget is missing, misspelt or null, instead of skipping it', () => {
    const misspelt = { ...toolPage, codeGzipBudgetBytes: ROOMY_BYTES, documentBudget: 1 };
    expect(checkFirstLoadBudgets(FIXTURE_DIST, [misspelt]).failures).toEqual([
      '/tool/: documentGzipBudgetBytes is not set; every listed page needs both budgets in tool-pages.mjs',
    ]);
    const nulled = { ...toolPage, codeGzipBudgetBytes: null, documentGzipBudgetBytes: ROOMY_BYTES };
    expect(checkFirstLoadBudgets(FIXTURE_DIST, [nulled]).failures).toEqual([
      '/tool/: codeGzipBudgetBytes is not set; every listed page needs both budgets in tool-pages.mjs',
    ]);
    expect(checkFirstLoadBudgets(FIXTURE_DIST, [{ ...toolPage, ...roomyBudgets, codeGzipBudgetBytes: 1.5 }]).failures).toEqual([
      '/tool/: code (stylesheets and scripts) has no usable budget (1.5); give it a whole number of bytes in tool-pages.mjs',
    ]);
  });

  it('fails an empty page list instead of passing with nothing checked', () => {
    expect(checkFirstLoadBudgets(FIXTURE_DIST, [])).toEqual({ measurements: [], failures: ['no tool pages are listed, so nothing was checked'] });
  });

  it('fails a page that reaches three.js, whatever its budgets', () => {
    const { failures } = checkFirstLoadBudgets(FIXTURE_DIST, [{ urlPath: '/eager/', ...roomyBudgets }]);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/^\/eager\/: three\.js can load without the visitor asking/);
  });

  it('throws when a listed page was not built', () => {
    expect(() => checkFirstLoadBudgets(FIXTURE_DIST, [{ ...atBudget, urlPath: '/absent/' }])).toThrow(/No built page/);
  });
});

describe('the recorded tool pages', () => {
  it('holds the Lab code and the Lab document each to its own baseline plus its own headroom', () => {
    const lab = TOOL_PAGES.find((page) => page.urlPath === '/atlas/model/');
    expect(lab?.codeGzipBudgetBytes).toBe(LAB_CODE_BASELINE_GZIP_BYTES + CODE_HEADROOM_GZIP_BYTES);
    expect(lab?.documentGzipBudgetBytes).toBe(LAB_DOCUMENT_BASELINE_GZIP_BYTES + DOCUMENT_HEADROOM_GZIP_BYTES);
  });

  it('names no interaction gate yet, so three.js may sit behind nothing on the Lab page', () => {
    expect(TOOL_PAGES.flatMap((page) => page.interactionGatedEntryNames)).toEqual([]);
  });

  it('gives every page a site path ending in "/", an island name and two positive whole-number budgets', () => {
    expect(TOOL_PAGES.length).toBeGreaterThan(0);
    for (const page of TOOL_PAGES) {
      expect(page.urlPath).toMatch(/^\/.*\/$/);
      expect(page.islandEntryName).toMatch(/\S/);
      for (const budget of [page.codeGzipBudgetBytes, page.documentGzipBudgetBytes]) {
        expect(Number.isInteger(budget) && budget > 0).toBe(true);
      }
    }
  });
});
