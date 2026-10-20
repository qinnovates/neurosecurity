import { lazy, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import type { LayerId } from '@/lib/anatomy/source-types';
import { CAMERA_VIEW_LABELS, DEFAULT_CAMERA_VIEW, type CameraViewId } from '@/lib/atlas-explorer/camera-views';
import type { ChainFrame } from '@/lib/atlas-explorer/chain-steps';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import type { Lens } from '@/lib/atlas-explorer/lens-state';
import { resolvePick } from '@/lib/atlas-explorer/resolve-pick';
import type { ViewportCaption } from '@/lib/atlas-explorer/viewport-caption';
import { clampSlice, listShapesCutAt, middleOf, stepSlice, type SliceState } from '@/lib/atlas-explorer/slice-plane';
import type { AtlasCanvasProps, CanvasCommands } from './AtlasCanvas';
import type { LensWays } from './ViewportStage';
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
  /** The threat-model steps on screen, or null. */
  chain: ChainFrame | null;
  /** The picked electrode, or null. Picking one selects no region. */
  electrodeId: string | null;
  onPickElectrode: (electrodeId: string) => void;
  onSelectRegion: (regionId: string) => void;
  /** Regions the visitor chose on an embedding page, in groups bracketed as one. They get the selection mark and no fill. */
  selectedRegionGroups?: ReadonlyArray<readonly string[]>;
  onClose: () => void;
  /** Takes the visitor to the selected region's details. Absent on a page that keeps them elsewhere. */
  onShowDetails?: () => void;
  /** The ways out of the current lens, offered under the picture. Absent on a page whose lens is fixed. */
  lensWays?: LensWays | null;
  /** Told the caption this picture shows whenever it changes, and null when the picture goes. */
  onCaption?: (caption: ViewportCaption | null) => void;
  /** Called when the picture cannot go on: the browser took the context away, or gave none after all. */
  onStopped: (state: Extract<GateState, 'context_lost' | 'no_webgl'>) => void;
  /** Replaceable in tests. In the page it is the real canvas, fetched now. */
  loadCanvas?: () => Promise<CanvasModule>;
}

