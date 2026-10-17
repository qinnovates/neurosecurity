/** What removing a part or connection takes with it, counted from the model so the editor can say so before it happens. */

import type { DeviceModel } from '@/lib/threat-model/device-model';
import { RISK_ID_SEPARATOR } from '@/lib/threat-model/risk-register';

export interface RemovalImpact {
  /** Connections that end at the removed part and go with it. Empty when a connection is removed. */
  connectionIds: string[];
  /** Decisions recorded on what is removed. They stay in the model; they no longer have a row. */
  decisionCount: number;
}

function countDecisionsOn(model: DeviceModel, elementIds: readonly string[]): number {
  return model.riskDecisions.filter((decision) => elementIds.includes(decision.riskId.split(RISK_ID_SEPARATOR)[0])).length;
}

export function measurePartRemoval(model: DeviceModel, partId: string): RemovalImpact {
  const connectionIds = model.links.filter((link) => link.fromComponentId === partId || link.toComponentId === partId).map((link) => link.id);
  return { connectionIds, decisionCount: countDecisionsOn(model, [partId, ...connectionIds]) };
}

export function measureConnectionRemoval(model: DeviceModel, connectionId: string): RemovalImpact {
  return { connectionIds: [], decisionCount: countDecisionsOn(model, [connectionId]) };
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** The sentence the confirmation shows. Every figure is a count over the model. */
export function describeRemovalImpact(impact: RemovalImpact): string {
  const connections = impact.connectionIds.length === 0 ? '' : `${plural(impact.connectionIds.length, 'connection goes', 'connections go')} with it. `;
  const decisions = impact.decisionCount === 0
    ? 'No decision is recorded on it.'
    : `${plural(impact.decisionCount, 'recorded decision stays', 'recorded decisions stay')} in the model without a row.`;
  return `${connections}${decisions}`;
}
