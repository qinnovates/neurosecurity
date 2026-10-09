import fs from 'node:fs';
import { describe, it, expect } from 'vitest';
import { listServedSamples } from '@/pages/atlas/model/samples/_sample-files';
import { ANALYSIS_WINDOW_SAMPLES, analyseWindow, analysisWindowSeconds } from '../analysis-window';
import { FREQUENCY_BANDS, bandMeanSquares, powerSpectrum } from '../band-power';
import { SampleFormatError, parseSampleCsv, type SignalSample } from '../sample-csv';
import { describeSample } from '../sample-properties';
import { findChannelSpans, findThresholdEvents } from '../threshold-events';

function tone(frequencyHz: number, sampleRateHz: number, length: number, amplitude = 10): Float32Array {
  return Float32Array.from({ length }, (_, index) => amplitude * Math.sin((2 * Math.PI * frequencyHz * index) / sampleRateHz));
}

describe('parseSampleCsv', () => {
  it('reads every sample the site serves', () => {
    const served = listServedSamples();
    expect(served.length).toBeGreaterThan(0);
    for (const { sourcePath } of served) {
      const sample = parseSampleCsv(fs.readFileSync(sourcePath, 'utf-8'));
      expect(sample.channelNames.length).toBeGreaterThan(0);
      expect(sample.channels.every((channel) => channel.length === sample.channels[0].length)).toBe(true);
      expect(sample.sampleRateHz).toBeGreaterThan(1);
      expect(sample.durationSeconds).toBeCloseTo(sample.channels[0].length / sample.sampleRateHz, 6);
    }
  });

  it('works out the sample rate from the timestamps and reads markers', () => {
    const sample = parseSampleCsv('timestamp,package_num,A,B,marker\n0.000,0,1,2,0\n0.004,1,3,4,1\n0.008,2,5,6,0\n');
    expect(sample.channelNames).toEqual(['A', 'B']);
    expect(sample.sampleRateHz).toBeCloseTo(250, 6);
    expect(Array.from(sample.channels[1])).toEqual([2, 4, 6]);
    expect(sample.markers).toHaveLength(1);
    expect(sample.markers[0].time).toBeCloseTo(0.004, 6);
  });

  it('refuses a file it cannot trust', () => {
    expect(() => parseSampleCsv('time,A\n0,1\n1,2\n')).toThrow(SampleFormatError);
    expect(() => parseSampleCsv('timestamp,A,marker\n0,1,0\n0.1,oops,0\n')).toThrow(/channel A is not a number/);
    expect(() => parseSampleCsv('timestamp,A\n0,1\n')).toThrow(/fewer than two rows/);
    expect(() => parseSampleCsv('timestamp,A\n5,1\n5,2\n')).toThrow(/timestamps do not advance/);
  });
});

describe('band power', () => {
  it('puts a 10 Hz tone in the alpha band and a 20 Hz tone in beta', () => {
    const names = FREQUENCY_BANDS.map((band) => band.id);
    const shareOf = (meanSquares: number[], bandId: string): number => meanSquares[names.indexOf(bandId)] / meanSquares.reduce((sum, value) => sum + value, 0);
    expect(shareOf(bandMeanSquares(tone(10, 250, 512), 250), 'alpha')).toBeGreaterThan(0.95);
    expect(shareOf(bandMeanSquares(tone(20, 250, 512), 250), 'beta')).toBeGreaterThan(0.95);
  });

  it('peaks at the bin of the tone', () => {
    const power = powerSpectrum(tone(32, 256, 256));
    expect(power.indexOf(Math.max(...power))).toBe(32);
  });

  it('gives all zeros for a flat signal and refuses a length that is not a power of two', () => {
    expect(bandMeanSquares(new Float32Array(256), 250)).toEqual([0, 0, 0, 0, 0]);
    expect(() => powerSpectrum(new Float32Array(300))).toThrow(RangeError);
  });
});

describe('findThresholdEvents', () => {
  const quiet = new Float32Array(1000);
  const spiky = new Float32Array(1000);
  spiky[100] = 120; spiky[110] = -130; spiky[600] = 90;
  const other = new Float32Array(1000);
  other[105] = 200;

  it('finds nothing when no channel passes the threshold', () => {
    expect(findThresholdEvents(['A'], [quiet], 250, 75)).toEqual([]);
  });

  it('merges crossings that are close together and keeps separate ones apart', () => {
    const events = findThresholdEvents(['A', 'B'], [spiky, other], 250, 75);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ channelNames: ['A', 'B'], peakMicrovolts: 200 });
    expect(events[0].time).toBeCloseTo(0.4, 6);
    // The group runs from sample 100 to just after sample 110.
    expect(events[0].endTime).toBeCloseTo(111 / 250, 6);
    expect(events[1]).toMatchObject({ channelNames: ['A'], peakMicrovolts: 90 });
  });

  it('fires fewer events at a higher threshold', () => {
    expect(findThresholdEvents(['A', 'B'], [spiky, other], 250, 125)).toHaveLength(1);
  });
});

