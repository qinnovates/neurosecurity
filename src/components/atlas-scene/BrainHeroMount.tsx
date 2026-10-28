import { useEffect, useRef, useState, type ComponentType } from 'react';
import { HERO_COPY } from '@/lib/anatomy/hero-copy';
import type { BrainHeroPanelProps } from './BrainHeroPanel';
import './brain-hero-mount.css';

type PanelModule = { default: ComponentType<BrainHeroPanelProps> };
type PanelState = { status: 'loading' } | { status: 'failed' } | { status: 'ready'; Panel: ComponentType<BrainHeroPanelProps> };

export interface BrainHeroMountProps extends BrainHeroPanelProps {
  /** Replaceable in tests. In the page it is the real panel, fetched as the hero appears. */
  loadPanel?: () => Promise<PanelModule>;
}

const loadRealPanel = (): Promise<PanelModule> => import('./BrainHeroPanel');

/**
 * The homepage's way in to the 3D brain. Unlike the mount on a list page, it
 * asks for nothing: the brain is the page's first picture, so the chunk that
 * draws it is fetched as soon as this shell is on screen. What ships with the
 * page is this shell, its frame and a few sentences; the atlas data, three.js
 * and the geometry come with the chunk, and the gate inside it still decides
 * whether the browser can draw before any of the geometry is fetched. If the
 * chunk does not arrive the frame says so, and the page's own link to the full
 * atlas stands beside it either way.
 */
export default function BrainHeroMount({ loadPanel = loadRealPanel, ...panelProps }: BrainHeroMountProps) {
  const [panel, setPanel] = useState<PanelState>({ status: 'loading' });
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    loadPanel()
      .then((module) => { if (isMounted.current) setPanel({ status: 'ready', Panel: module.default }); })
      // The script for the view did not arrive. The frame says so; the page's link to the full atlas is unchanged.
      .catch(() => { if (isMounted.current) setPanel({ status: 'failed' }); });
    return () => { isMounted.current = false; };
  }, [loadPanel]);

  if (panel.status === 'ready') return <panel.Panel {...panelProps} />;
  return (
    <div className="brain-hero-frame" data-brain-hero={panel.status}>
      {panel.status === 'loading' && <p className="brain-hero-notice" role="status">{HERO_COPY.loading}</p>}
      {panel.status === 'failed' && <p className="brain-hero-notice" role="alert">{HERO_COPY.failed}</p>}
    </div>
  );
}
