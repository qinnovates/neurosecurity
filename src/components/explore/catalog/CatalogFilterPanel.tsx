import FilterChip from '@/components/lab-kit/FilterChip';
import Panel from '@/components/lab-kit/Panel';
import { CATALOG_SEVERITIES, type CatalogTactic, type TechniqueMode } from '@/lib/threat-model/catalog-types';
import { isCatalogFiltered, type CatalogFacetCounts, type CatalogFilters } from '@/lib/threat-model/catalog-filter';
import type { EvidenceCount } from '@/lib/threat-model/evidence-levels';
import { CATALOG_SEVERITY_LABELS, EFFECT_HEADING, SCOPE_TERMS, SCOPE_TERM_LABELS } from '@/lib/threat-model/lab-terms';
import { MODE_LABELS } from './TechniquePanel';

interface Props {
  filters: CatalogFilters;
  facets: CatalogFacetCounts;
  /** Every evidence value in the catalog, strongest first; values a filter has emptied still show, at zero. */
  evidenceValues: readonly EvidenceCount[];
  tactics: readonly CatalogTactic[];
  deviceName: string;
  onChange: (filters: CatalogFilters) => void;
  onClear: () => void;
}

const MODES: readonly TechniqueMode[] = ['R', 'M', 'D'];

function toggle<Value>(values: readonly Value[], value: Value): Value[] {
  return values.includes(value) ? values.filter((existing) => existing !== value) : [...values, value];
}

/** The catalog's filters. Every chip shows how many techniques choosing it would leave. */
export default function CatalogFilterPanel({ filters, facets, evidenceValues, tactics, deviceName, onChange, onClear }: Props) {
  return (
    <Panel title="Filter" actions={isCatalogFiltered(filters) ? <button type="button" className="lab-button" onClick={onClear}>Clear</button> : undefined}>
      <div className="catalog-filters">
        <div className="catalog-filter-group" role="group" aria-label="Evidence">
          <span className="lab-label">Evidence</span>
          {evidenceValues.map((entry) => (
            <FilterChip
              key={entry.label} label={entry.label} count={facets.evidence.get(entry.label) ?? 0}
              isPressed={filters.evidence.includes(entry.label)} onToggle={() => onChange({ ...filters, evidence: toggle(filters.evidence, entry.label) })}
            />
          ))}
        </div>
        <div className="catalog-filter-group" role="group" aria-label={EFFECT_HEADING}>
          <span className="lab-label">{EFFECT_HEADING}</span>
          {MODES.map((mode) => (
            <FilterChip
              key={mode} label={MODE_LABELS[mode]} count={facets.modes.get(mode) ?? 0}
              isPressed={filters.modes.includes(mode)} onToggle={() => onChange({ ...filters, modes: toggle(filters.modes, mode) })}
            />
          ))}
        </div>
        <div className="catalog-filter-group" role="group" aria-label="Severity">
          <span className="lab-label">Severity</span>
          {CATALOG_SEVERITIES.map((severity) => (
            <FilterChip
              key={severity} label={CATALOG_SEVERITY_LABELS[severity]} count={facets.severities.get(severity) ?? 0}
              isPressed={filters.severities.includes(severity)} onToggle={() => onChange({ ...filters, severities: toggle(filters.severities, severity) })}
            />
          ))}
        </div>
        <div className="catalog-filter-group" role="group" aria-label={`On ${deviceName}`}>
          <span className="lab-label">On {deviceName}</span>
          {SCOPE_TERMS.map((state) => (
            <FilterChip
              key={state} label={SCOPE_TERM_LABELS[state]} count={facets.placement.get(state) ?? 0}
              isPressed={filters.placement.includes(state)} onToggle={() => onChange({ ...filters, placement: toggle(filters.placement, state) })}
            />
          ))}
        </div>
        <label className="catalog-filter-group">
          <span className="lab-label">Tactic</span>
          <select className="catalog-select" value={filters.tacticId ?? ''} onChange={(event) => onChange({ ...filters, tacticId: event.target.value === '' ? null : event.target.value })}>
            <option value="">All {tactics.length} tactics</option>
            {tactics.map((tactic) => <option key={tactic.id} value={tactic.id}>{tactic.name}</option>)}
          </select>
        </label>
        {(filters.bandIds.length > 0 || filters.domain !== null) && (
          <div className="catalog-filter-group" role="group" aria-label="From the matrix">
            <span className="lab-label">From the matrix</span>
            {filters.bandIds.map((bandId) => <button key={bandId} type="button" className="lab-chip" aria-pressed="true" onClick={() => onChange({ ...filters, bandIds: filters.bandIds.filter((existing) => existing !== bandId) })}>Band {bandId} <span aria-hidden="true">×</span></button>)}
            {filters.domain !== null && <button type="button" className="lab-chip" aria-pressed="true" onClick={() => onChange({ ...filters, domain: null })}>Domain {filters.domain} <span aria-hidden="true">×</span></button>}
          </div>
        )}
      </div>
    </Panel>
  );
}
