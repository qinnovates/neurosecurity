import { describe, expect, it } from 'vitest';
import atlas from '@shared/qif-brain-bci-atlas.json';
import { HOURGLASS_BANDS, QIF_LAYERS, QIF_LAYER_SEAM, layerOf, type BandId } from '../qif-constants';

const bandIds = HOURGLASS_BANDS.map((band) => band.id);

describe('band names', () => {
  it('reads the same in the atlas and the site constants, as Derivation Log Entry 88 decided for S1-S3', () => {
    expect(atlas.qif_bands.map((band) => [band.id, band.name])).toEqual(HOURGLASS_BANDS.map((band) => [band.id, band.name]));
  });

  it('keeps the superseded S-band names so a search for one still finds its band', () => {
    expect(atlas.qif_bands.filter((band) => band.legacy_name !== undefined).map((band) => [band.id, band.legacy_name])).toEqual([
      ['S1', 'Analog Front-End'], ['S2', 'Digital Processing'], ['S3', 'Application'],
    ]);
  });
});

describe('public layers over the QIF bands', () => {
  it('has eight layers: seven neural and one classical stack', () => {
    expect(QIF_LAYERS).toHaveLength(8);
    expect(QIF_LAYERS.filter((layer) => layer.zone === 'neural')).toHaveLength(7);
    expect(QIF_LAYERS.filter((layer) => layer.zone === 'silicon')).toHaveLength(1);
  });

  it('partitions the eleven band ids exactly, with I0 on the seam and in no layer', () => {
    const covered = [...QIF_LAYERS.flatMap((layer) => layer.band_ids), ...QIF_LAYER_SEAM.band_ids];
    expect([...covered].sort()).toEqual([...bandIds].sort());
    expect(new Set(covered).size).toBe(covered.length);
    expect(QIF_LAYER_SEAM.band_ids).toEqual(['I0']);
    expect(QIF_LAYERS.some((layer) => layer.band_ids.includes('I0'))).toBe(false);
  });

  it('keeps the classical stack to the device stages, never the interface', () => {
    const classical = QIF_LAYERS.find((layer) => layer.id === 'classical');
    expect(classical?.band_ids).toEqual(['S1', 'S2', 'S3']);
  });

  it('orders the public layers 1..8 without gaps', () => {
    expect(QIF_LAYERS.map((layer) => layer.public_order).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('keeps every layer and the seam marked proposed', () => {
    for (const layer of [...QIF_LAYERS, QIF_LAYER_SEAM]) expect(layer.status).toBe('proposed');
  });

  it('resolves every band id and refuses an unknown one', () => {
    for (const id of bandIds) expect(layerOf(id).band_ids).toContain(id);
    expect(layerOf('N5').id).toBe('basal-ganglia');
    expect(layerOf('S2').id).toBe('classical');
    expect(layerOf('I0').id).toBe('interface');
    expect(() => layerOf('N9' as BandId)).toThrow(/no layer/);
  });

  it('names the layers after the bands they hold under membership version 1', () => {
    for (const layer of QIF_LAYERS.filter((entry) => entry.zone === 'neural')) {
      const band = HOURGLASS_BANDS.find((entry) => entry.id === layer.band_ids[0]);
      expect(layer.name).toBe(band?.name);
    }
  });
});
