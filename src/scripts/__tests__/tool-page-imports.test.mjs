import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { readModuleStatements, readSourceImports } from '../source-imports.mjs';
import { TOOL_PAGES } from '../tool-pages.mjs';
import {
  ANATOMY_DATA_MODULES, BUILD_TIME_FILE_ACCESS_ALLOWED, INDEX_PIN_IMPORTERS, INDEX_PIN_MODULES, INDEX_PIN_STATEMENTS, findImportProblems, findIndexPinProblems, findPageSource, isAnatomyDataModule, isGeneratedTableFile, resolveImport,
} from '../tool-page-imports.mjs';

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
const problemsWith = (extraFiles, page = { scriptsMayCarryAnatomy: false }) => findImportProblems(PAGE, buildTree({ ...LAB_FILES, ...extraFiles }), page);

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
    const source = "---\nimport Layout from './Layout.astro';\n---\n<p>import x from './prose';</p>\n<script>import './inline';</script>\n<script is:inline>import('./late');</script>\n<script src='./named.ts'></script>";
    expect(readSourceImports('page.astro', source).specifiers).toEqual(['./named.ts', './Layout.astro', './inline', './late']);
  });

  it('reports what it cannot follow instead of passing over it', () => {
    const source = "const name = 'kql';\nconst a = import(`./${name}.ts`);\nconst b = import.meta.glob(pattern);\nimport { createRequire } from 'node:module';";
    expect(readSourceImports('x.ts', source).unfollowable).toEqual([
      'import() whose argument is computed', 'a glob whose pattern is computed', 'a module loader (node:module), whose createRequire loads files by a computed path',
    ]);
    expect(readSourceImports('x.ts', "import fs from 'node:fs';\nimport { exec } from 'child_process';\nimport path from 'node:path';").fileAccessModules).toEqual(['node:fs', 'child_process']);
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
    expect(resolve('src/lib/kql-tables')).toEqual({ kind: 'file', filePath: TABLES });
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
    ['a script tag that names a file which imports the query tables', {
      'src/scripts/lab-start.ts': "import { getKqlTables } from '@/lib/kql-tables';\nwindow.leak = getKqlTables();",
      [PAGE]: `---\n${PAGE_IMPORTS}\n---\n<WorkbenchShell client:load />\n<script src="../../scripts/lab-start.ts"></script>`,
    }, TABLES],
    ['E15 an inline script imports the query tables', inPageScript("import { getKqlTables } from '@/lib/kql-tables'; window.leak = getKqlTables();"), TABLES],
    ['E17 a component imports a parquet file by URL', inQueryMode("import parquetUrl from '@shared/parquet/anatomy_technique_terms.parquet?url';"), 'datalake/parquet/anatomy_technique_terms.parquet'],
    ['F01 a bare specifier that the project baseUrl resolves', inFrontmatter("import { getKqlTables } from 'src/lib/kql-tables';"), TABLES],
    ['F02 a bare specifier for the generated file', inQueryMode("import siteTables from 'src/site/data/kql-tables.json';"), GENERATED_TABLES],
    ['F07 a file named by new URL beside the source', inQueryMode("const tablesUrl = new URL('../../site/data/kql-tables.json', import.meta.url);"), GENERATED_TABLES],
    ['F08 a worker that imports the query tables', {
      'src/components/query/tables.worker.ts': "import { getKqlTables } from '@/lib/kql-tables';\npostMessage(getKqlTables());",
      ...inQueryMode("const worker = new Worker(new URL('./tables.worker.ts', import.meta.url), { type: 'module' });"),
    }, TABLES],
    ['a data file whose name holds digits', { 'datalake/qif-anatomy-h01-card.json': '{}', ...inQueryMode("import card from '@shared/qif-anatomy-h01-card.json';") }, 'datalake/qif-anatomy-h01-card.json'],
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
    ['E05 a page that reads files at build time', inFrontmatter("import fs from 'node:fs';\nconst regions = JSON.parse(fs.readFileSync('datalake/qif-anatomy-technique-regions.json', 'utf-8'));"),
      `${PAGE} imports node:fs; a file in a tool page's imports may not read files or run commands at build time unless it is listed in BUILD_TIME_FILE_ACCESS_ALLOWED with the reason`],
    ['a helper module that reads files, named as the file at fault', {
      'src/lib/read-json.ts': "import { readFileSync } from 'fs';\nexport const readJson = (filePath) => JSON.parse(readFileSync(filePath, 'utf-8'));",
      ...inFrontmatter("import { readJson } from '@/lib/read-json';\nconst regions = readJson('datalake/qif-anatomy-technique-regions.json');"),
    }, "src/lib/read-json.ts imports fs; a file in a tool page's imports may not read files or run commands at build time unless it is listed in BUILD_TIME_FILE_ACCESS_ALLOWED with the reason"],
    ['F05 a page that runs a command at build time', inFrontmatter("import { execFileSync } from 'node:child_process';\nconst tables = execFileSync('cat', ['src/site/data/kql-tables.json']);"),
      `${PAGE} imports node:child_process; a file in a tool page's imports may not read files or run commands at build time unless it is listed in BUILD_TIME_FILE_ACCESS_ALLOWED with the reason`],
    ['an import that resolves to no file', inQueryMode("import gone from './not-there';"), `${QUERY_MODE} has an import of "./not-there", which resolves to no file (tried src/components/query/not-there)`],
  ];

  it.each(UNFOLLOWABLE_CASES)('fails %s', (_name, extraFiles, problem) => {
    expect(problemsWith(extraFiles)).toEqual([problem]);
  });

  it('cannot see E16, a path fetched at run time: that is the Lab loader\'s own route, which filters the tables out (load-site-database.test.ts)', () => {
    expect(problemsWith(inQueryMode("export const loadLeak = () => fetch('/data/kql-tables.json').then((response) => response.json());"))).toEqual([]);
  });

  it('passes code that only names a data file, as an error message does, and a glob that matches no anatomy file', () => {
    expect(problemsWith(inQueryMode("export const SOURCES_FILE = 'datalake/qif-anatomy-sources.json';\nexport const hint = `Restore ${SOURCES_FILE}.`;"))).toEqual([]);
    expect(problemsWith(inQueryMode("const modes = import.meta.glob('./*.tsx');"))).toEqual([]);
    expect(problemsWith(inQueryMode("const base = new URL(location.href);\nconst icon = new URL('./icon.svg', import.meta.url);"), { scriptsMayCarryAnatomy: false }))
      .toEqual([`${QUERY_MODE} has an import of "./icon.svg", which resolves to no file (tried src/components/query/icon.svg)`]);
  });
});

