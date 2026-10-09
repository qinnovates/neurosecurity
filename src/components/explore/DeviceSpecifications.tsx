import { useMemo } from 'react';
import DataTable, { type DataTableColumn } from '@/components/lab-kit/DataTable';
import FacetBar, { type Facet } from '@/components/lab-kit/FacetBar';
import FilterChip from '@/components/lab-kit/FilterChip';
import { useSiteDatabase } from '@/components/query/use-site-database';
import { useViewState } from '@/components/workbench/ViewStateContext';
import {
  DEVICES_TABLE, NOT_RECORDED, SPEC_COLUMNS, countDeviceTypes, filterSpecRows, formatSpecDisplay, isChannelCount, readSpecText, specRowKey, specSortValue, type SpecRow,
} from './specifications/spec-rows';

/** The standing rule for named devices, and the one thing to do next. */
export const SPECIFICATIONS_STATEMENT = 'TARA Lab does not assess named products. These rows are published specifications only. To model a device, start from a generic class.';
const SEARCH_LABEL = 'Search every column';
const KEY_PREFIX = 'explore/specifications/';
const TEXT_KEY = `${KEY_PREFIX}text`;
const TYPES_KEY = `${KEY_PREFIX}types`;
const NO_TYPES: readonly string[] = [];
const MAX_TEXT_LENGTH = 200;
const MAX_TYPE_COUNT = 32;

function isShortText(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_TEXT_LENGTH;
}

function isTypeList(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.length <= MAX_TYPE_COUNT && value.every(isShortText);
}

const COLUMNS: readonly DataTableColumn<SpecRow>[] = SPEC_COLUMNS.map((column) => ({
  id: column.key,
  header: column.header,
  render: (row) => {
    const text = formatSpecDisplay(row, column.key);
    if (isChannelCount(row, column.key)) return <span className="lab-figure">{text}</span>;
    if (text === NOT_RECORDED) return <span className="lab-soft">{text}</span>;
    // Where the display differs from the file, the value as recorded is the cell's title.
    const recorded = readSpecText(row, column.key);
    return recorded === text ? text : <span title={recorded}>{text}</span>;
  },
  sortValue: (row) => specSortValue(row, column.key),
}));

/** Named devices and what is published about them. Specifications only. */
export default function DeviceSpecifications({ onOpenStart }: { onOpenStart: () => void }) {
  const { tables, error } = useSiteDatabase();
  const [text, setText] = useViewState<string>(TEXT_KEY, '', isShortText);
  const [activeTypes, setActiveTypes] = useViewState<readonly string[]>(TYPES_KEY, NO_TYPES, isTypeList);

  const devices = useMemo(() => tables?.[DEVICES_TABLE] ?? [], [tables]);
  const typeCounts = useMemo(() => countDeviceTypes(devices), [devices]);
  const shown = useMemo(() => filterSpecRows(devices, activeTypes, text), [devices, activeTypes, text]);

  if (error !== null) return <p className="lab-notice" role="alert" id="lab-results">{error}</p>;
  if (tables === null) return <p className="lab-soft" role="status" id="lab-results">Loading the device list…</p>;

  const toggleType = (label: string): void => setActiveTypes(activeTypes.includes(label) ? activeTypes.filter((existing) => existing !== label) : [...activeTypes, label]);
  const facets: Facet[] = [
    {
      id: 'search', label: 'Search', activeCount: text.trim() === '' ? 0 : 1,
      control: <input className="lab-input explore-search" type="search" aria-label={SEARCH_LABEL} placeholder={SEARCH_LABEL} value={text} onChange={(event) => setText(event.target.value)} />,
    },
    {
      id: 'type', label: 'Type', activeCount: activeTypes.length,
      control: typeCounts.map((type) => <FilterChip key={type.label} label={type.label} count={type.count} isPressed={activeTypes.includes(type.label)} onToggle={() => toggleType(type.label)} />),
    },
  ];

  return (
    <div className="explore-specs">
      <div className="lab-notice explore-specs-statement">
        <p>{SPECIFICATIONS_STATEMENT}</p>
        <button type="button" className="lab-button" onClick={onOpenStart}>Start from a generic class</button>
      </div>
      <section className="lab-panel explore-specs-filters" aria-label="Filters"><FacetBar label="Filter devices" facets={facets} /></section>
      <section className="lab-panel explore-specs-table" id="lab-results" aria-label="Published device specifications" tabIndex={-1}>
        <DataTable
          caption={`${shown.length} of ${devices.length} devices`} columns={COLUMNS} rows={shown} rowKey={specRowKey}
          emptyMessage="No device matches. Clear the search or a type to see the rest."
        />
      </section>
    </div>
  );
}
