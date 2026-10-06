import {
  REPLAY_SOURCE_OFFSET_SECONDS,
  getEventIndexAt,
  getEventWindow,
  isChannelAffected,
  sampleBaseline,
  sampleChannel,
  type SignalEventKind,
  type SignalEventWindow,
} from './signal-model';

export interface SignalBenchPalette {
  trace: string;
  adversarial: string;
  grid: string;
  background: string;
}

export interface SignalBenchFrame {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  /** Signal time at the write head, in seconds. */
  time: number;
  channelCount: number;
  eventKinds: readonly SignalEventKind[];
  /** One label per entry of `eventKinds`, drawn beside each event on the strip. */
  eventLabels: readonly string[];
  /** CSS font shorthand for the labels. */
  labelFont: string;
  palette: SignalBenchPalette;
}

interface StripGeometry {
  headX: number;
  laneHeight: number;
  amplitude: number;
}

interface VisibleEvents {
  firstIndex: number;
  windows: SignalEventWindow[];
}

type AnnotationRenderer = (frame: SignalBenchFrame, geometry: StripGeometry, event: SignalEventWindow) => void;

export const PIXELS_PER_SECOND = 120;
const SAMPLE_STEP_PX = 2;
const WRITE_HEAD_INSET_PX = 28;
const WRITE_HEAD_RADIUS_PX = 2.5;
const LANE_AMPLITUDE_RATIO = 0.4;
const TRACE_WIDTH_PX = 1.25;
const ADVERSARIAL_WIDTH_PX = 1.75;
const GHOST_OFFSET_RATIO = 0.42;
const GHOST_AMPLITUDE_RATIO = 0.6;
const GHOST_DASH_PX = [3, 3];
const BRACKET_GAP_PX = 6;
const BRACKET_TICK_PX = 4;
const BRACKET_SOURCE_ALPHA = 0.55;
const LABEL_GUTTER_PX = 16;
/** Room under the last lane for the replay bracket. */
const BRACKET_GUTTER_PX = 12;
const LABEL_LIFT_PX = 5;
const LABEL_PADDING_PX = 4;
const LABEL_HEAD_GAP_PX = 10;

function getGeometry(frame: SignalBenchFrame): StripGeometry {
  const laneHeight = (frame.height - LABEL_GUTTER_PX - BRACKET_GUTTER_PX) / frame.channelCount;
  return { headX: frame.width - WRITE_HEAD_INSET_PX, laneHeight, amplitude: laneHeight * LANE_AMPLITUDE_RATIO };
}

function getXAtTime(frame: SignalBenchFrame, geometry: StripGeometry, time: number): number {
  return geometry.headX - (frame.time - time) * PIXELS_PER_SECOND;
}

function getTimeAtX(frame: SignalBenchFrame, geometry: StripGeometry, x: number): number {
  return frame.time - (geometry.headX - x) / PIXELS_PER_SECOND;
}

function getLaneCenter(geometry: StripGeometry, channel: number): number {
  return LABEL_GUTTER_PX + geometry.laneHeight * (channel + 0.5);
}

function getVisibleEvents(frame: SignalBenchFrame, geometry: StripGeometry): VisibleEvents {
  const firstIndex = getEventIndexAt(getTimeAtX(frame, geometry, 0) - REPLAY_SOURCE_OFFSET_SECONDS);
  const lastIndex = getEventIndexAt(frame.time);
  const windows: SignalEventWindow[] = [];
  for (let index = firstIndex; index <= lastIndex; index++) {
    windows.push(getEventWindow(index, frame.eventKinds, frame.channelCount));
  }
  return { firstIndex, windows };
}

function getEventForTime(visibleEvents: VisibleEvents, time: number): SignalEventWindow {
  // Falls back to the oldest window if float rounding lands just outside the range.
  return visibleEvents.windows[getEventIndexAt(time) - visibleEvents.firstIndex] ?? visibleEvents.windows[0];
}

