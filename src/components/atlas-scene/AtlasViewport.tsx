import { Suspense, lazy, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import type { LayerId } from '@/lib/anatomy/source-types';
import type { ChainFrame } from '@/lib/atlas-explorer/chain-steps';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import type { Lens } from '@/lib/atlas-explorer/lens-state';
import type { ViewportCaption } from '@/lib/atlas-explorer/viewport-caption';
import type { OpenViewportProps } from './OpenViewport';
import type { LensWays } from './ViewportStage';
import { GATE_NOTICES, decideGate, probeWebGL, type GateState } from './viewport-gate';

type OpenViewModule = { default: ComponentType<OpenViewportProps> };

export interface AtlasViewportProps {
  model: ExplorerModel;
  lens: Lens;
  layers: Readonly<Record<LayerId, boolean>>;
  selectedRegionId: string | null;
  /** Whether the page was built with the index's digest and the index passed it. Without that, nothing is drawn. */
  isIndexPinned: boolean;
  /** The page is pinned to an index the site no longer serves. The view then says exactly that, and not that the page has no pin. */
  isOutOfStep?: boolean;
  /** The threat-model steps on screen, or null when none is shown. */
  chain?: ChainFrame | null;
  /** The electrode the visitor picked, or null. An electrode is not a region and selects none. */
  electrodeId?: string | null;
  onPickElectrode?: (electrodeId: string) => void;
  onSelectRegion: (regionId: string) => void;
  /** Takes the visitor to the selected region's details. Absent on a page that keeps them elsewhere. */
  onShowDetails?: () => void;
  /** The ways out of the current lens, offered under the picture. Absent on a page whose lens is fixed. */
  lensWays?: LensWays | null;
  /** Regions the visitor chose on an embedding page, in groups bracketed as one. Marked, never filled. */
  selectedRegionGroups?: ReadonlyArray<readonly string[]>;
  /** The visitor already asked for the view with the embedding page's own control, so it starts decided, not closed. */
  isAsked?: boolean;
  /** What the page keeps beside the view's heading: the control that says what the picture is coloured by. It stands above the picture whatever the gate says, so a change is never made blind. */
  headerControls?: ReactNode;
  /** Told the caption the open picture is showing, and null once the picture is gone, so words beside it need not be said twice. */
  onCaptionChange?: (caption: ViewportCaption | null) => void;
  /** Replaceable in tests. In the page they are the real probe and the real view, fetched only once the gate opens. */
  probe?: () => boolean;
  loadOpenView?: () => Promise<OpenViewModule>;
}

const BYTES_PER_MEGABYTE = 1_000_000;
/** The heading "Back to the 3D view" returns focus to, from the region's details. */
export const VIEWPORT_HEADING_ID = 'atlas-viewport-heading';
const IGNORE_ELECTRODE = (): void => undefined;
const NO_GROUPS: ReadonlyArray<readonly string[]> = [];
const loadRealOpenView = (): Promise<OpenViewModule> => import('./OpenViewport');

/** The bytes of geometry the requested layers would fetch, from the index's own figures. */
function sumRequestedBytes(model: ExplorerModel, layers: Readonly<Record<LayerId, boolean>>): number {
  const available = new Set(model.index.layers.filter((layer) => layer.available && layers[layer.id]).map((layer) => layer.id));
  return model.index.assets.filter((asset) => available.has(asset.layer)).reduce((total, asset) => total + asset.bytes, 0);
}

/**
 * The way in to the 3D view. Until the visitor asks, it is one button and a
 * sentence: no three.js, no geometry file and no WebGL context exist before
 * that. When asked, it first checks that the page is pinned to its index, that
 * files can be checked, and that the browser can draw; only then is anything
 * 3D fetched. If the view cannot open or stops, it says why and where the same
 * facts are.
 */
export default function AtlasViewport(props: AtlasViewportProps) {
  const { model, lens, layers, selectedRegionId, isIndexPinned, isOutOfStep = false, chain = null, electrodeId = null, onPickElectrode = IGNORE_ELECTRODE, onSelectRegion, onShowDetails, lensWays = null, selectedRegionGroups = NO_GROUPS, isAsked = false, headerControls = null, onCaptionChange, probe = probeWebGL, loadOpenView = loadRealOpenView } = props;
  const decide = (): GateState => decideGate(isIndexPinned, globalThis.crypto?.subtle !== undefined, probe, isOutOfStep);
  const [gate, setGate] = useState<GateState>(() => (isAsked ? decide() : 'closed'));
  const [run, setRun] = useState(0);
  // One lazy component per start of the view, so "start again" builds a fresh canvas.
  const OpenView = useMemo(() => lazy(loadOpenView), [loadOpenView, run]);
  const megabytes = (sumRequestedBytes(model, layers) / BYTES_PER_MEGABYTE).toFixed(1);
  // "Hide the 3D view" removes the button that was pressed, so focus goes to the one that takes its place.
  const isJustHidden = useRef(false);
  const hide = (): void => { isJustHidden.current = true; setGate('closed'); };
  const focusAfterHide = (button: HTMLButtonElement | null): void => {
    if (button === null || !isJustHidden.current) return;
    isJustHidden.current = false;
    button.focus();
  };

  const open = (): void => {
    setGate(decide());
    setRun((count) => count + 1);
  };

  return (
    <section className="atlas-panel atlas-viewport" aria-labelledby="atlas-viewport-heading" data-gate={gate}>
      <div className="atlas-viewport-header" data-viewport-header="true">
        <h2 className="atlas-heading" id={VIEWPORT_HEADING_ID} tabIndex={-1}>3D view</h2>
        {headerControls}
      </div>
      {gate !== 'closed' && gate !== 'open' && <p className="atlas-failure" role="alert" data-gate-notice={gate}>{GATE_NOTICES[gate]}</p>}
      {(gate === 'closed' || gate === 'context_lost') && (
        <>
          <p className="atlas-fact">Turn an average brain and pick the shapes inside it. It fetches about {megabytes} MB of shapes, and nothing until you ask.</p>
          <button type="button" className="atlas-button atlas-button-primary" ref={focusAfterHide} onClick={open}>{gate === 'closed' ? 'Show the 3D view' : 'Start the 3D view again'}</button>
        </>
      )}
      {gate === 'open' && (
        <Suspense fallback={<p className="atlas-loading" role="status">Loading the 3D view…</p>}>
          <OpenView
            key={run} model={model} lens={lens} layers={layers} selectedRegionId={selectedRegionId} onSelectRegion={onSelectRegion}
            chain={chain} electrodeId={electrodeId} onPickElectrode={onPickElectrode} selectedRegionGroups={selectedRegionGroups}
            onClose={hide} onShowDetails={onShowDetails} lensWays={lensWays} onStopped={setGate} onCaption={onCaptionChange}
          />
        </Suspense>
      )}
    </section>
  );
}
