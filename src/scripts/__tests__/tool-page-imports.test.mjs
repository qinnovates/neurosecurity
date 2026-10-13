import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { readSourceImports } from '../source-imports.mjs';
import { TOOL_PAGES } from '../tool-pages.mjs';
import { ANATOMY_DATA_MODULES, findImportProblems, findPageSource, isAnatomyDataModule, resolveImport } from '../tool-page-imports.mjs';

const SOURCE_ROOTS = ['src', 'datalake'];
const SKIPPED_DIRECTORIES = ['node_modules', 'eeg'];
const PAGE = 'src/pages/atlas/model.astro';
const SHELL = 'src/components/threat-model/WorkbenchShell.tsx';
const QUERY_MODE = 'src/components/query/QueryMode.tsx';
const TABLES = 'src/lib/kql-tables.ts';
const GENERATED_TABLES = 'src/site/data/kql-tables.json';
const REGIONS_FILE = 'datalake/qif-anatomy-technique-regions.json';
const PAGE_IMPORTS = "import ToolLayout from '@/layouts/ToolLayout.astro';\nimport WorkbenchShell from '@/components/threat-model/WorkbenchShell';";
const QUERY_MODE_SOURCE = "import { executeQuery } from '@/lib/kql-engine';\nexport default executeQuery;";

function listRepositoryFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) return SKIPPED_DIRECTORIES.includes(entry.name) ? [] : listRepositoryFiles(entryPath);
    return [entryPath];
  });
}

const repositoryFiles = SOURCE_ROOTS.flatMap(listRepositoryFiles);
const repositoryTree = {
  exists: (filePath) => existsSync(filePath) && statSync(filePath).isFile(),
  read: (filePath) => readFileSync(filePath, 'utf-8'),
  listFiles: () => repositoryFiles,
};

/** A source tree held in memory: path -> file text. */
function buildTree(files) {
  return { exists: (filePath) => Object.hasOwn(files, filePath), read: (filePath) => files[filePath], listFiles: () => Object.keys(files) };
}

/** The Lab page as it is wired today, reduced to its imports. */
const LAB_FILES = {
  [PAGE]: `---\n${PAGE_IMPORTS}\n---\n<WorkbenchShell client:load />`,
  'src/layouts/ToolLayout.astro': '---\n---\n<slot />',
  [SHELL]: "import type { Row } from '@/lib/kql-tables';\nconst modes = { query: () => import('../query/QueryMode') };\nexport default modes;",
  [QUERY_MODE]: QUERY_MODE_SOURCE,
  'src/lib/kql-engine.ts': 'export function executeQuery() {}',
  [TABLES]: "import { loadAnatomyTables } from './anatomy/load-anatomy-tables';\nexport function getKqlTables() { return loadAnatomyTables(); }",
  'src/lib/anatomy/load-anatomy-tables.ts': "import crosswalk from '@shared/qif-anatomy-crosswalk.json';\nexport const loadAnatomyTables = () => crosswalk;",
  'src/lib/anatomy/build-anatomy-index.ts': 'export function buildAnatomyBundle() {}',
  'datalake/qif-anatomy-crosswalk.json': '{}',
  [REGIONS_FILE]: '{}',
  'datalake/scripts/technique-region-curation.json': '{}',
  'datalake/parquet/anatomy_technique_terms.parquet': '',
  [GENERATED_TABLES]: '{}',
  'src/site/atlas-assets/manifest.json': '{}',
  'src/site/atlas-assets/open/labels-fixture.json': '{}',
};

const inFrontmatter = (line) => ({ [PAGE]: `---\n${PAGE_IMPORTS}\n${line}\n---\n<WorkbenchShell client:load />` });
const inPageScript = (line) => ({ [PAGE]: `---\n${PAGE_IMPORTS}\n---\n<WorkbenchShell client:load />\n<script>${line}</script>` });
const inQueryMode = (line) => ({ [QUERY_MODE]: `${QUERY_MODE_SOURCE}\n${line}` });
const problemsWith = (extraFiles) => findImportProblems(PAGE, buildTree({ ...LAB_FILES, ...extraFiles }));

