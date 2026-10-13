import { useRef, type KeyboardEvent } from 'react';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import { GEOMETRY_FILTERS, GEOMETRY_FILTER_LABELS, listVisibleRowIds, type BandGroup, type GeometryFilter, type ListFilter } from '@/lib/atlas-explorer/region-rows';
import LimitNote from './LimitNote';
import RegionRowButton from './RegionRowButton';
import { useRowFlip } from './use-row-flip';

interface Props {
  groups: readonly BandGroup[];
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
export default function StructureList({ groups, regionCount, filter, lensLabel, selectedRegionId, onFilter, onClearFilter, onSelect }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const visibleIds = listVisibleRowIds(groups);
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
        {groups.map((group) => (
          <section key={group.band.id} className="atlas-band" aria-labelledby={`atlas-band-${group.band.id}`} data-empty={group.rows.length === 0}>
            <h3 className="atlas-band-heading" id={`atlas-band-${group.band.id}`}>
              <span className="atlas-band-code">{group.band.id}</span>
              <span className="atlas-band-name">{group.band.name}</span>
              <span className="atlas-band-count">{group.rows.length === group.totalRows ? `${group.totalRows} regions` : `${group.rows.length} of ${group.totalRows} shown`}</span>
            </h3>
            <ul className="atlas-rows">
              {group.rows.map((row) => (
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