describe('findImportProblems on a page whose scripts may carry anatomy code', () => {
  const anatomyPage = { scriptsMayCarryAnatomy: true };

  it('lets it reach the anatomy loaders, builders and data files', () => {
    const reaching = inFrontmatter("import { getKqlTables } from '@/lib/kql-tables';\nimport { buildAnatomyBundle } from '@/lib/anatomy/build-anatomy-index';\nimport manifest from '../../site/atlas-assets/manifest.json';");
    expect(problemsWith(reaching)).toHaveLength(3);
    expect(problemsWith(reaching, anatomyPage)).toEqual([]);
  });

  it('still forbids the generated table file and the parquet files', () => {
    expect(problemsWith(inQueryMode("import siteTables from '../../site/data/kql-tables.json';"), anatomyPage))
      .toEqual([`reaches ${GENERATED_TABLES} through ${PAGE} -> ${SHELL} -> ${QUERY_MODE} -> ${GENERATED_TABLES}`]);
    expect(problemsWith(inQueryMode("import parquetUrl from '@shared/parquet/anatomy_technique_terms.parquet?url';"), anatomyPage)).toHaveLength(1);
  });

  it('still reports what cannot be followed and a build-time file read', () => {
    expect(problemsWith(inFrontmatter("import fs from 'node:fs';\nconst lazy = await import(`./${name}.ts`);"), anatomyPage)).toHaveLength(2);
  });
});

