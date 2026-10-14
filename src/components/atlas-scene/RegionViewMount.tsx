import { useEffect, useRef, useState, type ComponentType } from 'react';
import type { Lens } from '@/lib/atlas-explorer/lens-state';
import type { RegionViewPanelProps } from './RegionViewPanel';
import './region-view-mount.css';

type PanelModule = { default: ComponentType<RegionViewPanelProps> };
type PanelState = { status: 'closed' } | { status: 'loading' } | { status: 'failed' } | { status: 'ready'; Panel: ComponentType<RegionViewPanelProps> };

export interface RegionViewMountProps extends RegionViewPanelProps {
  /** Replaceable in tests. In a page it is the real panel, fetched only when the visitor asks. */
  loadPanel?: () => Promise<PanelModule>;
}

/** The lens for a page that shows no technique, score or device of its own: every region coloured by its band. */
export const BAND_LENS: Lens = { kind: 'band' };

const loadRealPanel = (): Promise<PanelModule> => import('./RegionViewPanel');

/**
 * The way in to the 3D view from any page that lists regions or bands. Until
 * the visitor presses the button it is the button and one sentence: no atlas
 * data, no three.js, no geometry and no WebGL context are fetched or made, so
 * the page's own list is the whole of what loads. The list stays where it is
 * afterwards too, and is all there is if the view cannot load.
 *
 * `lens` decides every fill, from the data. `selectedRegionIds` and
 * `selectedBandId` are the visitor's own choice on the page: marked, never filled.
 */
export default function RegionViewMount({ loadPanel = loadRealPanel, ...panelProps }: RegionViewMountProps) {
  const [panel, setPanel] = useState<PanelState>({ status: 'closed' });
  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const ask = (): void => {
    setPanel({ status: 'loading' });
    loadPanel()
      .then((module) => { if (isMounted.current) setPanel({ status: 'ready', Panel: module.default }); })
      // The script for the view did not arrive. The page says so beside the button and keeps its list.
      .catch(() => { if (isMounted.current) setPanel({ status: 'failed' }); });
  };

  if (panel.status === 'ready') return <panel.Panel {...panelProps} />;
  return (
    <div className="region-view-ask" data-region-mount={panel.status}>
      <button type="button" className="region-view-ask-button" onClick={ask} disabled={panel.status === 'loading'}>
        {panel.status === 'failed' ? 'Try the 3D view again' : 'Show the 3D view'}
      </button>
      {panel.status === 'closed' && <span>Draws this on an average brain, with what the picture cannot tell you beside it. Nothing is fetched until you ask.</span>}
      {panel.status === 'loading' && <span role="status">Loading the 3D view…</span>}
      {panel.status === 'failed' && <span role="alert">The 3D view could not be loaded. The list on this page is unchanged and has everything the view would show.</span>}
    </div>
  );
}
