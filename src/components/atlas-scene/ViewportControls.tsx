import { limitSentence } from '@/lib/anatomy/limits-copy';
import { CAMERA_VIEW_IDS, CAMERA_VIEW_LABELS, type CameraViewId } from '@/lib/atlas-explorer/camera-views';
import { SLICE_AXES, SLICE_AXIS_LABELS, type BoundsMm, type SliceAxis, type SliceState } from '@/lib/atlas-explorer/slice-plane';
import type { CanvasCommands } from './AtlasCanvas';
import Disclosure from './Disclosure';
import LimitNote from './LimitNote';

interface Props {
  /** The named view the camera last moved to, or null once it has been turned by hand or by the turn buttons. */
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
 * Every way to move the view, as real buttons: they are the keyboard's path and
 * the path for anyone who cannot drag. The canvas itself is never a tab stop.
 */
export default function ViewportControls(props: Props) {
  const { activeView, commands, slice, bounds } = props;
  return (
    <div className="atlas-controls">
      <div className="atlas-control-group" role="group" aria-label="View">
        {CAMERA_VIEW_IDS.map((viewId) => (
          <button key={viewId} type="button" className="atlas-button" aria-pressed={viewId === activeView} onClick={() => props.onView(viewId)}>{CAMERA_VIEW_LABELS[viewId]}</button>
        ))}
      </div>
      <div className="atlas-control-group" role="group" aria-label="Zoom and turn">
        <button type="button" className="atlas-button" onClick={() => commands.zoom('in')}>Zoom in</button>
        <button type="button" className="atlas-button" onClick={() => commands.zoom('out')}>Zoom out</button>
        <button type="button" className="atlas-button" onClick={() => commands.turn('left')}>Turn left</button>
        <button type="button" className="atlas-button" onClick={() => commands.turn('right')}>Turn right</button>
        <button type="button" className="atlas-button" onClick={() => commands.tilt('up')}>Tilt up</button>
        <button type="button" className="atlas-button" onClick={() => commands.tilt('down')}>Tilt down</button>
      </div>
      <div className="atlas-control-group">
        <button type="button" className="atlas-toggle" aria-pressed={slice !== null} aria-disabled={bounds === null} onClick={() => { if (bounds !== null) props.onToggleSlice(); }}>
          <span className="atlas-toggle-box" aria-hidden="true" />
          Cut through the brain
        </button>
      </div>
      <LimitNote limit={limitSentence('view_hint')} />
      {slice !== null && bounds !== null && (
        <>
          <SliceControls slice={slice} bounds={bounds} cutShapeNames={props.cutShapeNames} onSliceAxis={props.onSliceAxis} onSlicePosition={props.onSlicePosition} onSliceStep={props.onSliceStep} />
        </>
      )}
    </div>
  );
}
