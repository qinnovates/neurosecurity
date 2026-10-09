import HatchSwatch from '@/components/lab-kit/HatchSwatch';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { NOT_ASSESSED_REASON, SCOPE_TERMS, SCOPE_TERM_LABELS, type ScopeTerm } from '@/lib/threat-model/lab-terms';
import { SCOPE_LIST_BY_TERM, type ScopeEntry, type ScopeStatement } from '@/lib/threat-model/scope-statement';
import { describeElement } from '@/lib/threat-model/stride';
import { ReportSection, ReportTable, type ReportColumn } from './ReportSection';

interface Props {
  model: DeviceModel;
  scope: ScopeStatement;
  /** Kinds of part or connection no placement decision covers, as the engine states them. */
  coverageGaps: readonly string[];
}

const ID_COLUMN: ReportColumn<ScopeEntry> = { id: 'id', header: 'ID', render: (entry) => <span className="lab-id">{entry.techniqueId}</span> };
const NAME_COLUMN: ReportColumn<ScopeEntry> = { id: 'technique', header: 'Technique', render: (entry) => entry.name };
const REASON_COLUMN: ReportColumn<ScopeEntry> = { id: 'reason', header: 'Reason', render: (entry) => entry.reason };

function columnsFor(term: ScopeTerm, model: DeviceModel): readonly ReportColumn<ScopeEntry>[] {
  if (term === 'applies') {
    return [ID_COLUMN, NAME_COLUMN, { id: 'parts', header: 'On', render: (entry) => entry.elementIds.map((elementId) => describeElement(model, elementId)).join('; ') }, REASON_COLUMN];
  }
  if (term === 'would_apply_if') {
    return [ID_COLUMN, NAME_COLUMN, {
      id: 'conditions', header: 'Condition not met, and what would meet it',
      render: (entry) => <ul className="report-cell-list">{entry.conditions.map((condition) => <li key={condition.ruleId}>{condition.detail} {condition.restoringAnswer}</li>)}</ul>,
    }];
  }
  // Every technique under "not assessed" has the same reason, printed once above the list.
  return term === 'not_assessed' ? [ID_COLUMN, NAME_COLUMN] : [ID_COLUMN, NAME_COLUMN, REASON_COLUMN];
}

/** Every catalog technique under exactly one of the four terms, each with the reason it is there. */
export default function ReportScope({ model, scope, coverageGaps }: Props) {
  return (
    <ReportSection id="scope">
      <p>The catalog holds {scope.total} techniques. Each is in exactly one of the {SCOPE_TERMS.length} lists below.</p>
      {SCOPE_TERMS.map((term) => {
        const entries = scope[SCOPE_LIST_BY_TERM[term]];
        return (
          <div key={term} className="report-scope-list">
            <h3 className="report-subheading">{term === 'not_assessed' && <HatchSwatch />} {SCOPE_TERM_LABELS[term]}: {entries.length}</h3>
            {term === 'not_assessed' && entries.length > 0 && <p>{NOT_ASSESSED_REASON}</p>}
            <ReportTable caption={`${SCOPE_TERM_LABELS[term]}: ${entries.length} of ${scope.total}`} columns={columnsFor(term, model)} rows={entries} rowKey={(entry) => entry.techniqueId} emptyMessage="No catalog technique is in this list for this device." />
          </div>
        );
      })}
      {coverageGaps.length > 0 && <ul className="report-list">{coverageGaps.map((gap) => <li key={gap}>{gap} Nothing was assessed there.</li>)}</ul>}
    </ReportSection>
  );
}
