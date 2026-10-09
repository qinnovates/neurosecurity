import { useMemo, type Ref } from 'react';
import DataTable, { type DataTableColumn, type DataTableHandle, type DataTableSort } from '@/components/lab-kit/DataTable';
import EvidenceLegend from '@/components/lab-kit/EvidenceLegend';
import EvidenceMark from '@/components/lab-kit/EvidenceMark';
import SeverityMark from '@/components/lab-kit/SeverityMark';
import { CATALOG_SEVERITIES, type CatalogTechnique } from '@/lib/threat-model/catalog-types';
import { countByEvidence, describeEvidence } from '@/lib/threat-model/evidence-levels';
import { CATALOG_SEVERITY_HEADING, EFFECT_HEADING, SCOPE_TERMS, SCOPE_TERM_SHORT_LABELS, TECHNIQUE_FAMILY_HEADING, effectLabelForMode } from '@/lib/threat-model/lab-terms';
import type { ScopeEntry } from '@/lib/threat-model/scope-statement';
import { scopeLabelOf } from '../scope-words';
import ScopeMark from './ScopeMark';
import { ON_THIS_DEVICE_HEADING } from './CatalogFacetBar';
import { EVIDENCE_COLUMN_ID } from './catalog-view-state';

interface Props {
  techniques: readonly CatalogTechnique[];
  /** Where each technique stands on the device in focus. */
  scopeOf: (techniqueId: string) => ScopeEntry | undefined;
  familyNameOf: (tacticId: string) => string;
  sort: DataTableSort;
  onSortChange: (sort: DataTableSort) => void;
  openedId: string | null;
  onOpen: (techniqueId: string) => void;
  ref?: Ref<DataTableHandle>;
}

const CAPTION = 'TARA is a proposed catalog and is not peer reviewed. Enter opens a technique.';
export const NO_MATCH_TITLE = 'No technique matches these filters together.';
export const NO_MATCH_ACTION = 'Clear one to widen the search.';
const EMPTY_MESSAGE = `${NO_MATCH_TITLE} ${NO_MATCH_ACTION}`;
const EFFECT_NOT_STATED = 'Not stated';

/**
 * Where a technique stands on the device: a mark and the opening words of the term. The whole
 * term, with every condition, is the cell's title and is printed in full in the inspector.
 */
export function ScopeCell({ entry }: { entry: ScopeEntry | undefined }) {
  if (entry === undefined) return null;
  return (
    <span className="explore-scope-cell" data-term={entry.term} title={scopeLabelOf(entry)}>
      <ScopeMark term={entry.term} />
      <span>{SCOPE_TERM_SHORT_LABELS[entry.term]}{entry.term === 'would_apply_if' && '…'}</span>
    </span>
  );
}

/** The catalog as a table: evidence first, then where each technique stands on the device in focus. */
export default function TechniqueTable({ techniques, scopeOf, familyNameOf, sort, onSortChange, openedId, onOpen, ref }: Props) {
  const columns = useMemo((): readonly DataTableColumn<CatalogTechnique>[] => [
    { id: EVIDENCE_COLUMN_ID, header: 'Evidence', render: (technique) => <EvidenceMark tier={technique.evidenceTier} status={technique.evidenceStatus} labelForm="short" />, sortValue: (technique) => describeEvidence(technique).rank },
    { id: 'placement', header: ON_THIS_DEVICE_HEADING, render: (technique) => <ScopeCell entry={scopeOf(technique.id)} />, sortValue: (technique) => SCOPE_TERMS.indexOf(scopeOf(technique.id)?.term ?? 'not_assessed') },
    { id: 'name', header: 'Technique', render: (technique) => <span title={technique.name}>{technique.name}</span>, sortValue: (technique) => technique.name },
    { id: 'id', header: 'ID', render: (technique) => <span className="lab-id">{technique.id}</span>, sortValue: (technique) => technique.id },
    { id: 'family', header: TECHNIQUE_FAMILY_HEADING, render: (technique) => <span title={familyNameOf(technique.tactic)}>{familyNameOf(technique.tactic)}</span>, sortValue: (technique) => familyNameOf(technique.tactic) },
    { id: 'bands', header: 'Bands', render: (technique) => <span className="lab-id" title={technique.bandIds.join(' ')}>{technique.bandIds.join(' ')}</span> },
    { id: 'severity', header: CATALOG_SEVERITY_HEADING, render: (technique) => <SeverityMark severity={technique.severity} />, sortValue: (technique) => CATALOG_SEVERITIES.indexOf(technique.severity) },
    { id: 'effect', header: EFFECT_HEADING, render: (technique) => (technique.mode === null ? <span className="lab-soft">{EFFECT_NOT_STATED}</span> : effectLabelForMode(technique.mode)), sortValue: (technique) => technique.mode ?? '' },
  ], [scopeOf, familyNameOf]);
  const evidenceCounts = useMemo(() => countByEvidence(techniques), [techniques]);

  return (
    <div className="explore-techniques">
      <DataTable
        ref={ref} caption={CAPTION} columns={columns} rows={techniques} rowKey={(technique) => technique.id} emptyMessage={EMPTY_MESSAGE}
        sort={sort} onSortChange={onSortChange} openedKey={openedId} onOpenRow={(technique) => onOpen(technique.id)}
        renderCard={(technique) => (
          <div className="explore-technique-card">
            <strong>{technique.name}</strong> <span className="lab-id">{technique.id}</span>
            <EvidenceMark tier={technique.evidenceTier} status={technique.evidenceStatus} labelForm="short" />
            <ScopeCell entry={scopeOf(technique.id)} />
          </div>
        )}
      />
      <div className="explore-techniques-legend"><EvidenceLegend counts={evidenceCounts} isCompact /></div>
    </div>
  );
}
