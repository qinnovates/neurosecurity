import type { ModeId } from './mode-registry';
import { MODE_VIEW_GROUPS } from './view-registry';

interface Props {
  modeId: ModeId;
  activeViewId: string;
  onSelectView: (viewId: string) => void;
}

/** The views inside the current mode. A mode with one view shows no row at all. */
export default function ViewTabs({ modeId, activeViewId, onSelectView }: Props) {
  const groups = MODE_VIEW_GROUPS[modeId];
  const viewCount = groups.reduce((count, group) => count + group.views.length, 0);
  if (viewCount <= 1) return null;

  return (
    <nav className="lab-viewtabs tm-no-print" aria-label="Views in this mode">
      {groups.map((group) => (
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
