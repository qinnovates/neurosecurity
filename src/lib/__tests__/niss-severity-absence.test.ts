// @vitest-environment node
/**
 * Guards one fact across every artifact the registrar feeds: a NISS score that
 * nobody measured must never be published as a measured value.
 *
 * What went wrong, and what these tests stop coming back. The registrar holds
 * 178 techniques; 131 carry a NISS score and 47 do not. Three generators wrote
 * `niss.severity ?? 'none'` or `|| ''`, so the published
 * `statistics.by_niss_severity` read `none: 48`: the one technique measured at
 * 0.0 plus 47 nobody had scored, filed together under the floor of the scale.
 * The datalake is public and CC-BY-4.0, so that tally was shipped as a finding.
 *
 * NISS is a proposed, unvalidated framework. "Not scored" means no one has
 * measured the technique. It is not low, not zero, and not safe, and it is a
 * different claim from severity `none`, which is a score measured at 0.0 — a
 * distinction exactly one technique in the catalogue currently turns on.
 *
 * The registrar writes `niss.score`, `vector`, `severity`, `pins` and
 * `harm_flag` together or not at all, which is what makes "not scored" cleanly
 * detectable; the first test pins that invariant, and the rest lean on it.
 *
 * When the catalogue grows, these counts move. Update the constants below from
 * the registrar — do not relax an assertion to make the suite pass.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { NODE_RUNTIME, VoidLogger, createDuckDB, type DuckDBBindings } from '@duckdb/duckdb-wasm/blocking';
import { beforeAll, describe, expect, it } from 'vitest';
import registrar from '@shared/qtara-registrar.json';
import { TARA_TECHNIQUES } from '../../site/learn/autodidactive/js/data/tara.js';
import { getKqlTables } from '../kql-tables';

/** The pinned state of the catalogue. Derived from datalake/qtara-registrar.json, 2026-10-26. */
const TOTAL_TECHNIQUES = 178;
const SCORED_TECHNIQUES = 131;
/** 37 unscored (a recorded reason, no metrics) plus 10 provisional (bounds, no score). Neither has been measured. */
const NOT_SCORED_TECHNIQUES = 47;
const UNSCORED_TECHNIQUES = 37;
const PROVISIONAL_TECHNIQUES = 10;
/** Measured at a NISS score of 0.0, which the severity scale calls `none`. A measurement, not an absence. */
const MEASURED_NONE_IDS = ['QIF-T0057'];

/** The fields the registrar writes together with a score. Any one of them standing alone is a half-written block. */
const SCORE_COMPANION_FIELDS = ['vector', 'severity', 'pins', 'harm_flag'] as const;

const PARQUET_PATH = 'datalake/parquet/techniques.parquet';
const STALE_PARQUET_REMEDY = `Run \`npm run prebuild\` with pyarrow installed and commit ${PARQUET_PATH}.`;

interface Technique {
  id: string;
  niss?: Record<string, unknown>;
}

const techniques = registrar.techniques as unknown as Technique[];
const isMeasured = (technique: Technique) => typeof technique.niss?.score === 'number';
const measured = techniques.filter(isMeasured);
const notMeasured = techniques.filter((technique) => !isMeasured(technique));

