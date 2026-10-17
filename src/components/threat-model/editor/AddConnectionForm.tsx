import { useState, type FormEvent } from 'react';
import { LINK_MEDIA, type LinkMedium, type ModelComponent } from '@/lib/threat-model/device-model';
import type { ConnectionFields } from '@/lib/threat-model/model-edit';
import { CARRIES_FIELDS, MEDIUM_LABELS, type CarriesField } from './model-labels';

interface Props {
  parts: readonly ModelComponent[];
  onAdd: (connection: ConnectionFields) => void;
}

type Draft = Record<CarriesField, boolean> & { fromComponentId: string; toComponentId: string; medium: LinkMedium | '' };

const NOT_CHOSEN = '';
const EMPTY_DRAFT: Draft = {
  fromComponentId: NOT_CHOSEN, toComponentId: NOT_CHOSEN, medium: NOT_CHOSEN,
  carriesNeuralData: false, carriesStimulationCommands: false, carriesSoftwareUpdates: false,
};

function findProblem(draft: Draft): string | null {
  const missing = [
    ...(draft.fromComponentId === NOT_CHOSEN ? ['a part it runs from'] : []),
    ...(draft.toComponentId === NOT_CHOSEN ? ['a part it runs to'] : []),
    ...(draft.medium === NOT_CHOSEN ? ['a medium'] : []),
  ];
  if (missing.length > 0) return `A new connection needs ${missing.join(', ')}.`;
  return draft.fromComponentId === draft.toComponentId ? 'A connection runs between two different parts.' : null;
}

/** The row that adds a connection. Both ends and the medium start empty and must be chosen. */
export default function AddConnectionForm({ parts, onAdd }: Props) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [problem, setProblem] = useState<string | null>(null);
  const change = (changes: Partial<Draft>): void => setDraft((previous) => ({ ...previous, ...changes }));

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const found = findProblem(draft);
    setProblem(found);
    if (found !== null || draft.medium === NOT_CHOSEN) return;
    onAdd({ ...draft, medium: draft.medium });
    setDraft(EMPTY_DRAFT);
  };

  const partOptions = parts.map((part) => <option key={part.id} value={part.id}>{part.label}</option>);
  return (
    <form className="lab-editor-add" aria-label="Add a connection" noValidate onSubmit={submit}>
      <label className="lab-field">
        <span className="lab-label">From</span>
        <select className="lab-input" value={draft.fromComponentId} onChange={(event) => change({ fromComponentId: event.target.value })}>
          <option value={NOT_CHOSEN}>Choose a part</option>
          {partOptions}
        </select>
      </label>
      <label className="lab-field">
        <span className="lab-label">To</span>
        <select className="lab-input" value={draft.toComponentId} onChange={(event) => change({ toComponentId: event.target.value })}>
          <option value={NOT_CHOSEN}>Choose a part</option>
          {partOptions}
        </select>
      </label>
      <label className="lab-field">
        <span className="lab-label">Medium</span>
        <select className="lab-input" value={draft.medium} onChange={(event) => change({ medium: LINK_MEDIA.find((medium) => medium === event.target.value) ?? NOT_CHOSEN })}>
          <option value={NOT_CHOSEN}>Choose a medium</option>
          {LINK_MEDIA.map((medium) => <option key={medium} value={medium}>{MEDIUM_LABELS[medium]}</option>)}
        </select>
      </label>
      <fieldset className="lab-editor-group">
        <legend className="lab-label">Carries</legend>
        {CARRIES_FIELDS.map(({ field, label }) => (
          <label key={field} className="lab-editor-tick">
            <input type="checkbox" checked={draft[field]} onChange={(event) => change({ [field]: event.target.checked })} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <button type="submit" className="lab-button">Add connection</button>
      {problem !== null && <p role="alert" className="lab-label lab-editor-add-problem">{problem}</p>}
    </form>
  );
}
