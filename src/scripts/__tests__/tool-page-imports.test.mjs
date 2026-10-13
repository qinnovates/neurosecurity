import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { TOOL_PAGES } from '../tool-pages.mjs';
import {
  ANATOMY_DATA_MODULES, findForbiddenImportChain, findPageSource, isAnatomyDataModule, listImports, resolveImport,
} from '../tool-page-imports.mjs';

const SOURCE_ROOTS = ['src', 'datalake'];
const SKIPPED_DIRECTORIES = ['node_modules', 'parquet', 'eeg'];
const PAGE = 'src/pages/atlas/model.astro';
const SHELL = 'src/components/threat-model/WorkbenchShell.tsx';
const QUERY_MODE = 'src/components/query/QueryMode.tsx';

function listRepositoryFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) return SKIPPED_DIRECTORIES.includes(entry.name) ? [] : listRepositoryFiles(entryPath);
    return [entryPath];
  });
}

const repositoryFiles = SOURCE_ROOTS.flatMap(listRepositoryFiles);
const repositoryTree = { exists: (filePath) => existsSync(filePath), read: (filePath) => readFileSync(filePath, 'utf-8'), listFiles: () => repositoryFiles };

/** A source tree held in memory: path -> file text. */
function buildTree(files) {
  return { exists: (filePath) => Object.hasOwn(files, filePath), read: (filePath) => files[filePath], listFiles: () => Object.keys(files) };
}

/** The Lab page as it is wired today, reduced to its imports, plus whatever a case adds. */
function buildLabTree(extraFiles) {
  return buildTree({
    [PAGE]: "---\nimport ToolLayout from '@/layouts/ToolLayout.astro';\nimport WorkbenchShell from '@/components/threat-model/WorkbenchShell';\n---\n<WorkbenchShell client:load />",
    'src/layouts/ToolLayout.astro': '---\n---\n<slot />',
    [SHELL]: "import type { Row } from '@/lib/kql-tables';\nconst modes = { query: () => import('../query/QueryMode') };\nexport default modes;",
    [QUERY_MODE]: "import { executeQuery } from '@/lib/kql-engine';\nexport default executeQuery;",
    'src/lib/kql-engine.ts': 'export function executeQuery() {}',
    'src/lib/kql-tables.ts': "import { loadAnatomyTables } from './anatomy/load-anatomy-tables';\nexport function getKqlTables() { return loadAnatomyTables(); }",
    'src/lib/anatomy/load-anatomy-tables.ts': "import crosswalk from '@shared/qif-anatomy-crosswalk.json';\nexport const loadAnatomyTables = () => crosswalk;",
    'datalake/qif-anatomy-crosswalk.json': '{}',
    'datalake/scripts/technique-region-curation.json': '{}',
    'src/site/atlas-assets/manifest.json': '{}',
    'src/site/atlas-assets/open/labels-fixture.json': '{}',
    ...extraFiles,
  });
}

describe('listImports and resolveImport', () => {
  it('reads static imports, re-exports, side-effect imports and import(), and leaves type-only statements out', () => {
    const source = [
      "import a from './a';", "import {\n  b,\n  c,\n} from '@/lib/b';", "export { d } from '../d';", "export * from './e';", "import './side-effect';",
      "import type { T } from './types-only';", "export type { U } from './types-too';", "const lazy = () => import('./lazy');",
    ].join('\n');
    expect(listImports(source).specifiers).toEqual(['./a', '@/lib/b', '../d', './e', './side-effect', './lazy']);
  });

  it('reads literal globs, one pattern or a list', () => {
    const source = "const one = import.meta.glob<unknown>('/src/site/atlas-assets/manifest.json', { eager: true });\nconst many = import.meta.glob(['./a/*.json', './b/**/*.ts']);";
    expect(listImports(source).globs).toEqual(['/src/site/atlas-assets/manifest.json', './a/*.json', './b/**/*.ts']);
  });

  it('resolves the two source aliases and relative paths, and no package', () => {
    const exists = (filePath) => ['src/lib/kql-tables.ts', 'datalake/qif-anatomy-crosswalk.json', 'src/components/query/index.tsx'].includes(filePath);
    expect(resolveImport('@/lib/kql-tables', PAGE, exists)).toBe('src/lib/kql-tables.ts');
    expect(resolveImport('@shared/qif-anatomy-crosswalk.json', PAGE, exists)).toBe('datalake/qif-anatomy-crosswalk.json');
    expect(resolveImport('../query', SHELL, exists)).toBe('src/components/query/index.tsx');
    expect(resolveImport('react', PAGE, exists)).toBeNull();
  });
});