describe('readSourceImports', () => {
  it('reads imports however they are spaced, commented or quoted, and leaves type-only statements out', () => {
    const source = [
      "import a from './a';", "import{b}from'./b';", "/* note */ import { c } from './c';", "export { d } from '../d';", "export * from './e';", "import './side-effect';",
      "import type { T } from './types-only';", "export type { U } from './types-too';", "const lazy = () => import('./lazy');",
      "const noted = () => import(/* chunk: \"x\" */ './noted');", 'const ticked = () => import(`./ticked`);', "const old = require('./old');",
    ].join('\n');
    expect(readSourceImports('x.ts', source).specifiers).toEqual(['./a', './b', './c', '../d', './e', './side-effect', './lazy', './noted', './ticked', './old']);
  });

  it('reads literal globs, one pattern or a list, quoted either way', () => {
    const source = "const one = import.meta.glob<unknown>('/src/site/atlas-assets/manifest.json', { eager: true });\nconst many = import.meta.glob(['./a/*.json', `./b/**/*.ts`]);";
    expect(readSourceImports('x.ts', source).globs).toEqual(['/src/site/atlas-assets/manifest.json', './a/*.json', './b/**/*.ts']);
  });

  it('reads an .astro file as its frontmatter and its script blocks, and nothing from its markup', () => {
    const source = "---\nimport Layout from './Layout.astro';\n---\n<p>import x from './prose';</p>\n<script>import './inline';</script>\n<script is:inline>import('./late');</script>";
    expect(readSourceImports('page.astro', source).specifiers).toEqual(['./Layout.astro', './inline', './late']);
  });

  it('reports what it cannot follow instead of passing over it', () => {
    const source = "const name = 'kql';\nconst a = import(`./${name}.ts`);\nconst b = import.meta.glob(pattern);\nimport { createRequire } from 'node:module';";
    expect(readSourceImports('x.ts', source).unfollowable).toEqual([
      'import() whose argument is computed', 'a glob whose pattern is computed', 'a module loader (node:module), whose createRequire loads files by a computed path',
    ]);
  });
});

describe('resolveImport', () => {
  const files = [TABLES, 'datalake/qif-anatomy-crosswalk.json', 'src/components/query/index.tsx', 'src/lib/relay.mts', 'src/lib/relay-b.ts'];
  const exists = (filePath) => files.includes(filePath);
  const resolve = (specifier, fromFile = PAGE) => resolveImport(specifier, fromFile, exists);

  it('resolves aliases, relative and root-absolute paths, with or without an import query', () => {
    expect(resolve('@/lib/kql-tables')).toEqual({ kind: 'file', filePath: TABLES });
    expect(resolve('/src/lib/kql-tables.ts')).toEqual({ kind: 'file', filePath: TABLES });
    expect(resolve('@shared/../src/lib/kql-tables')).toEqual({ kind: 'file', filePath: TABLES });
    expect(resolve('@shared/qif-anatomy-crosswalk.json?raw')).toEqual({ kind: 'file', filePath: 'datalake/qif-anatomy-crosswalk.json' });
    expect(resolve('../query', SHELL)).toEqual({ kind: 'file', filePath: 'src/components/query/index.tsx' });
  });

  it('resolves a specifier that names the compiled file, and an .mts module', () => {
    expect(resolve('./relay-b.js', 'src/lib/relay-a.ts')).toEqual({ kind: 'file', filePath: 'src/lib/relay-b.ts' });
    expect(resolve('@/lib/relay.mts')).toEqual({ kind: 'file', filePath: 'src/lib/relay.mts' });
  });

  it('tells a package from a path that resolves to nothing', () => {
    expect(resolve('react')).toEqual({ kind: 'package' });
    expect(resolve('node:fs')).toEqual({ kind: 'package' });
    expect(resolve('./missing')).toEqual({ kind: 'unresolved', tried: 'src/pages/atlas/missing' });
  });
});

