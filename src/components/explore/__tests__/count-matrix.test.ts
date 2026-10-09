import { describe, it, expect } from 'vitest';
import type { CatalogTechnique } from '@/lib/threat-model/catalog-types';
import { BAND_AXIS, buildFamilyAxis } from '../catalog/catalog-axes';
import { cellKey, countMatrix } from '../catalog/count-matrix';
import { engineData } from './lab-harness';

const { techniques, tactics } = engineData;
const familyAxis = buildFamilyAxis(tactics);
const matrix = countMatrix(techniques, familyAxis, BAND_AXIS, (technique) => [technique.tactic], (technique) => technique.bandIds);
const bandIdsOnAxis = new Set(BAND_AXIS.map((band) => band.id));
const familyIdsOnAxis = new Set(familyAxis.map((family) => family.id));

function distinct(filter: (technique: CatalogTechnique) => boolean): number {
  return new Set(techniques.filter(filter).map((technique) => technique.id)).size;
}

describe('countMatrix on the real catalog', () => {
  it('counts each technique once in every cell it touches', () => {
    for (const family of familyAxis) {
      for (const band of BAND_AXIS) {
        const expected = distinct((technique) => technique.tactic === family.id && technique.bandIds.includes(band.id));
        expect(matrix.cells.get(cellKey(family.id, band.id)) ?? 0, `${family.id} ${band.id}`).toBe(expected);
      }
    }
  });

  it('gives totals of distinct techniques, so a row total is at most the sum of its cells', () => {
    for (const family of familyAxis) {
      const expected = distinct((technique) => technique.tactic === family.id && technique.bandIds.some((bandId) => bandIdsOnAxis.has(bandId)));
      const cellSum = BAND_AXIS.reduce((sum, band) => sum + (matrix.cells.get(cellKey(family.id, band.id)) ?? 0), 0);
      expect(matrix.rowTotals.get(family.id) ?? 0).toBe(expected);
      expect(matrix.rowTotals.get(family.id) ?? 0).toBeLessThanOrEqual(cellSum);
    }
    for (const band of BAND_AXIS) {
      expect(matrix.columnTotals.get(band.id) ?? 0).toBe(distinct((technique) => technique.bandIds.includes(band.id) && familyIdsOnAxis.has(technique.tactic)));
    }
    expect(matrix.total).toBe(distinct((technique) => familyIdsOnAxis.has(technique.tactic) && technique.bandIds.some((bandId) => bandIdsOnAxis.has(bandId))));
  });

  it('holds no entry for an empty cell, so a blank is never printed as a zero', () => {
    expect([...matrix.cells.values()].every((count) => count > 0)).toBe(true);
  });

  it('counts a technique listed twice under one value once, and ignores values the axis does not list', () => {
    const [sample] = techniques;
    const doubled = { ...sample, bandIds: ['N1', 'N1', 'ZZ'] };
    const counted = countMatrix([doubled], familyAxis, BAND_AXIS, (technique) => [technique.tactic], (technique) => technique.bandIds);
    expect(counted.cells.get(cellKey(sample.tactic, 'N1'))).toBe(1);
    expect(counted.columnTotals.has('ZZ')).toBe(false);
    expect(counted.total).toBe(1);
  });
});
