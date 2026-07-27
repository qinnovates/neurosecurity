/**
 * useDuckDB — Singleton DuckDB-WASM initialization hook.
 *
 * Lazy-loads @duckdb/duckdb-wasm via a normal package dynamic import
 * (code-split into its own content-hashed chunk by Rollup — never in the
 * main bundle, never fetched from a third-party origin at runtime).
 * WASM + worker bundles are vendored locally under src/site/duckdb/.
 *
 * State machine: idle → loading → ready → error
 *
 * Security:
 *   - All queries run client-side only (WASM sandbox, no filesystem)
 *   - Only /data/parquet/*.parquet paths are registered (no external URLs)
 *   - @duckdb/duckdb-wasm is a pinned npm dependency (package-lock.json),
 *     bundled by the build — no runtime CDN fetch, no dynamic-import SRI
 *     gap. Previously loaded from jsDelivr via `import(url)`, which the
 *     browser cannot apply SRI to; this closes that supply-chain gap.
 */

import { useState, useCallback, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────────────────

export type DuckDBState = 'idle' | 'loading' | 'ready' | 'error';

export interface DuckDBResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
}

interface DuckDBInstance {
  db: any;
  conn: any;
}

// ── Constants ──────────────────────────────────────────────────────────

const MAX_RESULT_ROWS = 10_000;
const QUERY_TIMEOUT_MS = 10_000;

// DuckDB-WASM bundles — vendored locally to eliminate CDN supply chain risk.
// WASM + worker files served from /duckdb/ (copied from src/site/duckdb/ at build).
// The JS loader itself ships as the pinned @duckdb/duckdb-wasm npm dependency,
// bundled by Rollup as its own chunk — see loadDuckDBModule below.
const LOCAL_BASE = '/duckdb';

// All known parquet datasets served from /data/parquet/
const PARQUET_DATASETS = [
  'techniques',
  'technique_dsm',
  'technique_neurorights',
  'impact_chains',
  'brain_regions',
  'hourglass_bands',
  'companies',
  'devices',
  'neural_pathways',
  'neurotransmitters',
  'cranial_nerves',
  'neuroendocrine',
  'glial_cells',
  'neurovascular',
  'receptors',
  'dsm_mappings',
  'dsm_clusters',
  'neurological_conditions',
  'cve_mappings',
  'security_controls',
  'ethics_controls',
  'guardrails',
  'neurosecurity_scores',
  'research_explorer',
  'research_institutions',
  'research_standards',
  'research_legislation',
  'research_registry',
  'validation_registry',
  'eeg_samples',
  'intel_feed',
  'intel_sources',
  'timeline',
] as const;

// Allowlist: only these path prefixes are permitted for read_parquet
const ALLOWED_PARQUET_PREFIX = '/data/parquet/';

// ── Loader ────────────────────────────────────────────────────────────

/**
 * Load the DuckDB-WASM JS module. A normal package specifier (not a URL),
 * so Rollup statically resolves and code-splits it into its own
 * content-hashed chunk — served same-origin, integrity-checked by the
 * build pipeline like every other bundled dependency. Kept as a dynamic
 * import (rather than a static top-level import) purely to defer loading
 * the ~35MB WASM payload until the SQL console is actually opened.
 */
async function loadDuckDBModule(): Promise<any> {
  return import('@duckdb/duckdb-wasm');
}

// ── Singleton ──────────────────────────────────────────────────────────

let singletonPromise: Promise<DuckDBInstance> | null = null;
let singletonInstance: DuckDBInstance | null = null;

