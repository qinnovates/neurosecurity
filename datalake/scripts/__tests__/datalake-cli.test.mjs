import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, it, expect } from 'vitest';
import { isInvokedScript } from '../datalake-cli.mjs';

const SCRIPT_URL = new URL('../derive-pathway-bands.mjs', import.meta.url).href;
const OTHER_SCRIPT_PATH = fileURLToPath(new URL('../compute-impact-chains.mjs', import.meta.url));

describe('isInvokedScript', () => {
  const linkDirectory = mkdtempSync(path.join(tmpdir(), 'datalake-cli-'));
  const symlinkPath = path.join(linkDirectory, 'derive-pathway-bands.mjs');
  symlinkSync(fileURLToPath(SCRIPT_URL), symlinkPath);

  afterAll(() => rmSync(linkDirectory, { recursive: true }));

  it('recognises the script by its own path', () => {
    expect(isInvokedScript(SCRIPT_URL, fileURLToPath(SCRIPT_URL))).toBe(true);
  });

  it('recognises the script when it is started through a symlink', () => {
    expect(isInvokedScript(SCRIPT_URL, symlinkPath)).toBe(true);
  });

  it('does not run a module that another script imported', () => {
    expect(isInvokedScript(SCRIPT_URL, OTHER_SCRIPT_PATH)).toBe(false);
    expect(isInvokedScript(SCRIPT_URL, undefined)).toBe(false);
  });
});
