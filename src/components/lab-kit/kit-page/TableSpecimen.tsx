import { useMemo, useState } from 'react';
import { CATALOG_SEVERITIES, type CatalogSeverity, type CatalogTechnique } from '@/lib/threat-model/catalog-types';
import { describeEvidence, type EvidenceCount } from '@/lib/threat-model/evidence-levels';
import DataTable, { type DataTableColumn, type DataTableSort } from '../DataTable';
import Drawer from '../Drawer';
import EmptyState from '../EmptyState';
import EvidenceMark from '../EvidenceMark';
import FacetBar, { type Facet } from '../FacetBar';
import FilterChip from '../FilterChip';
import Panel from '../Panel';
import SeverityMark from '../SeverityMark';
import TechniqueLink from '../TechniqueLink';
import { useLinkedHighlight } from '../motion/use-linked-highlight';

interface Props {
  techniques: readonly CatalogTechnique[];
  evidenceCounts: readonly EvidenceCount[];
}

const SEVERITY_NAMES: Readonly<Record<CatalogSeverity, string>> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

function toggled<Value>(values: readonly Value[], value: Value): readonly Value[] {
  return values.includes(value) ? values.filter((existing) => existing !== value) : [...values, value];
}

function TechniqueCard({ technique, onOpen }: { technique: CatalogTechnique; onOpen: (techniqueId: string) => void }) {
  return (
    <>
      <div className="kit-card-line"><b>{technique.name}</b><SeverityMark severity={technique.severity} /></div>
      <div className="kit-card-line"><EvidenceMark tier={technique.evidenceTier} status={technique.evidenceStatus} labelForm="short" /><TechniqueLink techniqueId={technique.id} techniqueName={technique.name} onOpen={onOpen} /></div>
    </>
  );
}

/** Facets, table, linked highlight and the inspector working together on the whole catalog. */
export default function TableSpecimen({ techniques, evidenceCounts }: Props) {
  const [evidenceLabels, setEvidenceLabels] = useState<readonly string[]>([]);
  const [severities, setSeverities] = useState<readonly CatalogSeverity[]>([]);
  const [sort, setSort] = useState<DataTableSort | null>(null);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const highlight = useLinkedHighlight();

  const byEvidence = useMemo(
    () => (evidenceLabels.length === 0 ? techniques : techniques.filter((technique) => evidenceLabels.includes(describeEvidence(technique).label))),
    [techniques, evidenceLabels],
  );
  const shown = useMemo(() => (severities.length === 0 ? byEvidence : byEvidence.filter((technique) => severities.includes(technique.severity))), [byEvidence, severities]);
  const opened = techniques.find((technique) => technique.id === openedId) ?? null;
  const clearFilters = (): void => { setEvidenceLabels([]); setSeverities([]); };

  const columns = useMemo<readonly DataTableColumn<CatalogTechnique>[]>(() => [
    { id: 'name', header: 'Technique', render: (technique) => technique.name, sortValue: (technique) => technique.name },
    { id: 'severity', header: 'Catalog severity', render: (technique) => <SeverityMark severity={technique.severity} />, sortValue: (technique) => CATALOG_SEVERITIES.indexOf(technique.severity) },
    { id: 'evidence', header: 'Evidence', render: (technique) => <EvidenceMark tier={technique.evidenceTier} status={technique.evidenceStatus} labelForm="short" />, sortValue: (technique) => describeEvidence(technique).rank },
    { id: 'id', header: 'ID', render: (technique) => <TechniqueLink techniqueId={technique.id} techniqueName={technique.name} onOpen={setOpenedId} />, sortValue: (technique) => technique.id },
  ], []);

  const facets: readonly Facet[] = [
    {
      id: 'severity', label: 'Catalog severity', activeCount: severities.length,
      control: CATALOG_SEVERITIES.map((severity) => (
        <span key={severity} {...highlight.bind(severity)}>
          <FilterChip label={SEVERITY_NAMES[severity]} count={byEvidence.filter((technique) => technique.severity === severity).length} isPressed={severities.includes(severity)} onToggle={() => setSeverities((current) => toggled(current, severity))} />
        </span>
      )),
    },
    {
      id: 'evidence', label: 'Evidence', activeCount: evidenceLabels.length,
      control: evidenceCounts.map((entry) => (
        <FilterChip key={entry.label} label={entry.label} count={entry.count} isPressed={evidenceLabels.includes(entry.label)} onToggle={() => setEvidenceLabels((current) => toggled(current, entry.label))} />
      )),
    },
  ];

  return (
    <Panel title="Facets, table and inspector">
      <div className="kit-stack">
        <FacetBar label="Filter techniques" facets={facets} visibleCount={1} />
        <p className="lab-soft">Point at a severity chip and its rows light; point at a row and its chip lights. Rows slide to their new place after a filter or a sort. Under 720px each row is a card.</p>
        {shown.length === 0 ? (
          <EmptyState reason="nothing-shown" title="No technique matches these filters" action={<button type="button" className="lab-button" onClick={clearFilters}>Clear filters</button>} />
        ) : (
          <div className="kit-table-scroll">
            <DataTable
              caption={`${shown.length} of ${techniques.length} techniques. Arrow keys move between rows; Enter opens one.`}
              columns={columns} rows={shown} rowKey={(technique) => technique.id} emptyMessage="No technique matches these filters."
              sort={sort} onSortChange={setSort} openedKey={openedId} onOpenRow={(technique) => setOpenedId(technique.id)}
              isRowLit={(technique) => highlight.isLit(technique.severity)} onRowPoint={(technique) => highlight.setLitKey(technique?.severity ?? null)}
              renderCard={(technique) => <TechniqueCard technique={technique} onOpen={setOpenedId} />}
            />
          </div>
        )}
      </div>
      <Drawer isOpen={opened !== null} title={opened?.name ?? ''} onClose={() => setOpenedId(null)}>
        {opened !== null && (
          <dl className="kit-detail">
            <dt className="lab-label">ID</dt><dd className="lab-id">{opened.id}</dd>
            <dt className="lab-label">Tactic</dt><dd className="lab-id">{opened.tactic}</dd>
            <dt className="lab-label">Catalog severity</dt><dd><SeverityMark severity={opened.severity} /></dd>
            <dt className="lab-label">Evidence</dt><dd><EvidenceMark tier={opened.evidenceTier} status={opened.evidenceStatus} /></dd>
          </dl>
        )}
      </Drawer>
    </Panel>
  );
}
