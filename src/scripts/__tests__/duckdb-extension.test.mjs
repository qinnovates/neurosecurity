import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const EXTENSION_PATH = path.join(ROOT, 'src/site/duckdb/ext/v1.1.1/wasm_eh/parquet.duckdb_extension.wasm');
const README_PATH = path.join(ROOT, 'src/site/duckdb/README.md');
const HOOK_PATH = path.join(ROOT, 'src/hooks/useDuckDB.ts');

/** The hash and size of the file DuckDB publishes, checked when it was fetched. */
const PINNED_SHA256 = 'e24fb2953c6a80e32d17fa3921f90f1f05ccbfa40f382e77702c1e6af9b79479';
const PINNED_BYTES = 2_803_379;
const WASM_MAGIC = [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00];

function readCustomSectionNames(bytes) {
  const names = [];
  let offset = 8;
  const readVarint = () => {
    let value = 0;
    let shift = 0;
    for (;;) {
      const byte = bytes[offset++];
      value |= (byte & 0x7f) << shift;
      shift += 7;
      if ((byte & 0x80) === 0) return value;
    }
  };
  while (offset < bytes.length) {
    const sectionId = bytes[offset++];
    const sectionLength = readVarint();
    const sectionStart = offset;
    if (sectionId === 0) {
      const nameLength = readVarint();
      names.push(Buffer.from(bytes.subarray(offset, offset + nameLength)).toString('latin1'));
    }
    offset = sectionStart + sectionLength;
  }
  return names;
}

describe('the self-hosted DuckDB Parquet extension', () => {
  const bytes = fs.readFileSync(EXTENSION_PATH);

  it('is byte-for-byte the file that was reviewed', () => {
    expect(bytes.length).toBe(PINNED_BYTES);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(PINNED_SHA256);
  });

  it('is a WebAssembly module that carries DuckDB\'s signature section', () => {
    expect([...bytes.subarray(0, 8)]).toEqual(WASM_MAGIC);
    expect(readCustomSectionNames(bytes)).toContain('duckdb_signature');
  });

  it('is the hash the README states', () => {
    expect(fs.readFileSync(README_PATH, 'utf8')).toContain(PINNED_SHA256);
  });
});

describe('the SQL console\'s extension source', () => {
  const hook = fs.readFileSync(HOOK_PATH, 'utf8');

  it('points DuckDB at this origin before any table is read', () => {
    const setting = hook.indexOf('SET custom_extension_repository');
    expect(setting).toBeGreaterThan(-1);
    expect(hook.slice(setting, setting + 140)).toContain('window.location.origin');
    expect(setting).toBeLessThan(hook.indexOf("FROM read_parquet('${url}')"));
  });

  it('names no third-party extension host', () => {
    expect(hook).not.toMatch(/extensions\.duckdb\.org/);
    expect(hook).not.toMatch(/custom_extension_repository='https?:/);
  });
});
