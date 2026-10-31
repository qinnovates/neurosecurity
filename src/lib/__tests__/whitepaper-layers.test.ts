import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOURGLASS_BANDS, QIF_LAYERS, QIF_MODEL_COUNTS, countTechniquesByBand } from '../qif-constants';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const LIVE_SOURCES = ['src/pages/research/whitepaper/index.astro', 'src/components/whitepaper/HourglassChart.astro'];
const TYPED_COUNTS = /\b11[- ]bands?\b|\b11 architectural\b|\b7-1-3\b|\b7 neural\b|\b3 synthetic\b/i;

describe('live whitepaper layer data', () => {
  it.each(LIVE_SOURCES)('%s types no band count by hand', (path) => {
    expect(read(path)).not.toMatch(TYPED_COUNTS);
  });

  it('renders the layers from the data, labelled proposed', () => {
    const page = read(LIVE_SOURCES[0]);
    expect(page).toContain('QIF_LAYERS.map');
    expect(page).toMatch(/\(proposed\)/);
    expect(QIF_LAYERS.every((layer) => layer.status === 'proposed')).toBe(true);
  });

  it('derives counts that agree with the bands', () => {
    const { neuralBands, interfaceBands, syntheticBands, bands } = QIF_MODEL_COUNTS;
    expect(neuralBands + interfaceBands + syntheticBands).toBe(bands);
    expect(bands).toBe(HOURGLASS_BANDS.length);
  });

  it('counts techniques for every band', () => {
    const counts = countTechniquesByBand();
    expect(Object.keys(counts)).toHaveLength(HOURGLASS_BANDS.length);
    expect(Object.values(counts).some((count) => count > 0)).toBe(true);
  });
});
