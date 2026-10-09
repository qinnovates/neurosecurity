import { useId } from 'react';
import type { ModeId } from './mode-registry';
import { MODE_VIEW_GROUPS, type LabViewGroup } from './view-registry';

interface Props {
  modeId: ModeId;
  activeViewId: string;
  onSelectView: (viewId: string) => void;
  /** On a narrow screen the views are one labelled menu, so every view is reachable without scrolling a row of tabs. */
  isNarrow: boolean;
}

function ViewSelect({ groups, activeViewId, onSelectView }: { groups: readonly LabViewGroup[] } & Pick<Props, 'activeViewId' | 'onSelectView'>) {
  const selectId = useId();
  const options = (group: LabViewGroup) => group.views.map((view) => <option key={view.id} value={view.id}>{view.label}</option>);
  return (
    <div className="lab-viewselect">
      <label className="lab-label" htmlFor={selectId}>View</label>
      <select id={selectId} className="lab-view-select" value={activeViewId} onChange={(event) => onSelectView(event.target.value)}>
        {groups.length === 1 ? options(groups[0]) : groups.map((group) => <optgroup key={group.label} label={group.label}>{options(group)}</optgroup>)}
      </select>
    </div>
  );
}

/** The views inside the current mode. A mode with one view shows no row at all. */
export default function ViewTabs({ modeId, activeViewId, onSelectView, isNarrow }: Props) {
  const groups = MODE_VIEW_GROUPS[modeId];
  const viewCount = groups.reduce((count, group) => count + group.views.length, 0);
  if (viewCount <= 1) return null;

  return (
    <nav className="lab-viewtabs" aria-label="Views in this mode">
      {isNarrow ? <ViewSelect groups={groups} activeViewId={activeViewId} onSelectView={onSelectView} /> : groups.map((group) => (
        <div key={group.label} className="lab-viewtab-group" role="group" aria-label={group.label}>
          {groups.length > 1 && <span className="lab-label" aria-hidden="true">{group.label}</span>}
          {group.views.map((view) => (
            <button
              key={view.id} type="button" className="lab-viewtab"
              aria-current={view.id === activeViewId ? 'page' : undefined} onClick={() => onSelectView(view.id)}
            >
              {view.label}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}
