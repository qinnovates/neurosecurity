import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { FREQUENCY_BANDS, bandShares, largestPowerOfTwoAtMost, powerSpectrum } from '../band-power';
import { SampleFormatError, parseSampleCsv } from '../sample-csv';
import { findThresholdEvents } from '../threshold-events';

const SAMPLE_DIRECTORY = 'src/site/brain-siem/data';

function tone(frequencyHz: number, sampleRateHz: number, length: number, amplitude = 10): Float32Array {
  return Float32Array.from({ length }, (_, index) => amplitude * Math.sin((2 * Math.PI * frequencyHz * index) / sampleRateHz));
}

describe('parseSampleCsv', () => {
  it('reads every sample the manifest lists', () => {
    const manifest = JSON.parse(fs.readFileSync(path.resolve(SAMPLE_DIRECTORY, 'manifest.json'), 'utf-8')) as { datasets: { file: string }[] };
    expect(manifest.datasets.length).toBeGreaterThan(0);
    for (const { file } of manifest.datasets) {
      const sample = parseSampleCsv(fs.readFileSync(path.resolve(SAMPLE_DIRECTORY, file), 'utf-8'));
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
    const alpha = bandShares(tone(10, 250, 512), 250);
    const beta = bandShares(tone(20, 250, 512), 250);
    expect(alpha[names.indexOf('alpha')]).toBeGreaterThan(0.95);
    expect(beta[names.indexOf('beta')]).toBeGreaterThan(0.95);
    expect(alpha.reduce((sum, share) => sum + share, 0)).toBeCloseTo(1, 6);
  });

  it('peaks at the bin of the tone', () => {
    const power = powerSpectrum(tone(32, 256, 256));
    expect(power.indexOf(Math.max(...power))).toBe(32);
  });

  it('gives all zeros for a flat signal and refuses a length that is not a power of two', () => {
    expect(bandShares(new Float32Array(256), 250)).toEqual([0, 0, 0, 0, 0]);
    expect(() => powerSpectrum(new Float32Array(300))).toThrow(RangeError);
    expect(largestPowerOfTwoAtMost(500)).toBe(256);
    expect(largestPowerOfTwoAtMost(0)).toBe(0);
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
    expect(events[1]).toMatchObject({ channelNames: ['A'], peakMicrovolts: 90 });
  });

  it('fires fewer events at a higher threshold', () => {
    expect(findThresholdEvents(['A', 'B'], [spiky, other], 250, 125)).toHaveLength(1);
  });
});