async function initDuckDB(): Promise<DuckDBInstance> {
  const duckdb = await loadDuckDBModule();

  // Use vendored local bundles (eliminates CDN supply chain risk)
  // Files served from src/site/duckdb/ → /duckdb/ at runtime
  const DUCKDB_BUNDLES = {
    mvp: {
      mainModule: `${LOCAL_BASE}/duckdb-mvp.wasm`,
      mainWorker: `${LOCAL_BASE}/duckdb-browser-mvp.worker.js`,
    },
    eh: {
      mainModule: `${LOCAL_BASE}/duckdb-eh.wasm`,
      mainWorker: `${LOCAL_BASE}/duckdb-browser-eh.worker.js`,
    },
  };

  // Select best bundle for this browser
  const bundle = await duckdb.selectBundle(DUCKDB_BUNDLES);

  const worker = new Worker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);

  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  const conn = await db.connect();

  // Register all parquet datasets as views using read_parquet()
  // Only uses relative URLs pointing to /data/parquet/*.parquet
  // SECURITY: dataset and url are derived from PARQUET_DATASETS constant (hardcoded).
  // Do NOT load dataset names from external config or user input — this uses string
  // interpolation in SQL which would become an injection vector.
  for (const dataset of PARQUET_DATASETS) {
    const url = `${ALLOWED_PARQUET_PREFIX}${dataset}.parquet`;
    try {
      // DuckDB-WASM's virtual filesystem treats a bare path like this as a
      // local file lookup, not an HTTP fetch, unless the URL is registered
      // first. Register the relative path as a virtual name pointing at the
      // real absolute same-origin URL, then reference that same name below.
      const absoluteUrl = new URL(url, window.location.origin).toString();
      await db.registerFileURL(url, absoluteUrl, duckdb.DuckDBDataProtocol.HTTP, false);
      await conn.query(
        `CREATE OR REPLACE VIEW "${dataset}" AS SELECT * FROM read_parquet('${url}')`
      );
    } catch (err) {
      // Some datasets may legitimately not exist yet — degrade gracefully,
      // but still surface it so a real regression (e.g. a broken path) is
      // visible in devtools instead of silently making the view disappear.
      console.warn(`[useDuckDB] Failed to register view "${dataset}":`, err);
    }
  }

  return { db, conn };
}

// ── Validation ─────────────────────────────────────────────────────────

/**
 * SQL validation. Rejects queries that attempt to:
 * - Load external URLs or arbitrary files (read_parquet, read_csv, etc.)
 * - Exfiltrate data (COPY, EXPORT)
 * - Mount external databases (ATTACH)
 * - Modify schema (CREATE, ALTER, DROP)
 * - Install extensions (INSTALL, LOAD)
 *
 * Security review: 2026-03-15. Covers bypasses identified by quorum swarm:
 * - COPY without parens (COPY ... TO syntax)
 * - ATTACH DATABASE
 * - Double-quoted read_parquet paths
 * - EXPORT DATABASE / EXPORT TABLE
 */
