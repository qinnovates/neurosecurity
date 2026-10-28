import { Suspense, type ComponentType, type ReactNode, type Ref } from 'react';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import type { DeviceCaption } from '@/lib/atlas-explorer/device-drawing';
import { SLICE_AXIS_LABELS, type SliceState } from '@/lib/atlas-explorer/slice-plane';
import type { ViewportCaption } from '@/lib/atlas-explorer/viewport-caption';
import type { AtlasCanvasProps, CanvasCommands } from './AtlasCanvas';
import LimitNote from './LimitNote';
import ReviewMark from './ReviewMark';
import type { AxisDirections } from './scene-renderer';

interface Props {
  Canvas: ComponentType<AtlasCanvasProps>;
  canvasProps: Omit<AtlasCanvasProps, 'commands'>;
  commands: Ref<CanvasCommands>;
  caption: ViewportCaption;
  directions: AxisDirections | null;
  /** The open cut, or null. The caption says where it is and that it is not a scan. */
  slice: SliceState | null;
  /** The electrode layout's line, review state and limits, while its dots are drawn. Null otherwise. */
  deviceCaption: DeviceCaption | null;
  /** A threat model's steps are on screen, so the caption says what their order does and does not mean. */
  isChainShown: boolean;
  /** The name of the shape under the pointer, or null. */
  hoverLabel: string | null;
  /** What the picture has selected, said beside it, with the way to its details where the page has them. Null while nothing is selected. */
  selection: PictureSelection | null;
  /** The ways out of the current lens, offered under the picture so a lens that lights nothing can be left without leaving the picture. Null where there is none. */
  lensWays?: LensWays | null;
  /** Shown over the picture when nothing can be drawn yet. */
  children?: ReactNode;
}

export interface PictureSelection {
  name: string;
  /** Takes the visitor to the selected region's details. Absent on a page that keeps the details elsewhere. */
  onShowDetails?: () => void;
}

/** Each is a button label with what it does; the caption already names the lens, so no sentence is repeated here. */
export interface LensWays {
  /** "Choose another technique", for a lens with a subject. */
  choose: { label: string; onChoose: () => void } | null;
  /** "Back to the Band lens", when there is a lens to go back to. */
  back: { label: string; onBack: () => void } | null;
}

export const ATTRIBUTION_PATH = '/atlas/attribution/';
export const SHOW_DETAILS_LABEL = 'See its details';
const DIRECTION_LABELS: Readonly<Record<keyof AxisDirections, string>> = { left: 'Left', right: 'Right', front: 'Front', back: 'Back', top: 'Top', bottom: 'Bottom' };
/** How far from the middle of the marker a label sits, as a share of its half-width. */
const MARKER_REACH = 38;
const HALF = 50;

/** Which way is left, right, front, back, up and down, as words that turn with the brain. */
function OrientationMarker({ directions }: { directions: AxisDirections }) {
  return (
    <div className="atlas-orientation" aria-hidden="true">
      {(Object.keys(DIRECTION_LABELS) as Array<keyof AxisDirections>).map((name) => {
        const [x, y, z] = directions[name];
        return <span key={name} className="atlas-orientation-label" data-facing={z >= 0 ? 'near' : 'far'} style={{ left: `${HALF + x * MARKER_REACH}%`, top: `${HALF - y * MARKER_REACH}%` }}>{DIRECTION_LABELS[name]}</span>;
      })}
    </div>
  );
}

/**
 * The picture and what must never be cropped away from it: the caption with
 * the review mark, the lens and its limit, and how far each layer's position
 * can be trusted. The caption lies inside the picture's own bounds.
 */
export default function ViewportStage({ Canvas, canvasProps, commands, caption, directions, slice, deviceCaption, isChainShown, hoverLabel, selection, lensWays = null, children }: Props) {
  const sliceLimits = slice === null ? [] : [limitSentence('slice_position', { position: String(slice.positionMm), axis: SLICE_AXIS_LABELS[slice.axis].toLowerCase() }), limitSentence('slice_view')];
  return (
    <figure className="atlas-picture" data-viewport-stage="true">
      <Suspense fallback={<p className="atlas-loading atlas-picture-notice" role="status">Loading the 3D view…</p>}>
        <Canvas {...canvasProps} commands={commands} />
      </Suspense>
      {children}
      {directions !== null && <OrientationMarker directions={directions} />}
      {hoverLabel !== null && <p className="atlas-hover-label" aria-hidden="true">{hoverLabel}</p>}
      {selection !== null && (
        <p className="atlas-picture-selected" data-picture-selected={selection.name}>
          <span>Selected: <strong>{selection.name}</strong>.</span>
          {selection.onShowDetails !== undefined && <button type="button" className="atlas-link-button" onClick={selection.onShowDetails}>{SHOW_DETAILS_LABEL}</button>}
        </p>
      )}
      {lensWays !== null && (lensWays.choose !== null || lensWays.back !== null) && (
        <p className="atlas-picture-lens" data-picture-lens="true">
          {lensWays.choose !== null && <button type="button" className="atlas-link-button" onClick={lensWays.choose.onChoose}>{lensWays.choose.label}</button>}
          {lensWays.back !== null && <button type="button" className="atlas-link-button" onClick={lensWays.back.onBack}>{lensWays.back.label}</button>}
        </p>
      )}
      <figcaption className="atlas-caption" data-viewport-caption="true">
        <p className="atlas-caption-line">
          {caption.reviewState !== null && <ReviewMark state={caption.reviewState} />} <strong>{caption.lensLabel}</strong>{' '}
          Average template {caption.templateSpace}, not anyone&rsquo;s brain. <a href={ATTRIBUTION_PATH}>Sources and licences</a>
        </p>
        {isChainShown && <LimitNote limit={limitSentence('chain_order')} />}
        {[...caption.lensLimits, ...caption.positionLimits, ...sliceLimits].map((limit) => <LimitNote key={`${limit.id}:${limit.text}`} limit={limit} />)}
        {deviceCaption !== null && (
          <div className="atlas-caption-device" data-device-caption="true">
            <p className="atlas-caption-line"><ReviewMark state={deviceCaption.reviewState} /> <strong>{deviceCaption.label}</strong></p>
            {deviceCaption.limits.map((limit) => <LimitNote key={limit.id} limit={limit} />)}
          </div>
        )}
      </figcaption>
    </figure>
  );
}
