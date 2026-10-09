import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  CATALOG_SEVERITY_HEADING, EFFECT_LABELS, ENTRY_PATH_LABELS, SCOPE_TERMS, SCOPE_TERM_LABELS, TECHNIQUE_FAMILY_HEADING, effectLabelForMode, wouldApplyIfLabel,
} from '../lab-terms';
import { PLACED_ENTRY_PATHS } from '../reference-data-types';

/** Words the Lab used before it had one set of terms. None may be printed again. */
const RETIRED_STRINGS = ['Placed here', 'Placed elsewhere', 'Not placed', 'not_reviewed', 'What it does'];
const SOURCE_FILE_PATTERN = /\.(ts|tsx)$/;
const TEST_FILE_PATTERN = /\.test\.(ts|tsx)$/;

function listSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : listSourceFiles(entryPath);
    return SOURCE_FILE_PATTERN.test(entry.name) && !TEST_FILE_PATTERN.test(entry.name) ? [entryPath] : [];
  });
}

describe('the Lab\'s terms', () => {
  it('names the four places a technique can stand, in order', () => {
    expect(SCOPE_TERMS.map((term) => SCOPE_TERM_LABELS[term])).toEqual([
      'Applies to this device', 'Would apply if (condition)', 'Reviewed, outside the device', 'Not assessed',
    ]);
    expect(wouldApplyIfLabel('the device can stimulate')).toBe('Would apply if the device can stimulate');
  });

  it('names the three effects, the severity and family headings, and every entry path', () => {
    expect(EFFECT_LABELS).toEqual({ read: 'Read', change: 'Change', deny: 'Deny' });
    expect((['R', 'M', 'D'] as const).map(effectLabelForMode)).toEqual(['Read', 'Change', 'Deny']);
    expect(CATALOG_SEVERITY_HEADING).toBe('Catalog severity');
    expect(TECHNIQUE_FAMILY_HEADING).toBe('Technique family');
    for (const entryPath of [...PLACED_ENTRY_PATHS, 'around_device' as const]) expect(ENTRY_PATH_LABELS[entryPath].length).toBeGreaterThan(0);
  });
});

describe('retired words', () => {
  const files = listSourceFiles('src').map((file) => ({ file, text: fs.readFileSync(file, 'utf-8') }));

  it('scans the source tree', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(RETIRED_STRINGS)('finds "%s" in no source file under src', (retired) => {
    expect(files.filter(({ text }) => text.includes(retired)).map(({ file }) => file)).toEqual([]);
  });
});
