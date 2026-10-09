/**
 * What a sample is called on screen: figures computed from its own signal when it loads.
 * Nothing here comes from a file name or a description written by a person.
 */

import { ANALYSIS_WINDOW_SAMPLES } from './analysis-window';
import { FREQUENCY_BANDS, bandMeanSquares, type FrequencyBand } from './band-power';
import type { SignalSample } from './sample-csv';

export interface SampleProperties {
  channelCount: number;
  sampleRateHz: number;
  durationSeconds: number;
  /** The band holding the most power over the whole sample and every channel; null when the sample is flat or shorter than one window. */
  dominantBand: FrequencyBand | null;
  /** The largest absolute amplitude on any channel, in microvolts. */
  peakMicrovolts: number;
}

function findPeak(channels: readonly Float32Array[]): number {
  let peak = 0;
  for (const channel of channels) {
    for (let index = 0; index < channel.length; index += 1) peak = Math.max(peak, Math.abs(channel[index]));
  }
  return peak;
}

/** Band power summed over consecutive, non-overlapping analysis windows and over every channel. */
function findDominantBand(sample: SignalSample): FrequencyBand | null {
  const totals = FREQUENCY_BANDS.map(() => 0);
  for (const channel of sample.channels) {
    for (let start = 0; start + ANALYSIS_WINDOW_SAMPLES <= channel.length; start += ANALYSIS_WINDOW_SAMPLES) {
      const meanSquares = bandMeanSquares(channel.subarray(start, start + ANALYSIS_WINDOW_SAMPLES), sample.sampleRateHz);
      meanSquares.forEach((meanSquare, band) => { totals[band] += meanSquare; });
    }
  }
  const largest = Math.max(...totals);
  return largest > 0 ? FREQUENCY_BANDS[totals.indexOf(largest)] : null;
}

export function describeSample(sample: SignalSample): SampleProperties {
  return {
    channelCount: sample.channelNames.length,
    sampleRateHz: sample.sampleRateHz,
    durationSeconds: sample.durationSeconds,
    dominantBand: findDominantBand(sample),
    peakMicrovolts: findPeak(sample.channels),
  };
}
