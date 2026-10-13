import { lazy, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import type { LayerId } from '@/lib/anatomy/source-types';
import { CAMERA_VIEW_LABELS, DEFAULT_CAMERA_VIEW, type CameraViewId } from '@/lib/atlas-explorer/camera-views';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import type { Lens } from '@/lib/atlas-explorer/lens-state';
import { resolvePick } from '@/lib/atlas-explorer/resolve-pick';
import { clampSlice, listShapesCutAt, middleOf, stepSlice, type SliceState } from '@/lib/atlas-explorer/slice-plane';
import type { AtlasCanvasProps, CanvasCommands } from './AtlasCanvas';
import type { AxisDirections } from './scene-renderer';
import { useViewportScene } from './use-viewport-scene';
import { readPrefersLessMotion, type GateState } from './viewport-gate';
import ViewportControls from './ViewportControls';
import ViewportLegend from './ViewportLegend';
import ViewportStage from './ViewportStage';

type CanvasModule = { default: ComponentType<AtlasCanvasProps> };

export interface OpenViewportProps {
  model: ExplorerModel;
  lens: Lens;
  layers: Readonly<Record<LayerId, boolean>>;
  selectedRegionId: string | null;
  onSelectRegion: (regionId: string) => void;
  onClose: () => void;
  /** Called when the picture cannot go on: the browser took the context away, or gave none after all. */
  onStopped: (state: Extract<GateState, 'context_lost' | 'no_webgl'>) => void;
  /** Replaceable in tests. In the page it is the real canvas, fetched now. */
  loadCanvas?: () => Promise<CanvasModule>;
}

const NO_COMMANDS: CanvasCommands = { setView: () => undefined, zoom: () => undefined, turn: () => undefined };
const loadRealCanvas = (): Promise<CanvasModule> => import('./AtlasCanvas');

function meanOf(points: ReadonlyArray<readonly [number, number, number]>): [number, number, number] | null {
  if (points.length === 0) return null;
  const sum = (axis: number): number => points.reduce((total, point) => total + point[axis], 0) / points.length;
  return [sum(0), sum(1), sum(2)];
}

/**
 * The 3D view once it is open: the picture with its caption, the buttons that
 * move it, and the legend. It draws only files that passed their checks,
 * colours them from the same lens as the list, and shares its selection with
 * the list both ways. This module and the canvas are fetched only after the
 * visitor asks for the view and the browser has shown it can draw one.
 */
export default function OpenViewport({ model, lens, layers, selectedRegionId, onSelectRegion, onClose, onStopped, loadCanvas = loadRealCanvas }: OpenViewportProps) {
  const [slice, setSlice] = useState<SliceState | null>(null);
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [directions, setDirections] = useState<AxisDirections | null>(null);
  const [activeView, setActiveView] = useState<CameraViewId | null>(DEFAULT_CAMERA_VIEW);
  const commands = useRef<CanvasCommands>(NO_COMMANDS);
  const scene = useViewportScene(model, lens, layers, true);
  const Canvas = useMemo(() => lazy(loadCanvas), [loadCanvas]);
  const prefersLessMotion = useMemo(() => readPrefersLessMotion(), []);

  const regionKeys = selectedRegionId === null ? [] : model.regionsById.get(selectedRegionId)?.structure_keys ?? [];
  const selectedKeys = useMemo(() => new Set([...regionKeys, ...(pickedKey === null ? [] : [pickedKey])]), [regionKeys.join(' '), pickedKey]);
  const focusMm = useMemo(() => meanOf(scene.drawnShapes.filter((shape) => regionKeys.includes(shape.structureKey)).map((shape) => shape.centroidMm)), [selectedRegionId, scene.drawnShapes.length]);
  useEffect(() => { if (scene.bounds !== null && slice !== null) setSlice({ axis: slice.axis, positionMm: clampSlice(slice.axis, slice.positionMm, scene.bounds) }); }, [scene.bounds]);

  const pick = (structureKey: string | null): void => {
    setPickedKey(structureKey);
    const regionId = structureKey === null ? null : resolvePick(model, structureKey)?.selectedRegionId ?? null;
    if (regionId !== null) onSelectRegion(regionId);
  };
  const turnView = (viewId: CameraViewId): void => { commands.current.setView(viewId); setActiveView(viewId); };
  const byHand: CanvasCommands = { setView: turnView, zoom: (direction) => commands.current.zoom(direction), turn: (direction) => { commands.current.turn(direction); setActiveView(null); } };
  const cutNames = slice === null ? [] : [...new Set(listShapesCutAt(slice, [...scene.nodesByShapeId.values()]).map((node) => resolvePick(model, `${node.atlas}:${node.labelId}`)?.label ?? node.labelId))];
  const description = `3D picture of an average brain outline with ${scene.drawnShapes.length} atlas shapes drawn inside it, ${scene.caption.lensLabel} lens, ${activeView === null ? 'turned by hand' : CAMERA_VIEW_LABELS[activeView].toLowerCase()}. Every fact it shows is in the region list.`;

  const canvasProps: Omit<AtlasCanvasProps, 'commands'> = {
    shapes: scene.drawnShapes, nodesByShapeId: scene.nodesByShapeId, selectedKeys, focusMm, slice, prefersLessMotion, description,
    onPick: pick, onHover: setHoveredKey, onCameraTurn: setDirections, onContextLost: () => onStopped('context_lost'), onUnavailable: () => onStopped('no_webgl'),
  };
  return (
    <>
      <button type="button" className="atlas-link-button" onClick={onClose}>Hide the 3D view</button>
      <div className="atlas-viewport-body">
        <ViewportStage
          Canvas={Canvas} canvasProps={canvasProps} commands={commands} caption={scene.caption} directions={directions}
          hoverLabel={hoveredKey === null ? null : resolvePick(model, hoveredKey)?.label ?? null}
        />
        <div className="atlas-viewport-side">
          <ViewportControls
            activeView={activeView} commands={byHand} slice={slice} bounds={scene.bounds} cutShapeNames={cutNames} onView={turnView}
            onToggleSlice={() => setSlice(slice === null && scene.bounds !== null ? { axis: 'back_front', positionMm: middleOf('back_front', scene.bounds) } : null)}
            onSliceAxis={(axis) => { if (scene.bounds !== null) setSlice({ axis, positionMm: middleOf(axis, scene.bounds) }); }}
            onSlicePosition={(positionMm) => { if (slice !== null && scene.bounds !== null) setSlice({ axis: slice.axis, positionMm: clampSlice(slice.axis, positionMm, scene.bounds) }); }}
            onSliceStep={(direction) => { if (slice !== null && scene.bounds !== null) setSlice(stepSlice(slice, direction, scene.bounds)); }}
          />
          <ViewportLegend
            caption={scene.caption} drawnShapes={scene.drawnShapes} assets={scene.assets} assetStates={scene.assetStates}
            picked={pickedKey === null ? null : resolvePick(model, pickedKey)} onRetryAssets={scene.retryAssets} onSelectRegion={onSelectRegion} onClearPick={() => setPickedKey(null)}
          />
        </div>
      </div>
    </>
  );
}