describe('the registrar separates an unmeasured NISS score from a measured one', () => {
  it('holds the pinned number of techniques, scored and not scored', () => {
    expect(techniques).toHaveLength(TOTAL_TECHNIQUES);
    expect(measured).toHaveLength(SCORED_TECHNIQUES);
    expect(notMeasured).toHaveLength(NOT_SCORED_TECHNIQUES);
  });

  it('writes the score and its companion fields together or not at all', () => {
    const halfWritten = techniques.filter((technique) =>
      SCORE_COMPANION_FIELDS.some((field) => (technique.niss?.[field] !== undefined) !== isMeasured(technique)),
    );
    expect(halfWritten.map((technique) => technique.id)).toEqual([]);
  });

  it('gives every unmeasured technique a scoring state that says so, and no severity', () => {
    for (const technique of notMeasured) {
      expect(technique.niss?.severity, technique.id).toBeUndefined();
      expect(technique.niss?.scoring_state, technique.id).toMatch(/^(unscored|provisional)$/);
    }
    const byState = (state: string) => notMeasured.filter((technique) => technique.niss?.scoring_state === state);
    expect(byState('unscored')).toHaveLength(UNSCORED_TECHNIQUES);
    expect(byState('provisional')).toHaveLength(PROVISIONAL_TECHNIQUES);
  });

  it('holds exactly one technique measured at the floor of the scale', () => {
    const atFloor = measured.filter((technique) => technique.niss?.severity === 'none');
    expect(atFloor.map((technique) => technique.id)).toEqual(MEASURED_NONE_IDS);
    for (const technique of atFloor) expect(technique.niss?.score, technique.id).toBe(0);
  });
});

describe('the published statistics state their denominator', () => {
  const block = registrar.statistics.by_niss_severity as unknown as {
    scored_techniques: number;
    not_scored_techniques: number;
    counts: Record<string, number>;
    denominator: string;
  };

  it('counts severity words over the scored techniques only', () => {
    expect(block.scored_techniques).toBe(SCORED_TECHNIQUES);
    expect(block.not_scored_techniques).toBe(NOT_SCORED_TECHNIQUES);
    const total = Object.values(block.counts).reduce((sum, count) => sum + count, 0);
    expect(total).toBe(SCORED_TECHNIQUES);
  });

  it('files the unmeasured techniques under no severity word', () => {
    expect(block.counts.none).toBe(MEASURED_NONE_IDS.length);
    expect(Object.keys(block.counts).sort()).toEqual(['critical', 'high', 'low', 'medium', 'none']);
    expect(Object.values(block.counts)).not.toContain(NOT_SCORED_TECHNIQUES);
  });

  it('says in the data itself that `none` is a measurement and not-scored is not a severity', () => {
    expect(block.denominator).toMatch(/scored techniques only/);
    expect(block.denominator).toMatch(/measured at 0\.0/);
  });

  it('agrees with the scoring-state tally beside it', () => {
    expect(registrar.statistics.by_scoring_state).toMatchObject({
      scored: SCORED_TECHNIQUES,
      unscored: UNSCORED_TECHNIQUES,
      provisional: PROVISIONAL_TECHNIQUES,
    });
  });
});

describe('the query tables carry null, not a value, for an unmeasured score', () => {
  const rows = getKqlTables().techniques;
  const nissColumns = ['niss_score', 'niss_severity', 'niss_vector', 'niss_pins', 'niss_harm_flag'] as const;

  it('has one row per technique', () => {
    expect(rows).toHaveLength(TOTAL_TECHNIQUES);
  });

  it('leaves every NISS cell of an unmeasured technique null', () => {
    const unmeasuredIds = new Set(notMeasured.map((technique) => technique.id));
    const unmeasuredRows = rows.filter((row) => unmeasuredIds.has(row.id as string));
    expect(unmeasuredRows).toHaveLength(NOT_SCORED_TECHNIQUES);
    for (const row of unmeasuredRows) {
      for (const column of nissColumns) expect(row[column], `${row.id}.${column}`).toBeNull();
      expect(row.niss_scoring_state, row.id as string).toMatch(/^(unscored|provisional)$/);
    }
  });

  it('keeps the measured floor score readable as a measurement', () => {
    const atFloor = rows.filter((row) => row.niss_severity === 'none');
    expect(atFloor.map((row) => row.id)).toEqual(MEASURED_NONE_IDS);
    for (const row of atFloor) expect(row.niss_score, row.id as string).toBe(0);
  });

  it('never writes an empty string or `none` where a score is missing', () => {
    const coerced = rows.filter((row) => row.niss_severity === '' || (row.niss_severity === 'none' && row.niss_score !== 0));
    expect(coerced.map((row) => row.id)).toEqual([]);
  });
});

