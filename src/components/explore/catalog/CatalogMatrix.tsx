import { useMemo } from 'react';
import type { CatalogTactic, CatalogTechnique, TechniqueMode } from '@/lib/threat-model/catalog-types';
import { filterCatalog, type CatalogFilterContext, type CatalogFilters } from '@/lib/threat-model/catalog-filter';
import { EFFECT_HEADING, TECHNIQUE_FAMILY_HEADING } from '@/lib/threat-model/lab-terms';
import { BAND_AXIS, EFFECT_AXIS, buildDomainAxis, buildFamilyAxis } from './catalog-axes';
import type { CatalogLayout } from './catalog-view-state';
import CountMatrix from './CountMatrix';
import { countMatrix, type MatrixAxisItem } from './count-matrix';

export type MatrixLayout = Exclude<CatalogLayout, 'table'>;

interface Props {
  layout: MatrixLayout;
  techniques: readonly CatalogTechnique[];
  tactics: readonly CatalogTactic[];
  filters: CatalogFilters;
  filterContext: CatalogFilterContext;
  onChange: (filters: CatalogFilters) => void;
}

/** One way of counting the catalog on two axes, and how a cell maps to the two filters it stands for. */
interface MatrixPlan {
  caption: string;
  rowHeading: string;
  rows: readonly MatrixAxisItem[];
  columns: readonly MatrixAxisItem[];
  /** The filters of the two axes, cleared: the matrix always shows every cell the other filters leave. */
  cleared: Partial<CatalogFilters>;
  rowIdsOf: (technique: CatalogTechnique) => readonly string[];
  columnIdsOf: (technique: CatalogTechnique) => readonly string[];
  isCellPicked: (rowId: string, columnId: string) => boolean;
  pick: (rowId: string, columnId: string) => Partial<CatalogFilters>;
}

const EMPTY_CELL_SENTENCE = 'An empty cell means no technique in view is there; it does not mean the cell is safe.';
export const MATRIX_LAYOUT_LABELS: Readonly<Record<MatrixLayout, string>> = {
  'family-band': `${TECHNIQUE_FAMILY_HEADING} by band`,
  'domain-effect': `Domain by ${EFFECT_HEADING.toLowerCase()}`,
};

function planFamilyByBand(tactics: readonly CatalogTactic[], filters: CatalogFilters): MatrixPlan {
  return {
    caption: `A technique that spans bands is counted in each, and once in each total. ${EMPTY_CELL_SENTENCE}`,
    rowHeading: TECHNIQUE_FAMILY_HEADING, rows: buildFamilyAxis(tactics), columns: BAND_AXIS, cleared: { tacticId: null, bandIds: [] },
    rowIdsOf: (technique) => [technique.tactic], columnIdsOf: (technique) => technique.bandIds,
    isCellPicked: (tacticId, bandId) => filters.tacticId === tacticId && filters.bandIds.length === 1 && filters.bandIds[0] === bandId,
    pick: (tacticId, bandId) => ({ tacticId, bandIds: [bandId] }),
  };
}

function planDomainByEffect(techniques: readonly CatalogTechnique[], filters: CatalogFilters): MatrixPlan {
  return {
    caption: `Techniques by the catalog's primary domain and by effect. ${EMPTY_CELL_SENTENCE}`,
    rowHeading: 'Domain', rows: buildDomainAxis(techniques), columns: EFFECT_AXIS, cleared: { domain: null, modes: [] },
    rowIdsOf: (technique) => (technique.domain === null ? [] : [technique.domain]), columnIdsOf: (technique) => (technique.mode === null ? [] : [technique.mode]),
    isCellPicked: (domain, mode) => filters.domain === domain && filters.modes.length === 1 && filters.modes[0] === mode,
    pick: (domain, mode) => ({ domain, modes: [mode as TechniqueMode] }),
  };
}

/** The catalog counted on two axes. Pressing a cell sets its two filters; pressing it again clears them. */
export default function CatalogMatrix({ layout, techniques, tactics, filters, filterContext, onChange }: Props) {
  const plan = useMemo(
    () => (layout === 'family-band' ? planFamilyByBand(tactics, filters) : planDomainByEffect(techniques, filters)),
    [layout, tactics, techniques, filters],
  );
  const data = useMemo(() => {
    const inView = filterCatalog(techniques, { ...filters, ...plan.cleared }, filterContext);
    return countMatrix(inView, plan.rows, plan.columns, plan.rowIdsOf, plan.columnIdsOf);
  }, [techniques, filters, filterContext, plan]);

  const pickCell = (rowId: string, columnId: string): void => {
    onChange({ ...filters, ...(plan.isCellPicked(rowId, columnId) ? plan.cleared : plan.pick(rowId, columnId)) });
  };
  return <CountMatrix caption={plan.caption} rowHeading={plan.rowHeading} rows={plan.rows} columns={plan.columns} data={data} isCellPicked={plan.isCellPicked} onPickCell={pickCell} />;
}