describe('findImportProblems on the leaks two independent verifications built', () => {
  it('passes the Lab page as it is wired: a type-only import of the query tables reaches nothing', () => {
    expect(problemsWith({})).toEqual([]);
  });

  /** Each case: its name in the verifier's notes, the change it made, and the module it must be reported as reaching. */
  const REACHING_CASES = [
    ['L1 the page imports the query tables', inFrontmatter("import { getKqlTables } from '@/lib/kql-tables';"), TABLES],
    ['L2 a relay re-exports the tables into Query mode', { 'src/components/query/site-tables.ts': "export { getKqlTables as readSiteTables } from '@/lib/kql-tables';", ...inQueryMode("import { readSiteTables } from './site-tables';") }, TABLES],
    ['L3 a component imports the curation record', inQueryMode("import record from '@shared/scripts/technique-region-curation.json';"), 'datalake/scripts/technique-region-curation.json'],
    ['L4 a component imports the asset manifest', inQueryMode("import manifest from '../../site/atlas-assets/manifest.json';"), 'src/site/atlas-assets/manifest.json'],
    ['E01 an import with no white space', inFrontmatter("import{getKqlTables}from'@/lib/kql-tables';"), TABLES],
    ['E02 a comment before the import on the same line', inFrontmatter("/* tables */ import { getKqlTables } from '@/lib/kql-tables';"), TABLES],
    ['E03a import() with a backtick literal', inFrontmatter('const { getKqlTables } = await import(`../../lib/kql-tables.ts`);'), TABLES],
    ['E06 the page imports the generated query-table file', inFrontmatter("import siteTables from '../../site/data/kql-tables.json';"), GENERATED_TABLES],
    ['E06 Query mode imports the generated query-table file', inQueryMode("import siteTables from '../../site/data/kql-tables.json';"), GENERATED_TABLES],
    ['E07 a root-absolute specifier', inFrontmatter("import { getKqlTables } from '/src/lib/kql-tables.ts';"), TABLES],
    ['E08b a .ts relay imported by its .js name', {
      'src/lib/anatomy/relay-a.ts': "export * from './relay-b.js';", 'src/lib/anatomy/relay-b.ts': "export { getKqlTables } from '../kql-tables';",
      ...inFrontmatter("import { getKqlTables } from '@/lib/anatomy/relay-a';"),
    }, TABLES],
    ['E09a a relay with an .mts extension', { 'src/lib/anatomy/relay-a.mts': "export { getKqlTables } from '../kql-tables';", ...inFrontmatter("import { getKqlTables } from '@/lib/anatomy/relay-a.mts';") }, TABLES],
    ['E11b import() with a comment before its argument', inQueryMode("export const loadLeak = () => import(/* webpackChunkName: \"tables\" */ '@/lib/kql-tables');"), TABLES],
    ['E11c import() with a backtick alias', inQueryMode('export const loadLeak = () => import(`@/lib/kql-tables`);'), TABLES],
    ['E12 a data file imported with ?raw', inFrontmatter("import regionsText from '@shared/qif-anatomy-technique-regions.json?raw';"), REGIONS_FILE],
    ['E13a a glob through an alias', inFrontmatter("const files = import.meta.glob('@shared/qif-anatomy-*.json', { eager: true });"), 'datalake/qif-anatomy-crosswalk.json'],
    ['E13b a glob in backticks', inFrontmatter('const files = import.meta.glob(`/datalake/qif-anatomy-*.json`, { eager: true });'), 'datalake/qif-anatomy-crosswalk.json'],
    ['E13c a relative glob over the label tables', inQueryMode("const tables = import.meta.glob('../../site/atlas-assets/*/labels-*.json');"), 'src/site/atlas-assets/open/labels-fixture.json'],
    ['E14 an inline script imports the generated file', inPageScript("import siteTables from '../../site/data/kql-tables.json'; window.leak = siteTables;"), GENERATED_TABLES],
    ['E15 an inline script imports the query tables', inPageScript("import { getKqlTables } from '@/lib/kql-tables'; window.leak = getKqlTables();"), TABLES],
    ['E17 a component imports a parquet file by URL', inQueryMode("import parquetUrl from '@shared/parquet/anatomy_technique_terms.parquet?url';"), 'datalake/parquet/anatomy_technique_terms.parquet'],
    ['E18 the page imports the index builder', inFrontmatter("import { buildAnatomyBundle } from '@/lib/anatomy/build-anatomy-index';"), 'src/lib/anatomy/build-anatomy-index.ts'],
  ];

  it.each(REACHING_CASES)('fails %s', (_name, extraFiles, reached) => {
    const problems = problemsWith(extraFiles);
    expect(problems.filter((problem) => problem.startsWith(`reaches ${reached} through ${PAGE}`))).toHaveLength(1);
  });

  /** Routes that cannot be followed to a file. Each is reported as what it is, so it fails all the same. */
  const UNFOLLOWABLE_CASES = [
    ['E03b import() with a computed argument', inFrontmatter("const part = ['kql', 'tables'].join('-');\nconst tables = await import(`../../lib/${part}.ts`);"), `${PAGE} has import() whose argument is computed`],
    ['E04 createRequire', inFrontmatter("import { createRequire } from 'node:module';\nconst regions = createRequire(`${process.cwd()}/`)('./datalake/qif-anatomy-technique-regions.json');"),
      `${PAGE} has a module loader (node:module), whose createRequire loads files by a computed path`],
    ['E05a a build-time read of an anatomy data file', inFrontmatter("import fs from 'node:fs';\nconst regions = JSON.parse(fs.readFileSync('datalake/qif-anatomy-technique-regions.json', 'utf-8'));"),
      `${PAGE} has a file-system module beside the data path "datalake/qif-anatomy-technique-regions.json"; a tool page may not read data files at build time`],
    ['E05b a build-time read of the generated query-table file', inFrontmatter("import fs from 'node:fs';\nconst tables = JSON.parse(fs.readFileSync('src/site/data/kql-tables.json', 'utf-8'));"),
      `${PAGE} has a file-system module beside the data path "src/site/data/kql-tables.json"; a tool page may not read data files at build time`],
    ['an import that resolves to no file', inQueryMode("import gone from './not-there';"), `${QUERY_MODE} has an import of "./not-there", which resolves to no file (tried src/components/query/not-there)`],
  ];

  it.each(UNFOLLOWABLE_CASES)('fails %s', (_name, extraFiles, problem) => {
    expect(problemsWith(extraFiles)).toEqual([problem]);
  });

  it('cannot see E16, a path fetched at run time: that is the Lab loader\'s own route, which filters the tables out (load-site-database.test.ts)', () => {
    expect(problemsWith(inQueryMode("export const loadLeak = () => fetch('/data/kql-tables.json').then((response) => response.json());"))).toEqual([]);
  });

  it('passes a file-system read of something that is not data, and a glob that matches no anatomy file', () => {
    expect(problemsWith(inFrontmatter("import fs from 'node:fs';\nconst notes = fs.readFileSync('src/content/notes.md', 'utf-8');"))).toEqual([]);
    expect(problemsWith(inQueryMode("const modes = import.meta.glob('./*.tsx');"))).toEqual([]);
  });
});

