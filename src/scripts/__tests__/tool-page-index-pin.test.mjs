import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { readModuleStatements } from '../source-imports.mjs';
import { INDEX_PIN_IMPORTERS, INDEX_PIN_MODULES, INDEX_PIN_STATEMENTS, findImportProblems, findIndexPinProblems } from '../tool-page-imports.mjs';

/**
 * The one edge the Lab's import walk does not follow, and what holds it shut. Every leak below is a source held in
 * memory, so the tracked files are never edited to try one.
 */
const PAGE = 'src/pages/atlas/model.astro';
const SHELL = 'src/components/threat-model/WorkbenchShell.tsx';
const GENERATED_TABLES = 'src/site/data/kql-tables.json';
const PAGE_IMPORTS = "import ToolLayout from '@/layouts/ToolLayout.astro';\nimport WorkbenchShell from '@/components/threat-model/WorkbenchShell';";
/** The Lab page reduced to its imports: a layout and a shell that import nothing. */
const LAB_FILES = { 'src/layouts/ToolLayout.astro': '---\n---\n<slot />', [SHELL]: 'export default function WorkbenchShell() { return null; }' };
const repositoryTree = { exists: (filePath) => existsSync(filePath), read: (filePath) => readFileSync(filePath, 'utf-8') };

/** A source tree held in memory: path -> file text. */
function buildTree(files) {
  return { exists: (filePath) => Object.hasOwn(files, filePath), read: (filePath) => files[filePath], listFiles: () => Object.keys(files) };
}
const inFrontmatter = (line) => ({ [PAGE]: `---\n${PAGE_IMPORTS}\n${line}\n---\n<WorkbenchShell client:load />` });
const problemsWith = (extraFiles, page = { scriptsMayCarryAnatomy: false }) => findImportProblems(PAGE, buildTree({ ...LAB_FILES, ...extraFiles }), page);

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
    expect(problemsWith({ ...pinFiles, ...inFrontmatter(WITH_PIN), [SHELL]: shell, [CLIENT_PANEL]: panel })).toEqual([`reaches ${LOADER} through ${PAGE} -> ${SHELL} -> ${CLIENT_PANEL} -> ${PIN_MODULE} -> ${LOADER}`]);
    // The page itself is not the pin element either.
    expect(problemsWith({ ...pinFiles, ...inFrontmatter("import { INDEX_PIN } from '@/components/atlas-scene/build-index-pin';") })).toEqual([`reaches ${LOADER} through ${PAGE} -> ${PIN_MODULE} -> ${LOADER}`]);
  });

  it('follows the pin module on an anatomy page, where only the generated tables are forbidden', () => {
    const leaking = `${BARE_PIN}export { default as tables } from '@/site/data/kql-tables.json';\n`;
    expect(problemsWith({ ...pinFiles, [PIN_MODULE]: leaking, [GENERATED_TABLES]: '{}', ...inFrontmatter(WITH_PIN) }, { scriptsMayCarryAnatomy: true })).toEqual([`reaches ${GENERATED_TABLES} through ${PAGE} -> ${PIN_ELEMENT} -> ${PIN_MODULE} -> ${GENERATED_TABLES}`]);
  });
});
