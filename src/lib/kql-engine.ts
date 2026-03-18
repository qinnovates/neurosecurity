/**
 * KQL Query Engine — extracted from BciKql.tsx for reuse and testability.
 *
 * Pure logic module with zero React dependencies.
 * Handles parsing, indexing, and execution of KQL-style pipe queries.
 *
 * Architecture:
 *   kql-tables.ts (build) → KqlTables → kql-engine.ts (query) → BciKql.tsx (render)
 *
 * Capabilities:
 *   - Pipe-based syntax: table | where | sort by | project | take | join | summarize | distinct | count
 *   - Hash indexes for fast equality lookups on common fields
 *   - Array-aware contains/has operators
 *   - Query reordering: where → join → distinct → summarize → project → sort → take → count
 *   - Security limits: query length, operation count, result rows, execution timeout
 *
 * @module kql-engine
 */

// --- Types ---

export type Row = Record<string, unknown>;
export type TableData = Record<string, Row[]>;
export type HashIndex = Record<string, Record<string, number[]>>; // field → value → row indices

export interface QueryResult {
  rows: Row[];
  tableName: string;
  error: string | null;
}

export interface ParsedOp {
  type: 'where' | 'sort' | 'take' | 'project' | 'summarize' | 'distinct' | 'count' | 'join';
  arg: string;
  priority: number; // lower = execute first
}

// --- Security Limits ---

/** Max query string length (bytes) */
export const MAX_QUERY_LENGTH = 4096;
/** Max piped operations per query */
export const MAX_OPERATIONS = 12;
/** Max result rows before truncation */
export const MAX_RESULT_ROWS = 50_000;
/** Max query execution time (ms) */
export const MAX_EXECUTION_MS = 2000;

// --- Indexing ---

/** Fields worth indexing for equality lookups */
export const INDEXED_FIELDS = [
  'type', 'severity', 'security_posture', 'status', 'qif_band',
  'band', 'zone', 'fda_status', 'category', 'cluster', 'tier',
  'tara_domain', 'tara_mode', 'tara_drift', 'biological_target',
  'evidence_tier', 'dual_use', 'operational_readiness',
];

/**
 * Build hash indexes for all tables on indexed fields.
 * Only indexes fields that exist in the table's first row.
 */
export function buildIndexes(tables: TableData): Record<string, HashIndex> {
  const indexes: Record<string, HashIndex> = {};
  for (const [tableName, rows] of Object.entries(tables)) {
    const tableIdx: HashIndex = {};
    for (const field of INDEXED_FIELDS) {
      if (rows.length > 0 && field in rows[0]) {
        const fieldIdx: Record<string, number[]> = {};
        for (let i = 0; i < rows.length; i++) {
          const v = String(rows[i][field] ?? '');
          if (!fieldIdx[v]) fieldIdx[v] = [];
          fieldIdx[v].push(i);
        }
        tableIdx[field] = fieldIdx;
      }
    }
    if (Object.keys(tableIdx).length > 0) {
      indexes[tableName] = tableIdx;
    }
  }
  return indexes;
}

// --- Value Helpers ---

export function parseValue(raw: string): string | number | boolean {
  const trimmed = raw.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return '';
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== '') return num;
  return trimmed;
}

export function getField(row: Row, field: string): unknown {
  return row[field.trim()];
}

export function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

