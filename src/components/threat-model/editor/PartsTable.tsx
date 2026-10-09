import { useId, useMemo, useState } from 'react';
import DataTable, { type DataTableColumn } from '@/components/lab-kit/DataTable';
import Panel from '@/components/lab-kit/Panel';
import { COMPONENT_KINDS, MODEL_LIMITS, TRUST_ZONES, type DeviceModel, type ModelComponent } from '@/lib/threat-model/device-model';
import type { ModelEdit, PartFields } from '@/lib/threat-model/model-edit';
import AddPartForm from './AddPartForm';
import CommittedTextField from './CommittedTextField';
import EditorConfirm from './EditorConfirm';
import { renderEditorCard } from './editor-card';
import { KIND_LABELS, ZONE_LABELS } from './model-labels';
import { describeRemovalImpact, measurePartRemoval } from './removal-impact';

interface Props {
  model: DeviceModel;
  onEdit: (edit: ModelEdit) => void;
}

const TISSUE_PART_NOTICE = 'The part that contacts tissue or the scalp cannot be removed: a model has exactly one. Mark another part first.';
const PART_LIMIT_NOTICE = `The model file holds at most ${MODEL_LIMITS.maxComponents} parts. Remove one to add another.`;

type ChangePart = (partId: string, changes: Partial<PartFields>) => void;

function buildColumns(tissueGroupName: string, changePart: ChangePart, askToRemove: (part: ModelComponent) => void): DataTableColumn<ModelComponent>[] {
  return [
    {
      id: 'label', header: 'Part',
      render: (part) => (
        <CommittedTextField
          label={`Label of ${part.label}`} isLabelHidden value={part.label} maxLength={MODEL_LIMITS.maxLabelLength}
          onCommit={(label) => changePart(part.id, { label })}
        />
      ),
    },
    {
      id: 'kind', header: 'Kind',
      render: (part) => (
        <select
          className="lab-input" aria-label={`Kind of ${part.label}`} value={part.kind}
          onChange={(event) => { const kind = COMPONENT_KINDS.find((candidate) => candidate === event.target.value); if (kind !== undefined) changePart(part.id, { kind }); }}
        >
          {COMPONENT_KINDS.map((kind) => <option key={kind} value={kind}>{KIND_LABELS[kind]}</option>)}
        </select>
      ),
    },
    {
      id: 'zone', header: 'Zone',
      render: (part) => (
        <select
          className="lab-input" aria-label={`Zone of ${part.label}`} value={part.trustZone}
          onChange={(event) => { const trustZone = TRUST_ZONES.find((candidate) => candidate === event.target.value); if (trustZone !== undefined) changePart(part.id, { trustZone }); }}
        >
          {TRUST_ZONES.map((zone) => <option key={zone} value={zone}>{ZONE_LABELS[zone]}</option>)}
        </select>
      ),
    },
    {
      id: 'shared', header: 'Shared across patients',
      render: (part) => (
        <label className="lab-editor-tick">
          <input
            type="checkbox" aria-label={`${part.label} is shared across patients`} checked={part.isSharedAcrossPatients}
            onChange={(event) => changePart(part.id, { isSharedAcrossPatients: event.target.checked })}
          />
        </label>
      ),
    },
    {
      id: 'tissue', header: 'Contacts tissue or scalp',
      render: (part) => (
        <label className="lab-editor-tick">
          <input
            type="radio" name={tissueGroupName} aria-label={`${part.label} contacts tissue or the scalp`} checked={part.isNeuralInterface}
            onChange={() => changePart(part.id, { isNeuralInterface: true })}
          />
        </label>
      ),
    },
    {
      id: 'remove', header: 'Remove',
      render: (part) => <button type="button" className="lab-button" aria-label={`Remove ${part.label}`} onClick={() => askToRemove(part)}>Remove</button>,
    },
  ];
}

/** The device's parts, one line each, edited in place. Ids are never shown as editable: they do not change. */
export default function PartsTable({ model, onEdit }: Props) {
  const tissueGroupName = useId();
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const pendingPart = model.components.find((part) => part.id === pendingRemovalId) ?? null;
  const partCount = model.components.length;

  const columns = useMemo(() => {
    const changePart: ChangePart = (partId, changes) => onEdit({ type: 'part-changed', partId, changes });
    const askToRemove = (part: ModelComponent): void => {
      setNotice(part.isNeuralInterface ? TISSUE_PART_NOTICE : null);
      setPendingRemovalId(part.isNeuralInterface ? null : part.id);
    };
    return buildColumns(tissueGroupName, changePart, askToRemove);
  }, [tissueGroupName, onEdit]);

  const removePending = (): void => {
    if (pendingPart !== null) onEdit({ type: 'part-removed', partId: pendingPart.id });
    setPendingRemovalId(null);
  };

  return (
    <Panel title="Parts">
      <div className="lab-editor-table">
        <DataTable
          caption={`${partCount} of at most ${MODEL_LIMITS.maxComponents} parts`} columns={columns} rows={model.components} rowKey={(part) => part.id}
          emptyMessage="No parts. Add the part that contacts tissue or the scalp first." renderCard={renderEditorCard(columns)}
        />
      </div>
      {notice !== null && <p role="alert" className="lab-notice">{notice}</p>}
      {pendingPart !== null && (
        <EditorConfirm
          question={`Remove ${pendingPart.label}?`} detail={describeRemovalImpact(measurePartRemoval(model, pendingPart.id))}
          confirmLabel="Remove it" keepLabel={`Keep ${pendingPart.label}`} onConfirm={removePending} onKeep={() => setPendingRemovalId(null)}
        />
      )}
      {partCount >= MODEL_LIMITS.maxComponents
        ? <p role="status" className="lab-notice">{PART_LIMIT_NOTICE}</p>
        : <AddPartForm onAdd={(part) => onEdit({ type: 'part-added', part })} />}
    </Panel>
  );
}
