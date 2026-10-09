import Drawer from '@/components/lab-kit/Drawer';
import type { CatalogTechnique } from '@/lib/threat-model/catalog-types';
import type { RiskStatus } from '@/lib/threat-model/device-model';
import type { RiskRow, ThreatModelReport } from '@/lib/threat-model/report-types';
import RiskDetail from '../RiskDetail';

interface Props {
  /** The opened risk, or null when the drawer is closed. */
  row: RiskRow | null;
  report: ThreatModelReport;
  techniqueById: ReadonlyMap<string, CatalogTechnique>;
  pendingStatus: RiskStatus | null;
  onDecide: (riskId: string, status: RiskStatus, note: string) => void;
  onOpenTechnique: (techniqueId: string) => void;
  onClose: () => void;
}

/** Why the placement table puts the row's technique on the row's part, in the table's own words. */
export function listPlacementReasons(row: RiskRow, report: Pick<ThreatModelReport, 'elementOutcomes'>): string[] {
  const outcome = report.elementOutcomes.find((candidate) => candidate.elementId === row.elementId);
  if (outcome?.kind !== 'matched') return [];
  return outcome.matches.find((match) => match.techniqueId === row.techniqueId)?.reasons.map((reason) => reason.detail) ?? [];
}

/**
 * The detail of one risk, as an inspector beside the register. Focus is not trapped, so the
 * reader can keep walking the table with the drawer open; Escape closes it.
 */
export default function RiskDrawer({ row, report, techniqueById, pendingStatus, onDecide, onOpenTechnique, onClose }: Props) {
  return (
    <Drawer isOpen={row !== null} title={row?.title ?? ''} onClose={onClose} isFocusTrapped={false}>
      {row !== null && (
        <RiskDetail
          row={row} technique={row.techniqueId === null ? undefined : techniqueById.get(row.techniqueId)}
          placementReasons={listPlacementReasons(row, report)} precedentCvesAsOf={report.precedentCvesAsOf}
          precedentCves={report.precedentCves.filter((cve) => row.precedentCveIds.includes(cve.cveId))}
          pendingStatus={pendingStatus} onDecide={onDecide} onOpenTechnique={onOpenTechnique}
        />
      )}
    </Drawer>
  );
}
