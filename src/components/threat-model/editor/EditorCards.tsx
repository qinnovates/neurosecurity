import type { ReactNode } from 'react';

/** How a field sits on a card: a labelled control, a tick that carries its own words, or a button at the card's foot. */
export type EditorFieldForm = 'control' | 'wide-control' | 'tick' | 'action';

export interface EditorField<Row> {
  id: string;
  /** Shown above a control. A tick and an action name themselves. */
  header: string;
  form: EditorFieldForm;
  render: (row: Row) => ReactNode;
}

interface Props<Row> {
  /** How many there are of how many the file holds; also the list's accessible name. */
  caption: string;
  fields: readonly EditorField<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  /** What to say when there are none. */
  emptyMessage: string;
}

/**
 * The parts or the connections of the device as a stack of cards, each edited in place. A
 * card fits the drawer whatever its width, so nothing is edited by scrolling sideways.
 */
export default function EditorCards<Row>({ caption, fields, rows, rowKey, emptyMessage }: Props<Row>) {
  const controls = fields.filter((field) => field.form === 'control' || field.form === 'wide-control');
  const ticks = fields.filter((field) => field.form === 'tick');
  const actions = fields.filter((field) => field.form === 'action');
  return (
    <>
      <p className="lab-label lab-editor-count">{caption}</p>
      {rows.length === 0 ? <p className="lab-soft" role="status">{emptyMessage}</p> : (
        <ul className="lab-editor-cards" aria-label={caption}>
          {rows.map((row) => (
            <li key={rowKey(row)} className="lab-editor-card">
              {controls.map((field) => (
                <div key={field.id} className="lab-field" data-wide={field.form === 'wide-control'}>
                  <span className="lab-label">{field.header}</span>
                  {field.render(row)}
                </div>
              ))}
              <div className="lab-editor-card-foot">
                <div className="lab-editor-card-ticks">{ticks.map((field) => <span key={field.id}>{field.render(row)}</span>)}</div>
                {actions.map((field) => <span key={field.id}>{field.render(row)}</span>)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