describe('findImportProblems and the index pin', () => {
  const LOADER = 'src/components/atlas-scene/load-anatomy-data.ts';
  const PIN_MODULE = 'src/components/atlas-scene/build-index-pin.ts';
  const PIN_ELEMENT = 'src/components/atlas-scene/AtlasIndexPin.astro';
  const CLIENT_PANEL = 'src/components/threat-model/TargetRegionsPanel.tsx';
  const BARE_PIN = "import type { PinnedFile } from '@/lib/anatomy/anatomy-index-types';\nimport { loadAnatomyBundle } from './load-anatomy-data';\n\n/** Build time only. */\nexport const INDEX_PIN: PinnedFile = loadAnatomyBundle().indexPin;\n";
  const pinFiles = {
    [LOADER]: "import crosswalk from '@shared/qif-anatomy-crosswalk.json';\nexport const loadAnatomyBundle = () => crosswalk;",
    'datalake/qif-anatomy-crosswalk.json': '{}',
    'src/lib/anatomy/anatomy-index-types.ts': 'export interface PinnedFile { path: string }',
    [PIN_MODULE]: BARE_PIN,
    [PIN_ELEMENT]: "---\nimport { INDEX_PIN } from './build-index-pin';\n---\n<div hidden></div>",
  };
  const WITH_PIN = "import AtlasIndexPin from '@/components/atlas-scene/AtlasIndexPin.astro';";
  const withPinModule = (sourceText) => problemsWith({ ...pinFiles, [PIN_MODULE]: sourceText, ...inFrontmatter(WITH_PIN) });

  it('names one module and one importer, which exist, and the module in the repository is the bare pin', () => {
    expect(INDEX_PIN_MODULES).toEqual([PIN_MODULE]);
    expect(INDEX_PIN_IMPORTERS).toEqual([PIN_ELEMENT]);
    expect(repositoryTree.exists(PIN_MODULE) && repositoryTree.exists(PIN_ELEMENT)).toBe(true);
    expect(readModuleStatements(PIN_MODULE, repositoryTree.read(PIN_MODULE))).toEqual(INDEX_PIN_STATEMENTS);
    expect(findIndexPinProblems(PIN_MODULE, repositoryTree.read(PIN_MODULE))).toEqual([]);
  });

  it('lets the Lab page carry the pin: the walk stops at the pin module and does not follow it to the loader', () => {
    expect(withPinModule(BARE_PIN)).toEqual([]);
    // The same statements laid out another way are the same module.
    expect(withPinModule("import type {\n  PinnedFile,\n} from \"@/lib/anatomy/anatomy-index-types\";\nimport { loadAnatomyBundle } from\n  './load-anatomy-data';\nexport const INDEX_PIN: PinnedFile =\n  loadAnatomyBundle()\n    .indexPin;")).toEqual([]);
  });

  it('still refuses the loader reached any other way, the pin module beside it or not', () => {
    const direct = inFrontmatter(`${WITH_PIN}\nimport { loadAnatomyBundle } from '@/components/atlas-scene/load-anatomy-data';`);
    expect(problemsWith({ ...pinFiles, ...direct })).toEqual([`reaches ${LOADER} through ${PAGE} -> ${LOADER}`]);
    const relayed = { ...pinFiles, [PIN_ELEMENT]: "---\nimport { loadAnatomyBundle } from './load-anatomy-data';\n---\n<div hidden></div>" };
    expect(problemsWith({ ...relayed, ...inFrontmatter(WITH_PIN) })).toEqual([`reaches ${LOADER} through ${PAGE} -> ${PIN_ELEMENT} -> ${LOADER}`]);
  });

  it('refuses a pin module that re-exports the anatomy', () => {
    const problems = withPinModule(`${BARE_PIN}export { loadAnatomyBundle } from './load-anatomy-data';\n`);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(`${PIN_MODULE} must stay a bare pin`);
    expect(problems[0]).toContain("it also holds \"ExportDeclaration: export { loadAnatomyBundle } from './load-anatomy-data';\"");
  });

  it('refuses an export written across lines and an added node:fs import, which a line pattern does not see', () => {
    const split = `import fs from 'node:fs';\n${BARE_PIN}export\n  const\n  EVERYTHING\n  = fs.readFileSync('datalake/qif-anatomy-crosswalk.json', 'utf-8');\n`;
    expect(split.match(/^export .*$/gm)).toEqual(['export const INDEX_PIN: PinnedFile = loadAnatomyBundle().indexPin;']);
    const problems = withPinModule(split);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('must stay a bare pin');
    expect(problems[0]).toContain("it also holds \"import fs from 'node:fs'\"");
    expect(problems[0]).toContain("it also holds \"export const EVERYTHING = fs.readFileSync('datalake/qif-anatomy-crosswalk.json','utf-8')\"");
  });

  it('refuses a pin module that exports the whole bundle, under a new name or under the pin\'s own', () => {
    const added = withPinModule(`${BARE_PIN}export const WHOLE = loadAnatomyBundle();\n`);
    expect(added).toHaveLength(1);
    expect(added[0]).toContain('it also holds "export const WHOLE = loadAnatomyBundle()"');
    const replaced = withPinModule(BARE_PIN.replace('loadAnatomyBundle().indexPin', 'loadAnatomyBundle()'));
    expect(replaced).toHaveLength(1);
    expect(replaced[0]).toContain('it also holds "export const INDEX_PIN = loadAnatomyBundle()"; it lacks "export const INDEX_PIN = loadAnatomyBundle().indexPin"');
  });

  it('refuses a pin module with a statement that is neither import nor export, or with one of its own repeated', () => {
    expect(withPinModule(`${BARE_PIN}globalThis.anatomy = loadAnatomyBundle();\n`)[0]).toContain('it also holds "ExpressionStatement: globalThis.anatomy = loadAnatomyBundle();"');
    expect(withPinModule(`${BARE_PIN}import { loadAnatomyBundle } from './load-anatomy-data';\n`)[0]).toContain('its statements are repeated or out of order');
  });

  it('walks into the pin module from any other importer: a client component that imports it reaches the loader', () => {
    const shell = "import TargetRegionsPanel from './TargetRegionsPanel';\nexport default TargetRegionsPanel;";
    const panel = "import { INDEX_PIN } from '@/components/atlas-scene/build-index-pin';\nexport default function TargetRegionsPanel() { return INDEX_PIN.sha256; }";
    const files = { ...pinFiles, [PAGE]: `---\n${PAGE_IMPORTS}\n${WITH_PIN}\n---\n<WorkbenchShell client:load />`, 'src/layouts/ToolLayout.astro': '---\n---\n<slot />', [SHELL]: shell, [CLIENT_PANEL]: panel };
    expect(findImportProblems(PAGE, buildTree(files))).toEqual([`reaches ${LOADER} through ${PAGE} -> ${SHELL} -> ${CLIENT_PANEL} -> ${PIN_MODULE} -> ${LOADER}`]);
    // The page itself is not the pin element either.
    expect(problemsWith({ ...pinFiles, ...inFrontmatter("import { INDEX_PIN } from '@/components/atlas-scene/build-index-pin';") })).toEqual([`reaches ${LOADER} through ${PAGE} -> ${PIN_MODULE} -> ${LOADER}`]);
  });

  it('follows the pin module on an anatomy page, where only the generated tables are forbidden', () => {
    const leaking = `${BARE_PIN}export { default as tables } from '@/site/data/kql-tables.json';\n`;
    expect(problemsWith({ ...pinFiles, [PIN_MODULE]: leaking, [GENERATED_TABLES]: '{}', ...inFrontmatter(WITH_PIN) }, { scriptsMayCarryAnatomy: true })).toEqual([`reaches ${GENERATED_TABLES} through ${PAGE} -> ${PIN_ELEMENT} -> ${PIN_MODULE} -> ${GENERATED_TABLES}`]);
  });
});

