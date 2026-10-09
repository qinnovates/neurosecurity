import { useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import Panel from '@/components/lab-kit/Panel';
import { useFocus } from '@/components/workbench/FocusContext';
import type { ModeProps } from '@/components/workbench/mode-registry';
import { MAX_QUERY_LENGTH, buildIndexes, executeQuery, type QueryResult, type TableData } from '@/lib/kql-engine';
import { buildQueryTables } from '@/lib/threat-model/query-tables';
import { escapeCsvCell } from '@/lib/threat-model/register-csv';
import QueryResultView, { formatCell } from './QueryResultView';
import SchemaBrowser from './SchemaBrowser';
import { STARTER_QUERIES } from './starter-queries';
import { useSiteDatabase } from './use-site-database';
import '@/components/threat-model/threat-model.css';
import '@/components/explore/explore.css';
import './query.css';

const MAX_HISTORY = 8;
/** What choosing a table runs: enough rows to see its shape. */
const FIRST_LOOK_ROWS = 20;

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

/** The Lab refuses a column no row carries; the public query pages keep the engine's default. */
const LAB_QUERY_OPTIONS = { strictColumns: true } as const;

/** The Query mode: ask precise questions of the device in focus and of the catalog. Runs in the browser; nothing is sent anywhere. */
export default function QueryMode(_props: ModeProps) {
  const { report, engineData, referenceData } = useFocus();
  const deviceTables = useMemo(() => buildQueryTables(report, engineData, referenceData.placementRules), [report, engineData, referenceData]);
  const { tables: siteTables, error: siteError } = useSiteDatabase();

  // Device tables come last so a site table can never shadow one of them.
  const tables = useMemo<TableData>(() => ({ ...(siteTables ?? {}), ...deviceTables }), [siteTables, deviceTables]);
  const indexes = useMemo(() => buildIndexes(tables), [tables]);
  const tableNames = useMemo(() => Object.keys(tables).sort(), [tables]);
  const [draft, setDraft] = useState(STARTER_QUERIES[0].query);
  const [submitted, setSubmitted] = useState(STARTER_QUERIES[0].query);
  const [openTable, setOpenTable] = useState<string | null>(null);
  // Recomputed when the device changes, so results always describe the device in focus.
  const result = useMemo(() => executeQuery(submitted, tables, indexes, LAB_QUERY_OPTIONS), [submitted, tables, indexes]);

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
  const openAndLook = (tableName: string): void => {
    setOpenTable(tableName);
    run(`${tableName} | take ${FIRST_LOOK_ROWS}`);
  };
  const canExport = result.error === null && result.rows.length > 0;

  return (
    <div className="query">
      <SchemaBrowser deviceTables={deviceTables} siteTables={siteTables} siteError={siteError} openTable={openTable} onOpenTable={openAndLook} />
      <div className="query-main">
        <Panel title="Query">
          <form onSubmit={submit}>
            <textarea
              className="query-editor" rows={3} spellCheck={false} maxLength={MAX_QUERY_LENGTH} aria-label="Query"
              value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={runOnShortcut}
            />
            <div className="query-actions">
              <button type="submit" className="lab-button lab-button--primary">Run</button>
              <button type="button" className="lab-button" disabled={!canExport} onClick={() => downloadCsv(toCsv(result))}>Export results (CSV)</button>
              <span className="lab-soft">Pipe syntax: table | where | join t on a == b | project | sort by | summarize count() by | take. Ctrl or Cmd + Enter runs it.</span>
            </div>
          </form>
          <p className="lab-label query-group">Start from a question</p>
          <div className="query-starters">
            {STARTER_QUERIES.filter((starter) => !starter.needsSiteDatabase || siteTables !== null).map((starter) => (
              <button key={starter.label} type="button" className="lab-chip" aria-pressed={submitted === starter.query} onClick={() => run(starter.query)}>{starter.label}</button>
            ))}
          </div>
          {history.length > 1 && (
            <div className="query-history" role="group" aria-label="Earlier queries in this visit">
              <span className="lab-label">Earlier</span>
              {history.slice(1).map((query) => <button key={query} type="button" className="lab-chip" title={query} onClick={() => run(query)}>{query}</button>)}
            </div>
          )}
        </Panel>
        <section className="lab-panel" aria-label="Result" aria-live="polite">
          <div className="lab-panel-body"><QueryResultView result={result} tableNames={tableNames} /></div>
        </section>
      </div>
    </div>
  );
}
