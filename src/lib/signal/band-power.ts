/**
 * How a stretch of signal divides between the classical EEG frequency bands. A small
 * radix-2 FFT, written here so the Lab loads no library for it.
 */

export interface FrequencyBand {
  id: string;
  label: string;
  fromHz: number;
  toHz: number;
}

/** The conventional bands. Edges vary a little between sources; these are the common ones. */
export const FREQUENCY_BANDS: readonly FrequencyBand[] = [
  { id: 'delta', label: 'Delta', fromHz: 0.5, toHz: 4 },
  { id: 'theta', label: 'Theta', fromHz: 4, toHz: 8 },
  { id: 'alpha', label: 'Alpha', fromHz: 8, toHz: 13 },
  { id: 'beta', label: 'Beta', fromHz: 13, toHz: 30 },
  { id: 'gamma', label: 'Gamma', fromHz: 30, toHz: 45 },
];

/** The largest power of two that fits in `length`; 0 when nothing fits. */
export function largestPowerOfTwoAtMost(length: number): number {
  return length < 1 ? 0 : 2 ** Math.floor(Math.log2(length));
}

/**
 * Power at each frequency bin of a real signal whose length is a power of two.
 * Bin `k` is the frequency `k * sampleRate / length`. Only the first half is returned.
 * @throws RangeError when the length is not a power of two
 */
export function powerSpectrum(signal: Float32Array): Float64Array {
  const size = signal.length;
  if (size === 0 || (size & (size - 1)) !== 0) throw new RangeError(`powerSpectrum needs a length that is a power of two; got ${size}.`);
  const real = new Float64Array(size);
  const imaginary = new Float64Array(size);
  // A Hann window, so a tone that falls between bins does not smear across the whole spectrum.
  for (let index = 0; index < size; index += 1) real[index] = signal[index] * (0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (size - 1)));

  for (let index = 1, reversed = 0; index < size; index += 1) {
    let bit = size >> 1;
    for (; (reversed & bit) !== 0; bit >>= 1) reversed ^= bit;
    reversed ^= bit;
    if (index < reversed) [real[index], real[reversed]] = [real[reversed], real[index]];
  }
  for (let span = 2; span <= size; span <<= 1) {
    const angle = (-2 * Math.PI) / span;
    for (let start = 0; start < size; start += span) {
      for (let offset = 0; offset < span / 2; offset += 1) {
        const cosine = Math.cos(angle * offset);
        const sine = Math.sin(angle * offset);
        const evenIndex = start + offset;
        const oddIndex = evenIndex + span / 2;
        const oddReal = real[oddIndex] * cosine - imaginary[oddIndex] * sine;
        const oddImaginary = real[oddIndex] * sine + imaginary[oddIndex] * cosine;
        real[oddIndex] = real[evenIndex] - oddReal;
        imaginary[oddIndex] = imaginary[evenIndex] - oddImaginary;
        real[evenIndex] += oddReal;
        imaginary[evenIndex] += oddImaginary;
      }
    }
  }
  const power = new Float64Array(size / 2);
  for (let bin = 0; bin < size / 2; bin += 1) power[bin] = real[bin] ** 2 + imaginary[bin] ** 2;
  return power;
}

/**
 * The share of power in each band, as fractions that sum to 1 across the bands (or all
 * zero for a flat signal). Shares, not absolute power, so samples of different amplitude compare.
 */
export function bandShares(signal: Float32Array, sampleRateHz: number, bands: readonly FrequencyBand[] = FREQUENCY_BANDS): number[] {
  const power = powerSpectrum(signal);
  const hertzPerBin = sampleRateHz / signal.length;
  const totals = bands.map((band) => {
    let total = 0;
    for (let bin = Math.ceil(band.fromHz / hertzPerBin); bin < power.length && bin * hertzPerBin < band.toHz; bin += 1) total += power[bin];
    return total;
  });
  const sum = totals.reduce((accumulated, total) => accumulated + total, 0);
  return totals.map((total) => (sum === 0 ? 0 : total / sum));
}
