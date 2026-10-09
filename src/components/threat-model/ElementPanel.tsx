import EmptyState from '@/components/lab-kit/EmptyState';
import type { ElementOutcome } from '@/lib/threat-model/report-types';

interface Props {
  elementLabel: string;
  outcome: ElementOutcome;
}

/**
 * Says why the selected part or connection has no technique on it. A part with techniques
 * says nothing here: its rows are in the register and each row states its own reason.
 */
export default function ElementPanel({ elementLabel, outcome }: Props) {
  if (outcome.kind === 'matched') return null;
  if (outcome.kind === 'not_modelled') {
    return (
      <section className="lab-panel" aria-label={elementLabel}>
        <EmptyState reason="not-assessed" detail={<>{outcome.detail} Nothing was assessed here; treat it as a gap in this tool, not as an absence of threats.</>} />
      </section>
    );
  }
  return (
    <section className="lab-panel" aria-label={elementLabel}>
      <div className="lab-panel-body">
        <p><strong>{elementLabel}.</strong> Techniques were considered here and excluded. This is not the same as no threat.</p>
        <ul className="model-risk-list">
          {outcome.exclusions.map((exclusion) => <li key={`${exclusion.ruleId}-${exclusion.detail}`}>{exclusion.detail}</li>)}
        </ul>
      </div>
    </section>
  );
}
