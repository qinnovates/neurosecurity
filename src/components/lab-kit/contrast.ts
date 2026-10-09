/** WCAG 2 contrast between two CSS colours, with translucent colours laid over what is beneath them. */

export interface Rgba {
  red: number;
  green: number;
  blue: number;
  /** 0 is clear, 1 is opaque. */
  alpha: number;
}

/** Thresholds the kit's tokens are held to. */
export const TEXT_CONTRAST_MINIMUM = 4.5;
export const BOUNDARY_CONTRAST_MINIMUM = 3;

export class ColourParseError extends Error {
  constructor(value: string) {
    super(`Cannot read "${value}" as a colour. Use #rgb, #rrggbb, rgb() or rgba().`);
    this.name = 'ColourParseError';
  }
}

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const FUNCTION_PATTERN = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)$/i;
const CHANNEL_MAXIMUM = 255;

function parseHex(digits: string): Rgba {
  const full = digits.length === 3 ? [...digits].map((digit) => digit + digit).join('') : digits;
  const channel = (start: number): number => Number.parseInt(full.slice(start, start + 2), 16);
  return { red: channel(0), green: channel(2), blue: channel(4), alpha: 1 };
}

export function parseColour(value: string): Rgba {
  const text = value.trim();
  const hex = HEX_PATTERN.exec(text);
  if (hex !== null) return parseHex(hex[1]);
  const call = FUNCTION_PATTERN.exec(text);
  if (call === null) throw new ColourParseError(value);
  return { red: Number(call[1]), green: Number(call[2]), blue: Number(call[3]), alpha: call[4] === undefined ? 1 : Number(call[4]) };
}

/** The opaque colour seen when `top` is laid over an opaque `bottom`. */
export function compositeOver(top: Rgba, bottom: Rgba): Rgba {
  const mix = (above: number, below: number): number => above * top.alpha + below * (1 - top.alpha);
  return { red: mix(top.red, bottom.red), green: mix(top.green, bottom.green), blue: mix(top.blue, bottom.blue), alpha: 1 };
}

function linearChannel(channel: number): number {
  const share = channel / CHANNEL_MAXIMUM;
  return share <= 0.04045 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(colour: Rgba): number {
  return 0.2126 * linearChannel(colour.red) + 0.7152 * linearChannel(colour.green) + 0.0722 * linearChannel(colour.blue);
}

/** Contrast of `foreground` drawn on an opaque `background`. A translucent foreground is laid over it first. */
export function contrastRatio(foreground: Rgba, background: Rgba): number {
  const drawn = relativeLuminance(compositeOver(foreground, background));
  const ground = relativeLuminance(background);
  return (Math.max(drawn, ground) + 0.05) / (Math.min(drawn, ground) + 0.05);
}
