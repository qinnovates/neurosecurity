import { useMemo } from 'react';
import type { IndexAsset } from '@/lib/anatomy/anatomy-index-types';
import type { DecodedNode } from '@/lib/anatomy/decode-glb';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import type { LayerId } from '@/lib/anatomy/source-types';
import { buildChainShapes, describeChainFrame, type ChainFrame } from '@/lib/atlas-explorer/chain-steps';
import { buildDeviceCaption, buildDeviceDrawing, type DeviceCaption, type DeviceDrawing } from '@/lib/atlas-explorer/device-drawing';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { toColourMode, type Lens } from '@/lib/atlas-explorer/lens-state';
import { buildSceneShapes, type SceneShape } from '@/lib/atlas-explorer/scene-shapes';
import type { BoundsMm } from '@/lib/atlas-explorer/slice-plane';
import { buildViewportCaption, type ViewportCaption } from '@/lib/atlas-explorer/viewport-caption';
import { useSceneAssets, type SceneAssetStates } from './use-scene-assets';

export interface ViewportScene {
  /** The files the requested layers need, in the order they load. */
  assets: IndexAsset[];
  assetStates: SceneAssetStates;
  retryAssets: () => void;
  /** Shapes whose file has arrived and passed its checks. Only these are drawn, and only these are captioned. */
  drawnShapes: SceneShape[];
  nodesByShapeId: Map<string, DecodedNode>;
  /** The extent of everything drawn, or null while nothing is. */
  bounds: BoundsMm | null;
  caption: ViewportCaption;
  /** The electrode dots, once the head surface they sit on has arrived and passed its checks. Null otherwise. */
  devices: DeviceDrawing | null;
  deviceCaption: DeviceCaption | null;
}

const SHAPE_ID_SEPARATOR = ':';

function unionBounds(nodes: readonly DecodedNode[]): BoundsMm | null {
  if (nodes.length === 0) return null;
  const pick = (side: 'min' | 'max', axis: number): number => Math[side](...nodes.map((node) => node.boundsMm[side][axis]));
  return { min: [pick('min', 0), pick('min', 1), pick('min', 2)], max: [pick('max', 0), pick('max', 1), pick('max', 2)] };
}

/**
 * Everything the open 3D view shows, derived from the shared model, lens and
 * layers. It exists only while the view is open, so a closed view asks for no file.
 *
 * @param chain the threat-model steps on screen; while set, shapes carry the technique lens's marks for those steps
 */
export function useViewportScene(model: ExplorerModel, lens: Lens, layers: Readonly<Record<LayerId, boolean>>, chain: ChainFrame | null = null): ViewportScene {
  const shapes = useMemo(() => (chain === null ? buildSceneShapes(model, toColourMode(lens), layers) : buildChainShapes(model, chain, layers)), [model, lens, layers, chain]);
  const assets = useMemo(() => model.index.assets.filter((asset) => shapes.some((shape) => shape.assetId === asset.id)), [model, shapes]);
  const { states, retry } = useSceneAssets(model.index, assets.map((asset) => asset.id));

  return useMemo(() => {
    const drawnShapes = shapes.filter((shape) => states[shape.assetId]?.status === 'ready');
    const nodes = assets.flatMap((asset) => { const state = states[asset.id]; return state?.status === 'ready' ? state.nodes : []; });
    const nodesByShapeId = new Map(nodes.map((node) => [[node.atlas, node.labelId, node.hemisphere].join(SHAPE_ID_SEPARATOR), node]));
    const drawnNodes = drawnShapes.flatMap((shape) => nodesByShapeId.get(shape.id) ?? []);
    // While steps are shown the shapes carry technique-lens marks, so the caption carries that lens's limit and names the steps.
    const [firstStep] = chain?.steps ?? [];
    const captionLens: Lens = firstStep === undefined ? lens : { kind: 'technique', techniqueId: firstStep.techniqueId };
    const lensCaption = buildViewportCaption(model, captionLens, drawnShapes);
    // With every step on screen no one technique's own limit fits, so the caption carries the technique lens's general one.
    const lensLimits = chain?.isWhole === true ? [limitSentence('lens_technique'), limitSentence('whole_scene')] : lensCaption.lensLimits;
    const caption = { ...lensCaption, lensLimits, ...(chain === null ? {} : { lensLabel: describeChainFrame(chain) }) };
    // Dots are drawn only on a head surface that arrived and passed its checks: never floating without it.
    const hasHeadSurface = drawnShapes.some((shape) => shape.layer === 'devices');
    const devices = hasHeadSurface ? buildDeviceDrawing(model.index, layers) : null;
    return {
      assets, assetStates: states, retryAssets: retry, drawnShapes, nodesByShapeId, bounds: unionBounds(drawnNodes), caption,
      devices, deviceCaption: devices === null ? null : buildDeviceCaption(devices),
    };
  }, [model, lens, layers, chain, shapes, assets, states, retry]);
}
