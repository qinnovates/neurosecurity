import { useMemo, useState } from 'react';
import { DOMAIN_COLORS } from '@/components/atlas/chain-constants';
import DataTable, { type DataTableColumn } from '@/components/lab-kit/DataTable';
import EvidenceBar from '@/components/lab-kit/EvidenceBar';
import EvidenceMark from '@/components/lab-kit/EvidenceMark';
import SeverityMark from '@/components/lab-kit/SeverityMark';
import { useFocus } from '@/components/workbench/FocusContext';
import type { ModeId } from '@/components/workbench/mode-registry';
import { BAND_ORDER, CATALOG_SEVERITIES, type CatalogTechnique } from '@/lib/threat-model/catalog-types';
import {
  EMPTY_CATALOG_FILTERS, countCatalogFacets, filterCatalog, placementStateOf, type CatalogFilters, type PlacementState,
} from '@/lib/threat-model/catalog-filter';
import { countByEvidence, describeEvidence } from '@/lib/threat-model/evidence-levels';
import CatalogFilterPanel, { PLACEMENT_LABELS } from './CatalogFilterPanel';
import MarkMatrix, { type MatrixAxisItem } from './MarkMatrix';
import TechniquePanel, { MODE_LABELS } from './TechniquePanel';

type CatalogLayout = 'table' | 'tactic-band' | 'domain-mode';

const LAYOUTS: readonly { id: CatalogLayout; label: string }[] = [
  { id: 'table', label: 'Table' },
  { id: 'tactic-band', label: 'Tactic by band' },
  { id: 'domain-mode', label: 'Domain by mode' },
];
const BAND_AXIS: readonly MatrixAxisItem[] = BAND_ORDER.map((bandId) => ({
  id: bandId, label: bandId, title: `Band ${bandId}, ${bandId.startsWith('S') ? 'silicon side' : bandId.startsWith('I') ? 'the interface' : 'neural side'}`,
}));
const MODE_AXIS: readonly MatrixAxisItem[] = (['R', 'M', 'D'] as const).map((mode) => ({ id: mode, label: MODE_LABELS[mode] }));

function domainLabel(code: string): string {
  return Object.hasOwn(DOMAIN_COLORS, code) ? DOMAIN_COLORS[code as keyof typeof DOMAIN_COLORS].label : code;
}

/**
 * The technique catalog: one set of filters, three layouts of the same rows, and one
 * panel for a technique. Evidence leads everywhere, and each technique says where it
 * stands against the device in focus.
 */
