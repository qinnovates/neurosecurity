import { useState } from 'react';
import Panel from '@/components/lab-kit/Panel';
import { BLANK_DEVICE_NAME } from '@/lib/threat-model/model-edit';
import type { DeviceArchetype } from '@/lib/threat-model/reference-data-types';
import EditorConfirm from './EditorConfirm';

interface Props {
  archetypes: readonly DeviceArchetype[];
  /** The preset the device still equals, or null once it is edited, blank or read from a file. */
  currentArchetypeId: string | null;
  deviceName: string;
  /** True when replacing the device would lose something the reader did. */
  hasWork: boolean;
  /** How many risks carry a recorded decision. */
  decisionCount: number;
  onSelectPreset: (archetype: DeviceArchetype) => void;
  onStartBlank: () => void;
}

/** A start the reader asked for and has not yet confirmed. */
type PendingStart = { kind: 'preset'; archetype: DeviceArchetype } | { kind: 'blank' };

const BLANK_LABEL = 'a blank device';
const SAVE_FIRST_HINT = 'Use "Save file" in the device menu first to keep them.';

function describeLoss(decisionCount: number): string {
  const decisions = decisionCount === 0 ? '' : `${decisionCount} recorded decision${decisionCount === 1 ? '' : 's'} and `;
  return `You will lose ${decisions}the edits to this device. ${SAVE_FIRST_HINT}`;
}

/** Replaces the device with a preset or a blank one. Work is never discarded without asking. */
export default function StartFrom({ archetypes, currentArchetypeId, deviceName, hasWork, decisionCount, onSelectPreset, onStartBlank }: Props) {
  const [pending, setPending] = useState<PendingStart | null>(null);

  const start = (requested: PendingStart): void => {
    setPending(null);
    if (requested.kind === 'preset') onSelectPreset(requested.archetype);
    else onStartBlank();
  };
  const request = (requested: PendingStart): void => {
    if (hasWork) setPending(requested);
    else start(requested);
  };

  return (
    <Panel title="Start from">
      <ul className="lab-pick-list lab-editor-starts">
        {archetypes.map((archetype) => (
          <li key={archetype.id}>
            <button type="button" className="lab-pick" aria-pressed={archetype.id === currentArchetypeId} onClick={() => request({ kind: 'preset', archetype })}>
              <strong>{archetype.label}</strong>
              <span className="lab-pick-sub lab-soft">{archetype.description}</span>
            </button>
          </li>
        ))}
        <li>
          <button type="button" className="lab-pick" aria-pressed={false} onClick={() => request({ kind: 'blank' })}>
            <strong>Start blank</strong>
            <span className="lab-pick-sub lab-soft">
              Keeps the device facts and the part that contacts tissue or the scalp, removes every other part and every connection,
              and names the device "{BLANK_DEVICE_NAME}".
            </span>
          </button>
        </li>
      </ul>
      {pending !== null && (
        <EditorConfirm
          question={`Replace ${deviceName} with ${pending.kind === 'preset' ? pending.archetype.label : BLANK_LABEL}?`} detail={describeLoss(decisionCount)}
          confirmLabel="Replace it" keepLabel={`Keep ${deviceName}`} onConfirm={() => start(pending)} onKeep={() => setPending(null)}
        />
      )}
    </Panel>
  );
}
