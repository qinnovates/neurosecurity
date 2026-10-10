// @vitest-environment node
/**
 * The committed parquet files are what the site serves: the deploy build has no
 * pyarrow, so it copies datalake/parquet/ as it is. These tests read each
 * committed anatomy file back and compare it, cell for cell, with a fresh build
 * of the table, so a data change that was not followed by `npm run prebuild`
 * (with pyarrow) fails here.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { NODE_RUNTIME, VoidLogger, createDuckDB, type DuckDBBindings } from '@duckdb/duckdb-wasm/blocking';
import { beforeAll, describe, expect, it } from 'vitest';
import { ANATOMY_TABLE_NAMES, ANATOMY_TABLE_PREFIX, type AnatomyTableName } from '../anatomy-tables';
import { loadAnatomyTables } from '../load-anatomy-tables';
import type { AnatomyCell, AnatomyRow } from '../table-columns';

const PARQUET_DIRECTORY = 'datalake/parquet';
const CATALOG_PATH = path.join(PARQUET_DIRECTORY, 'catalog.json');
const PARQUET_EXTENSION = '.parquet';
const STALE_REMEDY = 'Run `npm run prebuild` with pyarrow installed and commit datalake/parquet/.';

interface CatalogDataset {
  rows: number;
  columns: number;
  column_names: string[];
}

const tables = loadAnatomyTables();
const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8')) as { datasets: Record<string, CatalogDataset> };
let database: DuckDBBindings;

/** Parquet holds whole numbers as 64-bit integers, which arrive as BigInt. Every count in these tables fits a double exactly. */
function toCell(value: unknown): AnatomyCell {
  if (typeof value === 'bigint') return Number(value);
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  throw new TypeError(`A parquet cell holds a ${typeof value}, which no anatomy table column may. ${STALE_REMEDY}`);
}

function readCommittedRows(name: AnatomyTableName): AnatomyRow[] {
  const fileName = `${name}${PARQUET_EXTENSION}`;
  database.registerFileBuffer(fileName, new Uint8Array(fs.readFileSync(path.join(PARQUET_DIRECTORY, fileName))));
  const connection = database.connect();
  try {
    const result = connection.query(`SELECT * FROM read_parquet('${fileName}')`);
    return result.toArray().map((row) => Object.fromEntries(Object.entries(row.toJSON()).map(([column, value]) => [column, toCell(value)])));
  } finally {
    connection.close();
  }
}

beforeAll(async () => {
  const wasmDirectory = path.dirname(createRequire(import.meta.url).resolve('@duckdb/duckdb-wasm/dist/duckdb-eh.wasm'));
  /** The blocking runtime starts no worker; the bundle type still asks for each build's worker file. */
  const bundleOf = (build: 'mvp' | 'eh') => ({ mainModule: path.join(wasmDirectory, `duckdb-${build}.wasm`), mainWorker: path.join(wasmDirectory, `duckdb-node-${build}.worker.cjs`) });
  const bundles = { mvp: bundleOf('mvp'), eh: bundleOf('eh') };
  database = await createDuckDB(bundles, new VoidLogger(), NODE_RUNTIME);
  await database.instantiate(() => undefined);
});

describe('committed anatomy parquet files match a fresh build', () => {
  it('commits exactly one parquet file and one catalog entry per anatomy table', () => {
    const committed = fs.readdirSync(PARQUET_DIRECTORY).filter((name) => name.startsWith(ANATOMY_TABLE_PREFIX)).sort();
    expect(committed, STALE_REMEDY).toEqual(ANATOMY_TABLE_NAMES.map((name) => `${name}${PARQUET_EXTENSION}`).sort());
    expect(Object.keys(catalog.datasets).filter((name) => name.startsWith(ANATOMY_TABLE_PREFIX)).sort(), STALE_REMEDY).toEqual([...ANATOMY_TABLE_NAMES].sort());
  });

  it.each(ANATOMY_TABLE_NAMES)('%s: the catalog entry states the fresh build\'s row count and columns', (name) => {
    const columnNames = Object.keys(tables[name][0]);
    expect(tables[name].length).toBeGreaterThan(0);
    expect(catalog.datasets[name], STALE_REMEDY).toMatchObject({ rows: tables[name].length, columns: columnNames.length, column_names: columnNames });
  });

  it.each(ANATOMY_TABLE_NAMES)('%s: the committed file holds the fresh build\'s rows, cell for cell', (name) => {
    const committedRows = readCommittedRows(name);
    expect(committedRows.length).toBeGreaterThan(0);
    expect(committedRows, STALE_REMEDY).toEqual(tables[name]);
  });
});
