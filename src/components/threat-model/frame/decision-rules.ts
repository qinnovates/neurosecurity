/** When a decision on a row can be recorded. Accepting a risk, or ruling it out, needs the reason written down. */

import type { RiskStatus } from '@/lib/threat-model/device-model';
import { RISK_STATUS_LABELS } from '../risk-status-labels';

export const NOTE_REQUIRED_STATUSES: readonly RiskStatus[] = ['accepted', 'not_applicable'];

export function isNoteRequired(status: RiskStatus): boolean {
  return NOTE_REQUIRED_STATUSES.includes(status);
}

export function canRecordDecision(status: RiskStatus, note: string): boolean {
  return !isNoteRequired(status) || note.trim() !== '';
}

export const NOTE_REQUIRED_STATEMENT = `A note is required for ${NOTE_REQUIRED_STATUSES.map((status) => RISK_STATUS_LABELS[status]).join(' and ')}.`;
export const NOT_RECORDED_STATEMENT = 'This decision is not recorded yet.';
