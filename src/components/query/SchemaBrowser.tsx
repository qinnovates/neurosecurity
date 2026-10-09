import { useState } from 'react';
import Panel from '@/components/lab-kit/Panel';
import type { TableData } from '@/lib/kql-engine';
import { LAB_TABLE_POLICY_STATEMENT } from '@/lib/threat-model/lab-table-policy';
import { QUERY_TABLE_DESCRIPTIONS } from '@/lib/threat-model/query-tables';
import { groupTables } from './schema-groups';

interface Props {
  /** Every table the console can run on: the device's own and the site's. */
  tables: TableData;
  /** False while the site's tables are still loading. */
  isSiteLoaded: boolean;
  siteError: string | null;
  /** The table whose columns are shown, or null. */
  openTable: string | null;
  onOpenTable: (tableName: string) => void;
}

function TableButton({ name, rowCount, isOpen, onOpen }: { name: string; rowCount: number; isOpen: boolean; onOpen: () => void }) {
  return (
    <li>
      <button type="button" className="query-table" aria-pressed={isOpen} title={QUERY_TABLE_DESCRIPTIONS[name]} onClick={onOpen}>
        <span className="lab-id">{name}</span>
        <span className="lab-figure">{rowCount.toLocaleString('en-US')}</span>
      </button>
    </li>
  );
}

/**
 * Every table that can be queried, with its size, under three groups. The list is read from
 * the same data the console runs on, so it and the results cannot disagree. Choosing a table
 * shows its columns and runs a first look at it.
 */
export default function SchemaBrowser({ tables, isSiteLoaded, siteError, openTable, onOpenTable }: Props) {
  const [filter, setFilter] = useState('');
  const needle = filter.trim().toLowerCase();
  const groups = groupTables(Object.keys(tables).filter((name) => name.toLowerCase().includes(needle)));
  const openColumns = Object.keys((openTable === null ? undefined : tables[openTable])?.[0] ?? {});
  const hasMatch = groups.some((group) => group.tables.length > 0);

  return (
    <Panel title="Tables">
      <input className="lab-input" type="search" placeholder="Find a table" aria-label="Find a table by name" value={filter} onChange={(event) => setFilter(event.target.value)} />
      {siteError !== null && <p className="lab-notice query-group" role="alert">{siteError}</p>}
      {!isSiteLoaded && siteError === null && <p className="lab-soft query-group" role="status">Loading the database…</p>}
      {groups.filter((group) => group.tables.length > 0).map((group) => (
        <section key={group.id} aria-label={group.label}>
          <h3 className="lab-label query-group">{group.label}</h3>
          <ul className="query-table-list">
            {group.tables.map((name) => <TableButton key={name} name={name} rowCount={tables[name]?.length ?? 0} isOpen={name === openTable} onOpen={() => onOpenTable(name)} />)}
          </ul>
        </section>
      ))}
      {needle !== '' && !hasMatch && <p className="lab-soft query-group">No table name contains “{filter.trim()}”.</p>}
      {openTable !== null && (
        <>
          <p className="lab-label query-group">Columns of <span className="lab-id">{openTable}</span></p>
          <p className="lab-id query-columns">{openColumns.length === 0 ? 'This table has no rows, so its columns are not known.' : openColumns.join(' · ')}</p>
        </>
      )}
      <p className="lab-soft query-group">{LAB_TABLE_POLICY_STATEMENT}</p>
    </Panel>
  );
}