describe('findForbiddenImportChain on the cases an independent verifier built', () => {
  it('passes the Lab page as it is wired: a type-only import of the query tables reaches nothing', () => {
    expect(findForbiddenImportChain(PAGE, buildLabTree({}))).toBeNull();
  });

  it('fails a Lab page that imports the query tables in its frontmatter', () => {
    const page = "---\nimport { getKqlTables } from '@/lib/kql-tables';\nconst terms = getKqlTables().anatomy_technique_terms;\n---\n<div data-terms={JSON.stringify(terms)} />";
    expect(findForbiddenImportChain(PAGE, buildLabTree({ [PAGE]: page }))).toEqual([PAGE, 'src/lib/kql-tables.ts']);
  });

  it('fails a relay module that re-exports the tables into a lazily loaded Lab mode', () => {
    const relay = 'src/components/query/site-tables.ts';
    const chain = findForbiddenImportChain(PAGE, buildLabTree({
      [relay]: "export { getKqlTables as readSiteTables } from '@/lib/kql-tables';",
      [QUERY_MODE]: "import { readSiteTables } from './site-tables';\nexport default readSiteTables;",
    }));
    expect(chain).toEqual([PAGE, SHELL, QUERY_MODE, relay, 'src/lib/kql-tables.ts']);
  });

  it('fails a Lab component that imports the curation record or the asset manifest', () => {
    const importing = (specifier) => buildLabTree({ [QUERY_MODE]: `import record from '${specifier}';\nexport default record;` });
    expect(findForbiddenImportChain(PAGE, importing('@shared/scripts/technique-region-curation.json'))?.at(-1)).toBe('datalake/scripts/technique-region-curation.json');
    expect(findForbiddenImportChain(PAGE, importing('../../site/atlas-assets/manifest.json'))?.at(-1)).toBe('src/site/atlas-assets/manifest.json');
  });

  it.each(['/src/site/atlas-assets/*/labels-*.json', '../../site/atlas-assets/*/labels-*.json', '../../site/**/*.json'])('fails a Lab component that globs the label tables with %s', (glob) => {
    const globbing = buildLabTree({ [QUERY_MODE]: `const tables = import.meta.glob('${glob}', { eager: true });\nexport default tables;` });
    expect(findForbiddenImportChain(PAGE, globbing)?.at(-2)).toBe(QUERY_MODE);
    expect(isAnatomyDataModule(findForbiddenImportChain(PAGE, globbing)?.at(-1))).toBe(true);
  });

  it('passes a Lab component whose glob matches no anatomy file', () => {
    const globbing = buildLabTree({ [QUERY_MODE]: "const modes = import.meta.glob('./*.tsx');\nexport default modes;" });
    expect(findForbiddenImportChain(PAGE, globbing)).toBeNull();
  });
});

describe('the tool pages in this repository', () => {
  it('names only modules that exist as anatomy data modules, and counts every anatomy data file', () => {
    expect(ANATOMY_DATA_MODULES.filter((filePath) => !existsSync(filePath))).toEqual([]);
    const dataFiles = repositoryFiles.filter((filePath) => /qif-anatomy-|atlas-assets\/.*\.json$/.test(filePath));
    expect(dataFiles.length).toBeGreaterThan(0);
    expect(dataFiles.filter((filePath) => !isAnatomyDataModule(filePath))).toEqual([]);
  });

  it('reaches the query tables from a page that is allowed to, so the walk is known to follow real imports', () => {
    expect(findForbiddenImportChain('src/pages/data-studio/index.astro', repositoryTree)).toEqual(['src/pages/data-studio/index.astro', 'src/lib/kql-tables.ts']);
  });

  it.each(TOOL_PAGES.map((page) => page.urlPath))('%s reaches no module that holds anatomy data or the anatomy tables', (urlPath) => {
    const pageSource = findPageSource(urlPath, repositoryTree.exists);
    expect(pageSource).not.toBeNull();
    expect(listImports(repositoryTree.read(pageSource)).specifiers.length).toBeGreaterThan(0);
    expect(findForbiddenImportChain(pageSource, repositoryTree)).toBeNull();
  });
});
