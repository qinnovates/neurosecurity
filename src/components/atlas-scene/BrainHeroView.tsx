import { useMemo, useState } from 'react';
import type { LayerId } from '@/lib/anatomy/source-types';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import type { Lens } from '@/lib/atlas-explorer/lens-state';
import { INITIAL_EXPLORER_STATE } from './atlas-state';
import AtlasViewport, { type AtlasViewportProps } from './AtlasViewport';
import BrainHeroRegionList from './BrainHeroRegionList';
import BrainHeroSummary from './BrainHeroSummary';
import { GATE_NOTICES, decideGate, probeWebGL } from './viewport-gate';

interface Props {
  model: ExplorerModel;
  isIndexPinned: boolean;
  isOutOfStep: boolean;
  probe?: AtlasViewportProps['probe'];
  loadOpenView?: AtlasViewportProps['loadOpenView'];
  /** False for a teaser placement (e.g. the homepage hero): orbit/zoom stay on, region pick-to-summary is disabled. Defaults to true. */
  interactive?: boolean;
}

const IGNORE_SELECTION = () => {};

/** The hero colours each region by the highest NISS step among the techniques linked to it: the catalog's own subject, not a grouping. */
export const HERO_LENS: Lens = { kind: 'niss' };
/**
 * The outline and the cortical shapes, and not the deep ones: the cortex is what a first picture of a brain shows and the
 * deep layer is more than half of the geometry's bytes. The full atlas draws every layer and lets the visitor choose.
 */
export const HERO_LAYERS: Readonly<Record<LayerId, boolean>> = { ...INITIAL_EXPLORER_STATE.layers, deep: false };

/**
 * The homepage brain once its data has loaded: the 3D view, opened without a
 * button, with a summary of the picked region beside it and one way on to that
 * region's details in the full atlas. The gate is decided here first, with the
 * view's own probe, so a browser that cannot draw gets the region list in the
 * picture's place and never waits on a view that would only say no.
 */
export default function BrainHeroView({ model, isIndexPinned, isOutOfStep, probe = probeWebGL, loadOpenView, interactive = true }: Props) {
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const gate = useMemo(() => decideGate(isIndexPinned, globalThis.crypto?.subtle !== undefined, probe, isOutOfStep), [isIndexPinned, isOutOfStep, probe]);
  if (gate !== 'open') {
    return (
      <div className="atlas-root brain-hero" data-brain-hero="fallback" data-gate={gate}>
        <p className="atlas-failure" role="alert" data-gate-notice={gate}>{GATE_NOTICES[gate]}</p>
        <BrainHeroRegionList model={model} />
      </div>
    );
  }
  return (
    <div className="atlas-root brain-hero" data-brain-hero="open" data-interactive={interactive}>
      <AtlasViewport
        model={model} lens={HERO_LENS} layers={HERO_LAYERS} selectedRegionId={selectedRegionId} isIndexPinned={isIndexPinned} isOutOfStep={isOutOfStep} isAsked
        onSelectRegion={interactive ? setSelectedRegionId : IGNORE_SELECTION} probe={probe} loadOpenView={loadOpenView}
      />
      {interactive && <BrainHeroSummary model={model} regionId={selectedRegionId} />}
    </div>
  );
}
