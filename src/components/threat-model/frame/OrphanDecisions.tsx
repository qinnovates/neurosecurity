import Panel from '@/components/lab-kit/Panel';
import TechniqueLink from '@/components/lab-kit/TechniqueLink';
import type { OrphanDecision } from '@/lib/threat-model/orphan-decisions';
import { RISK_STATUS_LABELS } from '../risk-status-labels';

interface Props {
  orphans: readonly OrphanDecision[];
  /** The catalog's name for each technique id, so a decision is listed by the technique's name and not only its id. */
  techniqueNameById: ReadonlyMap<string, string>;
  /** The label of each part and connection still in the model. */
  elementLabelById: ReadonlyMap<string, string>;
  onOpenTechnique: (techniqueId: string) => void;
}

/** Where the decision was recorded: the part's name while it is in the model, and its id once it has been removed. */
export function describeOrphanPlace(orphan: Pick<OrphanDecision, 'cause' | 'elementId'>, elementLabelById: ReadonlyMap<string, string>): string {
  const label = elementLabelById.get(orphan.elementId);
  return orphan.cause === 'element_removed' || label === undefined ? `on a removed part (${orphan.elementId})` : `on ${label}`;
}

export const ORPHAN_DECISIONS_TITLE = 'Decisions without a row';
const NO_NOTE_LABEL = 'No note';

/** Decisions the model or the catalog has moved out from under. They are listed with the cause, never dropped. */
export default function OrphanDecisions({ orphans, techniqueNameById, elementLabelById, onOpenTechnique }: Props) {
  if (orphans.length === 0) return null;
  return (
    <Panel title={ORPHAN_DECISIONS_TITLE}>
      <ul className="model-orphans">
        {orphans.map((orphan) => (
          <li key={orphan.decision.riskId}>
            <p>
              <strong>{RISK_STATUS_LABELS[orphan.decision.status]}</strong>{' '}
              {orphan.techniqueId !== null && techniqueNameById.has(orphan.techniqueId) && <>{techniqueNameById.get(orphan.techniqueId)}{' '}</>}
              {orphan.techniqueId !== null && (orphan.cause === 'technique_not_in_catalog'
                ? <span className="lab-id">{orphan.techniqueId}</span>
                : <TechniqueLink techniqueId={orphan.techniqueId} techniqueName={techniqueNameById.get(orphan.techniqueId)} onOpen={onOpenTechnique} />)}{' '}
              <span className="lab-soft">{describeOrphanPlace(orphan, elementLabelById)}</span>
            </p>
            <p>{orphan.decision.note === '' ? <span className="lab-soft">{NO_NOTE_LABEL}</span> : orphan.decision.note}</p>
            <p className="lab-soft">{orphan.detail}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
