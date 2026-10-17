import FacetBar, { type Facet } from '@/components/lab-kit/FacetBar';
import FilterChip from '@/components/lab-kit/FilterChip';
import { CATALOG_SEVERITIES, type CatalogTactic, type TechniqueMode } from '@/lib/threat-model/catalog-types';
import type { CatalogFacetCounts, CatalogFilters } from '@/lib/threat-model/catalog-filter';
import type { EvidenceCount } from '@/lib/threat-model/evidence-levels';
import {
  CATALOG_SEVERITY_HEADING, CATALOG_SEVERITY_LABELS, EFFECT_HEADING, ENTRY_PATH_HEADING, ENTRY_PATH_LABELS, SCOPE_TERMS, SCOPE_TERM_LABELS,
  TECHNIQUE_FAMILY_HEADING, effectLabelForMode,
} from '@/lib/threat-model/lab-terms';
import { PLACED_ENTRY_PATHS, type EntryPath } from '@/lib/threat-model/reference-data-types';
import BandChips from './BandChips';

export interface DomainOption {
  code: string;
  label: string;
}

interface Props {
  filters: CatalogFilters;
  /** For each chip, how many techniques choosing it would leave. */
  facets: CatalogFacetCounts;
  /** Every evidence value in the catalog, strongest first; a value the other filters have emptied still shows, at zero. */
  evidenceValues: readonly EvidenceCount[];
  tactics: readonly CatalogTactic[];
  domains: readonly DomainOption[];
  onChange: (filters: CatalogFilters) => void;
}

export const ON_THIS_DEVICE_HEADING = 'On this device';
export const SEARCH_LABEL = 'Search techniques';
const MODES: readonly TechniqueMode[] = ['R', 'M', 'D'];
const ENTRY_PATHS: readonly EntryPath[] = [...PLACED_ENTRY_PATHS, 'around_device'];
/** Search, the device, evidence and severity are the one row always shown; the rest wait behind "More filters". */
const VISIBLE_FACET_COUNT = 4;

/**
 * The techniques with a recorded decision that leaves them outside the device are counted under
 * the scope term, in its own words: they are not all "around" the device.
 */
function entryPathLabel(entryPath: EntryPath): string {
  return entryPath === 'around_device' ? SCOPE_TERM_LABELS.reviewed_outside : ENTRY_PATH_LABELS[entryPath];
}

function toggle<Value>(values: readonly Value[], value: Value): Value[] {
  return values.includes(value) ? values.filter((existing) => existing !== value) : [...values, value];
}

interface ChipFacetPlan<Value extends string> {
  id: string;
  label: string;
  values: readonly Value[];
  selected: readonly Value[];
  labelOf: (value: Value) => string;
  /** How many techniques choosing the value would leave. */
  countOf: (value: Value) => number;
  onChange: (selected: Value[]) => void;
}

/** A facet of one chip per value of a list, each chip with what choosing it would leave. */
function chipFacet<Value extends string>({ id, label, values, selected, labelOf, countOf, onChange }: ChipFacetPlan<Value>): Facet {
  return {
    id, label, activeCount: selected.length,
    control: values.map((value) => (
      <FilterChip key={value} label={labelOf(value)} count={countOf(value)} isPressed={selected.includes(value)} onToggle={() => onChange(toggle(selected, value))} />
    )),
  };
}

interface SelectFacetPlan {
  id: string;
  label: string;
  value: string | null;
  options: readonly { value: string; label: string }[];
  onChange: (value: string | null) => void;
}

/** A facet that takes one value or all of them. */
function selectFacet({ id, label, value, options, onChange }: SelectFacetPlan): Facet {
  return {
    id, label, activeCount: value === null ? 0 : 1,
    control: (
      <select className="lab-input explore-select" aria-label={label} value={value ?? ''} onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}>
        <option value="">All {options.length}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    ),
  };
}

function searchFacet(text: string, onChange: (text: string) => void): Facet {
  return {
    id: 'search', label: 'Search', activeCount: text.trim() === '' ? 0 : 1,
    control: (
      <input
        className="lab-input explore-search" type="search" placeholder="Name, ID, source, CVE or product" aria-label={SEARCH_LABEL}
        value={text} onChange={(event) => onChange(event.target.value)}
      />
    ),
  };
}

/** The catalog's filters in one bar. The order is fixed, and every chip shows what choosing it would leave. */
export default function CatalogFacetBar({ filters, facets, evidenceValues, tactics, domains, onChange }: Props) {
  const set = (changed: Partial<CatalogFilters>): void => onChange({ ...filters, ...changed });
  const facetList: Facet[] = [
    searchFacet(filters.text, (text) => set({ text })),
    chipFacet({ id: 'placement', label: ON_THIS_DEVICE_HEADING, values: SCOPE_TERMS, selected: filters.placement, labelOf: (term) => SCOPE_TERM_LABELS[term], countOf: (term) => facets.placement.get(term) ?? 0, onChange: (placement) => set({ placement }) }),
    chipFacet({ id: 'evidence', label: 'Evidence', values: evidenceValues.map((entry) => entry.label), selected: filters.evidence, labelOf: (label) => label, countOf: (label) => facets.evidence.get(label) ?? 0, onChange: (evidence) => set({ evidence }) }),
    chipFacet({ id: 'severity', label: CATALOG_SEVERITY_HEADING, values: CATALOG_SEVERITIES, selected: filters.severities, labelOf: (severity) => CATALOG_SEVERITY_LABELS[severity], countOf: (severity) => facets.severities.get(severity) ?? 0, onChange: (severities) => set({ severities }) }),
    {
      id: 'band', label: 'Band', activeCount: filters.bandIds.length,
      control: <BandChips bands={facets.bands} selectedBandIds={filters.bandIds} onToggleBand={(bandId) => set({ bandIds: toggle(filters.bandIds, bandId) })} />,
    },
    selectFacet({ id: 'family', label: TECHNIQUE_FAMILY_HEADING, value: filters.tacticId, options: tactics.map((tactic) => ({ value: tactic.id, label: tactic.name })), onChange: (tacticId) => set({ tacticId }) }),
    chipFacet({ id: 'effect', label: EFFECT_HEADING, values: MODES, selected: filters.modes, labelOf: effectLabelForMode, countOf: (mode) => facets.modes.get(mode) ?? 0, onChange: (modes) => set({ modes }) }),
    chipFacet({ id: 'entry-path', label: ENTRY_PATH_HEADING, values: ENTRY_PATHS, selected: filters.entryPaths, labelOf: entryPathLabel, countOf: (entryPath) => facets.entryPaths.get(entryPath) ?? 0, onChange: (entryPaths) => set({ entryPaths }) }),
    selectFacet({ id: 'domain', label: 'Domain', value: filters.domain, options: domains.map((domain) => ({ value: domain.code, label: domain.label })), onChange: (domain) => set({ domain }) }),
  ];
  return <FacetBar label="Filter techniques" facets={facetList} visibleCount={VISIBLE_FACET_COUNT} />;
}
