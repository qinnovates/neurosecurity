import { type KeyboardEvent } from 'react';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import { CAMERA_VIEW_IDS, CAMERA_VIEW_LABELS, DEFAULT_CAMERA_VIEW, type CameraViewId } from '@/lib/atlas-explorer/camera-views';
import { SLICE_AXES, SLICE_AXIS_LABELS, type BoundsMm, type SliceAxis, type SliceState } from '@/lib/atlas-explorer/slice-plane';
import type { CanvasCommands } from './AtlasCanvas';
import Disclosure from './Disclosure';
import LimitNote from './LimitNote';

interface Props {
  /** The named view the camera last moved to, or null once it has been turned by hand or from the keyboard. */
  activeView: CameraViewId | null;
  commands: CanvasCommands;
  slice: SliceState | null;
  /** The extent of what is drawn, or null while nothing is: the slice controls wait for it. */
  bounds: BoundsMm | null;
  /** Names of the shapes the cut passes through. */
  cutShapeNames: readonly string[];
  onView: (viewId: CameraViewId) => void;
  onToggleSlice: () => void;
  onSliceAxis: (axis: SliceAxis) => void;
  onSlicePosition: (positionMm: number) => void;
  onSliceStep: (direction: -1 | 1) => void;
}

const AXIS_INDEX: Readonly<Record<SliceAxis, number>> = { left_right: 0, back_front: 1, bottom_top: 2 };

function isCameraViewId(value: string): value is CameraViewId {
  return (CAMERA_VIEW_IDS as readonly string[]).includes(value);
}

/** Every key the proxy answers to, and the command it runs. Keep in step with the legend below it. */
function proxyCommand(key: string, commands: CanvasCommands): (() => void) | null {
  switch (key) {
    case 'ArrowLeft': return () => commands.turn('left');
    case 'ArrowRight': return () => commands.turn('right');
    case 'ArrowUp': return () => commands.tilt('up');
    case 'ArrowDown': return () => commands.tilt('down');
    case '+': case '=': return () => commands.zoom('in');
    case '-': case '_': return () => commands.zoom('out');
    case 'Home': return () => commands.setView(DEFAULT_CAMERA_VIEW);
    default: return null;
  }
}

/**
 * One focusable stand-in for the picture, which is deliberately never a tab
 * stop itself. It carries every camera move the pointer has, as keys, with the
 * keys written out beside it so they can be discovered rather than guessed.
 * It replaced six buttons that existed only to be the keyboard's path.
 */
function ViewportProxy({ commands }: Pick<Props, 'commands'>) {
  const handleKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    const run = proxyCommand(event.key, commands);
    if (run === null) return;
    event.preventDefault();
    run();
  };
  return (
    <div className="atlas-proxy-group">
      {/* A focusable surface, not a widget: it takes keys and runs camera commands, and holds no content of its own. */}
      <div
        className="atlas-proxy" data-viewport-proxy="true" tabIndex={0} role="application"
        aria-roledescription="3D brain view" aria-label="Move the 3D view from the keyboard"
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Plus Minus Home" onKeyDown={handleKey}
      >
        Move the view
      </div>
      <ul className="atlas-proxy-keys">
        <li>Left and right arrows turn the brain.</li>
        <li>Up and down arrows tilt it.</li>
        <li>Plus and minus zoom in and out.</li>
        <li>Home returns to {CAMERA_VIEW_LABELS[DEFAULT_CAMERA_VIEW].toLowerCase()}.</li>
      </ul>
    </div>
  );
}

function SliceControls({ slice, bounds, cutShapeNames, onSliceAxis, onSlicePosition, onSliceStep }: Pick<Props, 'cutShapeNames' | 'onSliceAxis' | 'onSlicePosition' | 'onSliceStep'> & { slice: SliceState; bounds: BoundsMm }) {
  const index = AXIS_INDEX[slice.axis];
  return (
    <div className="atlas-slice">
      <div className="atlas-control-group" role="group" aria-label="Direction of the cut">
        {SLICE_AXES.map((axis) => <button key={axis} type="button" className="atlas-button" aria-pressed={axis === slice.axis} onClick={() => onSliceAxis(axis)}>{SLICE_AXIS_LABELS[axis]}</button>)}
      </div>
      <div className="atlas-control-group">
        <button type="button" className="atlas-button" onClick={() => onSliceStep(-1)}>Move the cut back</button>
        <input
          className="atlas-range" type="range" aria-label="Position of the cut, in millimetres" aria-valuetext={`${slice.positionMm} millimetres`}
          min={Math.ceil(bounds.min[index])} max={Math.floor(bounds.max[index])} step={1} value={slice.positionMm} onChange={(event) => onSlicePosition(Number(event.target.value))}
        />
        <button type="button" className="atlas-button" onClick={() => onSliceStep(1)}>Move the cut forward</button>
      </div>
      <p className="atlas-fact" role="status">Cut at {slice.positionMm} mm, {SLICE_AXIS_LABELS[slice.axis].toLowerCase()}. It passes through {cutShapeNames.length} {cutShapeNames.length === 1 ? 'shape' : 'shapes'}.</p>
      {cutShapeNames.length > 0 && (
        <Disclosure label="Shapes the cut passes through"><ul className="atlas-labels">{cutShapeNames.map((name) => <li key={name} className="atlas-name-label">{name}</li>)}</ul></Disclosure>
      )}
    </div>
  );
}

/**
 * Every way to move the view without dragging: a menu of the named views, one
 * focusable proxy carrying the turns, tilts and zooms as keys, and the cut.
 * Thirteen always-visible buttons became a menu and a proxy; a test asserts
 * that every camera move the pointer can make is still reachable from the
 * keyboard, so the reduction cannot quietly drop parity.
 */
export default function ViewportControls(props: Props) {
  const { activeView, commands, slice, bounds } = props;
  return (
    <div className="atlas-controls">
      <div className="atlas-control-group">
        <label className="atlas-label" htmlFor="atlas-camera-view">View</label>
        <select
          id="atlas-camera-view" className="atlas-input atlas-view-menu" value={activeView ?? ''}
          onChange={(event) => { if (isCameraViewId(event.target.value)) props.onView(event.target.value); }}
        >
          {activeView === null && <option value="">Turned by hand</option>}
          {CAMERA_VIEW_IDS.map((viewId) => <option key={viewId} value={viewId}>{CAMERA_VIEW_LABELS[viewId]}</option>)}
        </select>
        <button type="button" className="atlas-button" onClick={() => props.onView(DEFAULT_CAMERA_VIEW)}>Reset the view</button>
      </div>
      <ViewportProxy commands={commands} />
      <div className="atlas-control-group">
        <button type="button" className="atlas-toggle" aria-pressed={slice !== null} aria-disabled={bounds === null} onClick={() => { if (bounds !== null) props.onToggleSlice(); }}>
          <span className="atlas-toggle-box" aria-hidden="true" />
          Cut through the brain
        </button>
      </div>
      <LimitNote limit={limitSentence('view_hint')} />
      {slice !== null && bounds !== null && (
        <SliceControls slice={slice} bounds={bounds} cutShapeNames={props.cutShapeNames} onSliceAxis={props.onSliceAxis} onSlicePosition={props.onSlicePosition} onSliceStep={props.onSliceStep} />
      )}
    </div>
  );
}
