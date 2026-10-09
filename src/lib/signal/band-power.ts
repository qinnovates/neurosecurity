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

/** The sum of the squared Hann window, which scales windowed power back to the signal's own units. */
function hannEnergy(size: number): number {
  let energy = 0;
  for (let index = 0; index < size; index += 1) energy += (0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (size - 1))) ** 2;
  return energy;
}

/** Windowed power summed over each band's bins. */
function bandPowerTotals(signal: Float32Array, sampleRateHz: number, bands: readonly FrequencyBand[]): number[] {
  const power = powerSpectrum(signal);
  const hertzPerBin = sampleRateHz / signal.length;
  return bands.map((band) => {
    let total = 0;
    for (let bin = Math.ceil(band.fromHz / hertzPerBin); bin < power.length && bin * hertzPerBin < band.toHz; bin += 1) total += power[bin];
    return total;
  });
}

/**
 * The mean square of the signal that falls in each band, in the square of the signal's unit.
 * By Parseval's relation the windowed power of the one-sided bins, doubled and divided by the
 * length and the window's energy, estimates it. Its square root is the band's RMS amplitude.
 */
export function bandMeanSquares(signal: Float32Array, sampleRateHz: number, bands: readonly FrequencyBand[] = FREQUENCY_BANDS): number[] {
  const scale = 2 / (signal.length * hannEnergy(signal.length));
  return bandPowerTotals(signal, sampleRateHz, bands).map((total) => total * scale);
}