export function toStr(v: unknown): string {
  if (v == null) return '';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

/** Array-aware containment check */
export function valueContains(rv: unknown, val: string): boolean {
  if (Array.isArray(rv)) {
    const lower = val.toLowerCase();
    return rv.some(item => String(item).toLowerCase().includes(lower));
  }
  return toStr(rv).toLowerCase().includes(val.toLowerCase());
}

// --- Query Operators ---

export function applyWhere(
  rows: Row[],
  clause: string,
  tableName?: string,
  indexes?: Record<string, HashIndex>,
  allTableRows?: Row[],
): Row[] {
  const ops = ['!=', '>=', '<=', '==', '>', '<', '!contains', 'contains', 'startswith', 'has'];
  let matchedOp = '';
  let opIdx = -1;

  for (const op of ops) {
    const isSymbol = /[><=!]/.test(op[0]);
    if (isSymbol) {
      const idx = clause.indexOf(` ${op} `);
      if (idx >= 0) {
        matchedOp = op;
        opIdx = idx + 1;
        break;
      }
      const tightIdx = clause.indexOf(op);
      if (tightIdx > 0 && opIdx < 0) {
        matchedOp = op;
        opIdx = tightIdx;
        break;
      }
    } else {
      const idx = clause.indexOf(` ${op} `);
      if (idx >= 0) {
        matchedOp = op;
        opIdx = idx + 1;
        break;
      }
    }
  }

  if (!matchedOp || opIdx < 0) {
    throw new Error(`Invalid where clause: "${clause}". Expected: field op value`);
  }

  const field = clause.slice(0, opIdx).trim();
  const rawVal = clause.slice(opIdx + matchedOp.length).trim();
  const val = parseValue(rawVal);

  // Try hash index for equality lookups on full unfiltered table
  if (matchedOp === '==' && tableName && indexes && allTableRows && rows === allTableRows) {
    const tableIdx = indexes[tableName];
    if (tableIdx && tableIdx[field]) {
      const indices = tableIdx[field][String(val)];
      if (indices) return indices.map(i => allTableRows[i]);
      return [];
    }
  }

  return rows.filter(row => {
    const rv = getField(row, field);
    switch (matchedOp) {
      case '==': return toStr(rv) === String(val) || rv === val;
      case '!=': return toStr(rv) !== String(val) && rv !== val;
      case '>': return toNum(rv) > toNum(val);
      case '<': return toNum(rv) < toNum(val);
      case '>=': return toNum(rv) >= toNum(val);
      case '<=': return toNum(rv) <= toNum(val);
      case 'contains': return valueContains(rv, String(val));
      case '!contains': return !valueContains(rv, String(val));
      case 'startswith': return toStr(rv).toLowerCase().startsWith(String(val).toLowerCase());
      case 'has': return valueContains(rv, String(val));
      default: return true;
    }
  });
}

export function applySort(rows: Row[], clause: string): Row[] {
  const parts = clause.trim().split(/\s+/);
  const field = parts[0];
  const dir = (parts[1] || 'asc').toLowerCase();
  const sorted = [...rows].sort((a, b) => {
    const av = getField(a, field);
    const bv = getField(b, field);
    if (typeof av === 'number' && typeof bv === 'number') return av - bv;
    return toStr(av).localeCompare(toStr(bv));
  });
  return dir === 'desc' ? sorted.reverse() : sorted;
}

// Dangerous keys that could pollute prototypes if used as object keys
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype', 'toString', 'valueOf', 'hasOwnProperty']);

export function applyProject(rows: Row[], clause: string): Row[] {
  const fields = clause.split(',').map(f => f.trim()).filter(f => f && !FORBIDDEN_KEYS.has(f));
  return rows.map(row => {
    const out: Row = Object.create(null); // null prototype — immune to pollution
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(row, f)) {
        out[f] = row[f];
      }
    }
    return out;
  });
}

export function applySummarize(rows: Row[], clause: string): Row[] {
  const countMatch = clause.match(/count\(\)\s+by\s+(.+)/i);
  if (countMatch) {
    const field = countMatch[1].trim();
    const groups = new Map<string, number>();
    for (const row of rows) {
      const key = toStr(getField(row, field));
      groups.set(key, (groups.get(key) || 0) + 1);
    }
    return Array.from(groups.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ [field]: key, count }));
  }

  const aggMatch = clause.match(/(sum|avg|min|max)\((\w+)\)\s+by\s+(.+)/i);
  if (aggMatch) {
    const [, fn, numField, groupField] = aggMatch;
    const gf = groupField.trim();
    const groups = new Map<string, number[]>();
    for (const row of rows) {
      const key = toStr(getField(row, gf));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(toNum(getField(row, numField)));
    }
    return Array.from(groups.entries())
      .map(([key, vals]) => {
        let result: number;
        switch (fn.toLowerCase()) {
          case 'sum': result = vals.reduce((a, b) => a + b, 0); break;
          case 'avg': result = vals.reduce((a, b) => a + b, 0) / vals.length; break;
          case 'min': result = Math.min(...vals); break;
          case 'max': result = Math.max(...vals); break;
          default: result = 0;
        }
        return { [gf]: key, [fn.toLowerCase()]: Number(result.toFixed(2)), count: vals.length };
      })
      .sort((a, b) => (b[fn.toLowerCase()] as number) - (a[fn.toLowerCase()] as number));
  }

  throw new Error(`Invalid summarize: "${clause}". Expected: count() by field, or sum/avg/min/max(field) by field`);
}

export function applyDistinct(rows: Row[], clause: string): Row[] {
  const field = clause.trim();
  const seen = new Set<string>();
  const out: Row[] = [];
  for (const row of rows) {
    const v = toStr(getField(row, field));
    if (!seen.has(v)) {
      seen.add(v);
      out.push({ [field]: v });
    }
  }
  return out;
}

export function applyJoin(rows: Row[], clause: string, tables: TableData): Row[] {
  const match = clause.match(/^(\w+)\s+on\s+(.+)/i);
  if (!match) throw new Error(`Invalid join: "${clause}". Expected: join table on field`);

  const [, otherTable, onClause] = match;
  if (!tables[otherTable]) {
    throw new Error(`Join table "${otherTable}" not found. Available: ${Object.keys(tables).join(', ')}`);
  }

  const otherRows = tables[otherTable];
  const fields = onClause.split(',').map(f => f.trim());

  // Build hash of other table rows by join key
  const otherIndex = new Map<string, Row[]>();
  for (const oRow of otherRows) {
    const key = fields.map(f => String(oRow[f] ?? '')).join('|');
    if (!otherIndex.has(key)) otherIndex.set(key, []);
    otherIndex.get(key)!.push(oRow);
  }

  const result: Row[] = [];
  for (const row of rows) {
    const key = fields.map(f => String(row[f] ?? '')).join('|');
    const matches = otherIndex.get(key);
    if (matches) {
      for (const oRow of matches) {
        const merged: Row = { ...row };
        for (const [k, v] of Object.entries(oRow)) {
          if (k in merged && !fields.includes(k)) {
            merged[`${otherTable}_${k}`] = v;
          } else {
            merged[k] = v;
          }
        }
        result.push(merged);
      }
    }
  }
  return result;
}

