import { useEffect, useRef } from 'react';
import type { SampleMarker, SignalSample } from '@/lib/signal/sample-csv';
import type { ThresholdEvent } from '@/lib/signal/threshold-events';

interface Props {
  sample: SignalSample;
  /** The playhead, in seconds. The plot shows the stretch that ends here. */
  time: number;
  /** How many seconds the plot spans. */
  windowSeconds: number;
  /** Half the height of one channel's row, in microvolts. */
  scaleMicrovolts: number;
  events: readonly ThresholdEvent[];
  /** Accessible name; says what is plotted and that it is synthetic. */
  label: string;
}

const LABEL_GUTTER = 44;
const TOP_GUTTER = 18;
const BOTTOM_GUTTER = 18;
const STAMP = 'Synthetic sample';
const FONT = '11px Inter, system-ui, sans-serif';

interface Palette { ink: string; soft: string; line: string; flow: string; event: string }

function readPalette(element: Element): Palette {
  const style = getComputedStyle(element);
  const read = (name: string, fallback: string): string => style.getPropertyValue(name).trim() || fallback;
  return {
    ink: read('--lab-ink', '#111'), soft: read('--lab-ink-soft', '#666'), line: read('--lab-line', 'rgba(128,128,128,.3)'),
    flow: read('--lab-flow', '#0b766c'), event: read('--lab-high', '#b25a00'),
  };
}

function drawMarkers(context: CanvasRenderingContext2D, markers: readonly SampleMarker[], toX: (time: number) => number, from: number, to: number, height: number, palette: Palette): void {
  context.strokeStyle = palette.soft;
  context.setLineDash([2, 4]);
  context.beginPath();
  for (const marker of markers) {
    if (marker.time < from || marker.time > to) continue;
    context.moveTo(toX(marker.time), TOP_GUTTER);
    context.lineTo(toX(marker.time), height - BOTTOM_GUTTER);
  }
  context.stroke();
  context.setLineDash([]);
}

function draw(canvas: HTMLCanvasElement, { sample, time, windowSeconds, scaleMicrovolts, events }: Props): void {
  const context = canvas.getContext('2d');
  if (context === null) return;
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  const palette = readPalette(canvas);
  const from = time - windowSeconds;
  const plotWidth = width - LABEL_GUTTER;
  const toX = (seconds: number): number => LABEL_GUTTER + ((seconds - from) / windowSeconds) * plotWidth;
  const rowHeight = (height - TOP_GUTTER - BOTTOM_GUTTER) / sample.channels.length;
  context.font = FONT;
  context.textBaseline = 'middle';

  // One faint line per second, labelled with the time in the recording.
  context.strokeStyle = palette.line;
  context.fillStyle = palette.soft;
  context.lineWidth = 1;
  context.textAlign = 'center';
  for (let second = Math.ceil(Math.max(0, from)); second <= time; second += 1) {
    const x = Math.round(toX(second)) + 0.5;
    context.beginPath(); context.moveTo(x, TOP_GUTTER); context.lineTo(x, height - BOTTOM_GUTTER); context.stroke();
    context.fillText(`${second}s`, x, height - BOTTOM_GUTTER / 2);
  }
  drawMarkers(context, sample.markers, toX, Math.max(0, from), time, height, palette);

  const firstIndex = Math.max(0, Math.floor(from * sample.sampleRateHz));
  const lastIndex = Math.min(sample.channels[0].length - 1, Math.floor(time * sample.sampleRateHz));
  context.textAlign = 'left';
  sample.channels.forEach((channel, row) => {
    const middle = TOP_GUTTER + rowHeight * (row + 0.5);
    context.fillStyle = palette.soft;
    context.fillText(sample.channelNames[row], 4, middle);
    context.strokeStyle = palette.ink;
    context.lineWidth = 1.25;
    context.beginPath();
    for (let index = firstIndex; index <= lastIndex; index += 1) {
      const x = toX(index / sample.sampleRateHz);
      const y = middle - (channel[index] / scaleMicrovolts) * (rowHeight / 2);
      if (index === firstIndex) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.stroke();
  });

  // Where the stated rule fired inside this stretch: a tick on each channel that crossed.
  context.fillStyle = palette.event;
  for (const event of events) {
    if (event.time < from || event.time > time) continue;
    for (const name of event.channelNames) {
      const row = sample.channelNames.indexOf(name);
      if (row !== -1) context.fillRect(toX(event.time) - 1.5, TOP_GUTTER + rowHeight * row + 1, 3, rowHeight - 2);
    }
  }

  context.strokeStyle = palette.flow;
  context.lineWidth = 2;
  context.beginPath(); context.moveTo(toX(time) - 1, TOP_GUTTER); context.lineTo(toX(time) - 1, height - BOTTOM_GUTTER); context.stroke();
  context.fillStyle = palette.soft;
  context.textAlign = 'right';
  context.fillText(STAMP, width - 6, TOP_GUTTER / 2);
}

/** Every channel of the sample over the last few seconds, written at the playhead as time passes. */
export default function SignalPlot(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latestProps = useRef(props);
  latestProps.current = props;

  useEffect(() => {
    if (canvasRef.current !== null) draw(canvasRef.current, props);
  });

  // Redraw at the new size when the panel is resized, and in the new colours when the theme changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return undefined;
    const redraw = (): void => draw(canvas, latestProps.current);
    const sizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(redraw);
    sizeObserver?.observe(canvas);
    const themeObserver = new MutationObserver(redraw);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { sizeObserver?.disconnect(); themeObserver.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} className="monitor-plot" role="img" aria-label={props.label} />;
}