describe('the tool pages in this repository', () => {
  it('names only modules that exist as anatomy data modules, and counts every anatomy data and generated file', () => {
    expect(ANATOMY_DATA_MODULES.filter((filePath) => !repositoryTree.exists(filePath))).toEqual([]);
    expect(BUILD_TIME_FILE_ACCESS_ALLOWED.filter((filePath) => !repositoryTree.exists(filePath))).toEqual([]);
    const dataFiles = repositoryFiles.filter((filePath) => /^datalake\/qif-anatomy-|atlas-assets\/.*\.json$/.test(filePath));
    const generatedFiles = repositoryFiles.filter((filePath) => /^datalake\/parquet\/|^src\/site\/data\//.test(filePath));
    expect(dataFiles.length).toBeGreaterThan(0);
    expect(generatedFiles.filter((filePath) => filePath.startsWith('datalake/parquet/')).length).toBeGreaterThan(0);
    expect([...dataFiles, ...generatedFiles].filter((filePath) => !isAnatomyDataModule(filePath))).toEqual([]);
    expect(generatedFiles.filter((filePath) => !isGeneratedTableFile(filePath))).toEqual([]);
    expect(dataFiles.filter(isGeneratedTableFile)).toEqual([]);
  });

  it('reaches the query tables from a page that is allowed to, so the walk is known to follow real imports', () => {
    const problems = findImportProblems('src/pages/data-studio/index.astro', repositoryTree);
    expect(problems).toContain(`reaches ${TABLES} through src/pages/data-studio/index.astro -> ${TABLES}`);
    expect(findImportProblems('src/pages/data-studio/index.astro', repositoryTree, { scriptsMayCarryAnatomy: true }).filter((problem) => problem.startsWith('reaches'))).toEqual([]);
  });

  it.each(TOOL_PAGES)('$urlPath meets the rule its own setting gives it, and holds no import that cannot be followed', (page) => {
    const pageSource = findPageSource(page.urlPath, repositoryTree.exists);
    expect(pageSource).not.toBeNull();
    expect(typeof page.scriptsMayCarryAnatomy).toBe('boolean');
    expect(readSourceImports(pageSource, repositoryTree.read(pageSource)).specifiers.length).toBeGreaterThan(0);
    expect(findImportProblems(pageSource, repositoryTree, page)).toEqual([]);
  });
});