const NO_GROUPS: ReadonlyArray<readonly string[]> = [];
const NO_COMMANDS: CanvasCommands = { setView: () => undefined, zoom: () => undefined, turn: () => undefined, tilt: () => undefined };
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
export default function OpenViewport({ model, lens, layers, selectedRegionId, chain, electrodeId, onPickElectrode, onSelectRegion, selectedRegionGroups = NO_GROUPS, onClose, onShowDetails, lensWays = null, onCaption, onStopped, loadCanvas = loadRealCanvas }: OpenViewportProps) {
  const [slice, setSlice] = useState<SliceState | null>(null);
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [directions, setDirections] = useState<AxisDirections | null>(null);
  const [activeView, setActiveView] = useState<CameraViewId | null>(DEFAULT_CAMERA_VIEW);
  const commands = useRef<CanvasCommands>(NO_COMMANDS);
  const scene = useViewportScene(model, lens, layers, chain);
  const Canvas = useMemo(() => lazy(loadCanvas), [loadCanvas]);
  const prefersLessMotion = useMemo(() => readPrefersLessMotion(), []);

  const regionKeys = selectedRegionId === null ? [] : model.regionsById.get(selectedRegionId)?.structure_keys ?? [];
  // The page's own selection, as shapes: each group of regions becomes one group of the shapes that draw them.
  const groupKeys = useMemo(() => selectedRegionGroups.map((regionIds) => [...new Set(regionIds.flatMap((regionId) => model.regionsById.get(regionId)?.structure_keys ?? []))]), [model, selectedRegionGroups]);
  const selectedKeys = useMemo(() => new Set([...regionKeys, ...groupKeys.flat(), ...(pickedKey === null ? [] : [pickedKey])]), [regionKeys.join(' '), groupKeys, pickedKey]);
  // One bracket set around the whole selected region, however many shapes draw it, one around a picked shape outside it, and one around each group the page selected.
  const bracketGroups = useMemo(() => [regionKeys, pickedKey === null || regionKeys.includes(pickedKey) ? [] : [pickedKey], ...groupKeys].filter((keys) => keys.length > 0), [regionKeys.join(' '), groupKeys, pickedKey]);
  const selectedRegionName = selectedRegionId === null ? null : model.regionsById.get(selectedRegionId)?.name ?? null;
  // The name written above the first bracket set: the selected region's, or the picked shape's when the pick selected no region.
  const selectionLabel = regionKeys.length > 0 ? selectedRegionName : pickedKey === null ? null : resolvePick(model, pickedKey)?.label ?? null;
  const focusMm = useMemo(() => meanOf(scene.drawnShapes.filter((shape) => regionKeys.includes(shape.structureKey)).map((shape) => shape.centroidMm)), [selectedRegionId, scene.drawnShapes.length]);
  useEffect(() => {
    onCaption?.(scene.caption);
    return () => onCaption?.(null);
  }, [scene.caption, onCaption]);
  useEffect(() => { if (scene.bounds !== null && slice !== null) setSlice({ axis: slice.axis, positionMm: clampSlice(slice.axis, slice.positionMm, scene.bounds) }); }, [scene.bounds]);

  const pick = (structureKey: string | null): void => {
    setPickedKey(structureKey);
    const regionId = structureKey === null ? null : resolvePick(model, structureKey)?.selectedRegionId ?? null;
    if (regionId !== null) onSelectRegion(regionId);
  };
  const turnView = (viewId: CameraViewId): void => { commands.current.setView(viewId); setActiveView(viewId); };
  const byHand: CanvasCommands = { setView: turnView, zoom: (direction) => commands.current.zoom(direction), turn: (direction) => { commands.current.turn(direction); setActiveView(null); }, tilt: (direction) => { commands.current.tilt(direction); setActiveView(null); } };
  const cutNames = slice === null ? [] : [...new Set(listShapesCutAt(slice, [...scene.nodesByShapeId.values()]).map((node) => resolvePick(model, `${node.atlas}:${node.labelId}`)?.label ?? node.labelId))];
  const atlasShapeCount = scene.drawnShapes.filter((shape) => shape.layer !== 'devices').length;
  const deviceWords = scene.deviceCaption === null ? '' : ` ${scene.deviceCaption.label} Each dot is named in the electrode layout panel below the picture.`;
  const description = `3D picture of an average brain outline with ${atlasShapeCount} atlas shapes drawn inside it. ${scene.caption.lensLabel} View: ${activeView === null ? 'turned by hand' : CAMERA_VIEW_LABELS[activeView].toLowerCase()}. Every fact it shows is in the region list.${deviceWords}`;

  const canvasProps: Omit<AtlasCanvasProps, 'commands'> = {
    shapes: scene.drawnShapes, nodesByShapeId: scene.nodesByShapeId, selectedKeys, bracketGroups, selectionLabel, devices: scene.devices, selectedElectrodeId: electrodeId, focusMm, slice, prefersLessMotion, description,
    onPick: pick, onPickElectrode, onHover: setHoveredKey, onCameraTurn: setDirections, onContextLost: () => onStopped('context_lost'), onUnavailable: () => onStopped('no_webgl'),
  };
  return (
    <>
      <button type="button" className="atlas-link-button" onClick={onClose}>Hide the 3D view</button>
      <div className="atlas-viewport-body">
        <ViewportStage
          Canvas={Canvas} canvasProps={canvasProps} commands={commands} caption={scene.caption} directions={directions} slice={slice}
          deviceCaption={scene.deviceCaption} isChainShown={chain !== null}
          hoverLabel={hoveredKey === null ? null : resolvePick(model, hoveredKey)?.label ?? null}
          selection={selectedRegionName === null ? null : { name: selectedRegionName, onShowDetails }} lensWays={lensWays}
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
