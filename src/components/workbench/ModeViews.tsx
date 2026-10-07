import type { ReactNode } from 'react';
import type { ModeId } from './mode-registry';
import { MODE_VIEW_GROUPS, findView } from './view-registry';

interface Props {
  modeId: ModeId;
  activeViewId: string;
  onSelectView: (viewId: string) => void;
  /** The mode's own screen, shown when the active view is not a framed page. */
  children: ReactNode;
}

/** The second row of navigation: the views inside one mode, grouped and labelled. */
export default function ModeViews({ modeId, activeViewId, onSelectView, children }: Props) {
  const groups = MODE_VIEW_GROUPS[modeId];
  const activeView = findView(modeId, activeViewId);
  const viewCount = groups.reduce((count, group) => count + group.views.length, 0);

  return (
    <>
      {viewCount > 1 && (
        <nav className="workbench-views tm-no-print" aria-label="Views in this mode">
          {groups.map((group) => (
            <div key={group.label} className="workbench-view-group">
              <span className="workbench-view-group-label">{group.label}</span>
              {group.views.map((view) => (
                <button
                  key={view.id} type="button" className="workbench-view"
                  aria-current={view.id === activeViewId ? 'page' : undefined}
                  onClick={() => onSelectView(view.id)}
                >
                  {view.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
      )}
      {activeView === null || activeView.framedPath === null ? children : (
        <div className="workbench-framed">
          <p className="workbench-framed-note tm-no-print">
            An existing site view, shown here unchanged. It does not use the device in focus.{' '}
            <a href={activeView.framedPath} target="_blank" rel="noopener noreferrer">Open on its own page</a>
          </p>
          <iframe key={activeView.id} className="workbench-frame" src={activeView.framedPath} title={activeView.label} loading="lazy" />
        </div>
      )}
    </>
  );
}
