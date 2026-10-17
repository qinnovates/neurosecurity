/**
 * A short fingerprint of a text, used only to tell whether the device has changed since it
 * was last written to a file. It is change detection, not security: nothing trusts it.
 */

const SEED_HIGH = 0xdeadbeef;
const SEED_LOW = 0x41c6ce57;
const MIX_HIGH = 2654435761;
const MIX_LOW = 1597334677;
const FINAL_MIX_A = 2246822507;
const FINAL_MIX_B = 3266489909;
const HEX_RADIX = 16;
const HALF_WIDTH = 8;

/** A 64-bit non-cryptographic hash (cyrb53's two 32-bit halves), as 16 hex characters. */
export function fingerprintText(text: string): string {
  let high = SEED_HIGH;
  let low = SEED_LOW;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    high = Math.imul(high ^ code, MIX_HIGH);
    low = Math.imul(low ^ code, MIX_LOW);
  }
  high = Math.imul(high ^ (high >>> 16), FINAL_MIX_A) ^ Math.imul(low ^ (low >>> 13), FINAL_MIX_B);
  low = Math.imul(low ^ (low >>> 16), FINAL_MIX_A) ^ Math.imul(high ^ (high >>> 13), FINAL_MIX_B);
  const toHex = (half: number): string => (half >>> 0).toString(HEX_RADIX).padStart(HALF_WIDTH, '0');
  return `${toHex(high)}${toHex(low)}`;
}
