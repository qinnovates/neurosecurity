import { useState } from 'react';
import Panel from '@/components/lab-kit/Panel';
import type { TableData } from '@/lib/kql-engine';
import { QUERY_TABLE_DESCRIPTIONS } from '@/lib/threat-model/query-tables';

interface Props {
  deviceTables: TableData;
  /** The site's tables as the Lab may show them; null while loading. */
  siteTables: TableData | null;
  siteError: string | null;
  /** The table whose columns are shown, or null. */
  openTable: string | null;
  onOpenTable: (tableName: string) => void;
}

function TableButton({ name, rowCount, isOpen, note, onOpen }: { name: string; rowCount: number; isOpen: boolean; note?: string; onOpen: () => void }) {
  return (
    <li>
      <button type="button" className="query-table" aria-pressed={isOpen} title={note} onClick={onOpen}>
        <span className="lab-id">{name}</span>
        <span className="lab-figure">{rowCount.toLocaleString('en-US')}</span>
      </button>
    </li>
  );
}

/**
 * Every table that can be queried, with its size, read from the same data the console
 * runs on, so the list and the results cannot disagree. Choosing a table shows its
 * columns and runs a first look at it.
 */
export default function SchemaBrowser({ deviceTables, siteTables, siteError, openTable, onOpenTable }: Props) {
  const [filter, setFilter] = useState('');
  const needle = filter.trim().toLowerCase();
  const siteNames = Object.keys(siteTables ?? {}).sort().filter((name) => name.includes(needle));
  const deviceNames = Object.keys(QUERY_TABLE_DESCRIPTIONS).filter((name) => name.includes(needle));
  const openRows = openTable === null ? undefined : (deviceTables[openTable] ?? siteTables?.[openTable]);
  const openColumns = Object.keys(openRows?.[0] ?? {});

  return (
    <Panel title="Tables">
      <input className="catalog-search" type="search" placeholder="Find a table" aria-label="Find a table by name" value={filter} onChange={(event) => setFilter(event.target.value)} />
      <p className="lab-label query-group">This device</p>
      <ul className="query-table-list">
        {deviceNames.map((name) => (
          <TableButton key={name} name={name} rowCount={deviceTables[name]?.length ?? 0} isOpen={name === openTable} note={QUERY_TABLE_DESCRIPTIONS[name as keyof typeof QUERY_TABLE_DESCRIPTIONS]} onOpen={() => onOpenTable(name)} />
        ))}
      </ul>
      <p className="lab-label query-group">TARA database{siteTables !== null && `, ${Object.keys(siteTables).length} tables`}</p>
      {siteError !== null && <p className="tm-error" role="alert">{siteError}</p>}
      {siteTables === null && siteError === null && <p className="lab-soft" role="status">Loading the database…</p>}
      <ul className="query-table-list query-table-list--long">
        {siteNames.map((name) => <TableButton key={name} name={name} rowCount={siteTables?.[name]?.length ?? 0} isOpen={name === openTable} onOpen={() => onOpenTable(name)} />)}
      </ul>
      {needle !== '' && deviceNames.length + siteNames.length === 0 && <p className="lab-soft">No table name contains “{filter.trim()}”.</p>}
      {openTable !== null && (
        <>
          <p className="lab-label query-group">Columns of <span className="lab-id">{openTable}</span></p>
          <p className="lab-id query-columns">{openColumns.length === 0 ? 'This table has no rows, so its columns are not known.' : openColumns.join(' · ')}</p>
        </>
      )}
      <p className="lab-soft query-group">Named companies and devices carry published specifications only here. Tables and columns that score them are left out of the Lab.</p>
    </Panel>
  );
}
