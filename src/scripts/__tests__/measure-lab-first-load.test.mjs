import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checkFirstLoadBudgets,
  extractDynamicImportSpecifiers,
  extractPageEntries,
  extractStaticImportSpecifiers,
  findFirstLoadFailures,
  measureFirstLoad,
  resolveSiteUrlPath,
  walkStaticImportClosure,
} from '../measure-lab-first-load.mjs';
import {
  FIRST_LOAD_HEADROOM_GZIP_BYTES,
  LAB_FIRST_LOAD_BASELINE_GZIP_BYTES,
  TOOL_PAGES,
  resolveBuiltFile,
} from '../tool-pages.mjs';

const FIXTURE_DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'lab-first-load');
const FIXTURE_PAGE = '/tool/';

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

  it('returns null for bare names and other origins', () => {
    expect(resolveSiteUrlPath('/_astro/entry.js', 'react')).toBeNull();
    expect(resolveSiteUrlPath('/_astro/entry.js', 'https://cdn.example/x.js')).toBeNull();
    expect(resolveSiteUrlPath('/_astro/entry.js', '//cdn.example/x.js')).toBeNull();
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

describe('walkStaticImportClosure', () => {
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
    expect(walk.closure).toContain('/_astro/heavy-3d.js');
    expect(walk.lazyTargets).toEqual([]);
  });

  it('reports imported files that are absent and specifiers that name no site file', () => {
    const walk = walkStaticImportClosure(FIXTURE_DIST, ['/_astro/broken.js']);
    expect(walk.closure).toEqual(['/_astro/broken.js']);
    expect(walk.missing).toEqual(['/_astro/absent.js']);
    expect(walk.unresolved).toEqual(['react']);
  });
});

describe('extractPageEntries', () => {
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
      offOrigin: [],
    });
  });

  it('separates references to other origins', () => {
    const html = '<script src="https://cdn.example/x.js"></script><link rel="stylesheet" href="//cdn.example/x.css">';
    expect(extractPageEntries(html, '/tool/').offOrigin).toEqual(['https://cdn.example/x.js', '//cdn.example/x.css']);
  });
});

describe('measureFirstLoad', () => {
  it('counts the page, its stylesheet and the static closure, and nothing lazy', () => {
    const measurement = measureFirstLoad(FIXTURE_DIST, FIXTURE_PAGE);
    expect(measurement.files.map((file) => [file.kind, file.urlPath])).toEqual([
      ['html', '/tool/'],
      ['stylesheet', '/_astro/page.css'],
      ['script', '/_astro/entry.js'],
      ['script', '/_astro/client.js'],
      ['script', '/_astro/shared.js'],
      ['script', '/_astro/side-effect.js'],
      ['script', '/_astro/reexport.js'],
    ]);
    expect(measurement.totals.rawBytes).toBe(measurement.files.reduce((sum, file) => sum + file.rawBytes, 0));
    expect(measurement.files.every((file) => file.gzipBytes > 0)).toBe(true);
    expect(measurement.lazyTargets).toEqual(['/_astro/lazy.js']);
    expect(measurement.lazyOnlyLibrariesInFirstLoad).toEqual([]);
    expect(findFirstLoadFailures(measurement)).toEqual([]);
  });

  it('fails with a clear message when the page was not built', () => {
    expect(() => measureFirstLoad(FIXTURE_DIST, '/absent/')).toThrow(/No built page for "\/absent\/"/);
  });
});

describe('findFirstLoadFailures', () => {
  const passing = { missing: [], offOrigin: [], lazyOnlyLibrariesInFirstLoad: [], totals: { rawBytes: 10, gzipBytes: 1000 } };

  it('passes at the budget and fails one byte over it', () => {
    expect(findFirstLoadFailures(passing, 1000)).toEqual([]);
    expect(findFirstLoadFailures(passing, 999)).toEqual(['first load is 1000 bytes gzip, over the budget of 999']);
  });

  it('fails when a lazy-only library is in the first load', () => {
    const measurement = measureFirstLoad(FIXTURE_DIST, '/eager/');
    expect(measurement.lazyOnlyLibrariesInFirstLoad).toEqual(['three.js']);
    expect(findFirstLoadFailures(measurement)).toEqual(['three.js is in the first load; it must load on demand']);
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
  const fixtureFirstLoadGzipBytes = measureFirstLoad(FIXTURE_DIST, FIXTURE_PAGE).totals.gzipBytes;

  it('passes a page at its budget and names the page that is one byte over', () => {
    const atBudget = checkFirstLoadBudgets(FIXTURE_DIST, [{ urlPath: FIXTURE_PAGE, firstLoadGzipBudgetBytes: fixtureFirstLoadGzipBytes }]);
    expect(atBudget.failures).toEqual([]);
    expect(atBudget.measurements).toHaveLength(1);
    const overBudget = checkFirstLoadBudgets(FIXTURE_DIST, [{ urlPath: FIXTURE_PAGE, firstLoadGzipBudgetBytes: fixtureFirstLoadGzipBytes - 1 }]);
    expect(overBudget.failures).toEqual([
      `/tool/: first load is ${fixtureFirstLoadGzipBytes} bytes gzip, over the budget of ${fixtureFirstLoadGzipBytes - 1}`,
    ]);
  });

  it('fails a page that carries three.js in its first load, whatever its budget', () => {
    const { failures } = checkFirstLoadBudgets(FIXTURE_DIST, [{ urlPath: '/eager/', firstLoadGzipBudgetBytes: Number.MAX_SAFE_INTEGER }]);
    expect(failures).toEqual(['/eager/: three.js is in the first load; it must load on demand']);
  });

  it('throws when a listed page was not built', () => {
    expect(() => checkFirstLoadBudgets(FIXTURE_DIST, [{ urlPath: '/absent/', firstLoadGzipBudgetBytes: 1 }])).toThrow(/No built page/);
  });
});

describe('the recorded tool pages', () => {
  it('holds the Lab to its recorded baseline plus the headroom', () => {
    const lab = TOOL_PAGES.find((page) => page.urlPath === '/atlas/model/');
    expect(lab?.firstLoadGzipBudgetBytes).toBe(LAB_FIRST_LOAD_BASELINE_GZIP_BYTES + FIRST_LOAD_HEADROOM_GZIP_BYTES);
  });

  it('gives every page a site path ending in "/" and a positive whole-number budget', () => {
    expect(TOOL_PAGES.length).toBeGreaterThan(0);
    for (const page of TOOL_PAGES) {
      expect(page.urlPath).toMatch(/^\/.*\/$/);
      expect(Number.isInteger(page.firstLoadGzipBudgetBytes) && page.firstLoadGzipBudgetBytes > 0).toBe(true);
    }
  });
});
