import { useMemo, useRef, type KeyboardEvent } from 'react';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import { GEOMETRY_FILTERS, GEOMETRY_FILTER_LABELS, type BandGroup, type GeometryFilter, type ListFilter } from '@/lib/atlas-explorer/region-rows';
import LimitNote from './LimitNote';
import { listSectionRowIds, listSections } from './list-sections';
import RegionRowButton from './RegionRowButton';
import { useRowFlip } from './use-row-flip';

/*
 * Copy owned by `src/lib/anatomy/limits-copy.ts`, which this lane may not
 * edit. Written here verbatim for Lane 6 to route under the key named beside
 * it, and kept off the `.atlas-limit` class until it has.
 */
/** limits-copy key `lens_no_data_not_safe`. */
const NOT_ASSESSED_NOTE = 'The lens holds nothing for these regions. Nothing has been linked to them, which is not a finding that they are safe, or low, and they are never ordered against the regions that do hold a value.';

interface Props {
  groups: readonly BandGroup[];
  /** The same groups before the filter, so each section can state its own total. */
  unfilteredGroups: readonly BandGroup[];
  /** Regions in the index, before any filter. */
  regionCount: number;
  filter: ListFilter;
  /** What the lens column shows, for its header. */
  lensLabel: string;
  selectedRegionId: string | null;
  onFilter: (filter: Partial<ListFilter>) => void;
  onClearFilter: () => void;
  onSelect: (regionId: string, byKeyboard: boolean) => void;
}

function isGeometryFilter(value: string): value is GeometryFilter {
  return (GEOMETRY_FILTERS as readonly string[]).includes(value);
}

function targetIndex(key: string, index: number, count: number): number | null {
  const targets: Record<string, number> = { ArrowDown: Math.min(index + 1, count - 1), ArrowUp: Math.max(index - 1, 0), Home: 0, End: count - 1 };
  return Object.hasOwn(targets, key) ? targets[key] : null;
}

function FilterBar({ filter, onFilter }: Pick<Props, 'filter' | 'onFilter'>) {
  return (
    <div className="atlas-filterbar">
      <label className="atlas-field">
        <span className="atlas-label">Find a region</span>
        <input className="atlas-input" type="search" value={filter.query} placeholder="Name, id or band" autoComplete="off" onChange={(event) => onFilter({ query: event.target.value })} />
      </label>
      <label className="atlas-field">
        <span className="atlas-label">Shape status</span>
        <select className="atlas-input" value={filter.geometry} onChange={(event) => { if (isGeometryFilter(event.target.value)) onFilter({ geometry: event.target.value }); }}>
          {GEOMETRY_FILTERS.map((option) => <option key={option} value={option}>{GEOMETRY_FILTER_LABELS[option]}</option>)}
        </select>
      </label>
      <button type="button" className="atlas-toggle" aria-pressed={filter.onlyWithData} onClick={() => onFilter({ onlyWithData: !filter.onlyWithData })}>
        <span className="atlas-toggle-box" aria-hidden="true" />
        Only regions with data under this lens
      </button>
    </div>
  );
}

/**
 * The region list, grouped by band. It is the whole of the atlas for anyone
 * without the 3D view, so each row says in words what a colour would. One tab
 * stop: arrow keys, Home and End move between rows, Enter or Space selects.
 */
export default function StructureList({ groups, unfilteredGroups, regionCount, filter, lensLabel, selectedRegionId, onFilter, onClearFilter, onSelect }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const sections = useMemo(() => listSections(groups, unfilteredGroups), [groups, unfilteredGroups]);
  const visibleIds = listSectionRowIds(sections);
  const tabStopId = selectedRegionId !== null && visibleIds.includes(selectedRegionId) ? selectedRegionId : visibleIds[0];
  useRowFlip(listRef, visibleIds.join(' '));

  const handleRowKey = (event: KeyboardEvent<HTMLButtonElement>, regionId: string): void => {
    const next = targetIndex(event.key, visibleIds.indexOf(regionId), visibleIds.length);
    if (next === null) return;
    event.preventDefault();
    const rows = [...(listRef.current?.querySelectorAll<HTMLButtonElement>('[data-region-id]') ?? [])];
    rows.find((row) => row.dataset.regionId === visibleIds[next])?.focus();
  };

  return (
    <section className="atlas-panel atlas-list" aria-labelledby="atlas-list-heading">
      <h2 className="atlas-heading" id="atlas-list-heading">Regions</h2>
      <LimitNote limit={limitSentence('region_matching')} />
      <FilterBar filter={filter} onFilter={onFilter} />
      <p className="atlas-list-count" role="status">
        {visibleIds.length === regionCount ? `${regionCount} regions.` : `Showing ${visibleIds.length} of ${regionCount} regions.`}
        {visibleIds.length === 0 && ' No region matches these filters.'}
      </p>
      {visibleIds.length !== regionCount && <button type="button" className="atlas-link-button" onClick={onClearFilter}>Show all regions</button>}
      <div className="atlas-columns" aria-hidden="true">
        <span>Region</span><span>What stands for it</span><span>{lensLabel}</span>
      </div>
      <div ref={listRef} className="atlas-groups">
        {sections.map((section) => (
          <section
            key={section.key} className={section.isNotAssessed ? 'atlas-band atlas-not-assessed' : 'atlas-band'}
            aria-labelledby={`atlas-band-${section.key}`} data-empty={section.rows.length === 0} data-not-assessed={section.isNotAssessed}
          >
            <h3 className="atlas-band-heading" id={`atlas-band-${section.key}`}>
              {section.code !== null && <span className="atlas-band-code">{section.code}</span>}
              <span className="atlas-band-name">{section.name}</span>
              <span className="atlas-band-count">{section.rows.length === section.totalRows ? `${section.totalRows} regions` : `${section.rows.length} of ${section.totalRows} shown`}</span>
            </h3>
            {section.isNotAssessed && <p className="atlas-coverage-note" data-coverage-note="lens_no_data_not_safe">{NOT_ASSESSED_NOTE}</p>}
            <ul className="atlas-rows">
              {section.rows.map((row) => (
                <RegionRowButton key={row.id} row={row} isSelected={row.id === selectedRegionId} isTabStop={row.id === tabStopId} onSelect={onSelect} onKeyDown={handleRowKey} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <LimitNote limit={limitSentence('list_terms')} />
    </section>
  );
}
