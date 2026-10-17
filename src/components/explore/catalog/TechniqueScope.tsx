import HatchSwatch from '@/components/lab-kit/HatchSwatch';
import { NOT_ASSESSED_REASON, SCOPE_TERM_LABELS } from '@/lib/threat-model/lab-terms';
import type { ScopeEntry } from '@/lib/threat-model/scope-statement';
import { scopeLabelOf } from '../scope-words';

interface Props {
  entry: ScopeEntry;
  /** The label of a part or connection of the device in focus, by id. */
  elementLabelOf: (elementId: string) => string;
  onShowInModel: () => void;
}

const NOT_ASSESSED_CAVEAT = 'That is not the same as it not applying.';
const UNMET_CONDITION_LABEL = 'Condition not met';
const RESTORING_ANSWER_LABEL = 'Would be met when';
const PLACED_ON_LABEL = 'On';

/** Where one technique stands on the device in focus, with the reason the scope statement holds for it. */
export default function TechniqueScope({ entry, elementLabelOf, onShowInModel }: Props) {
  if (entry.term === 'not_assessed') {
    return <p data-term={entry.term}><HatchSwatch /> {SCOPE_TERM_LABELS.not_assessed}. {NOT_ASSESSED_REASON} {NOT_ASSESSED_CAVEAT}</p>;
  }
  if (entry.term === 'would_apply_if') {
    return (
      <div data-term={entry.term}>
        <p>{scopeLabelOf(entry)}.</p>
        <dl className="explore-conditions">
          {entry.conditions.map((condition) => (
            <div key={condition.ruleId}>
              <dt className="lab-label">{UNMET_CONDITION_LABEL}</dt>
              <dd>{condition.detail}</dd>
              <dt className="lab-label">{RESTORING_ANSWER_LABEL}</dt>
              <dd>{condition.restoringAnswer}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }
  return (
    <div data-term={entry.term}>
      <p>{SCOPE_TERM_LABELS[entry.term]}. {entry.reason}</p>
      {entry.term === 'applies' && (
        <>
          {entry.elementIds.length > 0 && <p className="lab-soft">{PLACED_ON_LABEL}: {entry.elementIds.map(elementLabelOf).join(', ')}</p>}
          <button type="button" className="lab-button" onClick={onShowInModel}>Show in Model</button>
        </>
      )}
    </div>
  );
}
