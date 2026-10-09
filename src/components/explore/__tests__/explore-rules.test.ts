import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const EXPLORE_DIRECTORY = 'src/components/explore';
/** Old-name tokens the kit keeps only until their last use is gone. */
const RETIRED_TOKENS = ['--lab-line-strong', '--lab-radius)', '--lab-high', '--motion-quick', '--motion-move', '--motion-ease', '--motion-flow', '--motion-trace-step'];
const SITE_DATABASE_IMPORT = 'use-site-database';
/** The only files that may read the table of named devices. */
const SPECIFICATION_FILES = ['DeviceSpecifications.tsx', 'specifications/spec-rows.ts'];
const MAX_FILE_LINES = 300;

function listFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : listFiles(entryPath);
    return [entryPath];
  });
}

const files = listFiles(EXPLORE_DIRECTORY).map((file) => ({ file: path.relative(EXPLORE_DIRECTORY, file), text: fs.readFileSync(file, 'utf-8') }));

function filesHolding(pattern: RegExp | string): string[] {
  return files.filter(({ text }) => (typeof pattern === 'string' ? text.includes(pattern) : pattern.test(text))).map(({ file }) => file);
}

describe('Explore source rules', () => {
  it('scans the Explore folder', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('uses no old component classes and no site colour tokens', () => {
    expect(filesHolding(/\btm-[a-z]/)).toEqual([]);
    expect(filesHolding('--color-')).toEqual([]);
    expect(filesHolding('threat-model.css')).toEqual([]);
  });

  it.each(RETIRED_TOKENS)('no longer uses the old token name %s', (token) => {
    expect(filesHolding(token)).toEqual([]);
  });

  it('never dims with opacity and sets no type under 12px', () => {
    expect(filesHolding(/opacity\s*:/)).toEqual([]);
    expect(filesHolding(/font-size:\s*(0\.[0-6]\d*rem|[0-9]px|1[01]px)/)).toEqual([]);
  });

  it('reads the table of named devices only in the specifications view', () => {
    expect(filesHolding(SITE_DATABASE_IMPORT)).toEqual(['DeviceSpecifications.tsx']);
    expect(filesHolding(/DEVICES_TABLE/).sort()).toEqual([...SPECIFICATION_FILES].sort());
  });

  it('keeps the old mark matrix, filter panel, technique panel and chain card out', () => {
    const names = files.map(({ file }) => file);
    for (const gone of ['catalog/MarkMatrix.tsx', 'catalog/CatalogFilterPanel.tsx', 'catalog/TechniquePanel.tsx']) expect(names).not.toContain(gone);
    expect(filesHolding(/AttackChainViz['"]/).filter((file) => !file.endsWith('CuratedChains.tsx'))).toEqual([]);
    expect(filesHolding(/<AttackChainViz/)).toEqual([]);
  });

  it('never calls the product by a name it must not carry', () => {
    expect(filesHolding(/\bSIEM\b|\bscanner\b|detection system/i)).toEqual([]);
  });

  it('links to no fragment inside the Lab', () => {
    expect(filesHolding(/href=["'{`]#/)).toEqual([]);
  });

  it('keeps every file under the line limit', () => {
    expect(files.filter(({ text }) => text.split('\n').length > MAX_FILE_LINES).map(({ file }) => file)).toEqual([]);
  });
});
