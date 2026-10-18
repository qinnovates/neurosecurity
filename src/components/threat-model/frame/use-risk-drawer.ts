/**
 * The opened risk and the decisions made on it. The opened risk is kept in view state, so it
 * is still open when the reader comes back; closing it puts focus back on its row.
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { DataTableHandle } from '@/components/lab-kit/DataTable';
import { useFocus } from '@/components/workbench/FocusContext';
import { useViewState } from '@/components/workbench/ViewStateContext';
import type { RiskStatus } from '@/lib/threat-model/device-model';
import type { RiskRow } from '@/lib/threat-model/report-types';
import { canRecordDecision } from './decision-rules';
import { MODEL_STATE_KEYS, isNullableRiskId } from './model-view-keys';

interface PendingDecision {
  riskId: string;
  status: RiskStatus;
}

export interface RiskDrawerState {
  /** The risk whose detail is open, or null. A risk the device no longer has closes itself. */
  openedRisk: RiskRow | null;
  /** A decision chosen on the opened row that is waiting for its note. */
  pendingStatus: RiskStatus | null;
  tableRef: RefObject<DataTableHandle | null>;
  openRisk: (riskId: string) => void;
  closeRisk: () => void;
  /** Records a decision made in the drawer, where the note is at hand. */
  decide: (riskId: string, status: RiskStatus, note: string) => void;
  /** A decision chosen on the row itself: recorded at once, or the drawer opens for the note it needs. */
  decideOnRow: (row: RiskRow, status: RiskStatus) => void;
}

export function useRiskDrawer(rows: readonly RiskRow[]): RiskDrawerState {
  const { dispatch } = useFocus();
  const [openedRiskId, setOpenedRiskId] = useViewState<string | null>(MODEL_STATE_KEYS.openedRiskId, null, isNullableRiskId);
  const [pending, setPending] = useState<PendingDecision | null>(null);
  const tableRef = useRef<DataTableHandle>(null);
  const lastOpenedRef = useRef<string | null>(openedRiskId);

  // The drawer returns focus to whatever opened it. When that is gone (another view, a re-sorted table), the row takes it.
  useEffect(() => {
    const closedRiskId = openedRiskId === null ? lastOpenedRef.current : null;
    lastOpenedRef.current = openedRiskId;
    const isFocusLost = document.activeElement === null || document.activeElement === document.body;
    if (closedRiskId !== null && isFocusLost) tableRef.current?.focusRow(closedRiskId);
  }, [openedRiskId]);

  const decide = useCallback((riskId: string, status: RiskStatus, note: string): void => {
    setPending(null);
    dispatch({ type: 'risk-decided', riskId, status, note });
  }, [dispatch]);
  const decideOnRow = useCallback((row: RiskRow, status: RiskStatus): void => {
    if (canRecordDecision(status, row.note)) {
      decide(row.riskId, status, row.note);
      return;
    }
    setPending({ riskId: row.riskId, status });
    setOpenedRiskId(row.riskId);
  }, [decide, setOpenedRiskId]);
  const openRisk = useCallback((riskId: string): void => {
    setPending(null);
    setOpenedRiskId(riskId);
  }, [setOpenedRiskId]);
  const closeRisk = useCallback((): void => {
    setPending(null);
    setOpenedRiskId(null);
  }, [setOpenedRiskId]);

  const openedRisk = rows.find((row) => row.riskId === openedRiskId) ?? null;
  return {
    openedRisk, tableRef, openRisk, closeRisk, decide, decideOnRow,
    pendingStatus: pending !== null && pending.riskId === openedRisk?.riskId ? pending.status : null,
  };
}