export default function CatalogView({ onOpenMode }: { onOpenMode: (modeId: ModeId) => void }) {
  const { engineData, referenceData, report, state, techniqueById } = useFocus();
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_CATALOG_FILTERS);
  const [layout, setLayout] = useState<CatalogLayout>('table');
  const [openedId, setOpenedId] = useState<string | null>(null);
  const { techniques, tactics } = engineData;
  const deviceName = state.model.name;

  const placementOf = useMemo(() => {
    const idsOnDevice = new Set(report.riskRows.flatMap((row) => (row.source === 'catalog' && row.techniqueId !== null ? [row.techniqueId] : [])));
    return (techniqueId: string): PlacementState => placementStateOf(techniqueId, referenceData.placementRules, idsOnDevice);
  }, [report.riskRows, referenceData.placementRules]);
  const shown = useMemo(() => filterCatalog(techniques, filters, placementOf), [techniques, filters, placementOf]);
  const facets = useMemo(() => countCatalogFacets(techniques, filters, placementOf), [techniques, filters, placementOf]);
  const evidenceValues = useMemo(() => countByEvidence(techniques), [techniques]);
  const shownEvidence = useMemo(() => {
    const shownCounts = new Map(countByEvidence(shown).map((entry) => [entry.label, entry.count]));
    // Every value keeps its place in the bar, so a segment shrinks to nothing instead of the others jumping.
    return evidenceValues.map((entry) => ({ ...entry, count: shownCounts.get(entry.label) ?? 0 }));
  }, [shown, evidenceValues]);
  const tacticById = useMemo(() => new Map(tactics.map((tactic) => [tactic.id, tactic])), [tactics]);
  const opened = openedId === null ? undefined : techniqueById.get(openedId);

  const columns = useMemo((): readonly DataTableColumn<CatalogTechnique>[] => [
    { id: 'evidence', header: 'Evidence', render: (technique) => <EvidenceMark tier={technique.evidenceTier} status={technique.evidenceStatus} />, sortValue: (technique) => describeEvidence(technique).rank },
    { id: 'name', header: 'Technique', render: (technique) => technique.name, sortValue: (technique) => technique.name },
    { id: 'id', header: 'ID', render: (technique) => <span className="lab-id">{technique.id}</span>, sortValue: (technique) => technique.id },
    { id: 'tactic', header: 'Tactic', render: (technique) => tacticById.get(technique.tactic)?.name ?? technique.tactic, sortValue: (technique) => tacticById.get(technique.tactic)?.name ?? technique.tactic },
    { id: 'bands', header: 'Bands', render: (technique) => <span className="lab-id">{technique.bandIds.join(' ')}</span> },
    { id: 'severity', header: 'Severity', render: (technique) => <SeverityMark severity={technique.severity} />, sortValue: (technique) => CATALOG_SEVERITIES.indexOf(technique.severity) },
    { id: 'mode', header: 'Does', render: (technique) => (technique.mode === null ? <span className="lab-soft">Not stated</span> : MODE_LABELS[technique.mode]), sortValue: (technique) => technique.mode ?? '' },
    {
      id: 'placement', header: `On ${deviceName}`, sortValue: (technique) => placementOf(technique.id),
      render: (technique) => { const placement = placementOf(technique.id); return <span className={`catalog-state${placement === 'not-assessed' ? ' lab-hatch' : ''}`} data-state={placement}>{PLACEMENT_LABELS[placement]}</span>; },
    },
  ], [tacticById, placementOf, deviceName]);

  /** A cell in a matrix narrows the table to that cell, so the reader lands on the techniques themselves. */
  const pickCell = (cell: Partial<CatalogFilters>): void => {
    setFilters({ ...filters, ...cell });
    setLayout('table');
  };
  const domainAxis = useMemo((): MatrixAxisItem[] => [...new Set(shown.map((technique) => technique.domain ?? ''))]
    .filter((code) => code !== '').sort().map((code) => ({ id: code, label: domainLabel(code), title: `${domainLabel(code)} (${code})` })), [shown]);
  const tacticAxis = useMemo((): MatrixAxisItem[] => tactics.map((tactic) => ({ id: tactic.id, label: tactic.name, title: `${tactic.name} (${tactic.id})` })), [tactics]);

  return (
    <div className="catalog" data-panel={opened !== undefined}>
      <CatalogFilterPanel
        filters={filters} facets={facets} evidenceValues={evidenceValues} tactics={tactics} deviceName={deviceName}
        onChange={setFilters} onClear={() => setFilters(EMPTY_CATALOG_FILTERS)}
      />
      <div className="catalog-main">
        <section className="lab-panel catalog-head" aria-label="Catalog summary and layout">
          <div className="catalog-head-row">
            <p className="lab-panel-title" role="status">{shown.length} of {techniques.length} techniques</p>
            <div className="catalog-layouts" role="group" aria-label="Layout">
              {LAYOUTS.map((option) => <button key={option.id} type="button" className="lab-button" aria-pressed={layout === option.id} onClick={() => setLayout(option.id)}>{option.label}</button>)}
            </div>
          </div>
          <EvidenceBar counts={shownEvidence} subject="techniques shown" />
          <input
            className="catalog-search" type="search" placeholder="Search by name or ID" aria-label="Search techniques by name or ID"
            value={filters.text} onChange={(event) => setFilters({ ...filters, text: event.target.value })}
          />
        </section>
        <section className="lab-panel" aria-label="Techniques">
          {layout === 'table' && (
            <div className="catalog-table">
              <DataTable
                caption="TARA is a proposed catalog and is not peer reviewed. Enter opens a technique."
                columns={columns} rows={shown} rowKey={(technique) => technique.id} onOpenRow={(technique) => setOpenedId(technique.id)}
                emptyMessage="No technique matches these filters together. Clear one to widen the search."
              />
            </div>
          )}
          {layout === 'tactic-band' && (
            <div className="lab-panel-body">
              <MarkMatrix
                caption="One mark per technique, in each band it touches. A technique that spans bands appears in each. An empty cell means the catalog has no technique there; it does not mean the cell is safe."
                rows={tacticAxis} columns={BAND_AXIS}
                techniquesAt={(tacticId, bandId) => shown.filter((technique) => technique.tactic === tacticId && technique.bandIds.includes(bandId))}
                onPickCell={(tacticId, bandId) => pickCell({ tacticId, bandId })}
              />
            </div>
          )}
          {layout === 'domain-mode' && (
            <div className="lab-panel-body">
              <MarkMatrix
                caption="One mark per technique, by the catalog's primary domain and by what the technique does. An empty cell means the catalog has no technique there."
                rows={domainAxis} columns={MODE_AXIS}
                techniquesAt={(domain, mode) => shown.filter((technique) => technique.domain === domain && technique.mode === mode)}
                onPickCell={(domain, mode) => pickCell({ domain, modes: [mode as 'R' | 'M' | 'D'] })}
              />
            </div>
          )}
        </section>
      </div>
      {opened !== undefined && (
        <TechniquePanel
          technique={opened} tactic={tacticById.get(opened.tactic)} deviceName={deviceName}
          precedentCves={engineData.precedentCves.filter((cve) => cve.techniqueIds.includes(opened.id))} precedentCvesAsOf={engineData.precedentCvesAsOf}
          placementState={placementOf(opened.id)} placementRules={referenceData.placementRules}
          relatedTechniques={opened.relatedTechniqueIds.flatMap((relatedId) => { const related = techniqueById.get(relatedId); return related === undefined ? [] : [related]; })}
          onOpenTechnique={setOpenedId} onShowInModel={() => onOpenMode('model')} onClose={() => setOpenedId(null)}
        />
      )}
    </div>
  );
}
