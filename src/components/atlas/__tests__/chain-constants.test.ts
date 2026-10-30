import { describe, expect, it } from 'vitest';
import { DOMAIN_COLORS, EVIDENCE_LABELS, ON_FILL_INK } from '../chain-constants';

const AA_SMALL_TEXT = 4.5;

function luminance(hex: string): number {
  const channel = (at: number): number => {
    const value = Number.parseInt(hex.slice(at, at + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(first: string, second: string): number {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

describe('the chain\'s fills and the ink on them', () => {
  it('sets words on every domain and evidence fill in one ink that reads at AA for small text, in both themes', () => {
    const fills = [...Object.values(DOMAIN_COLORS), ...Object.values(EVIDENCE_LABELS)].map((style) => style.fill);
    expect(fills.length).toBeGreaterThan(0);
    for (const fill of fills) expect(contrast(ON_FILL_INK, fill), `ink on ${fill}`).toBeGreaterThanOrEqual(AA_SMALL_TEXT);
  });

  it('would not have read in the domain\'s own colour: that is why the ink is fixed', () => {
    const failing = Object.entries(DOMAIN_COLORS).filter(([, style]) => contrast(style.stroke, style.fill) < AA_SMALL_TEXT);
    expect(failing.length).toBeGreaterThan(0);
  });

  it('names every domain, so colour is never its only mark', () => {
    for (const [code, style] of Object.entries(DOMAIN_COLORS)) {
      expect(style.label.trim().length, code).toBeGreaterThan(0);
      expect(style.label, code).not.toBe(code);
    }
  });
});
