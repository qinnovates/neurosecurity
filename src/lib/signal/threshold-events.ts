/**
 * One simple, stated rule over a sample: a channel's amplitude goes beyond a threshold.
 * This is a demonstration of what a rule on a signal looks like. It detects nothing about
 * a device, and finding no crossings says only that this one rule did not fire.
 */

export interface ThresholdEvent {
  /** Seconds from the start of the sample, at the first crossing of the group. */
  time: number;
  /** Channels that crossed within the group, in channel order. */
  channelNames: string[];
  /** The largest absolute amplitude reached in the group, in microvolts. */
  peakMicrovolts: number;
}

/** Crossings closer together than this are reported as one event. */
export const EVENT_MERGE_SECONDS = 0.25;

export function findThresholdEvents(
  channelNames: readonly string[], channels: readonly Float32Array[], sampleRateHz: number, thresholdMicrovolts: number,
): ThresholdEvent[] {
  const length = channels[0]?.length ?? 0;
  const mergeSamples = Math.max(1, Math.round(EVENT_MERGE_SECONDS * sampleRateHz));
  const events: ThresholdEvent[] = [];
  let open: { start: number; last: number; channelIndexes: Set<number>; peak: number } | null = null;

  const close = (): void => {
    if (open === null) return;
    events.push({
      time: open.start / sampleRateHz,
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
