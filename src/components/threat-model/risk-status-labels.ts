import type { RiskStatus } from '@/lib/threat-model/device-model';

/** The words for a risk's disposition, shared by the register, the risk panel and the printed report. */
export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  open: 'Open',
  mitigated: 'Mitigated',
  accepted: 'Accepted',
  not_applicable: 'Not applicable',
};
