import { describe, expect, it } from 'vitest';
import { AtlasMapError, parseAtlasMap } from '../atlas-map/parse-atlas-map.mjs';
import { commandProblems, createRepositoryReader, findRepositoryProblems, readJobBlock } from '../atlas-map/check-atlas-map.mjs';
import { REPOSITORY_ROOT, loadAtlasMap } from '../atlas-map/load-atlas-map.mjs';
import { findStalePages } from '../atlas-map/render-atlas-docs.mjs';

/** The smallest map the parser accepts; each test changes one thing in a copy. */
function buildMap() {
  return {
    schema_version: 1,
    summary: 'A test map.',
    modules: [
      { id: 'lib', path: 'src/lib/', responsibility: 'Library', entry_files: ['src/lib/a.ts'], depends_on: [], map_file: 'src/lib/CONTEXT.md' },
      { id: 'ui', path: 'src/ui/', responsibility: 'Interface', entry_files: ['src/ui/b.tsx'], depends_on: ['lib'], map_file: 'src/CONTEXT.md' },
    ],
    data: [{ id: 'rows', path: 'data/rows.json', holds: 'Rows', validated_by: 'src/lib/a.ts', generator: 'npm run make-rows', consumers: ['lib'] }],
    checks: [{ id: 'unit', script: 'test', guards: 'Everything', ci: { workflow: '.github/workflows/ci.yml', job: 'audit', runs: 'npm test' } }],
    changes: [{ id: 'change-rows', summary: 'Change rows', keywords: ['Rows'], recipe: { map: 'src/lib/CONTEXT.md', number: 1 }, edit: ['data/rows.json'], note: 'None', commands: ['npm run make-rows'], checks: ['unit'] }],
    followups: [{ id: 'ATLAS-F01', what: 'Do a thing.', ref: '#1', owner: 'kevin', status: 'open', from: 'epic' }],
    provenance: [{ id: 'prov-a', path: 'docs/a.md', justifies: 'Rows' }],
  };
}

const WORKFLOW = 'name: ci\non: [pull_request]\njobs:\n  audit:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test\n  other:\n    steps:\n      - run: npm run build\n';
const FILES = {
  'src/lib/': '', 'src/lib/a.ts': '', 'src/lib/CONTEXT.md': '# lib\n\n### 1. Change rows\n', 'src/ui/': '', 'src/ui/b.tsx': '', 'src/CONTEXT.md': '',
  'data/': '', 'data/rows.json': '', 'docs/a.md': '', '.github/workflows/ci.yml': WORKFLOW,
};

/** A repository made of the FILES table, with `make-rows` and `test` scripts. */
function fakeRepository(files = FILES) {
  return {
    exists: (candidate) => Object.hasOwn(files, candidate) || Object.hasOwn(files, `${candidate}/`),
    listDirectory: (directory) => Object.keys(files).filter((file) => file.startsWith(`${directory}/`)).map((file) => file.slice(directory.length + 1)),
    readText: (file) => files[file],
    scripts: { test: 'vitest run', 'make-rows': 'node x.mjs' },
  };
}

function expectRejected(map, message) {
  expect(() => parseAtlasMap(map)).toThrow(AtlasMapError);
  expect(() => parseAtlasMap(map)).toThrow(message);
}

describe('the committed atlas map', () => {
  const map = loadAtlasMap();

  it('parses and agrees with the repository: paths, npm scripts, CI jobs, recipes and module maps', () => {
    expect(findRepositoryProblems(map, createRepositoryReader(REPOSITORY_ROOT))).toEqual([]);
  });

  it('generates docs/atlas/INDEX.md and docs/atlas/FOLLOW-UPS.md exactly as committed (run npm run atlas:docs)', () => {
    expect(findStalePages(map)).toEqual([]);
  });

  it('lists a check for every change and exempts only records that name their pending PR', () => {
    for (const change of map.changes) expect(change.checks.length, change.id).toBeGreaterThan(0);
    const pending = [...map.data, ...map.checks, ...map.changes].filter((record) => record.pending_pr !== undefined);
    for (const record of pending) expect([181, 182, 183], record.id).toContain(record.pending_pr);
  });
});

