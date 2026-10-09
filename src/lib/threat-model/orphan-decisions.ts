/**
 * Decisions that no longer have a row. A decision someone recorded is never dropped: when
 * the model or the catalog changes under it, it is listed here with the cause.
 */

import type { DeviceModel, RiskDecision } from './device-model';
import type { ThreatModelReport } from './report-types';
import { RISK_ID_SEPARATOR, STRIDE_RISK_PREFIX } from './risk-register';

export const ORPHAN_CAUSES = ['element_removed', 'technique_no_longer_applies', 'technique_not_in_catalog', 'baseline_no_longer_applies'] as const;
export type OrphanCause = typeof ORPHAN_CAUSES[number];

export interface OrphanDecision {
  decision: RiskDecision;
  /** The part or connection id the decision was recorded on, as read from its risk id. */
  elementId: string;
  /** The technique id, or null for a baseline row. */
  techniqueId: string | null;
  cause: OrphanCause;
  /** The cause in words. For a technique that no longer applies, it ends with the unmet condition. */
  detail: string;
}

const ELEMENT_REMOVED_DETAIL = 'The part or connection this decision was recorded on is no longer in the model.';
const NOT_IN_CATALOG_DETAIL = 'The technique is no longer in the catalog.';
const BASELINE_DETAIL = 'The baseline no longer lists this category for this part or connection.';
const NO_LONGER_APPLIES_DETAIL = 'The technique no longer applies here.';
const NOT_PLACED_HERE_CONDITION = 'The placement table does not put it on this part or connection as the model now describes it.';

type Cause = Pick<OrphanDecision, 'cause' | 'detail'>;

function findCause(elementId: string, subjectId: string, model: DeviceModel, report: ThreatModelReport): Cause {
  const hasElement = model.components.some((component) => component.id === elementId) || model.links.some((link) => link.id === elementId);
  if (!hasElement) return { cause: 'element_removed', detail: ELEMENT_REMOVED_DETAIL };
  if (subjectId.startsWith(STRIDE_RISK_PREFIX)) return { cause: 'baseline_no_longer_applies', detail: BASELINE_DETAIL };
  const excluded = report.elementOutcomes
    .flatMap((outcome) => outcome.excluded)
    .find((exclusion) => exclusion.elementId === elementId && exclusion.techniqueId === subjectId);
  return { cause: 'technique_no_longer_applies', detail: `${NO_LONGER_APPLIES_DETAIL} ${excluded?.reason.detail ?? NOT_PLACED_HERE_CONDITION}` };
}

/**
 * Every recorded decision whose risk id matches no row the model now produces.
 * @param model the model holding the decisions
 * @param report the report built from that model
 */
export function listOrphanDecisions(model: DeviceModel, report: ThreatModelReport): OrphanDecision[] {
  const rowById = new Map(report.riskRows.map((row) => [row.riskId, row]));
  return model.riskDecisions.flatMap((decision): OrphanDecision[] => {
    const row = rowById.get(decision.riskId);
    if (row !== undefined && row.catalogState === 'current') return [];
    const [elementId, subjectId = ''] = decision.riskId.split(RISK_ID_SEPARATOR);
    const techniqueId = subjectId === '' || subjectId.startsWith(STRIDE_RISK_PREFIX) ? null : subjectId;
    // The register keeps a flagged row for a decision whose technique left the catalog; that row is the evidence for this cause.
    const cause: Cause = row === undefined ? findCause(elementId, subjectId, model, report) : { cause: 'technique_not_in_catalog', detail: NOT_IN_CATALOG_DETAIL };
    return [{ decision, elementId, techniqueId, ...cause }];
  });
}
