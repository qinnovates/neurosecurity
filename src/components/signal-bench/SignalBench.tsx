import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useReducedMotion } from '../../lib/useReducedMotion';
import type { SignalBenchEvent } from './signal-bench-events';
import { drawSignalBench, type SignalBenchPalette } from './signal-bench-renderer';
import SignalBenchSelection from './SignalBenchSelection';
import { getFinalFrameTime, getScheduleSlot, getStartedEventIndexAt } from './signal-model';

interface SignalBenchProps {
  events: SignalBenchEvent[];
}

/** Chosen so the first catalogued event is already on screen at first paint. */
const INITIAL_TIME_SECONDS = 5;
const MAX_FRAME_DELTA_SECONDS = 0.1;
const MAX_DEVICE_PIXEL_RATIO = 2;
const COMPACT_WIDTH_PX = 640;
const COMPACT_CHANNEL_COUNT = 4;
const FULL_CHANNEL_COUNT = 6;
const TECHNIQUE_PATH = '/atlas/tara/';
const LABEL_FONT_SIZE_PX = 11;
const LABEL_FONT_TOKEN = '--font-heading';
const HIGHLIGHT_PARAM = 'highlight';

const PALETTE_TOKENS: Record<keyof SignalBenchPalette, string> = {
  trace: '--signal-trace',
  adversarial: '--signal-event',
  background: '--color-bg-deep',
};

function readPalette(element: Element): SignalBenchPalette {
  const styles = getComputedStyle(element);
  return {
    trace: styles.getPropertyValue(PALETTE_TOKENS.trace).trim(),
    adversarial: styles.getPropertyValue(PALETTE_TOKENS.adversarial).trim(),
    background: styles.getPropertyValue(PALETTE_TOKENS.background).trim(),
  };
}

function readLabelFont(element: Element): string {
  return `500 ${LABEL_FONT_SIZE_PX}px ${getComputedStyle(element).getPropertyValue(LABEL_FONT_TOKEN).trim() || 'sans-serif'}`;
}

function fitCanvasToElement(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): { width: number; height: number } {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
  const { clientWidth: width, clientHeight: height } = canvas;
  const pixelWidth = Math.round(width * pixelRatio);
  const pixelHeight = Math.round(height * pixelRatio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  return { width, height };
}

/** Runs `onFrame` every animation frame with a clamped delta; returns a stop function. */
function startFrameLoop(onFrame: (deltaSeconds: number) => void): () => void {
  let previousTimestamp = performance.now();
  let frameHandle = requestAnimationFrame(function advance(timestamp: number) {
    onFrame(Math.min((timestamp - previousTimestamp) / 1000, MAX_FRAME_DELTA_SECONDS));
    previousTimestamp = timestamp;
    frameHandle = requestAnimationFrame(advance);
  });
  return () => cancelAnimationFrame(frameHandle);
}

function useIsOnScreen(elementRef: RefObject<Element | null>): boolean {
  const [isOnScreen, setIsOnScreen] = useState(false);
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setIsOnScreen(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef]);
  return isOnScreen;
}

/** Increments whenever the site theme flips, so the canvas re-reads its colours. */
function useThemeRevision(): number {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setRevision((current) => current + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return revision;
}

function useSignalBenchCanvas(
  events: SignalBenchEvent[],
  isAnimationAllowed: boolean,
  isStaticFinalFrame: boolean,
  onEventIndexChange: (index: number) => void,
): RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(INITIAL_TIME_SECONDS);
  const isOnScreen = useIsOnScreen(canvasRef);
  const themeRevision = useThemeRevision();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    // Without a 2D context the readout below the strip stands in as static content.
    if (!canvas || !context || events.length === 0) return;

    if (isStaticFinalFrame) {
      timeRef.current = getFinalFrameTime(events.length);
      onEventIndexChange(getStartedEventIndexAt(timeRef.current));
    }
    const palette = readPalette(canvas);
    const labelFont = readLabelFont(canvas);
    const eventKinds = events.map((event) => event.kind);
    const fullLabels = events.map((event) => `${event.id} ${event.name} (${event.status.toLowerCase()})`);
    const compactLabels = events.map((event) => `${event.id} (${event.status.toLowerCase()})`);
    const paint = () => {
      const { width, height } = fitCanvasToElement(canvas, context);
      const isCompact = width < COMPACT_WIDTH_PX;
      const channelCount = isCompact ? COMPACT_CHANNEL_COUNT : FULL_CHANNEL_COUNT;
      const eventLabels = isCompact ? compactLabels : fullLabels;
      drawSignalBench({ context, width, height, time: timeRef.current, channelCount, eventKinds, eventLabels, labelFont, palette });
    };

    paint();
    const resizeObserver = new ResizeObserver(paint);
    resizeObserver.observe(canvas);
    const stopFrameLoop =
      !isAnimationAllowed || !isOnScreen
        ? undefined
        : startFrameLoop((deltaSeconds) => {
            timeRef.current += deltaSeconds;
            paint();
            onEventIndexChange(getStartedEventIndexAt(timeRef.current));
          });
    return () => {
      stopFrameLoop?.();
      resizeObserver.disconnect();
    };
  }, [events, isAnimationAllowed, isStaticFinalFrame, isOnScreen, themeRevision, onEventIndexChange]);

  return canvasRef;
}

