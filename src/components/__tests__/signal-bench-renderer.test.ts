import { describe, it, expect, vi } from 'vitest';
import { PIXELS_PER_SECOND, drawSignalBench, type SignalBenchFrame } from '../signal-bench/signal-bench-renderer';
import { EVENT_LEAD_SECONDS, REPLAY_SOURCE_OFFSET_SECONDS, type SignalEventKind } from '../signal-bench/signal-model';

const WIDTH = 1200;
const HEIGHT = 240;
const CHANNEL_COUNT = 6;
const PALETTE = { trace: 'trace', adversarial: 'adversarial', grid: 'grid', background: 'background' };

function createContext() {
  const alphaValues: number[] = [];
  const strokeStyles: string[] = [];
  const context = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    setLineDash: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 6, actualBoundingBoxAscent: 8 })),
    stroke: vi.fn(function stroke(this: { strokeStyle: string }) {
      strokeStyles.push(this.strokeStyle);
    }),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    lineJoin: 'miter',
    font: '',
    set globalAlpha(value: number) {
      alphaValues.push(value);
    },
  };
  return { context, alphaValues, strokeStyles };
}

function draw(kinds: readonly SignalEventKind[], time: number) {
  const recorder = createContext();
  const frame: SignalBenchFrame = {
    context: recorder.context as unknown as CanvasRenderingContext2D,
    width: WIDTH,
    height: HEIGHT,
    time,
    channelCount: CHANNEL_COUNT,
    eventKinds: kinds,
    eventLabels: kinds.map((kind) => `label-${kind}`),
    labelFont: '500 11px monospace',
    palette: PALETTE,
  };
  drawSignalBench(frame);
  return recorder;
}

function getLabelsDrawn(recorder: ReturnType<typeof createContext>): string[] {
  return recorder.context.fillText.mock.calls.map(([text]) => text as string);
}

describe('drawSignalBench', () => {
  it('clears the whole strip and draws one write head per channel', () => {
    const { context } = draw(['inject'], 5);
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, WIDTH, HEIGHT);
    expect(context.arc).toHaveBeenCalledTimes(CHANNEL_COUNT);
  });

  it('draws altered samples in the adversarial colour and the rest in the trace colour', () => {
    const { strokeStyles } = draw(['inject'], 5);
    expect(strokeStyles).toContain(PALETTE.adversarial);
    expect(strokeStyles).toContain(PALETTE.trace);
  });

  it('labels an event only once it has started', () => {
    const period = 7;
    const beforeStart = draw(['inject', 'jam'], period + EVENT_LEAD_SECONDS - 0.2);
    expect(getLabelsDrawn(beforeStart)).toEqual(['label-inject']);
    const afterStart = draw(['inject', 'jam'], period + EVENT_LEAD_SECONDS + 0.2);
    expect(getLabelsDrawn(afterStart)).toContain('label-jam');
  });

  it('keeps labels inside the strip while an event is still entering', () => {
    const { context } = draw(['inject'], EVENT_LEAD_SECONDS + 0.1);
    const lastCall = context.fillText.mock.calls.at(-1);
    expect(lastCall).toBeDefined();
    const [text, x] = lastCall as [string, number, number];
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x + text.length * 6).toBeLessThan(WIDTH);
  });

  it('draws a dashed ghost for interception and never recolours the tapped trace', () => {
    const { context, strokeStyles } = draw(['intercept'], 5);
    expect(context.setLineDash).toHaveBeenCalledWith([3, 3]);
    const solidAdversarialStrokes = strokeStyles.filter((style) => style === PALETTE.adversarial).length;
    expect(solidAdversarialStrokes).toBe(context.setLineDash.mock.calls.length);
  });

  it('brackets both the captured span and the replayed span', () => {
    const { alphaValues } = draw(['replay'], 5 + REPLAY_SOURCE_OFFSET_SECONDS);
    expect(alphaValues.length).toBeGreaterThan(0);
    expect(alphaValues.every((value) => value > 0 && value < 1)).toBe(true);
    expect(WIDTH / PIXELS_PER_SECOND).toBeGreaterThan(REPLAY_SOURCE_OFFSET_SECONDS);
  });
});
