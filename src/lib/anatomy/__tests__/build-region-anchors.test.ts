// @vitest-environment node
import crosswalk from '@shared/qif-anatomy-crosswalk.json';
import { describe, expect, it } from 'vitest';
import type { ContainsRelation, CrosswalkRow } from '../anatomy-types';
import { buildAllRegionGeometrySets, buildRegionGeometrySet } from '../build-region-anchors';
import { buildRow } from './crosswalk-fixtures';

const rows = crosswalk.rows as unknown as CrosswalkRow[];
const contains = crosswalk.contains as unknown as ContainsRelation[];

describe('buildRegionGeometrySet (R1, asymmetric containment)', () => {
  it('folds a container\'s declared children\'s rows in, on top of its own', () => {
    const thalamus = buildRegionGeometrySet(rows, contains, 'thalamus');
    // 14 direct thalamus rows + vim's 1 + ant's 1 = 16 (G6 §0.1 "Owner attachment").
    expect(thalamus.structureKeys).toHaveLength(16);
    expect(thalamus.includesChildren.sort()).toEqual(['ant', 'vim']);
    expect(thalamus.structureKeys).toContain('allen_hra_3d_2020:10420');
    expect(thalamus.structureKeys).toContain('allen_hra_3d_2020:10392');
  });

  it('never flows a container\'s rows up onto a part it contains', () => {
    const vim = buildRegionGeometrySet(rows, contains, 'vim');
    const ant = buildRegionGeometrySet(rows, contains, 'ant');
    // The bug this file fixes: a "direct rows only" rule applied symmetrically
    // cuts vim/ant out of the thalamus; applied to the owner map's downward
    // propagation it instead paints the whole thalamus for a vim selection.
    // Correct: vim and ant own only their own single label each.
    expect(vim.structureKeys).toEqual(['allen_hra_3d_2020:10420']);
    expect(ant.structureKeys).toEqual(['allen_hra_3d_2020:10392']);
    expect(vim.includesChildren).toEqual([]);
    expect(ant.includesChildren).toEqual([]);
  });

  it('every region in the real crosswalk resolves to a non-empty geometry set or is a declared container only', () => {
    const sets = buildAllRegionGeometrySets(rows, contains);
    for (const [regionId, set] of sets) {
      expect(set.structureKeys.length, `region "${regionId}" has no geometry at all (not even via a declared child)`).toBeGreaterThan(0);
    }
  });
});

describe('buildRegionGeometrySet on fixtures', () => {
  it('a region with no declared children is just its own rows', () => {
    const geometrySet = buildRegionGeometrySet([buildRow({ subject_id: 'stn', atlas_ids: ['7'] })], [], 'stn');
    expect(geometrySet.structureKeys).toEqual(['fixture_atlas:7']);
  });

  it('two declared children fold in without duplicating a shared label', () => {
    const rowsFixture = [
      buildRow({ subject_id: 'parent', atlas_ids: ['1', '2'] }),
      buildRow({ subject_id: 'child_a', atlas_ids: ['3'] }),
      buildRow({ subject_id: 'child_b', atlas_ids: ['3', '4'] }),
    ];
    const containsFixture: ContainsRelation[] = [
      { parent: 'parent', child: 'child_a' },
      { parent: 'parent', child: 'child_b' },
    ];
    const geometrySet = buildRegionGeometrySet(rowsFixture, containsFixture, 'parent');
    expect(new Set(geometrySet.structureKeys)).toEqual(new Set(['fixture_atlas:1', 'fixture_atlas:2', 'fixture_atlas:3', 'fixture_atlas:4']));
    expect(geometrySet.structureKeys).toHaveLength(4);
  });

  it('a grandchild never folds in — contains is read one level, not transitively', () => {
    const rowsFixture = [
      buildRow({ subject_id: 'grandparent', atlas_ids: ['1'] }),
      buildRow({ subject_id: 'parent', atlas_ids: ['2'] }),
      buildRow({ subject_id: 'child', atlas_ids: ['3'] }),
    ];
    const containsFixture: ContainsRelation[] = [
      { parent: 'grandparent', child: 'parent' },
      { parent: 'parent', child: 'child' },
    ];
    const geometrySet = buildRegionGeometrySet(rowsFixture, containsFixture, 'grandparent');
    expect(geometrySet.structureKeys.sort()).toEqual(['fixture_atlas:1', 'fixture_atlas:2']);
  });
});
