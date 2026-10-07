import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ModeId } from './mode-registry';
import { findView } from './view-registry';

interface Props {
  modeId: ModeId;
  activeViewId: string;
  /** The mode's own screen, shown when the active view is not a framed page. */
  children: ReactNode;
}

const MIN_FRAME_HEIGHT_PX = 480;

/**
 * A same-origin page shown in a frame that grows to the page's own height, so the page
 * scrolls with the Lab and never inside a second scrollbar.
 */
function FramedView({ path, title }: { path: string; title: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (frame === null) return undefined;
    let observer: ResizeObserver | null = null;
    const measure = (): void => {
      const root = frame.contentDocument?.documentElement;
      if (root) setHeight(Math.max(MIN_FRAME_HEIGHT_PX, root.scrollHeight));
    };
    const watch = (): void => {
      observer?.disconnect();
      const body = frame.contentDocument?.body;
      if (!body) return;
      observer = new ResizeObserver(measure);
      observer.observe(body);
      measure();
    };
    frame.addEventListener('load', watch);
    watch();
    return () => {
      frame.removeEventListener('load', watch);
      observer?.disconnect();
    };
  }, [path]);

  return (
    <iframe
      ref={frameRef} className="workbench-frame" src={path} title={title} scrolling="no"
      style={height === null ? undefined : { height: `${height}px` }}
    />
  );
}

/** Shows the active view: the mode's own screen, or an existing site page in a frame. */
export default function ModeViews({ modeId, activeViewId, children }: Props) {
  const activeView = findView(modeId, activeViewId);
  if (activeView === null || activeView.framedPath === null) return <>{children}</>;
  return (
    <div className="workbench-framed">
      <p className="workbench-framed-note tm-no-print">
        An existing site view, shown here unchanged. It does not use the device in focus.{' '}
        <a href={activeView.framedPath} target="_blank" rel="noopener noreferrer">Open on its own page</a>
      </p>
      <FramedView key={activeView.id} path={activeView.framedPath} title={activeView.label} />
    </div>
  );
}
