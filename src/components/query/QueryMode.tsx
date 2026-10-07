import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useFocus } from '@/components/workbench/FocusContext';
import type { ModeProps } from '@/components/workbench/mode-registry';
import { MAX_QUERY_LENGTH, buildIndexes, executeQuery, type QueryResult, type TableData } from '@/lib/kql-engine';
import { QUERY_TABLE_DESCRIPTIONS, buildQueryTables } from '@/lib/threat-model/query-tables';
import { escapeCsvCell } from '@/lib/threat-model/register-csv';
import { SiteDatabaseError, loadSiteDatabase } from './load-site-database';
import { STARTER_QUERIES } from './starter-queries';
import '@/components/threat-model/threat-model.css';

const MAX_ROWS_SHOWN = 200;
const MAX_HISTORY = 8;
const HISTORY_LABEL_LENGTH = 70;

/** Every row of a result as CSV, with spreadsheet formula characters neutralised. */
function toCsv(result: QueryResult): string {
  const columns = Object.keys(result.rows[0] ?? {});
  const lines = [columns, ...result.rows.map((row) => columns.map((column) => formatCell(row[column])))];
  return `${lines.map((cells) => cells.map(escapeCsvCell).join(',')).join('\r\n')}\r\n`;
}

function downloadCsv(csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'tara-lab-query.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function ResultTable({ result }: { result: QueryResult }) {
  if (result.error !== null) return <p className="tm-error" role="alert">{result.error}</p>;
  if (result.rows.length === 0) return <p className="tm-muted">No rows match.</p>;
  const columns = Object.keys(result.rows[0]);
  const shown = result.rows.slice(0, MAX_ROWS_SHOWN);
  return (
    <>
      <p className="tm-muted tm-small">{result.rows.length} row{result.rows.length === 1 ? '' : 's'}{result.rows.length > shown.length ? `, first ${shown.length} shown` : ''}.</p>
      <div className="tm-table-wrap">
        <table className="tm-table">
          <thead><tr>{columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
          <tbody>
            {shown.map((row, index) => (
              <tr key={index}>{columns.map((column) => <td key={column}>{formatCell(row[column])}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** The Query mode: ask precise questions of the device in focus. Runs in the browser; nothing is sent anywhere. */
export default function QueryMode(_props: ModeProps) {
  const { report, engineData, referenceData } = useFocus();
  const deviceTables = useMemo(() => buildQueryTables(report, engineData, referenceData.placementRules), [report, engineData, referenceData]);
  const [siteTables, setSiteTables] = useState<TableData | null>(null);
  const [siteError, setSiteError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadSiteDatabase(controller.signal)
      .then(setSiteTables)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setSiteError(error instanceof SiteDatabaseError ? error.message : 'The TARA database could not be loaded. Device tables still work.');
      });
    return () => controller.abort();
  }, []);

  // Device tables come last so a site table can never shadow one of them.
  const tables = useMemo<TableData>(() => ({ ...(siteTables ?? {}), ...deviceTables }), [siteTables, deviceTables]);
  const indexes = useMemo(() => buildIndexes(tables), [tables]);
  const siteTableNames = useMemo(() => Object.keys(siteTables ?? {}).sort(), [siteTables]);
  const [draft, setDraft] = useState(STARTER_QUERIES[0].query);
  const [submitted, setSubmitted] = useState(STARTER_QUERIES[0].query);
  // Recomputed when the device changes, so results always describe the device in focus.
  const result = useMemo(() => executeQuery(submitted, tables, indexes), [submitted, tables, indexes]);

  // Kept in memory for this visit only; a reload clears it.
  const [history, setHistory] = useState<string[]>([]);
  const run = (query: string): void => {
    setDraft(query);
    setSubmitted(query);
    setHistory((previous) => [query, ...previous.filter((earlier) => earlier !== query)].slice(0, MAX_HISTORY));
  };
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    run(draft);
  };
  const runOnShortcut = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      run(draft);
    }
  };
  const runStarter = run;
  const canExport = result.error === null && result.rows.length > 0;

  return (
    <div className="tm-root tm-grid">
      <aside>
        <section className="tm-card">
          <h2 className="tm-heading">Start from a question</h2>
          <div className="tm-actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            {STARTER_QUERIES.filter((starter) => !starter.needsSiteDatabase || siteTables !== null).map((starter) => (
              <button key={starter.label} type="button" className="tm-button" style={{ textAlign: 'left' }} aria-pressed={submitted === starter.query} onClick={() => runStarter(starter.query)}>
                {starter.label}
              </button>
            ))}
          </div>
        </section>
        <section className="tm-card">
          <h2 className="tm-heading">This device</h2>
          <ul className="tm-list">
            {Object.entries(QUERY_TABLE_DESCRIPTIONS).map(([name, description]) => (
              <li key={name}><span className="tm-mono">{name}</span> <span className="tm-muted">({deviceTables[name]?.length ?? 0}) {description}</span></li>
            ))}
          </ul>
        </section>
        <section className="tm-card" aria-live="polite">
          <h2 className="tm-heading">TARA database</h2>
          {siteError !== null && <p className="tm-error" role="alert">{siteError}</p>}
          {siteTables === null && siteError === null && <p className="tm-muted" role="status">Loading…</p>}
          {siteTables !== null && (
            <>
              <p className="tm-muted">{siteTableNames.length} tables from the site database. To join one to your device, name both key fields, for example <span className="tm-mono">join techniques on technique_id == id</span>.</p>
              <p className="tm-mono" style={{ marginTop: '0.5rem', maxHeight: '11rem', overflowY: 'auto' }}>
                {siteTableNames.map((name) => `${name} (${siteTables[name].length})`).join(' · ')}
              </p>
            </>
          )}
        </section>
      </aside>
      <div>
        <form className="tm-card" onSubmit={submit}>
          <label className="tm-field">
            <span className="tm-label">Query</span>
            <textarea
              className="tm-input tm-mono" rows={3} spellCheck={false} maxLength={MAX_QUERY_LENGTH}
              value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={runOnShortcut}
            />
          </label>
          <div className="tm-actions">
            <button type="submit" className="tm-button tm-button--primary">Run</button>
            <button type="button" className="tm-button" disabled={!canExport} onClick={() => downloadCsv(toCsv(result))}>Export results (CSV)</button>
            <span className="tm-muted tm-small">Pipe syntax: table | where | join t on a == b | project | sort by | summarize count() by | take. Ctrl or Cmd + Enter runs it. Runs in your browser.</span>
          </div>
          {history.length > 1 && (
            <div className="tm-actions" style={{ marginTop: '0.625rem' }} role="group" aria-label="Earlier queries in this visit">
              <span className="lab-label">Earlier</span>
              {history.slice(1).map((query) => (
                <button key={query} type="button" className="tm-button tm-mono tm-small" title={query} onClick={() => run(query)}>
                  {query.length > HISTORY_LABEL_LENGTH ? `${query.slice(0, HISTORY_LABEL_LENGTH)}…` : query}
                </button>
              ))}
            </div>
          )}
        </form>
        <section className="tm-card" aria-live="polite">
          <ResultTable result={result} />
        </section>
      </div>
    </div>
  );
}
