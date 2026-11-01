import { useMemo, useState } from 'react';
import type { LayerId } from '@/lib/anatomy/source-types';
import { createExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { LENS_LABELS, SUBJECT_FREE_LENS_KINDS, emptyLens, type Lens } from '@/lib/atlas-explorer/lens-state';
import { INITIAL_EXPLORER_STATE } from './atlas-state';
import AtlasViewport, { type AtlasViewportProps } from './AtlasViewport';
import type { BrainHeroPanelProps } from './BrainHeroPanel';
import BrainHeroRegionList from './BrainHeroRegionList';
import BrainHeroSummary from './BrainHeroSummary';
import { GATE_NOTICES, decideGate, probeWebGL } from './viewport-gate';

interface Props extends BrainHeroPanelProps {
  model: ExplorerModel;
  isIndexPinned: boolean;
  isOutOfStep: boolean;
  probe?: AtlasViewportProps['probe'];
  loadOpenView?: AtlasViewportProps['loadOpenView'];
}

/**
 * The lenses the hero offers: the ones whole without a subject, which are also the ones the explorer's address can
 * open on, so the way on from the card carries the lens the visitor was looking through. Band first: under it every
 * region holds a value, so the whole brain is filled, lit under the pointer and picks on the first click. NISS severity
 * is the catalog's own subject, and most regions hold no value under it yet, so it is the second look and not the first.
 */
export const HERO_LENSES: readonly Lens[] = SUBJECT_FREE_LENS_KINDS.map((kind) => emptyLens(kind));
export const HERO_DEFAULT_LENS: Lens = HERO_LENSES[0];
/**
 * The outline and the cortical shapes, and not the deep ones: the cortex is what a first picture of a brain shows and the
 * deep layer is more than half of the geometry's bytes. The full atlas draws every layer and lets the visitor choose.
 */
export const HERO_LAYERS: Readonly<Record<LayerId, boolean>> = { ...INITIAL_EXPLORER_STATE.layers, deep: false };

/** Two buttons in the view's header, above the picture: what the brain is coloured by. The caption under the picture names the lens in words. */
function HeroLensSwitch({ lens, onChoose, onShowEvidence }: { lens: Lens; onChoose: (lens: Lens) => void; onShowEvidence?: () => void }) {
  return (
    <div className="brain-hero-lenses" role="group" aria-label="Colour the brain by">
      {HERO_LENSES.map((choice) => (
        <button key={choice.kind} type="button" className="brain-hero-lens" aria-pressed={choice.kind === lens.kind} onClick={() => onChoose(choice)}>
          {onShowEvidence && choice.kind === 'niss' ? 'NISS' : LENS_LABELS[choice.kind]}
        </button>
      ))}
      {onShowEvidence && <button type="button" className="brain-hero-lens" aria-pressed="false" onClick={onShowEvidence}>Evidence</button>}
    </div>
  );
}

/**
 * The homepage brain once its data has loaded: the 3D view, opened without a
 * button, with the region's dashboard beside it and one way on to that region's
 * details in the full atlas. The gate is decided here first, with the view's
 * own probe, so a browser that cannot draw gets the region list in the
 * picture's place and never waits on a view that would only say no.
 */
export default function BrainHeroView(props: Props) {
  if (props.selectedRegionId !== undefined && props.lens !== undefined) {
    return <HeroView {...props} selectedRegionId={props.selectedRegionId} lens={props.lens} select={(id) => props.onSelectRegion?.(id)} chooseLens={() => {}} />;
  }
  return <UncontrolledHeroView {...props} />;
}

/** Homepage callers keep their own state; the TARA page takes only the controlled path. */
function UncontrolledHeroView(props: Props) {
  const [localId, setSelectedRegionId] = useState<string | null>(null);
  const [localLens, setLens] = useState<Lens>(HERO_DEFAULT_LENS);
  const select = (id: string | null) => {
    if (props.selectedRegionId === undefined) setSelectedRegionId(id);
    props.onSelectRegion?.(id);
  };
  return <HeroView {...props} selectedRegionId={props.selectedRegionId === undefined ? localId : props.selectedRegionId} lens={props.lens ?? localLens} select={select} chooseLens={setLens} />;
}

function HeroView({ model, isIndexPinned, isOutOfStep, probe = probeWebGL, loadOpenView, selectedRegionId, lens, select, chooseLens, onSelectRegion, renderRegionPanel, onShowEvidence, hideLensControl = false, keyboardRegions = false, techniqueIds }: Props & { selectedRegionId: string | null; lens: Lens; select: (id: string | null) => void; chooseLens: (lens: Lens) => void }) {
  const viewportModel = useMemo(() => techniqueIds === undefined ? model : createExplorerModel({ ...model.index, techniques: model.index.techniques.filter((t) => techniqueIds.includes(t.id)) }, model.catalog), [model, techniqueIds]);
  const gate = useMemo(() => decideGate(isIndexPinned, globalThis.crypto?.subtle !== undefined, probe, isOutOfStep), [isIndexPinned, isOutOfStep, probe]);
  if (gate !== 'open') {
    return (
      <div className="atlas-root brain-hero" data-brain-hero="fallback" data-gate={gate}>
        <p className="atlas-failure" role="alert" data-gate-notice={gate}>{GATE_NOTICES[gate]}</p>
        <BrainHeroRegionList model={model} onSelectRegion={onSelectRegion ? select : undefined} />
        {renderRegionPanel?.(model, selectedRegionId)}
      </div>
    );
  }
  return (
    <div className="atlas-root brain-hero" data-brain-hero="open" data-hero-lens={lens.kind}>
      <AtlasViewport
        model={viewportModel} lens={lens} layers={HERO_LAYERS} selectedRegionId={selectedRegionId} isIndexPinned={isIndexPinned} isOutOfStep={isOutOfStep} isAsked
        onSelectRegion={select} probe={probe} loadOpenView={loadOpenView} headerControls={hideLensControl ? null : <HeroLensSwitch lens={lens} onChoose={chooseLens} onShowEvidence={onShowEvidence} />}
      />
      {keyboardRegions && <BrainHeroRegionList model={model} onSelectRegion={select} />}
      {renderRegionPanel ? renderRegionPanel(model, selectedRegionId) : <BrainHeroSummary model={model} regionId={selectedRegionId} lens={lens} />}
    </div>
  );
}
