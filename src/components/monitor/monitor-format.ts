/** How the Monitor prints times and amplitudes. One place, so every panel rounds the same way. */

const SECONDS_DIGITS = 2;

/** Minutes, seconds and tenths. Rounds through whole tenths so 11.1 never prints as 11.0. */
export function formatTime(seconds: number): string {
  const tenths = Math.floor(seconds * 10 + 1e-6);
  const whole = Math.floor(tenths / 10);
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}.${tenths % 10}`;
}

/** A length of time in seconds, to two places: "2.05 s". */
export function formatSeconds(seconds: number): string {
  return `${seconds.toFixed(SECONDS_DIGITS)} s`;
}

export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

export function formatMicrovolts(microvolts: number): string {
  return `${Math.round(microvolts)} µV`;
}

export function formatHertz(hertz: number): string {
  return `${Math.round(hertz)} Hz`;
}
