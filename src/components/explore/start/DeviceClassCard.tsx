import type { ReactNode } from 'react';
import HatchSwatch from '@/components/lab-kit/HatchSwatch';
import DeviceMiniDiagram from '@/components/threat-model/diagram/DeviceMiniDiagram';
import type { InterfaceDirection } from '@/lib/threat-model/device-model';
import { SCOPE_TERM_LABELS } from '@/lib/threat-model/lab-terms';
import type { ComparedDevice } from './class-scopes';

const DIRECTION_LABELS: Readonly<Record<InterfaceDirection, string>> = { read: 'Records', write: 'Stimulates', bidirectional: 'Records and stimulates' };

interface Props {
  device: ComparedDevice;
  /** The name shown on the card, when it is not the label the comparison uses. */
  title?: string;
  /** A line above the name, for the reader's own device. */
  kicker?: string;
  description?: string;
  isInFocus: boolean;
  actionLabel: string;
  onAction: () => void;
  /** Shown in place of the action while the reader is asked to confirm a replacement. */
  confirm?: ReactNode;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** One device on the Start view: its drawing, the facts that compare across classes, and one action. */
export default function DeviceClassCard({ device, title = device.label, kicker, description, isInFocus, actionLabel, onAction, confirm }: Props) {
  const { model, scope } = device;
  return (
    <article className="lab-panel explore-class" data-in-focus={isInFocus} aria-label={title}>
      <div className="explore-class-diagram"><DeviceMiniDiagram model={model} /></div>
      <div className="explore-class-name">
        {kicker !== undefined && <p className="lab-label">{kicker}</p>}
        <h3 className="lab-panel-title">{title}</h3>
        {description !== undefined && <p className="lab-soft">{description}</p>}
      </div>
      <div className="explore-class-facts">
        <p>{DIRECTION_LABELS[model.direction]} · {plural(model.components.length, 'part', 'parts')} · {plural(model.links.length, 'connection', 'connections')}</p>
        <p className="explore-class-scope">
          <span><span className="lab-figure">{scope.applies.length}</span> of <span className="lab-figure">{scope.total}</span> catalog techniques apply</span>
          <span><HatchSwatch /> <span className="lab-figure">{scope.notAssessed.length}</span> {SCOPE_TERM_LABELS.not_assessed.toLowerCase()}</span>
        </p>
      </div>
      {confirm ?? (
        <div className="explore-class-actions">
          {/* The visible words, then the device, so three cards do not offer three buttons of one name. */}
          <button type="button" className={`lab-button${isInFocus ? ' lab-button--primary' : ''}`} aria-label={`${actionLabel}: ${title}`} onClick={onAction}>{actionLabel}</button>
        </div>
      )}
    </article>
  );
}