describe('parseAtlasMap', () => {
  it('accepts the smallest valid map and lower-cases keywords', () => {
    expect(parseAtlasMap(buildMap()).changes[0].keywords).toEqual(['rows']);
  });

  it('rejects an id used twice, across sections too', () => {
    const map = buildMap();
    map.followups.push({ ...map.followups[0] });
    expectRejected(map, 'id "ATLAS-F01" is already used at followups[0]');
    const crossSection = buildMap();
    crossSection.provenance[0].id = 'lib';
    expectRejected(crossSection, 'id "lib" is already used at modules[0]');
  });

  it('rejects a dependency on an unknown module and a cycle', () => {
    const unknown = buildMap();
    unknown.modules[1].depends_on = ['nowhere'];
    expectRejected(unknown, 'modules[1].depends_on[0]: no modules has id "nowhere"');
    const cycle = buildMap();
    cycle.modules[0].depends_on = ['ui'];
    expectRejected(cycle, 'dependency cycle lib -> ui -> lib');
  });

  it('rejects a change with no check or with an unknown check', () => {
    const none = buildMap();
    none.changes[0].checks = [];
    expectRejected(none, 'changes[0].checks: expected at least 1 entries');
    const unknown = buildMap();
    unknown.changes[0].checks = ['nope'];
    expectRejected(unknown, 'no checks has id "nope"');
  });

  it('rejects an unknown owner, a malformed follow-up id, an unexpected key and a home path', () => {
    const owner = buildMap();
    owner.followups[0].owner = 'someone';
    expectRejected(owner, 'followups[0].owner: expected one of kevin, data, engineering, domain-review');
    const id = buildMap();
    id.followups[0].id = 'ATLAS-1';
    expectRejected(id, 'followups[0].id');
    const extra = buildMap();
    extra.checks[0].owner = 'x';
    expectRejected(extra, 'checks[0]: unexpected key "owner"');
    const home = buildMap();
    home.data[0].holds = 'Copied from /Users/someone/file';
    expectRejected(home, 'data[0].holds: text names a home directory');
  });

  it('rejects a pending_pr that is not a pull request number', () => {
    const map = buildMap();
    map.changes[0].pending_pr = '181';
    expectRejected(map, 'changes[0].pending_pr: expected a pull request number');
  });
});

describe('findRepositoryProblems', () => {
  const problemsFor = (edit) => {
    const map = buildMap();
    edit(map);
    return findRepositoryProblems(parseAtlasMap(map), fakeRepository());
  };

  it('finds nothing wrong with a map that matches its repository', () => {
    expect(problemsFor(() => {})).toEqual([]);
  });

  it('reports a missing path, and skips it when the record names its pending PR', () => {
    expect(problemsFor((map) => { map.changes[0].edit = ['data/missing.json']; })).toEqual(['changes[0] (change-rows).edit: path "data/missing.json" does not exist']);
    expect(problemsFor((map) => { map.changes[0].edit = ['data/missing.json']; map.changes[0].pending_pr = 181; })).toEqual([]);
  });

  it('reports a script missing from package.json and a command of an unknown form', () => {
    expect(problemsFor((map) => { map.checks[0].script = 'nope'; })).toEqual(['checks[0] (unit): package.json has no script "nope"']);
    expect(problemsFor((map) => { map.changes[0].commands = ['make rows']; })).toEqual([
      'changes[0] (change-rows).commands: command "make rows" is not npm test, npm run <script>, npx vitest run, node <file> or bash <file>',
    ]);
  });

  it('reports a missing workflow, a missing job and a job that does not run the check', () => {
    expect(problemsFor((map) => { map.checks[0].ci.workflow = '.github/workflows/none.yml'; })).toEqual(['checks[0] (unit).ci: workflow ".github/workflows/none.yml" does not exist']);
    expect(problemsFor((map) => { map.checks[0].ci.job = 'deploy'; })).toEqual(['checks[0] (unit).ci: .github/workflows/ci.yml has no job "deploy"']);
    expect(problemsFor((map) => { map.checks[0].ci.runs = 'npm run build'; })).toEqual(['checks[0] (unit).ci: job "audit" in .github/workflows/ci.yml does not run "npm run build"']);
  });

  it('reports a recipe heading that does not exist and a map file outside its module', () => {
    expect(problemsFor((map) => { map.changes[0].recipe.number = 9; })).toEqual(['changes[0] (change-rows).recipe: src/lib/CONTEXT.md has no recipe "### 9."']);
    expect(problemsFor((map) => { map.modules[1].map_file = 'src/lib/CONTEXT.md'; })).toEqual([
      'modules[1] (ui): map_file "src/lib/CONTEXT.md" must be a CONTEXT.md in "src/ui/" or a directory above it',
    ]);
  });

  it('refuses paths that leave the checkout', () => {
    expect(commandProblems('node ../outside.mjs', 'here', fakeRepository())).toEqual(['here: path "../outside.mjs" does not exist']);
  });
});

describe('readJobBlock', () => {
  it('returns one job and stops at the next', () => {
    expect(readJobBlock(WORKFLOW, 'audit')).toContain('npm test');
    expect(readJobBlock(WORKFLOW, 'audit')).not.toContain('npm run build');
    expect(readJobBlock(WORKFLOW, 'missing')).toBeUndefined();
  });
});
