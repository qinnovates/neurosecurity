import { useState, type FormEvent } from 'react';
import { COMPONENT_KINDS, MODEL_LIMITS, TRUST_ZONES, type ComponentKind, type TrustZone } from '@/lib/threat-model/device-model';
import type { NewPartFields } from '@/lib/threat-model/model-edit';
import { KIND_LABELS, ZONE_LABELS } from './model-labels';

interface Props {
  onAdd: (part: NewPartFields) => void;
}

interface Draft {
  label: string;
  kind: ComponentKind | '';
  trustZone: TrustZone | '';
  isSharedAcrossPatients: boolean;
}

const EMPTY_DRAFT: Draft = { label: '', kind: '', trustZone: '', isSharedAcrossPatients: false };
const NOT_CHOSEN = '';

function findMissingFields(draft: Draft): string[] {
  return [
    ...(draft.label.trim() === '' ? ['a label'] : []),
    ...(draft.kind === NOT_CHOSEN ? ['a kind'] : []),
    ...(draft.trustZone === NOT_CHOSEN ? ['a zone'] : []),
  ];
}

/** The row that adds a part. Nothing is pre-filled: the kind and zone are the reader's to state. */
export default function AddPartForm({ onAdd }: Props) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [problem, setProblem] = useState<string | null>(null);
  const change = (changes: Partial<Draft>): void => setDraft((previous) => ({ ...previous, ...changes }));

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const missing = findMissingFields(draft);
    setProblem(missing.length === 0 ? null : `A new part needs ${missing.join(', ')}.`);
    if (draft.kind === NOT_CHOSEN || draft.trustZone === NOT_CHOSEN || missing.length > 0) return;
    onAdd({
      label: draft.label.trim().slice(0, MODEL_LIMITS.maxLabelLength), kind: draft.kind, trustZone: draft.trustZone,
      isSharedAcrossPatients: draft.isSharedAcrossPatients,
    });
    setDraft(EMPTY_DRAFT);
  };

  return (
    <form className="lab-editor-add" aria-label="Add a part" noValidate onSubmit={submit}>
      <label className="lab-field">
        <span className="lab-label">Label of the new part</span>
        <input className="lab-input" type="text" value={draft.label} maxLength={MODEL_LIMITS.maxLabelLength} onChange={(event) => change({ label: event.target.value })} />
      </label>
      <label className="lab-field">
        <span className="lab-label">Kind</span>
        <select className="lab-input" value={draft.kind} onChange={(event) => change({ kind: COMPONENT_KINDS.find((kind) => kind === event.target.value) ?? NOT_CHOSEN })}>
          <option value={NOT_CHOSEN}>Choose a kind</option>
          {COMPONENT_KINDS.map((kind) => <option key={kind} value={kind}>{KIND_LABELS[kind]}</option>)}
        </select>
      </label>
      <label className="lab-field">
        <span className="lab-label">Zone</span>
        <select className="lab-input" value={draft.trustZone} onChange={(event) => change({ trustZone: TRUST_ZONES.find((zone) => zone === event.target.value) ?? NOT_CHOSEN })}>
          <option value={NOT_CHOSEN}>Choose a zone</option>
          {TRUST_ZONES.map((zone) => <option key={zone} value={zone}>{ZONE_LABELS[zone]}</option>)}
        </select>
      </label>
      <label className="lab-editor-tick">
        <input type="checkbox" checked={draft.isSharedAcrossPatients} onChange={(event) => change({ isSharedAcrossPatients: event.target.checked })} />
        <span>Shared across patients</span>
      </label>
      <button type="submit" className="lab-button">Add part</button>
      {problem !== null && <p role="alert" className="lab-label lab-editor-add-problem">{problem}</p>}
    </form>
  );
}
