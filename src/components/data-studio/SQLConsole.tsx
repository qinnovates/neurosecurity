/**
 * SQLConsole — DuckDB-WASM SQL console for the QIF Data Studio.
 *
 * Lazy-loaded: DuckDB-WASM only initializes when the user clicks "Open SQL Console".
 * All queries run entirely in the browser via WebAssembly. No data leaves the machine.
 *
 * Features:
 *   - Textarea SQL input with example query chips
 *   - Run button with query execution timing
 *   - Results table (max 10,000 rows)
 *   - CSV export (client-side)
 *   - Graceful error handling and fallback
 */

import { useState, useCallback, useRef } from 'react';
import { useDuckDB, type DuckDBResult } from '../../hooks/useDuckDB';

// ── Example Queries ────────────────────────────────────────────────────

const EXAMPLE_QUERIES = [
  {
    label: 'Critical techniques',
    sql: "SELECT * FROM techniques WHERE severity = 'critical'",
  },
  {
    label: 'Techniques by tactic',
    sql: 'SELECT tactic, COUNT(*) as count FROM techniques GROUP BY tactic ORDER BY count DESC',
  },
  {
    label: 'Top BCI companies',
    sql: 'SELECT company, device_count, tara_attack_surface FROM companies ORDER BY device_count DESC LIMIT 10',
  },
  {
    label: 'High-impact chains',
    sql: 'SELECT * FROM impact_chains WHERE niss_score > 8 LIMIT 20',
  },
] as const;

// ── Styles ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid #e2e8f0',
    borderRadius: '1rem',
    overflow: 'hidden' as const,
  },
  header: {
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 700 as const,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: '0.125rem',
  },
  body: {
    padding: '1.25rem',
  },
  textarea: {
    width: '100%',
    minHeight: '100px',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0',
    fontSize: '0.8125rem',
    fontFamily: 'var(--font-mono, "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace)',
    lineHeight: 1.6,
    resize: 'vertical' as const,
    outline: 'none',
    background: '#fafbfc',
    color: '#1e293b',
    boxSizing: 'border-box' as const,
  },
  chipRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
    marginBottom: '0.75rem',
  },
  chip: {
    padding: '0.25rem 0.625rem',
    borderRadius: '2rem',
    fontSize: '0.6875rem',
    fontWeight: 600 as const,
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.1s',
  },
  actionRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    marginTop: '0.75rem',
  },
  runButton: {
    padding: '0.5rem 1.25rem',
    borderRadius: '0.5rem',
    fontSize: '0.8125rem',
    fontWeight: 600 as const,
    border: 'none',
    cursor: 'pointer',
    background: '#0f172a',
    color: '#fff',
    transition: 'opacity 0.1s',
  },
  runButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed' as const,
  },
  exportButton: {
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: 600 as const,
    border: '1px solid #e2e8f0',
    background: '#fff',
    color: '#475569',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  timing: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontFamily: 'var(--font-mono, monospace)',
    marginLeft: 'auto',
  },
  errorBox: {
    marginTop: '1rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    fontSize: '0.8125rem',
    fontFamily: 'var(--font-mono, monospace)',
    color: '#991b1b',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  resultMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.625rem 1rem',
    borderTop: '1px solid #e2e8f0',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
    fontSize: '0.75rem',
    color: '#64748b',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono, monospace)',
  },
  th: {
    padding: '0.5rem 0.75rem',
    textAlign: 'left' as const,
    borderBottom: '2px solid #e2e8f0',
    background: '#f8fafc',
    fontWeight: 600 as const,
    color: '#475569',
    whiteSpace: 'nowrap' as const,
    position: 'sticky' as const,
    top: 0,
  },
  td: {
    padding: '0.375rem 0.75rem',
    borderBottom: '1px solid #f1f5f9',
    whiteSpace: 'nowrap' as const,
    maxWidth: '300px',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
  },
  loadingBar: {
    height: '3px',
    background: '#e2e8f0',
    borderRadius: '2px',
    overflow: 'hidden' as const,
    marginTop: '0.75rem',
  },
  loadingFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  openButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: 600 as const,
    border: '1px solid #e2e8f0',
    background: '#fff',
    color: '#0f172a',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.15s',
  },
  fallbackBox: {
    padding: '1.5rem',
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '0.75rem',
    textAlign: 'center' as const,
  },
  privacyNote: {
    fontSize: '0.6875rem',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
} as const;

