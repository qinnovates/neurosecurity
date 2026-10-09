import { RISK_STATUSES, type RiskStatus } from '@/lib/threat-model/device-model';
import { RISK_STATUS_LABELS } from '../risk-status-labels';
import type { DecisionTotals } from './overview-figures';
import StackBar, { StackKey, type StackTone } from './StackBar';

interface Props {
  totals: DecisionTotals;
}

export const DECISION_PROGRESS_TITLE = 'Decision progress';
/** An open row is an outline; a decided one is filled. */
const TONE_BY_STATUS: Readonly<Record<RiskStatus, StackTone>> = { open: 'open', mitigated: 'strong', accepted: 'medium', not_applicable: 'light' };
const ROW_KINDS: readonly { id: keyof DecisionTotals; label: string }[] = [
  { id: 'catalog', label: 'Neural techniques' },
  { id: 'baseline', label: 'STRIDE baseline' },
];

/** Rows by the decision recorded on each, for the catalog rows and for the baseline rows. Each integer is printed. */
export default function DecisionProgress({ totals }: Props) {
  return (
    <table className="model-coverage">
      <caption className="sr-only">{DECISION_PROGRESS_TITLE}</caption>
      <thead>
        <tr>
          <th scope="col">Rows</th>
          <th scope="col"><span className="sr-only">Share</span></th>
          {RISK_STATUSES.map((status) => (
            <th key={status} scope="col" className="model-coverage-figure"><StackKey tone={TONE_BY_STATUS[status]} /> {RISK_STATUS_LABELS[status]}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ROW_KINDS.map((kind) => (
          <tr key={kind.id}>
            <th scope="row">{kind.label}</th>
            <td className="model-coverage-bar">
              <StackBar
                subject={`${kind.label} rows`}
                segments={RISK_STATUSES.map((status) => ({ id: status, label: RISK_STATUS_LABELS[status], count: totals[kind.id][status], tone: TONE_BY_STATUS[status] }))}
              />
            </td>
            {RISK_STATUSES.map((status) => <td key={status} className="model-coverage-figure lab-figure">{totals[kind.id][status]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
