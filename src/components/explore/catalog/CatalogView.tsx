import { useEffect, useRef, type RefObject } from 'react';
import type { DataTableHandle } from '@/components/lab-kit/DataTable';
import { useCountTransition } from '@/components/lab-kit/motion/use-count-transition';
import Segmented, { type SegmentedOption } from '@/components/lab-kit/Segmented';
import { useShowTechniqueInModel } from '@/components/workbench/use-open-technique';
import { EMPTY_CATALOG_FILTERS, isCatalogFiltered } from '@/lib/threat-model/catalog-filter';
import { useOpenedTechniqueId } from '../explore-navigation';
import { BAND_LEGEND_SENTENCE } from './band-groups';
import CatalogFacetBar from './CatalogFacetBar';
import CatalogMatrix, { MATRIX_LAYOUT_LABELS } from './CatalogMatrix';
import { useCatalogViewState, type CatalogLayout } from './catalog-view-state';
import ScopeCountsLine from './ScopeCountsLine';
import TechniqueDrawer from './TechniqueDrawer';
import TechniqueTable from './TechniqueTable';
import { useCatalogData } from './use-catalog-data';

const LAYOUT_OPTIONS: readonly SegmentedOption<CatalogLayout>[] = [
  { value: 'table', label: 'Table' },
  { value: 'family-band', label: MATRIX_LAYOUT_LABELS['family-band'] },
  { value: 'domain-effect', label: MATRIX_LAYOUT_LABELS['domain-effect'] },
];

/** Returns focus to the row of a technique when its drawer closes. */
function useFocusReturn(openedId: string | null): RefObject<DataTableHandle | null> {
  const tableRef = useRef<DataTableHandle>(null);
  const lastOpenedId = useRef<string | null>(null);
  useEffect(() => {
    if (openedId !== null) { lastOpenedId.current = openedId; return; }
    if (lastOpenedId.current !== null) tableRef.current?.focusRow(lastOpenedId.current);
    lastOpenedId.current = null;
  }, [openedId]);
  return tableRef;
}

/**
 * The technique catalog: one bar of filters, the techniques as a table, the same techniques
 * counted on two axes, and one technique in the inspector. Filters, sort, layout and the
 * opened technique are kept when the reader leaves and comes back.
 */
export default function CatalogView() {
  const { filters, setFilters, sort, setSort, layout, setLayout } = useCatalogViewState();
  const [openedId, setOpenedId] = useOpenedTechniqueId();
  const data = useCatalogData(filters);
  const showInModel = useShowTechniqueInModel();
  const opened = openedId === null ? undefined : data.techniqueOf(openedId);
  const tableRef = useFocusReturn(opened?.id ?? null);
  // The count swaps at once and is marked for a moment; it never runs through numbers that were not true.
  const shownCount = useCountTransition(data.shown.length);

  return (
    <div className="explore-catalog" data-drawer={opened !== undefined}>
      <section className="lab-panel explore-catalog-filters" aria-label="Filters">
        <CatalogFacetBar filters={filters} facets={data.facets} evidenceValues={data.evidenceValues} tactics={data.tactics} domains={data.domains} onChange={setFilters} />
        <p className="lab-soft explore-band-legend">{BAND_LEGEND_SENTENCE}</p>
      </section>
      <div className="explore-catalog-head lab-material">
        <p className="lab-panel-title" role="status">
          <span className="lab-figure" data-changed={shownCount.hasChanged}>{shownCount.value}</span> of <span className="lab-figure">{data.techniques.length}</span> techniques
        </p>
        {isCatalogFiltered(filters) && <button type="button" className="lab-button" onClick={() => setFilters(EMPTY_CATALOG_FILTERS)}>Clear filters</button>}
        <Segmented label="Layout" options={LAYOUT_OPTIONS} value={layout} onChange={setLayout} />
      </div>
      {filters.placement.length > 0 && <ScopeCountsLine counts={data.scopeCounts} pickedTerms={filters.placement} />}
      {layout !== 'table' && (
        <section className="lab-panel explore-catalog-matrix" aria-label={MATRIX_LAYOUT_LABELS[layout]}>
          <CatalogMatrix layout={layout} techniques={data.techniques} tactics={data.tactics} filters={filters} filterContext={data.filterContext} onChange={setFilters} />
        </section>
      )}
      <section className="lab-panel" id="lab-results" aria-label="Techniques" tabIndex={-1}>
        <TechniqueTable
          ref={tableRef} techniques={data.shown} scopeOf={data.scopeOf} familyNameOf={data.familyNameOf}
          sort={sort} onSortChange={setSort} openedId={opened?.id ?? null} onOpen={setOpenedId}
        />
      </section>
      <TechniqueDrawer
        technique={opened} tactic={opened === undefined ? undefined : data.tacticOf(opened.tactic)} scopeEntry={opened === undefined ? undefined : data.scopeOf(opened.id)}
        deviceName={data.deviceName} elementLabelOf={data.elementLabelOf} cves={opened === undefined ? [] : data.cvesOf(opened.id)} cvesAsOf={data.cvesAsOf}
        relatedTechniques={opened === undefined ? [] : data.relatedOf(opened)}
        onOpenTechnique={setOpenedId} onShowInModel={() => { if (opened !== undefined) showInModel(opened.id); }} onClose={() => setOpenedId(null)}
      />
    </div>
  );
}
