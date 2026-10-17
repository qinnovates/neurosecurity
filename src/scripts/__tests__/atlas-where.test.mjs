import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { findMatches, listKnownTerms, normaliseQuery, runWhere, scoreTerm } from '../atlas-map/atlas-where.mjs';
import { REPOSITORY_ROOT, loadAtlasMap } from '../atlas-map/load-atlas-map.mjs';

const CLI = path.join(REPOSITORY_ROOT, 'src/scripts/atlas-map/atlas-where.mjs');
const map = loadAtlasMap();

describe('scoreTerm', () => {
  it('ranks an exact match above a contained phrase above a partial word, and ignores short partials', () => {
    expect(scoreTerm('region mapping', 'region mapping')).toBeGreaterThan(scoreTerm('change the region mapping', 'region mapping'));
    expect(scoreTerm('change the region mapping', 'region mapping')).toBeGreaterThan(scoreTerm('region', 'region mapping'));
    expect(scoreTerm('re', 'region mapping')).toBe(0);
    expect(scoreTerm('lens', 'lenses and more')).toBe(4);
  });
});

describe('findMatches', () => {
  it('sends the requests the brief names to the right change record', () => {
    const cases = {
      'region mapping': 'change-region-mapping', 'atlas source': 'change-atlas-source', lens: 'change-lens', device: 'change-device',
      'limit wording': 'change-limit-wording', 'registrar refresh': 'change-registrar-refresh', pipeline: 'change-pipeline',
      'purpose statement': 'change-purpose-statement', 'dsm qualifier': 'change-dsm-qualifier',
    };
    for (const [query, id] of Object.entries(cases)) expect(findMatches(map, query).changes[0]?.id, query).toBe(id);
  });

  it('matches module and data ids', () => {
    expect(findMatches(map, 'anatomy-lib').modules.map((module) => module.id)).toEqual(['anatomy-lib']);
    expect(findMatches(map, 'anatomy-crosswalk').data.map((data) => data.id)).toEqual(['anatomy-crosswalk']);
  });

  it('matches nothing for an empty query', () => {
    expect(findMatches(map, normaliseQuery(['  ']))).toEqual({ changes: [], modules: [], data: [] });
  });
});

describe('runWhere', () => {
  it('prints the recipe, files, commands and checks with their CI job', () => {
    const { exitCode, output } = runWhere(map, ['region', 'mapping']);
    expect(exitCode).toBe(0);
    expect(output).toContain('change-region-mapping:');
    expect(output).toContain('src/lib/anatomy/CONTEXT.md recipe 2');
    expect(output).toContain('datalake/qif-anatomy-crosswalk.json');
    expect(output).toContain('npm test (CI: security.yml audit)');
  });

  it('says when the files live on an open PR', () => {
    expect(runWhere(map, ['purpose', 'statement']).output).toContain('files live on #181 until it merges');
  });

  it('exits 1 and lists every known keyword when nothing matches', () => {
    const { exitCode, output } = runWhere(map, ['zzz-no-such-thing']);
    expect(exitCode).toBe(1);
    expect(output).toContain('Nothing in the atlas map matches "zzz-no-such-thing"');
    for (const term of listKnownTerms(map)) expect(output).toContain(term);
  });
});

describe('the atlas:where command line', () => {
  it('prints a match on stdout with exit 0', () => {
    expect(execFileSync(process.execPath, [CLI, 'region', 'mapping'], { encoding: 'utf-8' })).toContain('change-region-mapping');
  });

  it('exits 1 on stderr when nothing matches', () => {
    const result = spawnSync(process.execPath, [CLI, 'zzz-no-such-thing'], { encoding: 'utf-8' });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Known keywords and ids:');
  });
});