function SignalBenchReadout({ event }: { event: SignalBenchEvent }) {
  return (
    <p className="signal-bench-readout flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
      <a href={`${TECHNIQUE_PATH}${event.id}/`} className="inline-flex items-baseline gap-2 text-[var(--color-text-primary)] hover:underline">
        <span aria-hidden="true" className="inline-block w-2 h-2 bg-[var(--signal-event)]" />
        {event.id}
      </a>
      <span className="text-[var(--color-text-primary)]">{event.name}</span>
      <span className="tabular-nums text-[var(--color-text-muted)]">
        NISS {event.nissScore.toFixed(1)} {event.severity}
      </span>
      <span className="text-[var(--color-text-muted)]">{event.status.toLowerCase()}</span>
    </p>
  );
}

function SignalBenchEventButtons({ events, activeId, selectedId, onSelect }: {
  events: SignalBenchEvent[];
  activeId: string;
  selectedId: string | null;
  onSelect: (event: SignalBenchEvent) => void;
}) {
  return (
    <ul className="flex flex-wrap gap-2 mt-3" aria-label="Catalogued events on this strip">
      {events.map((event) => (
        <li key={event.id}>
          <button
            type="button"
            aria-pressed={event.id === selectedId}
            data-playing={event.id === activeId}
            onClick={() => onSelect(event)}
            className="signal-bench-event min-h-[44px] rounded-lg px-3 text-left text-sm"
          >
            {event.id} {event.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Keeps the choice in the address bar without a history entry; other parameters stay. */
function writeHighlightParam(techniqueId: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set(HIGHLIGHT_PARAM, techniqueId);
  window.history.replaceState(window.history.state, '', url);
}

/** The event named by the address, if any. The parameter is visitor-controlled, so only a listed id counts. */
function readHighlightedEvent(events: SignalBenchEvent[]): SignalBenchEvent | null {
  const techniqueId = new URLSearchParams(window.location.search).get(HIGHLIGHT_PARAM);
  return events.find((event) => event.id === techniqueId) ?? null;
}

/**
 * Homepage strip chart: synthetic traces on which catalogued interference
 * classes play out, each labelled from the TARA registrar.
 */
export default function SignalBench({ events }: SignalBenchProps) {
  const [eventIndex, setEventIndex] = useState(getStartedEventIndexAt(INITIAL_TIME_SECONDS));
  const [isPaused, setIsPaused] = useState(false);
  // Held while the readout is hovered or focused so its link cannot change under the pointer.
  const [isReadoutInUse, setIsReadoutInUse] = useState(false);
  const hasReducedMotion = useReducedMotion();
  const [selectedEvent, setSelectedEvent] = useState<SignalBenchEvent | null>(null);
  const canvasRef = useSignalBenchCanvas(events, !hasReducedMotion && !isPaused && !isReadoutInUse, hasReducedMotion, setEventIndex);
  // Read after hydration: the server has no address, and first paint must match its markup.
  useEffect(() => setSelectedEvent(readHighlightedEvent(events)), [events]);
  const selectEvent = useCallback((event: SignalBenchEvent) => {
    setSelectedEvent(event);
    writeHighlightParam(event.id);
  }, []);
  if (events.length === 0) return null;
  const activeEvent = events[getScheduleSlot(eventIndex, events.length)];

  return (
    <div className="signal-bench flex-1 flex flex-col min-h-0">
      <div className="signal-bench-strip relative flex-1 min-h-[200px]">
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 w-full h-full" />
      </div>
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div
            onPointerEnter={(event) => {
              // A tap also fires pointerenter and would leave the strip held with no visible cause.
              if (event.pointerType === 'mouse') setIsReadoutInUse(true);
            }}
            onPointerLeave={() => setIsReadoutInUse(false)}
            onFocus={() => setIsReadoutInUse(true)}
            onBlur={() => setIsReadoutInUse(false)}
          >
            <SignalBenchReadout key={activeEvent.id} event={activeEvent} />
          </div>
          {!hasReducedMotion && (
            <button
              type="button"
              onClick={() => setIsPaused((current) => !current)}
              className="glass shrink-0 rounded-lg px-3 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              {isPaused ? 'Play animation' : 'Pause animation'}
            </button>
          )}
        </div>
        <SignalBenchEventButtons events={events} activeId={activeEvent.id} selectedId={selectedEvent?.id ?? null} onSelect={selectEvent} />
        {selectedEvent && <SignalBenchSelection event={selectedEvent} />}
        <p className="text-xs text-[var(--color-text-faint)] mt-2">
          Synthetic illustration of signal-level interference. These traces are generated, not recorded neural data.
        </p>
      </div>
    </div>
  );
}
