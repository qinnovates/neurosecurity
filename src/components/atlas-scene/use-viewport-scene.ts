import { useMemo } from 'react';
import type { IndexAsset } from '@/lib/anatomy/anatomy-index-types';
import type { DecodedNode } from '@/lib/anatomy/decode-glb';
import type { LayerId } from '@/lib/anatomy/source-types';
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
}

const SHAPE_ID_SEPARATOR = ':';

function unionBounds(nodes: readonly DecodedNode[]): BoundsMm | null {
  if (nodes.length === 0) return null;
  const pick = (side: 'min' | 'max', axis: number): number => Math[side](...nodes.map((node) => node.boundsMm[side][axis]));
  return { min: [pick('min', 0), pick('min', 1), pick('min', 2)], max: [pick('max', 0), pick('max', 1), pick('max', 2)] };
}

/**
 * Everything the 3D view shows, derived from the shared model, lens and layers.
 * While the view is closed it asks for no file at all.
 */
export function useViewportScene(model: ExplorerModel, lens: Lens, layers: Readonly<Record<LayerId, boolean>>, isOpen: boolean): ViewportScene {
  const shapes = useMemo(() => buildSceneShapes(model, toColourMode(lens), layers), [model, lens, layers]);
  const assets = useMemo(() => model.index.assets.filter((asset) => shapes.some((shape) => shape.assetId === asset.id)), [model, shapes]);
  const { states, retry } = useSceneAssets(model.index, isOpen ? assets.map((asset) => asset.id) : []);

  return useMemo(() => {
    const drawnShapes = shapes.filter((shape) => states[shape.assetId]?.status === 'ready');
    const nodes = assets.flatMap((asset) => { const state = states[asset.id]; return state?.status === 'ready' ? state.nodes : []; });
    const nodesByShapeId = new Map(nodes.map((node) => [[node.atlas, node.labelId, node.hemisphere].join(SHAPE_ID_SEPARATOR), node]));
    const drawnNodes = drawnShapes.flatMap((shape) => nodesByShapeId.get(shape.id) ?? []);
    return { assets, assetStates: states, retryAssets: retry, drawnShapes, nodesByShapeId, bounds: unionBounds(drawnNodes), caption: buildViewportCaption(model, lens, drawnShapes) };
  }, [model, lens, shapes, assets, states, retry]);
}