// ── Component ──────────────────────────────────────────────────────────

export default function SQLConsole() {
  const { state, error: initError, loadProgress, initialize, executeQuery } = useDuckDB();
  const [sql, setSql] = useState('');
  const [result, setResult] = useState<DuckDBResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [timing, setTiming] = useState<number | null>(null);
  const downloadRef = useRef<HTMLAnchorElement>(null);

  // ── Init ─────────────────────────────────────────────────────────────

  const handleOpen = useCallback(async () => {
    await initialize();
  }, [initialize]);

  // ── Execute ──────────────────────────────────────────────────────────

  const handleRun = useCallback(async () => {
    const trimmed = sql.trim();
    if (!trimmed) return;

    setRunning(true);
    setQueryError(null);
    setResult(null);
    setTiming(null);

    const start = performance.now();

    try {
      const res = await executeQuery(trimmed);
      const elapsed = performance.now() - start;
      setResult(res);
      setTiming(elapsed);
    } catch (err: any) {
      setQueryError(err?.message || 'Query failed.');
      setTiming(performance.now() - start);
    } finally {
      setRunning(false);
    }
  }, [sql, executeQuery]);

  // ── Keyboard shortcut ────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  }, [handleRun]);

  // ── CSV Export ───────────────────────────────────────────────────────

  const handleExportCSV = useCallback(() => {
    if (!result || result.rows.length === 0) return;

    const escapeCSV = (val: unknown): string => {
      if (val == null) return '';
      let str = String(val);
      // Formula injection protection: prefix values starting with =, +, -, @, \t, \r
      // These can trigger formula execution in Excel/LibreOffice when CSV is opened
      if (/^[=+\-@\t\r]/.test(str)) {
        str = "'" + str;
      }
      // Escape CSV: wrap in quotes if contains comma, quote, newline, or carriage return
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r') || str.includes('\t')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };
    const header = result.columns.map(c => escapeCSV(c)).join(',');
    const rows = result.rows.map(row =>
      result.columns.map(col => escapeCSV(row[col])).join(',')
    );

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    if (downloadRef.current) {
      downloadRef.current.href = url;
      downloadRef.current.download = 'qif-query-results.csv';
      downloadRef.current.click();
      // Delay revoke so the browser has time to start the download
      setTimeout(() => URL.revokeObjectURL(url), 500);
    }
  }, [result]);

  // ── Idle state: show open button ─────────────────────────────────────

  if (state === 'idle') {
    return (
      <div>
        <button
          onClick={handleOpen}
          style={styles.openButton}
          onMouseEnter={e => { (e.target as HTMLElement).style.background = '#f8fafc'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.background = '#fff'; }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <rect x="1" y="3" width="14" height="10" rx="2" stroke="#475569" strokeWidth="1.5" fill="none" />
            <path d="M4 7h8M4 9.5h5" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Open SQL Console
        </button>
        <p style={{ ...styles.privacyNote, marginTop: '0.5rem', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v4l2 1" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="6" cy="6" r="5" stroke="#94a3b8" strokeWidth="1.2" fill="none" />
          </svg>
          Loads DuckDB-WASM (~4MB). Runs entirely in your browser.
        </p>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────

  if (state === 'loading') {
    return (
      <div style={{ ...styles.container, padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: '#475569', margin: '0 0 0.5rem' }}>
          Loading SQL engine (~4MB)...
        </p>
        <div style={styles.loadingBar}>
          <div style={{ ...styles.loadingFill, width: `${loadProgress}%` }} />
        </div>
        <p style={{ ...styles.privacyNote, marginTop: '0.75rem', justifyContent: 'center' }}>
          Downloading DuckDB-WASM from jsDelivr CDN
        </p>
      </div>
    );
  }

  // ── Error state: graceful fallback ───────────────────────────────────

  if (state === 'error') {
    return (
      <div style={styles.fallbackBox}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#92400e', margin: '0 0 0.5rem' }}>
          SQL Console unavailable
        </p>
        <p style={{ fontSize: '0.8125rem', color: '#a16207', margin: '0 0 1rem' }}>
          {initError || 'DuckDB-WASM failed to load. Your browser may not support WebAssembly.'}
        </p>
        <p style={{ fontSize: '0.8125rem', color: '#78716c', margin: 0 }}>
          You can still download the Parquet files and query them locally:
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <a href="/data/parquet/techniques.parquet" download style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>techniques.parquet</a>
          <a href="/data/parquet/companies.parquet" download style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>companies.parquet</a>
          <a href="/data/parquet/impact_chains.parquet" download style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>impact_chains.parquet</a>
          <a href="/data/parquet/devices.parquet" download style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>devices.parquet</a>
        </div>
        <button
          onClick={handleOpen}
          style={{ ...styles.runButton, marginTop: '1rem', background: '#92400e', fontSize: '0.75rem' }}
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Ready state: full console ────────────────────────────────────────

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>SQL Console</h3>
          <p style={styles.subtitle}>DuckDB-WASM — queries run in your browser</p>
        </div>
        <div style={styles.privacyNote}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="3" y="5" width="6" height="5" rx="1" stroke="#94a3b8" strokeWidth="1.2" fill="none" />
            <path d="M4.5 5V3.5a1.5 1.5 0 013 0V5" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          No data leaves your machine
        </div>
      </div>

      <div style={styles.body}>
        {/* Example query chips */}
        <div style={styles.chipRow}>
          <span style={{ fontSize: '0.6875rem', color: '#94a3b8', alignSelf: 'center' }}>Try:</span>
          {EXAMPLE_QUERIES.map((q, i) => (
            <button
              key={i}
              onClick={() => setSql(q.sql)}
              style={styles.chip}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.background = '#eef2ff';
                (e.target as HTMLElement).style.borderColor = '#c7d2fe';
                (e.target as HTMLElement).style.color = '#4338ca';
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.background = '#f8fafc';
                (e.target as HTMLElement).style.borderColor = '#e2e8f0';
                (e.target as HTMLElement).style.color = '#475569';
              }}
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* SQL input */}
        <textarea
          value={sql}
          onChange={e => setSql(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="SELECT * FROM techniques LIMIT 10;"
          style={styles.textarea}
          spellCheck={false}
        />

        {/* Action row */}
        <div style={styles.actionRow}>
          <button
            onClick={handleRun}
            disabled={running || !sql.trim()}
            style={{
              ...styles.runButton,
              ...(running || !sql.trim() ? styles.runButtonDisabled : {}),
            }}
          >
            {running ? 'Running...' : 'Run Query'}
          </button>

          <span style={{ fontSize: '0.6875rem', color: '#cbd5e1' }}>
            {navigator.platform?.includes('Mac') ? '\u2318' : 'Ctrl'}+Enter
          </span>

          {result && result.rows.length > 0 && (
            <button onClick={handleExportCSV} style={styles.exportButton}>
              Export CSV
            </button>
          )}

          {timing !== null && (
            <span style={styles.timing}>
              {timing < 1000 ? `${timing.toFixed(0)}ms` : `${(timing / 1000).toFixed(2)}s`}
            </span>
          )}
        </div>

        {/* Hidden download anchor for CSV export */}
        <a ref={downloadRef} style={{ display: 'none' }} />

        {/* Query error */}
        {queryError && (
          <div style={styles.errorBox}>{queryError}</div>
        )}
      </div>

      {/* Results */}
      {result && result.rows.length > 0 && (
        <>
          <div style={styles.resultMeta} aria-live="polite">
            <span>
              <strong>{result.rowCount.toLocaleString()}</strong> row{result.rowCount !== 1 ? 's' : ''}
              {result.truncated && (
                <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>
                  (showing first {MAX_DISPLAY_ROWS.toLocaleString()})
                </span>
              )}
            </span>
            <span>{result.columns.length} column{result.columns.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
            <table style={styles.table}>
              <caption style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>SQL query results</caption>
              <thead>
                <tr>
                  {result.columns.map(col => (
                    <th key={col} scope="col" style={styles.th}>{col.replace(/_/g, ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    {result.columns.map(col => {
                      const val = row[col];
                      const display = val == null || val === ''
                        ? '\u2014'
                        : typeof val === 'object'
                          ? JSON.stringify(val).slice(0, 60)
                          : String(val).length > 80
                            ? String(val).slice(0, 80) + '...'
                            : String(val);
                      return (
                        <td
                          key={col}
                          style={{
                            ...styles.td,
                            color: val == null ? '#cbd5e1' : '#1e293b',
                          }}
                        >{display}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Empty result */}
      {result && result.rows.length === 0 && !queryError && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', borderTop: '1px solid #e2e8f0' }}>
          Query returned 0 rows.
        </div>
      )}
    </div>
  );
}

// Mirror the constant from the hook for display
const MAX_DISPLAY_ROWS = 10_000;
