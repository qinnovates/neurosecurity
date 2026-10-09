/**
 * Draws one page of a sample on a canvas: every channel's trace, the threshold as two faint
 * lines in each row, and under each trace the stretches where that channel is beyond it.
 * The page is still. The playhead is a separate element laid over it.
 */

import type { SignalSample } from '@/lib/signal/sample-csv';
import type { ChannelSpan } from '@/lib/signal/threshold-events';

export interface PlotPage {
  sample: SignalSample;
  /** Seconds from the start of the sample at the left edge. */
  pageStart: number;
  /** How many seconds the page spans. */
  pageSeconds: number;
  /** Half the height of one channel's row, in microvolts. */
  scaleMicrovolts: number;
  thresholdMicrovolts: number;
  spans: readonly ChannelSpan[];
}

/** The left margin that holds the channel names, in CSS pixels. The playhead is laid out against it. */
export const LABEL_GUTTER = 48;
const TOP_GUTTER = 20;
const BOTTOM_GUTTER = 20;
const SPAN_HEIGHT = 3;
const STAMP = 'Synthetic sample';
const FONT = '12px Inter, system-ui, sans-serif';

interface Palette { ink: string; soft: string; faint: string; line: string }

function readPalette(element: Element): Palette {
  const style = getComputedStyle(element);
  const read = (name: string, fallback: string): string => style.getPropertyValue(name).trim() || fallback;
  return { ink: read('--lab-ink', '#1d1d1f'), soft: read('--lab-ink-soft', '#515154'), faint: read('--lab-ink-faint', '#6a6a6f'), line: read('--lab-line', 'rgba(128,128,128,.3)') };
}

/** The first second of the page the playhead is on. The last page may be shorter than the others. */
export function pageStartFor(time: number, pageSeconds: number, durationSeconds: number): number {
  const lastPageStart = Math.max(0, Math.ceil(durationSeconds / pageSeconds) - 1) * pageSeconds;
  return Math.min(lastPageStart, Math.floor((time + 1e-6) / pageSeconds) * pageSeconds);
}

/** Whether the threshold lines fit inside a row at this scale. */
export function isThresholdDrawable(thresholdMicrovolts: number, scaleMicrovolts: number): boolean {
  return thresholdMicrovolts <= scaleMicrovolts;
}

interface Frame { context: CanvasRenderingContext2D; width: number; height: number; rowHeight: number; toX: (seconds: number) => number; palette: Palette }

function drawTimeGrid({ context, height, toX, palette }: Frame, page: PlotPage): void {
  context.strokeStyle = palette.line;
  context.fillStyle = palette.soft;
  context.lineWidth = 1;
  context.textAlign = 'center';
  const pageEnd = Math.min(page.pageStart + page.pageSeconds, page.sample.durationSeconds);
  for (let second = Math.ceil(page.pageStart); second <= pageEnd; second += 1) {
    const x = Math.round(toX(second)) + 0.5;
    context.beginPath(); context.moveTo(x, TOP_GUTTER); context.lineTo(x, height - BOTTOM_GUTTER); context.stroke();
    context.fillText(`${second} s`, x, height - BOTTOM_GUTTER / 2);
  }
  // The file's own markers, dotted.
  context.strokeStyle = palette.soft;
  context.setLineDash([2, 4]);
  context.beginPath();
  for (const marker of page.sample.markers) {
    if (marker.time < page.pageStart || marker.time > pageEnd) continue;
    context.moveTo(toX(marker.time), TOP_GUTTER);
    context.lineTo(toX(marker.time), height - BOTTOM_GUTTER);
  }
  context.stroke();
  context.setLineDash([]);
}

function drawThreshold({ context, width, rowHeight, palette }: Frame, page: PlotPage, middle: number): void {
  if (!isThresholdDrawable(page.thresholdMicrovolts, page.scaleMicrovolts)) return;
  const offset = (page.thresholdMicrovolts / page.scaleMicrovolts) * (rowHeight / 2);
  context.strokeStyle = palette.faint;
  context.lineWidth = 1;
  context.setLineDash([4, 3]);
  context.beginPath();
  for (const y of [middle - offset, middle + offset]) { context.moveTo(LABEL_GUTTER, Math.round(y) + 0.5); context.lineTo(width, Math.round(y) + 0.5); }
  context.stroke();
  context.setLineDash([]);
}

function drawTrace({ context, rowHeight, toX, palette }: Frame, page: PlotPage, channel: Float32Array, middle: number): void {
  const { sampleRateHz } = page.sample;
  const firstIndex = Math.max(0, Math.floor(page.pageStart * sampleRateHz));
  const lastIndex = Math.min(channel.length - 1, Math.ceil((page.pageStart + page.pageSeconds) * sampleRateHz));
  context.strokeStyle = palette.ink;
  context.lineWidth = 1.25;
  context.beginPath();
  for (let index = firstIndex; index <= lastIndex; index += 1) {
    const x = toX(index / sampleRateHz);
    const y = middle - (channel[index] / page.scaleMicrovolts) * (rowHeight / 2);
    if (index === firstIndex) context.moveTo(x, y); else context.lineTo(x, y);
  }
  context.stroke();
}

/** Each span sits at the foot of its own channel's row, from that channel's first crossing to its last. */
function drawSpans({ context, rowHeight, toX, palette }: Frame, page: PlotPage): void {
  const pageEnd = page.pageStart + page.pageSeconds;
  context.fillStyle = palette.ink;
  for (const span of page.spans) {
    if (span.to < page.pageStart || span.from > pageEnd) continue;
    const left = toX(Math.max(span.from, page.pageStart));
    const right = toX(Math.min(span.to, pageEnd));
    context.fillRect(left, TOP_GUTTER + rowHeight * (span.channelIndex + 1) - SPAN_HEIGHT, Math.max(1, right - left), SPAN_HEIGHT);
  }
}

export function drawSignalPage(canvas: HTMLCanvasElement, page: PlotPage): void {
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
  context.font = FONT;
  context.textBaseline = 'middle';
  const toX = (seconds: number): number => LABEL_GUTTER + ((seconds - page.pageStart) / page.pageSeconds) * (width - LABEL_GUTTER);
  const frame: Frame = { context, width, height, rowHeight: (height - TOP_GUTTER - BOTTOM_GUTTER) / page.sample.channels.length, toX, palette: readPalette(canvas) };

  drawTimeGrid(frame, page);
  page.sample.channels.forEach((channel, row) => {
    const middle = TOP_GUTTER + frame.rowHeight * (row + 0.5);
    context.textAlign = 'left';
    context.fillStyle = frame.palette.soft;
    context.fillText(page.sample.channelNames[row], 4, middle);
    drawThreshold(frame, page, middle);
    drawTrace(frame, page, channel, middle);
  });
  drawSpans(frame, page);
  context.fillStyle = frame.palette.soft;
  context.textAlign = 'right';
  context.fillText(STAMP, width - 6, TOP_GUTTER / 2);
}