describe('the tool pages in this repository', () => {
  it('names only modules that exist as anatomy data modules, and counts every anatomy data and generated file', () => {
    expect(ANATOMY_DATA_MODULES.filter((filePath) => !repositoryTree.exists(filePath))).toEqual([]);
    const dataFiles = repositoryFiles.filter((filePath) => /qif-anatomy-|atlas-assets\/.*\.json$|^datalake\/parquet\/|^src\/site\/data\//.test(filePath));
    expect(dataFiles.filter((filePath) => filePath.startsWith('datalake/parquet/')).length).toBeGreaterThan(0);
    expect(dataFiles.filter((filePath) => !isAnatomyDataModule(filePath))).toEqual([]);
  });

  it('reaches the query tables from a page that is allowed to, so the walk is known to follow real imports', () => {
    const problems = findImportProblems('src/pages/data-studio/index.astro', repositoryTree);
    expect(problems).toContain(`reaches ${TABLES} through src/pages/data-studio/index.astro -> ${TABLES}`);
  });

  it.each(TOOL_PAGES.map((page) => page.urlPath))('%s reaches no anatomy data, table or generated file, and holds no import that cannot be followed', (urlPath) => {
    const pageSource = findPageSource(urlPath, repositoryTree.exists);
    expect(pageSource).not.toBeNull();
    expect(readSourceImports(pageSource, repositoryTree.read(pageSource)).specifiers.length).toBeGreaterThan(0);
    expect(findImportProblems(pageSource, repositoryTree)).toEqual([]);
  });
});
