import { Suspense, lazy, useMemo, useState, type ComponentType } from 'react';
import type { LayerId } from '@/lib/anatomy/source-types';
import type { ChainFrame } from '@/lib/atlas-explorer/chain-steps';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import type { Lens } from '@/lib/atlas-explorer/lens-state';
import type { OpenViewportProps } from './OpenViewport';
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
  /** Replaceable in tests. In the page they are the real probe and the real view, fetched only once the gate opens. */
  probe?: () => boolean;
  loadOpenView?: () => Promise<OpenViewModule>;
}

const BYTES_PER_MEGABYTE = 1_000_000;
const IGNORE_ELECTRODE = (): void => undefined;
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
  const { model, lens, layers, selectedRegionId, isIndexPinned, isOutOfStep = false, chain = null, electrodeId = null, onPickElectrode = IGNORE_ELECTRODE, onSelectRegion, probe = probeWebGL, loadOpenView = loadRealOpenView } = props;
  const [gate, setGate] = useState<GateState>('closed');
  const [run, setRun] = useState(0);
  // One lazy component per start of the view, so "start again" builds a fresh canvas.
  const OpenView = useMemo(() => lazy(loadOpenView), [loadOpenView, run]);
  const megabytes = (sumRequestedBytes(model, layers) / BYTES_PER_MEGABYTE).toFixed(1);

  const open = (): void => {
    setGate(decideGate(isIndexPinned, globalThis.crypto?.subtle !== undefined, probe, isOutOfStep));
    setRun((count) => count + 1);
  };

  return (
    <section className="atlas-panel atlas-viewport" aria-labelledby="atlas-viewport-heading" data-gate={gate}>
      <h2 className="atlas-heading" id="atlas-viewport-heading">3D view</h2>
      {gate !== 'closed' && gate !== 'open' && <p className="atlas-failure" role="alert" data-gate-notice={gate}>{GATE_NOTICES[gate]}</p>}
      {(gate === 'closed' || gate === 'context_lost') && (
        <>
          <p className="atlas-fact">Turn an average brain and pick the shapes inside it. It fetches about {megabytes} MB of shapes, and nothing until you ask.</p>
          <button type="button" className="atlas-button atlas-button-primary" onClick={open}>{gate === 'closed' ? 'Show the 3D view' : 'Start the 3D view again'}</button>
        </>
      )}
      {gate === 'open' && (
        <Suspense fallback={<p className="atlas-loading" role="status">Loading the 3D view…</p>}>
          <OpenView
            key={run} model={model} lens={lens} layers={layers} selectedRegionId={selectedRegionId} onSelectRegion={onSelectRegion}
            chain={chain} electrodeId={electrodeId} onPickElectrode={onPickElectrode}
            onClose={() => setGate('closed')} onStopped={setGate}
          />
        </Suspense>
      )}
    </section>
  );
}
