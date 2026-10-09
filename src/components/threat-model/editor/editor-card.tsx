import type { ReactNode } from 'react';
import type { DataTableColumn } from '@/components/lab-kit/DataTable';

/** Under 720px a row of the editor's tables becomes a stack: each column's header above its control. */
export function renderEditorCard<Row>(columns: readonly DataTableColumn<Row>[]): (row: Row) => ReactNode {
  return function EditorCard(row: Row): ReactNode {
    return (
      <div className="lab-editor-card">
        {columns.map((column) => (
          <div key={column.id} className="lab-field">
            <span className="lab-label">{column.header}</span>
            {column.render(row)}
          </div>
        ))}
      </div>
    );
  };
}
