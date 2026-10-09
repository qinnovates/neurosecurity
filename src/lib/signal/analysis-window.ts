/**
 * What the Monitor computes about the stretch of signal that ends at the playhead. The
 * stretch is a fixed number of samples, so its length in seconds is the constant divided by
 * the sample rate and is stated that way on screen.
 */

import { FREQUENCY_BANDS, bandMeanSquares } from './band-power';
import type { SignalSample } from './sample-csv';

/** A power of two, as the transform needs. */
export const ANALYSIS_WINDOW_SAMPLES = 512;

export function analysisWindowSeconds(sampleRateHz: number): number {
  return ANALYSIS_WINDOW_SAMPLES / sampleRateHz;
}

export interface WindowAnalysis {
  /** RMS amplitude per channel and band, in microvolts; bands in the order of FREQUENCY_BANDS. */
  amplitudesByChannel: number[][];
  /** Each band's share of its own channel's band power, from 0 to 1. */
  sharesByChannel: number[][];
  /** Each band's share of the band power of all channels together; sums to 1, or all zero for a flat signal. */
  composition: number[];
  /** RMS amplitude of every channel over the window, in microvolts. */
  rmsMicrovolts: number;
}

function toShares(values: readonly number[]): number[] {
  const sum = values.reduce((accumulated, value) => accumulated + value, 0);
  return values.map((value) => (sum === 0 ? 0 : value / sum));
}

function rootMeanSquare(windows: readonly Float32Array[]): number {
  let sumOfSquares = 0;
  let count = 0;
  for (const window of windows) {
    for (let index = 0; index < window.length; index += 1) sumOfSquares += window[index] ** 2;
    count += window.length;
  }
  return count === 0 ? 0 : Math.sqrt(sumOfSquares / count);
}

/** The analysis of the window that ends at `endSeconds`, or null until a whole window has passed. */
export function analyseWindow(sample: SignalSample, endSeconds: number): WindowAnalysis | null {
  const end = Math.min(sample.channels[0]?.length ?? 0, Math.floor(endSeconds * sample.sampleRateHz + 1e-6));
  if (end < ANALYSIS_WINDOW_SAMPLES) return null;
  const windows = sample.channels.map((channel) => channel.subarray(end - ANALYSIS_WINDOW_SAMPLES, end));
  const meanSquaresByChannel = windows.map((window) => bandMeanSquares(window, sample.sampleRateHz));
  const totalsByBand = FREQUENCY_BANDS.map((_, band) => meanSquaresByChannel.reduce((sum, meanSquares) => sum + meanSquares[band], 0));
  return {
    amplitudesByChannel: meanSquaresByChannel.map((meanSquares) => meanSquares.map(Math.sqrt)),
    sharesByChannel: meanSquaresByChannel.map(toShares),
    composition: toShares(totalsByBand),
    rmsMicrovolts: rootMeanSquare(windows),
  };
}