describe('findChannelSpans', () => {
  it('draws each channel from its own first crossing to its own last, not from the group start', () => {
    const early = new Float32Array(1000);
    early[100] = 120; early[110] = -130;
    const late = new Float32Array(1000);
    late[400] = 200; late[900] = 95;
    const spans = findChannelSpans([early, late], 250, 75);
    expect(spans).toHaveLength(3);
    expect(spans[0]).toMatchObject({ channelIndex: 0 });
    expect(spans[0].from).toBeCloseTo(100 / 250, 6);
    expect(spans[0].to).toBeCloseTo(111 / 250, 6);
    expect(spans[1].from).toBeCloseTo(400 / 250, 6);
    expect(spans[2].from).toBeCloseTo(900 / 250, 6);
    expect(findChannelSpans([new Float32Array(1000)], 250, 75)).toEqual([]);
  });
});

function sampleOf(channels: Float32Array[], sampleRateHz = 250): SignalSample {
  return { channelNames: channels.map((_, index) => `ch${index}`), channels, sampleRateHz, durationSeconds: channels[0].length / sampleRateHz, markers: [] };
}

describe('the analysis window', () => {
  it('is as long as its constant divided by the sample rate, and the constant suits the transform', () => {
    expect(analysisWindowSeconds(250)).toBe(ANALYSIS_WINDOW_SAMPLES / 250);
    expect(analysisWindowSeconds(500)).toBe(ANALYSIS_WINDOW_SAMPLES / 500);
    expect(Number.isInteger(Math.log2(ANALYSIS_WINDOW_SAMPLES))).toBe(true);
  });

  it('is not computed until a whole window has passed, and then uses exactly that many samples', () => {
    const sample = sampleOf([tone(10, 250, 2000)]);
    expect(analyseWindow(sample, analysisWindowSeconds(250) - 0.01)).toBeNull();
    expect(analyseWindow(sample, analysisWindowSeconds(250))).not.toBeNull();
  });

  it('gives a tone its RMS amplitude in its own band', () => {
    const [, , alpha] = bandMeanSquares(tone(10, 250, ANALYSIS_WINDOW_SAMPLES, 10), 250);
    expect(Math.sqrt(alpha)).toBeCloseTo(10 / Math.SQRT2, 0);
  });

  it('takes the composition from the power of all channels, so a quiet channel does not count as much as a loud one', () => {
    const loudAlpha = tone(10, 250, 2000, 100);
    const quietBeta = tone(20, 250, 2000, 1);
    const analysis = analyseWindow(sampleOf([loudAlpha, quietBeta]), 4);
    const names = FREQUENCY_BANDS.map((band) => band.id);
    expect(analysis).not.toBeNull();
    expect(analysis?.composition[names.indexOf('alpha')]).toBeGreaterThan(0.99);
    expect(analysis?.sharesByChannel[1][names.indexOf('beta')]).toBeGreaterThan(0.95);
    expect(analysis?.composition.reduce((sum, share) => sum + share, 0)).toBeCloseTo(1, 6);
    expect(analysis?.rmsMicrovolts).toBeCloseTo(Math.sqrt((100 ** 2 / 2 + 1 / 2) / 2), 0);
  });
});

describe('describeSample', () => {
  it('computes every property from the signal', () => {
    const signal = tone(20, 250, 2500, 40);
    signal[1200] = -87.6;
    const properties = describeSample(sampleOf([signal, new Float32Array(2500)]));
    expect(properties).toMatchObject({ channelCount: 2, sampleRateHz: 250, durationSeconds: 10 });
    expect(properties.dominantBand?.id).toBe('beta');
    expect(properties.peakMicrovolts).toBeCloseTo(87.6, 3);
  });

  it('names no dominant band for a flat sample or one shorter than a window', () => {
    expect(describeSample(sampleOf([new Float32Array(2000)])).dominantBand).toBeNull();
    expect(describeSample(sampleOf([tone(10, 250, ANALYSIS_WINDOW_SAMPLES - 1)])).dominantBand).toBeNull();
  });
});
