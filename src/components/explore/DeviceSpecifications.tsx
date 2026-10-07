import { useMemo, useState } from 'react';
import DataTable, { type DataTableColumn } from '@/components/lab-kit/DataTable';
import FilterChip from '@/components/lab-kit/FilterChip';
import { useSiteDatabase } from '@/components/query/use-site-database';

type SpecRow = Record<string, unknown>;

/** The published facts shown for a named device. Nothing about security posture, scores or counts is listed. */
const SPEC_COLUMNS: readonly { key: string; header: string; isNumeric?: boolean }[] = [
  { key: 'device', header: 'Device' },
  { key: 'company', header: 'Company' },
  { key: 'type', header: 'Type' },
  { key: 'channels', header: 'Channels', isNumeric: true },
  { key: 'electrode_type', header: 'Electrodes' },
  { key: 'fda_status', header: 'Regulatory status' },
  { key: 'first_human', header: 'First human use' },
  { key: 'target_use', header: 'Use' },
];
const DEVICES_TABLE = 'devices';
const TYPE_COLUMN = 'type';
const NOT_PUBLISHED = 'Not published';

function readText(row: SpecRow, key: string): string {
  const value = row[key];
  if (value === null || value === undefined || value === '') return NOT_PUBLISHED;
  return String(value).replaceAll('_', ' ');
}

const COLUMNS: readonly DataTableColumn<SpecRow>[] = SPEC_COLUMNS.map((column) => ({
  id: column.key,
  header: column.header,
  render: (row) => (column.isNumeric === true && typeof row[column.key] === 'number'
    ? <span className="lab-figure">{(row[column.key] as number).toLocaleString('en-US')}</span>
    : readText(row, column.key)),
  sortValue: (row) => (column.isNumeric === true && typeof row[column.key] === 'number' ? (row[column.key] as number) : readText(row, column.key)),
}));

/** Named devices and what their makers have published about them. Specifications only. */
export default function DeviceSpecifications() {
  const { tables, error } = useSiteDatabase();
  const [activeTypes, setActiveTypes] = useState<readonly string[]>([]);
  const [text, setText] = useState('');

  const devices = useMemo(() => tables?.[DEVICES_TABLE] ?? [], [tables]);
  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of devices) counts.set(readText(row, TYPE_COLUMN), (counts.get(readText(row, TYPE_COLUMN)) ?? 0) + 1);
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [devices]);
  const shown = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return devices.filter((row) => (activeTypes.length === 0 || activeTypes.includes(readText(row, TYPE_COLUMN)))
      && (needle === '' || ['device', 'company'].some((key) => readText(row, key).toLowerCase().includes(needle))));
  }, [devices, activeTypes, text]);
  const companyCount = useMemo(() => new Set(devices.map((row) => readText(row, 'company'))).size, [devices]);

  if (error !== null) return <p className="tm-error" role="alert">{error}</p>;
  if (tables === null) return <p className="lab-soft" role="status">Loading the device list…</p>;
  return (
    <section className="lab-panel" aria-label="Device specifications">
      <div className="specs-bar">
        <p style={{ margin: 0, flexBasis: '100%' }}>
          {devices.length} devices from {companyCount} companies. Published specifications only. TARA Lab holds no findings about any named product, so no technique, score or count is shown against one.
        </p>
        <div className="catalog-filter-group" role="group" aria-label="Type" style={{ flexWrap: 'wrap' }}>
          {typeCounts.map(([type, count]) => (
            <FilterChip
              key={type} label={type} count={count} isPressed={activeTypes.includes(type)}
              onToggle={() => setActiveTypes((current) => (current.includes(type) ? current.filter((existing) => existing !== type) : [...current, type]))}
            />
          ))}
        </div>
        <input className="catalog-search" type="search" placeholder="Search by device or company" aria-label="Search by device or company" value={text} onChange={(event) => setText(event.target.value)} />
      </div>
      <div className="specs-table">
        <DataTable
          caption={`${shown.length} of ${devices.length} devices`} columns={COLUMNS} rows={shown}
          rowKey={(row) => `${readText(row, 'company')}::${readText(row, 'device')}`}
          emptyMessage="No device matches. Clear the search or a type to see the rest."
        />
      </div>
    </section>
  );
}
