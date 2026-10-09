import { useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import Panel from '@/components/lab-kit/Panel';
import { useFocus } from '@/components/workbench/FocusContext';
import type { ModeProps } from '@/components/workbench/mode-registry';
import { useViewState } from '@/components/workbench/ViewStateContext';
import { MAX_QUERY_LENGTH, buildIndexes, executeQuery, type QueryResult, type TableData } from '@/lib/kql-engine';
import { buildQueryTables } from '@/lib/threat-model/query-tables';
import { escapeCsvCell } from '@/lib/threat-model/register-csv';
import { formatCell } from './query-result-columns';
import QueryResultView from './QueryResultView';
import SchemaBrowser from './SchemaBrowser';
import { STARTER_QUERIES } from './starter-queries';
import { useOpenTechniqueInCatalog } from './use-open-technique';
import { useSiteDatabase } from './use-site-database';
import './query.css';

const MAX_HISTORY = 8;
/** What choosing a table runs: enough rows to see its shape. */
const FIRST_LOOK_ROWS = 20;
const EXPORT_FILE_NAME = 'tara-lab-query.csv';
const SYNTAX_HINT = 'Pipe syntax: table | where | join t on a == b | project | sort by | summarize count() by | take. Ctrl or Cmd + Enter runs it.';

/** The Lab refuses a column no row carries; the public query pages keep the engine's default. */
export const LAB_QUERY_OPTIONS = { strictColumns: true } as const;

function isTableNameOrNull(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

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
  anchor.download = EXPORT_FILE_NAME;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** The Query mode: ask precise questions of the device in focus and of the catalog. Runs in the browser; nothing is sent anywhere. */
export default function QueryMode(_props: ModeProps) {
  const { report, engineData, referenceData, techniqueById } = useFocus();
  const deviceTables = useMemo(() => buildQueryTables(report, engineData, referenceData.placementRules), [report, engineData, referenceData]);
  const { tables: siteTables, error: siteError } = useSiteDatabase();

  // Device tables come last so a site table can never shadow one of them.
  const tables = useMemo<TableData>(() => ({ ...(siteTables ?? {}), ...deviceTables }), [siteTables, deviceTables]);
  const indexes = useMemo(() => buildIndexes(tables), [tables]);
  const tableNames = useMemo(() => Object.keys(tables).sort(), [tables]);
  const techniqueIds = useMemo(() => new Set(techniqueById.keys()), [techniqueById]);
  const [submitted, setSubmitted] = useViewState('query/console/submitted', STARTER_QUERIES[0].query);
  const [draft, setDraft] = useState(submitted);
  const [openTable, setOpenTable] = useViewState<string | null>('query/console/open-table', null, isTableNameOrNull);
  // Recomputed when the device changes, so results always describe the device in focus.
  const result = useMemo(() => executeQuery(submitted, tables, indexes, LAB_QUERY_OPTIONS), [submitted, tables, indexes]);
  const openTechnique = useOpenTechniqueInCatalog();

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
      <Panel title="Query">
        <form onSubmit={submit}>
          <textarea
            className="query-editor" rows={3} spellCheck={false} maxLength={MAX_QUERY_LENGTH} aria-label="Query"
            value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={runOnShortcut}
          />
          <div className="query-actions">
            <button type="submit" className="lab-button lab-button--primary">Run</button>
            <button type="button" className="lab-button" disabled={!canExport} onClick={() => downloadCsv(toCsv(result))}>Export results (CSV)</button>
            <span className="lab-soft">{SYNTAX_HINT}</span>
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
      <div className="query-body">
        <section className="lab-panel" id="lab-results" aria-label="Result" tabIndex={-1}>
          <div className="lab-panel-body"><QueryResultView result={result} tableNames={tableNames} techniqueIds={techniqueIds} onOpenTechnique={openTechnique} /></div>
        </section>
        <SchemaBrowser tables={tables} isSiteLoaded={siteTables !== null} siteError={siteError} openTable={openTable} onOpenTable={openAndLook} />
      </div>
    </div>
  );
}
