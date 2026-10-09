import { useMemo, useState } from 'react';
import DataTable, { type DataTableColumn } from '@/components/lab-kit/DataTable';
import Panel from '@/components/lab-kit/Panel';
import { LINK_MEDIA, MODEL_LIMITS, type DeviceModel, type ModelComponent, type ModelLink } from '@/lib/threat-model/device-model';
import type { ConnectionFields, ModelEdit } from '@/lib/threat-model/model-edit';
import { describeLink } from '@/lib/threat-model/stride';
import AddConnectionForm from './AddConnectionForm';
import EditorConfirm from './EditorConfirm';
import { renderEditorCard } from './editor-card';
import { CARRIES_FIELDS, MEDIUM_LABELS } from './model-labels';
import { describeRemovalImpact, measureConnectionRemoval } from './removal-impact';

interface Props {
  model: DeviceModel;
  onEdit: (edit: ModelEdit) => void;
}

const CONNECTION_LIMIT_NOTICE = `The model file holds at most ${MODEL_LIMITS.maxLinks} connections. Remove one to add another.`;
const TOO_FEW_PARTS_NOTICE = 'A connection runs between two parts. Add a second part to connect them.';
const MIN_PARTS_TO_CONNECT = 2;

type ChangeConnection = (connectionId: string, changes: Partial<ConnectionFields>) => void;
type EndField = 'fromComponentId' | 'toComponentId';

interface ColumnContext {
  model: DeviceModel;
  changeConnection: ChangeConnection;
  askToRemove: (connection: ModelLink) => void;
}

/** One end of a connection. The part at the other end is left out, since a connection cannot join a part to itself. */
function endColumn(field: EndField, header: string, { model, changeConnection }: ColumnContext): DataTableColumn<ModelLink> {
  const otherField: EndField = field === 'fromComponentId' ? 'toComponentId' : 'fromComponentId';
  const optionsFor = (connection: ModelLink): ModelComponent[] => model.components.filter((part) => part.id !== connection[otherField]);
  return {
    id: field, header,
    render: (connection) => (
      <select
        className="lab-input" aria-label={`${header}, ${describeLink(model, connection.id)}`} value={connection[field]}
        onChange={(event) => changeConnection(connection.id, { [field]: event.target.value })}
      >
        {optionsFor(connection).map((part) => <option key={part.id} value={part.id}>{part.label}</option>)}
      </select>
    ),
  };
}

function buildColumns(context: ColumnContext): DataTableColumn<ModelLink>[] {
  const { model, changeConnection, askToRemove } = context;
  return [
    endColumn('fromComponentId', 'From', context),
    endColumn('toComponentId', 'To', context),
    {
      id: 'medium', header: 'Medium',
      render: (connection) => (
        <select
          className="lab-input" aria-label={`Medium, ${describeLink(model, connection.id)}`} value={connection.medium}
          onChange={(event) => { const medium = LINK_MEDIA.find((candidate) => candidate === event.target.value); if (medium !== undefined) changeConnection(connection.id, { medium }); }}
        >
          {LINK_MEDIA.map((medium) => <option key={medium} value={medium}>{MEDIUM_LABELS[medium]}</option>)}
        </select>
      ),
    },
    ...CARRIES_FIELDS.map(({ field, label }): DataTableColumn<ModelLink> => ({
      id: field, header: `Carries ${label.toLowerCase()}`,
      render: (connection) => (
        <label className="lab-editor-tick">
          <input
            type="checkbox" aria-label={`${describeLink(model, connection.id)} carries ${label.toLowerCase()}`} checked={connection[field]}
            onChange={(event) => changeConnection(connection.id, { [field]: event.target.checked })}
          />
        </label>
      ),
    })),
    {
      id: 'remove', header: 'Remove',
      render: (connection) => (
        <button type="button" className="lab-button" aria-label={`Remove ${describeLink(model, connection.id)}`} onClick={() => askToRemove(connection)}>Remove</button>
      ),
    },
  ];
}

/** The device's connections, one line each, edited in place. */
export default function ConnectionsTable({ model, onEdit }: Props) {
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const pendingConnection = model.links.find((connection) => connection.id === pendingRemovalId) ?? null;
  const connectionCount = model.links.length;

  const columns = useMemo(() => buildColumns({
    model,
    changeConnection: (connectionId, changes) => onEdit({ type: 'connection-changed', connectionId, changes }),
    // A connection with no decision on it has nothing to lose, so it goes at once.
    askToRemove: (connection) => {
      if (measureConnectionRemoval(model, connection.id).decisionCount === 0) onEdit({ type: 'connection-removed', connectionId: connection.id });
      else setPendingRemovalId(connection.id);
    },
  }), [model, onEdit]);

  const removePending = (): void => {
    if (pendingConnection !== null) onEdit({ type: 'connection-removed', connectionId: pendingConnection.id });
    setPendingRemovalId(null);
  };

  return (
    <Panel title="Connections">
      <div className="lab-editor-table">
        <DataTable
          caption={`${connectionCount} of at most ${MODEL_LIMITS.maxLinks} connections`} columns={columns} rows={model.links} rowKey={(connection) => connection.id}
          emptyMessage="No connections. A part with no connection is listed under Warnings." renderCard={renderEditorCard(columns)}
        />
      </div>
      {pendingConnection !== null && (
        <EditorConfirm
          question={`Remove ${describeLink(model, pendingConnection.id)}?`} detail={describeRemovalImpact(measureConnectionRemoval(model, pendingConnection.id))}
          confirmLabel="Remove it" keepLabel="Keep it" onConfirm={removePending} onKeep={() => setPendingRemovalId(null)}
        />
      )}
      <ConnectionAdder model={model} onEdit={onEdit} />
    </Panel>
  );
}

/** The add row, or the reason there is none: the file's limit is reached, or there are not two parts to join. */
function ConnectionAdder({ model, onEdit }: Props) {
  if (model.links.length >= MODEL_LIMITS.maxLinks) return <p role="status" className="lab-notice">{CONNECTION_LIMIT_NOTICE}</p>;
  if (model.components.length < MIN_PARTS_TO_CONNECT) return <p role="status" className="lab-notice">{TOO_FEW_PARTS_NOTICE}</p>;
  return <AddConnectionForm parts={model.components} onAdd={(connection) => onEdit({ type: 'connection-added', connection })} />;
}