function drawTimeGrid(frame: SignalBenchFrame, geometry: StripGeometry): void {
  const { context } = frame;
  context.strokeStyle = frame.palette.grid;
  context.lineWidth = 1;
  context.beginPath();
  for (let second = Math.ceil(getTimeAtX(frame, geometry, 0)); second <= frame.time; second++) {
    const x = Math.round(getXAtTime(frame, geometry, second)) + 0.5;
    context.moveTo(x, 0);
    context.lineTo(x, frame.height);
  }
  context.stroke();
}

function strokeRun(frame: SignalBenchFrame, isAdversarial: boolean): void {
  frame.context.strokeStyle = isAdversarial ? frame.palette.adversarial : frame.palette.trace;
  frame.context.lineWidth = isAdversarial ? ADVERSARIAL_WIDTH_PX : TRACE_WIDTH_PX;
  frame.context.stroke();
}

function drawChannelTrace(frame: SignalBenchFrame, geometry: StripGeometry, visibleEvents: VisibleEvents, channel: number): void {
  const { context } = frame;
  const centerY = getLaneCenter(geometry, channel);
  let isAdversarialRun = false;
  context.beginPath();
  for (let x = 0; x <= geometry.headX; x += SAMPLE_STEP_PX) {
    const time = getTimeAtX(frame, geometry, x);
    const sample = sampleChannel(channel, time, getEventForTime(visibleEvents, time));
    const y = centerY - sample.value * geometry.amplitude;
    context.lineTo(x, y);
    if (sample.isAdversarial !== isAdversarialRun) {
      strokeRun(frame, isAdversarialRun);
      isAdversarialRun = sample.isAdversarial;
      context.beginPath();
      context.moveTo(x, y);
    }
  }
  strokeRun(frame, isAdversarialRun);
}

/** A dashed copy peeling off below the tapped lane: the original stays untouched. */
const drawInterceptGhost: AnnotationRenderer = (frame, geometry, event) => {
  const { context } = frame;
  const startX = Math.max(0, getXAtTime(frame, geometry, event.startTime));
  const endX = Math.min(geometry.headX, getXAtTime(frame, geometry, event.endTime));
  if (endX <= startX) return;
  const laneY = getLaneCenter(geometry, event.channel);
  const ghostY = laneY + geometry.laneHeight * GHOST_OFFSET_RATIO;
  context.save();
  context.strokeStyle = frame.palette.adversarial;
  context.lineWidth = TRACE_WIDTH_PX;
  context.setLineDash(GHOST_DASH_PX);
  context.beginPath();
  context.moveTo(startX, laneY - sampleBaseline(event.channel, getTimeAtX(frame, geometry, startX)) * geometry.amplitude);
  for (let x = startX; x <= endX; x += SAMPLE_STEP_PX) {
    const value = sampleBaseline(event.channel, getTimeAtX(frame, geometry, x));
    context.lineTo(x, ghostY - value * geometry.amplitude * GHOST_AMPLITUDE_RATIO);
  }
  context.stroke();
  context.restore();
};

function strokeBracket(frame: SignalBenchFrame, geometry: StripGeometry, fromX: number, toX: number, y: number): void {
  const startX = Math.max(0, fromX);
  const endX = Math.min(geometry.headX, toX);
  if (endX <= startX) return;
  const { context } = frame;
  context.beginPath();
  context.moveTo(startX, y - BRACKET_TICK_PX);
  context.lineTo(startX, y);
  context.lineTo(endX, y);
  if (endX === toX) context.lineTo(endX, y - BRACKET_TICK_PX);
  context.stroke();
}

