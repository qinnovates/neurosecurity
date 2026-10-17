import { useEffect, useState } from 'react';
import type { RiskStatus } from '@/lib/threat-model/device-model';
import type { RiskRow } from '@/lib/threat-model/report-types';
import { canRecordDecision } from './decision-rules';

export interface DecisionDraft {
  status: RiskStatus;
  note: string;
  /** True while the draft cannot be recorded: the chosen decision needs a note and has none. */
  isNoteMissing: boolean;
  change: (status: RiskStatus, note: string) => void;
}

/**
 * What the reader has chosen for one row, which is recorded the moment it can be. A decision
 * that needs a note is held here, unrecorded, until the note is written.
 *
 * @param pendingStatus a decision chosen on the row itself that could not be recorded for want of a note
 */
export function useDecisionDraft(
  row: Pick<RiskRow, 'riskId' | 'status' | 'note'>,
  pendingStatus: RiskStatus | null,
  onDecide: (riskId: string, status: RiskStatus, note: string) => void,
): DecisionDraft {
  const [draft, setDraft] = useState({ status: pendingStatus ?? row.status, note: row.note });

  // The draft follows what is recorded: another row, a decision made on the row itself, a file loaded.
  useEffect(() => {
    setDraft({ status: pendingStatus ?? row.status, note: row.note });
  }, [row.riskId, row.status, row.note, pendingStatus]);

  const change = (status: RiskStatus, note: string): void => {
    setDraft({ status, note });
    if (canRecordDecision(status, note)) onDecide(row.riskId, status, note);
  };

  return { ...draft, isNoteMissing: !canRecordDecision(draft.status, draft.note), change };
}
