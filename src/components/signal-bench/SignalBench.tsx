import { useEffect, useRef, useState, type RefObject } from 'react';
import { useReducedMotion } from '../../lib/useReducedMotion';
import type { SignalBenchEvent } from './signal-bench-events';
import { drawSignalBench, type SignalBenchPalette } from './signal-bench-renderer';
import { getScheduleSlot, getStartedEventIndexAt } from './signal-model';

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
const LABEL_FONT_TOKEN = '--font-mono';

const PALETTE_TOKENS: Record<keyof SignalBenchPalette, string> = {
  trace: '--color-text-muted',
  adversarial: '--color-accent-tertiary',
  grid: '--color-border',
  background: '--color-bg-deep',
};

function readPalette(element: Element): SignalBenchPalette {
  const styles = getComputedStyle(element);
  return {
    trace: styles.getPropertyValue(PALETTE_TOKENS.trace).trim(),
    adversarial: styles.getPropertyValue(PALETTE_TOKENS.adversarial).trim(),
    grid: styles.getPropertyValue(PALETTE_TOKENS.grid).trim(),
    background: styles.getPropertyValue(PALETTE_TOKENS.background).trim(),
  };
}

function readLabelFont(element: Element): string {
  return `500 ${LABEL_FONT_SIZE_PX}px ${getComputedStyle(element).getPropertyValue(LABEL_FONT_TOKEN).trim() || 'monospace'}`;
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

function useSignalBenchCanvas(events: SignalBenchEvent[], onEventIndexChange: (index: number) => void): RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(INITIAL_TIME_SECONDS);
  const isOnScreen = useIsOnScreen(canvasRef);
  const hasReducedMotion = useReducedMotion();
  const themeRevision = useThemeRevision();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    // Without a 2D context the readout below the strip stands in as static content.
    if (!canvas || !context || events.length === 0) return;

    const palette = readPalette(canvas);
    const labelFont = readLabelFont(canvas);
    const eventKinds = events.map((event) => event.kind);
    const eventLabels = events.map((event) => `${event.id} ${event.name}`);
    const paint = () => {
      const { width, height } = fitCanvasToElement(canvas, context);
      const channelCount = width < COMPACT_WIDTH_PX ? COMPACT_CHANNEL_COUNT : FULL_CHANNEL_COUNT;
      drawSignalBench({ context, width, height, time: timeRef.current, channelCount, eventKinds, eventLabels, labelFont, palette });
    };

    paint();
    const resizeObserver = new ResizeObserver(paint);
    resizeObserver.observe(canvas);
    const stopFrameLoop =
      hasReducedMotion || !isOnScreen
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
  }, [events, hasReducedMotion, isOnScreen, themeRevision, onEventIndexChange]);

  return canvasRef;
}

function SignalBenchReadout({ event }: { event: SignalBenchEvent }) {
  return (
    <p className="signal-bench-readout flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
      <a href={`${TECHNIQUE_PATH}${event.id}/`} className="inline-flex items-baseline gap-2 font-mono text-[var(--color-text-primary)] hover:underline">
        <span aria-hidden="true" className="inline-block w-2 h-2 bg-[var(--color-accent-tertiary)]" />
        {event.id}
      </a>
      <span className="text-[var(--color-text-primary)]">{event.name}</span>
      <span className="font-mono text-[var(--color-text-muted)]">
        NISS {event.nissScore.toFixed(1)} {event.severity}
      </span>
      <span className="text-[var(--color-text-muted)]">{event.status.toLowerCase()}</span>
    </p>
  );
}

/**
 * Homepage strip chart: synthetic traces on which catalogued interference
 * classes play out, each labelled from the TARA registrar.
 */
export default function SignalBench({ events }: SignalBenchProps) {
  const [eventIndex, setEventIndex] = useState(getStartedEventIndexAt(INITIAL_TIME_SECONDS));
  const canvasRef = useSignalBenchCanvas(events, setEventIndex);
  if (events.length === 0) return null;
  const activeEvent = events[getScheduleSlot(eventIndex, events.length)];

  return (
    <div className="signal-bench flex-1 flex flex-col min-h-0">
      <div className="signal-bench-strip relative flex-1 min-h-[200px]">
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 w-full h-full" />
      </div>
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <SignalBenchReadout key={activeEvent.id} event={activeEvent} />
        <p className="text-xs text-[var(--color-text-faint)] mt-1">
          Synthetic illustration of signal-level interference. These traces are generated, not recorded neural data.
        </p>
      </div>
    </div>
  );
}