describe('the Autodidactive lesson module carries null for an unmeasured score', () => {
  it('nulls the severity of every unmeasured technique and keeps the one measured floor', () => {
    const lessonTechniques = TARA_TECHNIQUES as { id: string; niss_severity: string | null }[];
    expect(lessonTechniques).toHaveLength(TOTAL_TECHNIQUES);
    expect(lessonTechniques.filter((technique) => technique.niss_severity === null)).toHaveLength(NOT_SCORED_TECHNIQUES);
    expect(
      lessonTechniques.filter((technique) => technique.niss_severity === 'none').map((technique) => technique.id),
    ).toEqual(MEASURED_NONE_IDS);
  });
});

/**
 * The deploy build has no pyarrow and serves the committed parquet as it is, so
 * this reads the committed file rather than a fresh build.
 */
describe('the committed public parquet carries null for an unmeasured score', () => {
  let database: DuckDBBindings;

  beforeAll(async () => {
    const wasmDirectory = path.dirname(createRequire(import.meta.url).resolve('@duckdb/duckdb-wasm/dist/duckdb-eh.wasm'));
    /** The blocking runtime starts no worker; the bundle type still asks for each build's worker file. */
    const bundleOf = (build: 'mvp' | 'eh') => ({
      mainModule: path.join(wasmDirectory, `duckdb-${build}.wasm`),
      mainWorker: path.join(wasmDirectory, `duckdb-node-${build}.worker.cjs`),
    });
    database = await createDuckDB({ mvp: bundleOf('mvp'), eh: bundleOf('eh') }, new VoidLogger(), NODE_RUNTIME);
    await database.instantiate(() => undefined);
  });

  function committedRows(): { id: string; niss_score: number | null; niss_severity: string | null }[] {
    const fileName = path.basename(PARQUET_PATH);
    database.registerFileBuffer(fileName, new Uint8Array(fs.readFileSync(PARQUET_PATH)));
    const connection = database.connect();
    try {
      const result = connection.query(`SELECT id, niss_score, niss_severity FROM read_parquet('${fileName}')`);
      return result.toArray().map((row) => row.toJSON() as { id: string; niss_score: number | null; niss_severity: string | null });
    } finally {
      connection.close();
    }
  }

  it('matches the catalog digest, so the file under test is the file that ships', () => {
    const catalog = JSON.parse(fs.readFileSync('datalake/parquet/catalog.json', 'utf-8')) as {
      datasets: Record<string, { sha256: string }>;
    };
    const digest = createHash('sha256').update(fs.readFileSync(PARQUET_PATH)).digest('hex');
    expect(catalog.datasets.techniques.sha256, STALE_PARQUET_REMEDY).toBe(digest);
  });

  it('nulls the severity and score of every unmeasured technique', () => {
    const rows = committedRows();
    expect(rows, STALE_PARQUET_REMEDY).toHaveLength(TOTAL_TECHNIQUES);
    const unmeasuredIds = new Set(notMeasured.map((technique) => technique.id));
    const unmeasured = rows.filter((row) => unmeasuredIds.has(row.id));
    expect(unmeasured, STALE_PARQUET_REMEDY).toHaveLength(NOT_SCORED_TECHNIQUES);
    for (const row of unmeasured) {
      expect(row.niss_severity, row.id).toBeNull();
      expect(row.niss_score, row.id).toBeNull();
    }
  });

  it('keeps the one measured floor score at 0.0 instead of dropping it to null', () => {
    const atFloor = committedRows().filter((row) => row.niss_severity === 'none');
    expect(atFloor.map((row) => row.id), STALE_PARQUET_REMEDY).toEqual(MEASURED_NONE_IDS);
    for (const row of atFloor) expect(row.niss_score, row.id).toBe(0);
  });
});
