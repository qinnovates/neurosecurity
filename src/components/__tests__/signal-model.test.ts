import { describe, it, expect } from 'vitest';
import {
  EVENT_DURATION_SECONDS,
  EVENT_LEAD_SECONDS,
  EVENT_PERIOD_SECONDS,
  REPLAY_SOURCE_OFFSET_SECONDS,
  getEventEnvelope,
  getEventIndexAt,
  getEventWindow,
  getStartedEventIndexAt,
  isChannelAffected,
  sampleBaseline,
  sampleChannel,
  type SignalEventKind,
  type SignalEventWindow,
} from '../signal-bench/signal-model';

const ALL_KINDS: readonly SignalEventKind[] = ['inject', 'intercept', 'jam', 'replay', 'spoof'];
const CHANNEL_COUNT = 6;

function buildEvent(kind: SignalEventKind, channel = 2): SignalEventWindow {
  return { index: 0, slot: 0, kind, channel, startTime: 10, endTime: 10 + EVENT_DURATION_SECONDS };
}

function getMidpoint(event: SignalEventWindow): number {
  return (event.startTime + event.endTime) / 2;
}

describe('sampleBaseline', () => {
  it('is deterministic', () => {
    expect(sampleBaseline(3, 12.345)).toBe(sampleBaseline(3, 12.345));
  });

  it('stays within a drawable range', () => {
    for (let step = 0; step < 2000; step++) {
      expect(Math.abs(sampleBaseline(step % CHANNEL_COUNT, step * 0.037))).toBeLessThan(1);
    }
  });

  it('differs between channels', () => {
    expect(sampleBaseline(0, 4.2)).not.toBe(sampleBaseline(1, 4.2));
  });
});

describe('getEventWindow', () => {
  it('cycles through the kinds in order', () => {
    const kinds = ALL_KINDS.map((_, index) => getEventWindow(index, ALL_KINDS, CHANNEL_COUNT).kind);
    expect(kinds).toEqual(ALL_KINDS);
    expect(getEventWindow(ALL_KINDS.length, ALL_KINDS, CHANNEL_COUNT).kind).toBe(ALL_KINDS[0]);
  });

  it('keeps the channel in range for negative and large indices', () => {
    for (let index = -50; index < 500; index++) {
      const { channel } = getEventWindow(index, ALL_KINDS, CHANNEL_COUNT);
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThan(CHANNEL_COUNT);
    }
  });

  it('fits each event inside its own period', () => {
    const event = getEventWindow(4, ALL_KINDS, CHANNEL_COUNT);
    expect(getEventIndexAt(event.startTime)).toBe(4);
    expect(getEventIndexAt(event.endTime)).toBe(4);
    expect(event.endTime - event.startTime).toBeCloseTo(EVENT_DURATION_SECONDS);
    expect(event.endTime).toBeLessThan(5 * EVENT_PERIOD_SECONDS);
  });

  it('reports the schedule slot, including for negative indices', () => {
    expect(getEventWindow(7, ALL_KINDS, CHANNEL_COUNT).slot).toBe(2);
    expect(getEventWindow(-1, ALL_KINDS, CHANNEL_COUNT).slot).toBe(ALL_KINDS.length - 1);
  });

  it('only counts an event as started once its window opens', () => {
    const event = getEventWindow(3, ALL_KINDS, CHANNEL_COUNT);
    expect(getStartedEventIndexAt(event.startTime - 0.01)).toBe(2);
    expect(getStartedEventIndexAt(event.startTime + 0.01)).toBe(3);
    expect(event.startTime - 3 * EVENT_PERIOD_SECONDS).toBeCloseTo(EVENT_LEAD_SECONDS);
  });

  it('rejects an empty schedule', () => {
    expect(() => getEventWindow(0, [], CHANNEL_COUNT)).toThrow(RangeError);
    expect(() => getEventWindow(0, ALL_KINDS, 0)).toThrow(RangeError);
  });
});

describe('getEventEnvelope', () => {
  it('is zero outside the window and one in the middle', () => {
    const event = buildEvent('inject');
    expect(getEventEnvelope(event.startTime - 0.01, event)).toBe(0);
    expect(getEventEnvelope(event.endTime + 0.01, event)).toBe(0);
    expect(getEventEnvelope(getMidpoint(event), event)).toBe(1);
  });
});

describe('sampleChannel', () => {
  it.each(ALL_KINDS)('leaves the signal untouched outside a %s window', (kind) => {
    const event = buildEvent(kind);
    const sample = sampleChannel(event.channel, event.startTime - 1, event);
    expect(sample).toEqual({ value: sampleBaseline(event.channel, event.startTime - 1), isAdversarial: false });
  });

  it('never alters the signal for passive interception', () => {
    const event = buildEvent('intercept');
    const time = getMidpoint(event);
    expect(sampleChannel(event.channel, time, event)).toEqual({ value: sampleBaseline(event.channel, time), isAdversarial: false });
  });

  it('replays an exact copy of the earlier segment', () => {
    const event = buildEvent('replay');
    const time = getMidpoint(event);
    const sample = sampleChannel(event.channel, time, event);
    expect(sample.isAdversarial).toBe(true);
    expect(sample.value).toBeCloseTo(sampleBaseline(event.channel, time - REPLAY_SOURCE_OFFSET_SECONDS), 10);
  });

  it.each(['inject', 'jam', 'spoof'] as const)('marks %s samples as adversarial and changes them', (kind) => {
    const event = buildEvent(kind);
    const time = getMidpoint(event) + 0.013;
    const sample = sampleChannel(event.channel, time, event);
    expect(sample.isAdversarial).toBe(true);
    expect(sample.value).not.toBe(sampleBaseline(event.channel, time));
  });

  it('confines single-channel events to their channel', () => {
    const event = buildEvent('inject', 2);
    const time = getMidpoint(event);
    expect(sampleChannel(3, time, event).isAdversarial).toBe(false);
    expect(isChannelAffected(event, 3)).toBe(false);
  });

  it('spreads jamming to adjacent channels only', () => {
    const event = buildEvent('jam', 2);
    expect([0, 1, 2, 3, 4].map((channel) => isChannelAffected(event, channel))).toEqual([false, true, true, true, false]);
  });
});