function validateQuery(sql: string): string | null {
  // Strip SQL comments before validation to prevent bypass
  let stripped = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

  // Block semicolons — only allow single statements
  if (stripped.replace(/;[\s]*$/, '').includes(';')) {
    return 'Multiple statements are not allowed. Submit one query at a time.';
  }

  // Allowlist check: first non-whitespace token must be SELECT or WITH
  const firstToken = stripped.trim().split(/\s+/)[0]?.toUpperCase();
  if (firstToken && firstToken !== 'SELECT' && firstToken !== 'WITH') {
    return `Only SELECT and WITH queries are allowed. Found: "${firstToken}".`;
  }

  const normalized = stripped.toLowerCase();

  // Block information_schema, pg_catalog, and duckdb_ system schemas
  if (/\binformation_schema\b/i.test(normalized)) {
    return '"information_schema" access is not allowed.';
  }
  if (/\bpg_catalog\b/i.test(normalized)) {
    return '"pg_catalog" access is not allowed.';
  }
  if (/\bduckdb_\w+\s*\(/i.test(normalized)) {
    return 'DuckDB system functions are not allowed.';
  }

  // Block read_parquet — validate ALL occurrences (matchAll, not match)
  // Security: previous version only checked first occurrence — multi-call bypass possible
  const readFnMatches = [...normalized.matchAll(/read_parquet\s*\(\s*['"]([^'"]+)['"]/g)];
  for (const m of readFnMatches) {
    if (!m[1].startsWith(ALLOWED_PARQUET_PREFIX)) {
      return `Only local parquet files are allowed. Use paths starting with ${ALLOWED_PARQUET_PREFIX}`;
    }
  }

  // Block http/https URLs and file:// protocol
  if (/https?:\/\//.test(normalized) && !normalized.includes(ALLOWED_PARQUET_PREFIX)) {
    return 'External URLs are not allowed. Query the pre-registered dataset views directly.';
  }
  if (/file:\/\//.test(normalized)) {
    return 'File URLs are not allowed.';
  }

  // Block dangerous statements (word-boundary match, no parens required)
  // Includes PRAGMA for DuckDB settings manipulation
  const blockedStatements = ['copy', 'export', 'attach', 'create', 'alter', 'drop', 'install', 'load', 'pragma', 'set', 'reset'];
  for (const stmt of blockedStatements) {
    if (new RegExp(`\\b${stmt}\\b`, 'i').test(normalized)) {
      return `"${stmt.toUpperCase()}" statements are not allowed. Use SELECT queries on the available dataset views.`;
    }
  }

  // Block filesystem/network/introspection functions
  // Includes DuckDB-specific table functions that expose internal state
  const blockedFns = [
    'read_csv', 'read_json', 'read_text', 'write_parquet', 'write_csv',
    'httpfs', 'postgres_scan', 'parquet_scan', 'glob', 'delta_scan', 'iceberg_scan',
    'duckdb_extensions', 'duckdb_settings', 'duckdb_views', 'duckdb_columns',
    'duckdb_tables', 'duckdb_constraints', 'duckdb_databases', 'duckdb_functions',
  ];
  for (const fn of blockedFns) {
    if (new RegExp(`\\b${fn}\\s*\\(`, 'i').test(normalized)) {
      return `The function "${fn}" is not allowed in the SQL console. Use SELECT queries on the available dataset views.`;
    }
  }

  return null; // valid
}

// ── Hook ───────────────────────────────────────────────────────────────

export function useDuckDB() {
  const [state, setState] = useState<DuckDBState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const initialize = useCallback(async () => {
    if (singletonInstance) {
      setState('ready');
      return;
    }

    if (singletonPromise) {
      setState('loading');
      try {
        singletonInstance = await singletonPromise;
        setState('ready');
      } catch (err: any) {
        setState('error');
        setError(err?.message || 'Failed to initialize DuckDB');
      }
      return;
    }

    setState('loading');
    setLoadProgress(10);
    setError(null);

    try {
      // Simulate progress during load (actual progress is opaque)
      const progressInterval = setInterval(() => {
        setLoadProgress(prev => Math.min(prev + 8, 85));
      }, 300);

      singletonPromise = initDuckDB();
      singletonInstance = await singletonPromise;

      clearInterval(progressInterval);
      setLoadProgress(100);
      setState('ready');
    } catch (err: any) {
      singletonPromise = null;
      setState('error');
      setError(err?.message || 'Failed to initialize DuckDB-WASM. Your browser may not support WebAssembly.');
    }
  }, []);

  const executeQuery = useCallback(async (sql: string): Promise<DuckDBResult> => {
    if (!singletonInstance) {
      throw new Error('DuckDB not initialized. Call initialize() first.');
    }

    // Validate query
    const validationError = validateQuery(sql);
    if (validationError) {
      throw new Error(validationError);
    }

    const { conn } = singletonInstance;

    // Query with timeout
    abortRef.current = new AbortController();

    const resultPromise = conn.query(sql);
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Query timed out after ${QUERY_TIMEOUT_MS / 1000} seconds. Try adding LIMIT or simplifying your query.`));
      }, QUERY_TIMEOUT_MS);

      abortRef.current?.signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('Query cancelled.'));
      });
    });

    const result = await Promise.race([resultPromise, timeoutPromise]);

    // Convert Arrow result to plain objects
    const columns: string[] = result.schema.fields.map((f: any) => f.name);
    const totalRows = result.numRows;
    const truncated = totalRows > MAX_RESULT_ROWS;

    const rows: Record<string, unknown>[] = [];
    const limit = Math.min(totalRows, MAX_RESULT_ROWS);

    for (let i = 0; i < limit; i++) {
      const row: Record<string, unknown> = {};
      for (const col of columns) {
        const val = result.getChildAt(columns.indexOf(col))?.get(i);
        // Convert BigInt to Number for display
        row[col] = typeof val === 'bigint' ? Number(val) : val;
      }
      rows.push(row);
    }

    return { columns, rows, rowCount: totalRows, truncated };
  }, []);

  const cancelQuery = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const close = useCallback(async () => {
    if (singletonInstance) {
      try {
        await singletonInstance.conn.close();
        await singletonInstance.db.terminate();
      } catch { /* ignore cleanup errors */ }
      singletonInstance = null;
      singletonPromise = null;
      setState('idle');
    }
  }, []);

  return {
    state,
    error,
    loadProgress,
    initialize,
    executeQuery,
    cancelQuery,
    close,
    datasets: PARQUET_DATASETS,
  };
}
