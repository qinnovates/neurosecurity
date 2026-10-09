import { describe, it, expect } from 'vitest';
import { EVENT_MERGE_SECONDS, findChannelSpans, findThresholdEvents, mergeSamplesFor } from '@/lib/signal/threshold-events';
import { formatSeconds } from '../monitor-format';
import { describeThresholdRule } from '../SampleMonitor';
import { listChannelsCrossingOnPage, rowAt, BOTTOM_GUTTER, TOP_GUTTER } from '../signal-plot-draw';

const THRESHOLD = 75;
const BEYOND = THRESHOLD + 1;
const SAMPLE_RATES_HZ = [100, 250, 256, 500];

/** One channel, flat at zero, beyond the threshold at the given sample indexes. */
function channelWithCrossingsAt(indexes: readonly number[], length: number): Float32Array {
  const channel = new Float32Array(length);
  for (const index of indexes) channel[index] = BEYOND;
  return channel;
}

/** The numbers the sentence states, read back out of it. */
function readRule(sentence: string): { threshold: number; mergeSamples: number } {
  const threshold = /any channel beyond (\d+) µV/.exec(sentence);
  const merge = /no more than (\d+) samples? apart/.exec(sentence);
  if (threshold === null || merge === null) throw new Error(`the rule sentence states no threshold or merge distance: ${sentence}`);
  return { threshold: Number(threshold[1]), mergeSamples: Number(merge[1]) };
}

describe.each(SAMPLE_RATES_HZ)('the Monitor rule sentence against findThresholdEvents at %i Hz', (sampleRateHz) => {
  const stated = readRule(describeThresholdRule(THRESHOLD, sampleRateHz));
  const length = stated.mergeSamples * 4;

  it('states the merge distance the constant gives at this sample rate', () => {
    expect(stated.threshold).toBe(THRESHOLD);
    expect(stated.mergeSamples).toBe(mergeSamplesFor(sampleRateHz));
    expect(stated.mergeSamples).toBe(Math.max(1, Math.round(EVENT_MERGE_SECONDS * sampleRateHz)));
    expect(describeThresholdRule(THRESHOLD, sampleRateHz)).toContain(`(${formatSeconds(stated.mergeSamples / sampleRateHz)} at ${sampleRateHz} Hz)`);
  });

  it('reports two crossings exactly the stated distance apart as one event and one bar', () => {
    const channel = channelWithCrossingsAt([1, 1 + stated.mergeSamples], length);
    const events = findThresholdEvents(['A'], [channel], sampleRateHz, stated.threshold);
    expect(events).toHaveLength(1);
    expect(findChannelSpans([channel], sampleRateHz, stated.threshold)).toHaveLength(1);
    // The one event's duration covers every sample between the two crossings, though only two are beyond the threshold.
    expect(Math.round((events[0].endTime - events[0].time) * sampleRateHz)).toBe(stated.mergeSamples + 1);
  });

  it('reports two crossings one sample further apart as two events and two bars', () => {
    const channel = channelWithCrossingsAt([1, 2 + stated.mergeSamples], length);
    expect(findThresholdEvents(['A'], [channel], sampleRateHz, stated.threshold)).toHaveLength(2);
    expect(findChannelSpans([channel], sampleRateHz, stated.threshold)).toHaveLength(2);
  });

  it('counts a value at the threshold as not beyond it, and either sign beyond it as a crossing', () => {
    const atThreshold = new Float32Array(length).fill(stated.threshold);
    expect(findThresholdEvents(['A'], [atThreshold], sampleRateHz, stated.threshold)).toEqual([]);
    const negative = new Float32Array(length);
    negative[3] = -BEYOND;
    expect(findThresholdEvents(['A'], [negative], sampleRateHz, stated.threshold)).toHaveLength(1);
  });
});

describe('durations', () => {
  it('prints a one-sample event to three places and never as 0.00 s', () => {
    expect(formatSeconds(1 / 250)).toBe('0.004 s');
    expect(formatSeconds(0.0099)).toBe('0.010 s');
    expect(formatSeconds(0.01)).toBe('0.01 s');
    expect(formatSeconds(2.048)).toBe('2.05 s');
  });
});

describe('threshold lines on the plot', () => {
  const spans = [{ channelIndex: 0, from: 1, to: 1.5 }, { channelIndex: 2, from: 9, to: 9.2 }];

  it('are drawn only for channels beyond the threshold on the page shown', () => {
    expect([...listChannelsCrossingOnPage({ spans, pageStart: 0, pageSeconds: 8 })]).toEqual([0]);
    expect([...listChannelsCrossingOnPage({ spans, pageStart: 8, pageSeconds: 8 })]).toEqual([2]);
    expect([...listChannelsCrossingOnPage({ spans: [], pageStart: 0, pageSeconds: 8 })]).toEqual([]);
  });

  it('finds the row under the pointer, and none in the gutters', () => {
    const height = TOP_GUTTER + BOTTOM_GUTTER + 160;
    expect(rowAt(TOP_GUTTER + 5, height, 16)).toBe(0);
    expect(rowAt(TOP_GUTTER + 155, height, 16)).toBe(15);
    expect(rowAt(TOP_GUTTER - 1, height, 16)).toBeNull();
    expect(rowAt(height - 1, height, 16)).toBeNull();
  });
});