// --- Parser ---

export function parseOperations(segments: string[]): ParsedOp[] {
  const ops: ParsedOp[] = [];
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.startsWith('where ')) {
      ops.push({ type: 'where', arg: seg.slice(6), priority: 0 });
    } else if (seg.startsWith('join ')) {
      ops.push({ type: 'join', arg: seg.slice(5), priority: 1 });
    } else if (seg.startsWith('distinct ')) {
      ops.push({ type: 'distinct', arg: seg.slice(9), priority: 2 });
    } else if (seg.startsWith('summarize ')) {
      ops.push({ type: 'summarize', arg: seg.slice(10), priority: 3 });
    } else if (seg.startsWith('project ')) {
      ops.push({ type: 'project', arg: seg.slice(8), priority: 4 });
    } else if (seg.startsWith('sort by ')) {
      ops.push({ type: 'sort', arg: seg.slice(8), priority: 5 });
    } else if (seg.startsWith('take ') || seg.startsWith('limit ')) {
      ops.push({ type: 'take', arg: seg.split(' ')[1], priority: 6 });
    } else if (seg === 'count') {
      ops.push({ type: 'count', arg: '', priority: 7 });
    } else {
      throw new Error(`Unknown operation: "${seg}"`);
    }
  }
  return ops;
}

// --- Executor ---

/**
 * Execute a KQL-style pipe query against a set of tables.
 *
 * Query syntax: tableName | op1 arg | op2 arg | ...
 *
 * Supported operators:
 *   where field op value     - Filter (==, !=, >, <, >=, <=, contains, !contains, startswith, has)
 *   sort by field [asc|desc] - Sort results
 *   take N / limit N         - Return first N rows
 *   project f1, f2, ...      - Select columns
 *   summarize count() by f   - Group and count
 *   summarize sum(f) by g    - Group and aggregate (sum/avg/min/max)
 *   distinct field            - Unique values
 *   count                     - Total row count
 *   join table on field       - Hash join with another table
 *
 * Operations are auto-reordered for efficiency:
 *   where (0) → join (1) → distinct (2) → summarize (3) → project (4) → sort (5) → take (6) → count (7)
 */
export function executeQuery(
  query: string,
  tables: TableData,
  indexes: Record<string, HashIndex>,
): QueryResult {
  const trimmed = query.trim();
  if (!trimmed) return { rows: [], tableName: '', error: null };

  if (trimmed.length > MAX_QUERY_LENGTH) {
    return { rows: [], tableName: '', error: `Query too long (${trimmed.length} chars). Maximum: ${MAX_QUERY_LENGTH}.` };
  }

  const segments = trimmed.split('|').map(s => s.trim());
  const tableName = segments[0];

  if (segments.length - 1 > MAX_OPERATIONS) {
    return { rows: [], tableName, error: `Too many operations (${segments.length - 1}). Maximum: ${MAX_OPERATIONS}.` };
  }

  if (!tables[tableName]) {
    const available = Object.keys(tables).join(', ');
    return { rows: [], tableName, error: `Unknown table "${tableName}". Available: ${available}` };
  }

  try {
    const startTime = performance.now();
    const ops = parseOperations(segments);
    ops.sort((a, b) => a.priority - b.priority);

    const allTableRows = tables[tableName];
    let rows = [...allTableRows];

    for (const op of ops) {
      if (performance.now() - startTime > MAX_EXECUTION_MS) {
        return { rows: rows.slice(0, MAX_RESULT_ROWS), tableName, error: `Query timed out after ${MAX_EXECUTION_MS}ms. Results truncated.` };
      }

      switch (op.type) {
        case 'where':
          rows = applyWhere(rows, op.arg, tableName, indexes, allTableRows);
          break;
        case 'join':
          rows = applyJoin(rows, op.arg, tables);
          if (rows.length > MAX_RESULT_ROWS) {
            rows = rows.slice(0, MAX_RESULT_ROWS);
          }
          break;
        case 'sort':
          rows = applySort(rows, op.arg);
          break;
        case 'take': {
          const n = parseInt(op.arg, 10);
          if (isNaN(n)) throw new Error(`Invalid take/limit value: ${op.arg}`);
          rows = rows.slice(0, Math.min(n, MAX_RESULT_ROWS));
          break;
        }
        case 'project':
          rows = applyProject(rows, op.arg);
          break;
        case 'summarize':
          rows = applySummarize(rows, op.arg);
          break;
        case 'distinct':
          rows = applyDistinct(rows, op.arg);
          break;
        case 'count':
          rows = [{ count: rows.length }];
          break;
      }
    }

    if (rows.length > MAX_RESULT_ROWS) {
      rows = rows.slice(0, MAX_RESULT_ROWS);
    }

    return { rows, tableName, error: null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { rows: [], tableName, error: msg };
  }
}
