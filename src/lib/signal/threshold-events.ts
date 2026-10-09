/**
 * One simple, stated rule over a sample: a channel's amplitude goes beyond a threshold.
 * This is a demonstration of what a rule on a signal looks like. It detects nothing about
 * a device, and finding no crossings says only that this one rule did not fire.
 */

export interface ThresholdEvent {
  /** Seconds from the start of the sample, at the first crossing of the group. */
  time: number;
  /** Seconds from the start of the sample, just after the last crossing of the group. */
  endTime: number;
  /** Channels that crossed within the group, in channel order. */
  channelNames: string[];
  /** The largest absolute amplitude reached in the group, in microvolts. */
  peakMicrovolts: number;
}

/** One channel's own stretch beyond the threshold, from its first crossing to just after its last. */
export interface ChannelSpan {
  channelIndex: number;
  /** Seconds from the start of the sample. */
  from: number;
  to: number;
}

/** Crossings closer together than this are reported as one event, and drawn as one span. */
export const EVENT_MERGE_SECONDS = 0.25;

function mergeSamplesFor(sampleRateHz: number): number {
  return Math.max(1, Math.round(EVENT_MERGE_SECONDS * sampleRateHz));
}

export function findThresholdEvents(
  channelNames: readonly string[], channels: readonly Float32Array[], sampleRateHz: number, thresholdMicrovolts: number,
): ThresholdEvent[] {
  const length = channels[0]?.length ?? 0;
  const mergeSamples = mergeSamplesFor(sampleRateHz);
  const events: ThresholdEvent[] = [];
  let open: { start: number; last: number; channelIndexes: Set<number>; peak: number } | null = null;

  const close = (): void => {
    if (open === null) return;
    events.push({
      time: open.start / sampleRateHz,
      endTime: (open.last + 1) / sampleRateHz,
      channelNames: [...open.channelIndexes].sort((left, right) => left - right).map((index) => channelNames[index]),
      peakMicrovolts: open.peak,
    });
    open = null;
  };

  for (let sample = 0; sample < length; sample += 1) {
    for (let channel = 0; channel < channels.length; channel += 1) {
      const amplitude = Math.abs(channels[channel][sample]);
      if (amplitude <= thresholdMicrovolts) continue;
      if (open !== null && sample - open.last > mergeSamples) close();
      open ??= { start: sample, last: sample, channelIndexes: new Set<number>(), peak: 0 };
      open.last = sample;
      open.channelIndexes.add(channel);
      open.peak = Math.max(open.peak, amplitude);
    }
  }
  close();
  return events;
}

function findSpansOnChannel(channel: Float32Array, channelIndex: number, sampleRateHz: number, thresholdMicrovolts: number): ChannelSpan[] {
  const mergeSamples = mergeSamplesFor(sampleRateHz);
  const spans: ChannelSpan[] = [];
  let start = -1;
  let last = -1;
  const close = (): void => {
    if (start !== -1) spans.push({ channelIndex, from: start / sampleRateHz, to: (last + 1) / sampleRateHz });
    start = -1;
  };
  for (let sample = 0; sample < channel.length; sample += 1) {
    if (Math.abs(channel[sample]) <= thresholdMicrovolts) continue;
    if (start !== -1 && sample - last > mergeSamples) close();
    if (start === -1) start = sample;
    last = sample;
  }
  close();
  return spans;
}

/** Where the rule holds on each channel, by that channel's own crossings. In channel order, then in time. */
export function findChannelSpans(channels: readonly Float32Array[], sampleRateHz: number, thresholdMicrovolts: number): ChannelSpan[] {
  return channels.flatMap((channel, channelIndex) => findSpansOnChannel(channel, channelIndex, sampleRateHz, thresholdMicrovolts));
}
