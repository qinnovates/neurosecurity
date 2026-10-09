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

describe('bars and folded rows', () => {
  const rows = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }];
  const columns = [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }];
  const data = { cells: new Map([[cellKey('a', 'x'), 4], [cellKey('b', 'x'), 1], [cellKey('a', 'y'), 2]]), rowTotals: new Map([['a', 5], ['b', 1]]), columnTotals: new Map([['x', 5], ['y', 2]]), total: 6 };

  it('scales a bar to the largest cell of its own column, and gives a column with no cell no scale', async () => {
    const { largestCellByColumn } = await import('../catalog/count-matrix');
    expect([...largestCellByColumn(data, rows, columns)]).toEqual([['x', 4], ['y', 2]]);
    expect([...largestCellByColumn({ ...data, cells: new Map() }, rows, columns)]).toEqual([]);
  });

  it('separates the rows with a technique in view from those with none, in axis order', async () => {
    const { splitRowsByContent } = await import('../catalog/count-matrix');
    const { filled, empty } = splitRowsByContent(data, rows);
    expect(filled.map((row) => row.id)).toEqual(['a', 'b']);
    expect(empty.map((row) => row.id)).toEqual(['c']);
  });

  it('counts the folded rows in words', async () => {
    const { describeEmptyRows } = await import('../catalog/CountMatrix');
    expect(describeEmptyRows(3, 'families')).toBe('3 families with none in view');
  });
});
