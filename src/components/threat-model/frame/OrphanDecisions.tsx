import Panel from '@/components/lab-kit/Panel';
import TechniqueLink from '@/components/lab-kit/TechniqueLink';
import type { OrphanDecision } from '@/lib/threat-model/orphan-decisions';
import { RISK_STATUS_LABELS } from '../risk-status-labels';

interface Props {
  orphans: readonly OrphanDecision[];
  onOpenTechnique: (techniqueId: string) => void;
}

export const ORPHAN_DECISIONS_TITLE = 'Decisions without a row';
const NO_NOTE_LABEL = 'No note';

/** Decisions the model or the catalog has moved out from under. They are listed with the cause, never dropped. */
export default function OrphanDecisions({ orphans, onOpenTechnique }: Props) {
  if (orphans.length === 0) return null;
  return (
    <Panel title={ORPHAN_DECISIONS_TITLE}>
      <ul className="model-orphans">
        {orphans.map((orphan) => (
          <li key={orphan.decision.riskId}>
            <p>
              <strong>{RISK_STATUS_LABELS[orphan.decision.status]}</strong>{' '}
              {orphan.techniqueId !== null && (orphan.cause === 'technique_not_in_catalog'
                ? <span className="lab-id">{orphan.techniqueId}</span>
                : <TechniqueLink techniqueId={orphan.techniqueId} onOpen={onOpenTechnique} />)}{' '}
              <span className="lab-id">{orphan.elementId}</span>
            </p>
            <p>{orphan.decision.note === '' ? <span className="lab-soft">{NO_NOTE_LABEL}</span> : orphan.decision.note}</p>
            <p className="lab-soft">{orphan.detail}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