/** Brackets the captured segment and the later span where the same samples reappear. */
const drawReplayBracket: AnnotationRenderer = (frame, geometry, event) => {
  const { context } = frame;
  const y = getLaneCenter(geometry, event.channel) + geometry.amplitude + BRACKET_GAP_PX;
  const replayStartX = getXAtTime(frame, geometry, event.startTime);
  const replayEndX = getXAtTime(frame, geometry, event.endTime);
  const sourceShiftPx = REPLAY_SOURCE_OFFSET_SECONDS * PIXELS_PER_SECOND;
  context.save();
  context.strokeStyle = frame.palette.adversarial;
  context.lineWidth = TRACE_WIDTH_PX;
  strokeBracket(frame, geometry, replayStartX, replayEndX, y);
  context.globalAlpha = BRACKET_SOURCE_ALPHA;
  strokeBracket(frame, geometry, replayStartX - sourceShiftPx, replayEndX - sourceShiftPx, y);
  context.restore();
};

const ANNOTATION_RENDERERS: Partial<Record<SignalEventKind, AnnotationRenderer>> = {
  intercept: drawInterceptGhost,
  replay: drawReplayBracket,
};

function getTopAffectedChannel(event: SignalEventWindow): number {
  let channel = event.channel;
  while (channel > 0 && isChannelAffected(event, channel - 1)) channel--;
  return channel;
}

/** Names the event in place so every coloured mark is identified where it is drawn. */
function drawEventLabel(frame: SignalBenchFrame, geometry: StripGeometry, event: SignalEventWindow): void {
  const { context } = frame;
  const startX = getXAtTime(frame, geometry, event.startTime);
  const label = frame.eventLabels[event.slot];
  if (startX > geometry.headX || !label) return;
  context.font = frame.labelFont;
  const metrics = context.measureText(label);
  // Hugs the write head while the event is still entering, then travels with it.
  const x = Math.min(startX, geometry.headX - LABEL_HEAD_GAP_PX - metrics.width);
  // Once the label has scrolled off the left edge it is gone; it must not stay pinned there.
  if (x + metrics.width < 0) return;
  const baselineY = getLaneCenter(geometry, getTopAffectedChannel(event)) - geometry.amplitude - LABEL_LIFT_PX;
  const ascent = metrics.actualBoundingBoxAscent;
  context.fillStyle = frame.palette.background;
  context.fillRect(x - LABEL_PADDING_PX, baselineY - ascent - LABEL_PADDING_PX, metrics.width + LABEL_PADDING_PX * 2, ascent + LABEL_PADDING_PX * 2);
  context.fillStyle = frame.palette.adversarial;
  context.fillText(label, x, baselineY);
}

function drawWriteHeads(frame: SignalBenchFrame, geometry: StripGeometry, visibleEvents: VisibleEvents): void {
  const { context } = frame;
  const currentEvent = getEventForTime(visibleEvents, frame.time);
  for (let channel = 0; channel < frame.channelCount; channel++) {
    const sample = sampleChannel(channel, frame.time, currentEvent);
    context.fillStyle = sample.isAdversarial ? frame.palette.adversarial : frame.palette.trace;
    context.beginPath();
    context.arc(geometry.headX, getLaneCenter(geometry, channel) - sample.value * geometry.amplitude, WRITE_HEAD_RADIUS_PX, 0, Math.PI * 2);
    context.fill();
  }
}

/** Draws one complete frame. Stateless: the same inputs always produce the same pixels. */
export function drawSignalBench(frame: SignalBenchFrame): void {
  const geometry = getGeometry(frame);
  const visibleEvents = getVisibleEvents(frame, geometry);
  frame.context.clearRect(0, 0, frame.width, frame.height);
  frame.context.lineJoin = 'round';
  drawTimeGrid(frame, geometry);
  for (let channel = 0; channel < frame.channelCount; channel++) {
    drawChannelTrace(frame, geometry, visibleEvents, channel);
  }
  for (const event of visibleEvents.windows) {
    ANNOTATION_RENDERERS[event.kind]?.(frame, geometry, event);
    drawEventLabel(frame, geometry, event);
  }
  drawWriteHeads(frame, geometry, visibleEvents);
}
