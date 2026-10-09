import { describe, expect, it } from 'vitest';
import type { OwnerVia } from '../anatomy-index-types';
import type { ExtentMatch } from '../anatomy-types';
import { createStructureStyler, decideOwnershipMark, type OwnerInMode } from '../colour-modes';
import { buildIndex, buildIndexLink, buildOwner, buildStructure, buildSubject, buildTechnique } from './index-fixtures';

function inMode(lit: boolean, values: string[], via: OwnerVia = 'row', extentMatch: ExtentMatch | null = 'approximate'): OwnerInMode {
  return { via, extent_match: via === 'row' ? extentMatch : null, lit, values };
}

describe('decideOwnershipMark: the ownership table', () => {
  it('fills a structure with one owner that is not contained and has a value', () => {
    expect(decideOwnershipMark([inMode(true, ['N5'])])).toEqual({ mark: 'solid', step: 'N5', reason: 'single_owner' });
  });

  it('fills a structure whose non-contained owners agree and are all lit', () => {
    expect(decideOwnershipMark([inMode(true, ['N5']), inMode(true, ['N5'])])).toEqual({ mark: 'solid', step: 'N5', reason: 'owners_agree' });
  });

  it('marks "one of the records here" when a second owner exists and only one is lit', () => {
    expect(decideOwnershipMark([inMode(true, ['N5']), inMode(false, [])])).toEqual({ mark: 'inside_or_mixed', step: null, reason: 'partly_lit' });
  });

  it('marks "holds records that differ" when owners disagree on the value', () => {
    expect(decideOwnershipMark([inMode(true, ['N7']), inMode(true, ['N6'])])).toEqual({ mark: 'inside_or_mixed', step: null, reason: 'owners_differ' });
    expect(decideOwnershipMark([inMode(true, ['N7', 'N6'])])).toEqual({ mark: 'inside_or_mixed', step: null, reason: 'owners_differ' });
  });

  it('marks "somewhere inside this shape" when lit only through a contained owner or a declared child', () => {
    expect(decideOwnershipMark([inMode(true, ['N7'], 'row', 'contained')])).toEqual({ mark: 'inside_or_mixed', step: null, reason: 'inside_only' });
    expect(decideOwnershipMark([inMode(true, ['N4'], 'declared_child')])).toEqual({ mark: 'inside_or_mixed', step: null, reason: 'inside_only' });
  });

  it('never fills a structure that holds a contained owner, even when every owner is lit and agrees', () => {
    expect(decideOwnershipMark([inMode(true, ['N7']), inMode(true, ['N7'], 'row', 'contained')]))
      .toEqual({ mark: 'inside_or_mixed', step: null, reason: 'holds_contained_owner' });
  });

  it('marks no data when no owner is lit, and never reads that as the lowest step', () => {
    expect(decideOwnershipMark([inMode(false, []), inMode(false, [])])).toEqual({ mark: 'no_data', step: null, reason: 'no_lit_link' });
  });

  it('leaves a shape with no owner neutral', () => {
    expect(decideOwnershipMark([])).toEqual({ mark: 'context', step: null, reason: 'no_owner' });
  });
});

describe('decideOwnershipMark: property over every small owner set', () => {
  const VIAS: OwnerVia[] = ['row', 'declared_parent', 'declared_child'];
  const EXTENTS: ExtentMatch[] = ['same', 'atlas_covers_part', 'approximate', 'contained'];
  const LIGHTINGS: Array<[boolean, string[]]> = [[false, []], [true, ['A']], [true, ['B']], [true, ['A', 'B']]];
  const MAX_OWNERS = 3;

  function listOwnerChoices(): OwnerInMode[] {
    return VIAS.flatMap((via) => (via === 'row' ? EXTENTS : [null]).flatMap((extent) => LIGHTINGS.map(([lit, values]) => inMode(lit, values, via, extent))));
  }

  function listOwnerSets(size: number): OwnerInMode[][] {
    if (size === 0) return [[]];
    return listOwnerSets(size - 1).flatMap((owners) => listOwnerChoices().map((owner) => [...owners, owner]));
  }

  const ownerSets = Array.from({ length: MAX_OWNERS }, (_unused, index) => listOwnerSets(index + 1)).flat();

  it('enumerates a non-trivial number of owner sets', () => {
    expect(ownerSets.length).toBeGreaterThan(10000);
  });

  it('never gives one owner\'s solid colour to a structure whose owners disagree, are contained or are only partly lit', () => {
    const wronglyFilled = ownerSets.filter((owners) => {
      const litValues = new Set(owners.filter((owner) => owner.lit).flatMap((owner) => owner.values));
      const isPartlyLit = owners.some((owner) => owner.lit) && owners.some((owner) => !owner.lit);
      const holdsContained = owners.some((owner) => owner.extent_match === 'contained');
      return (litValues.size > 1 || isPartlyLit || holdsContained) && decideOwnershipMark(owners).mark === 'solid';
    });
    expect(wronglyFilled).toEqual([]);
  });

  it('fills only with a value that every owner holds, and only when some owner is lit directly', () => {
    const filled = ownerSets.map((owners) => ({ owners, style: decideOwnershipMark(owners) })).filter(({ style }) => style.mark === 'solid');
    expect(filled.length).toBeGreaterThan(0);
    expect(filled.filter(({ owners, style }) => !owners.every((owner) => owner.lit && owner.values.length === 1 && owner.values[0] === style.step))).toEqual([]);
    expect(filled.filter(({ owners }) => !owners.some((owner) => owner.via !== 'declared_child'))).toEqual([]);
  });

  it('never fills from multi-owner sets with a mark other than the three allowed ones', () => {
    const marks = new Set(ownerSets.map((owners) => decideOwnershipMark(owners).mark));
    expect([...marks].sort()).toEqual(['inside_or_mixed', 'no_data', 'solid']);
  });
});

describe('createStructureStyler', () => {
  const thalamus = buildStructure('1', [buildOwner('thalamus'), buildOwner('vim', 'declared_child')]);
  const sharedFold = buildStructure('2', [buildOwner('m1', 'row', 'contained'), buildOwner('pmc', 'row', 'contained')]);
  const mixedBands = buildStructure('3', [buildOwner('wernicke'), buildOwner('insula')]);
  const nucleus = buildStructure('4', [buildOwner('stn', 'row', 'same')]);
  const unknownBand = buildStructure('5', [buildOwner('periphery')]);
  const contextShape = buildStructure('6', []);
  const index = buildIndex({
    structures: [thalamus, sharedFold, mixedBands, nucleus, unknownBand, contextShape],
    subjects: [
      buildSubject('thalamus', ['N4']), buildSubject('vim', ['N4']), buildSubject('m1', ['N7']), buildSubject('pmc', ['N7']),
      buildSubject('wernicke', ['N7']), buildSubject('insula', ['N6']), buildSubject('stn', ['N5']), buildSubject('periphery', ['PER']),
    ],
    techniques: [
      buildTechnique('QIF-T9001', { niss_severity: 'medium', links: [buildIndexLink('stn', true), buildIndexLink('thalamus', false)] }),
      buildTechnique('QIF-T9002', { niss_severity: 'high', dsm_cluster: 'motor_neurocognitive', links: [buildIndexLink('stn', true), buildIndexLink('m1', true)] }),
      buildTechnique('QIF-T9003', { scope: 'band_level', band_ids: ['N6'] }),
      buildTechnique('QIF-T9004', { scope: 'not_drafted' }),
    ],
    devices: { fiducial_space: null, fiducials: [], leads: [], stated_targets: [{ device_id: 'fixture-device', region_ids: ['m1', 'stn'] }] },
  });
  const style = createStructureStyler(index);

  it('fills by band when every owner shares one band, and marks mixed when bands differ', () => {
    expect(style(thalamus, thalamus.owners, { kind: 'band' })).toMatchObject({ mark: 'solid', step: 'N4', step_known: true });
    expect(style(mixedBands, mixedBands.owners, { kind: 'band' })).toMatchObject({ mark: 'inside_or_mixed', words: 'holds records that differ' });
    expect(style(sharedFold, sharedFold.owners, { kind: 'band' })).toMatchObject({ mark: 'inside_or_mixed', words: 'somewhere inside this shape' });
  });

  it('accepts a band code it does not know and says so', () => {
    expect(style(unknownBand, unknownBand.owners, { kind: 'band' })).toMatchObject({ mark: 'solid', step: 'PER', step_known: false });
  });

  it('lights only regions a technique reaches through a lit link', () => {
    const mode = { kind: 'technique', techniqueId: 'QIF-T9001' } as const;
    expect(style(nucleus, nucleus.owners, mode)).toMatchObject({ mark: 'solid', step: 'QIF-T9001' });
    expect(style(thalamus, thalamus.owners, mode)).toMatchObject({ mark: 'no_data', words: 'no data' });
  });

  it('marks a fold "somewhere inside" when a technique lights a region contained in it, and "one of the records here" beside an unlit one', () => {
    const mode = { kind: 'technique', techniqueId: 'QIF-T9002' } as const;
    expect(style(sharedFold, sharedFold.owners, mode)).toMatchObject({ mark: 'inside_or_mixed', reason: 'partly_lit', words: 'one of the records here' });
  });

  it('lights nothing for a band-level technique and says which band it is tagged to', () => {
    const result = style(nucleus, nucleus.owners, { kind: 'technique', techniqueId: 'QIF-T9003' });
    expect(result).toEqual({ mark: 'no_data', step: null, step_known: true, reason: 'band_level_only', words: 'tagged to band N6 only; no region assessed' });
  });

  it('lights nothing for a technique with no drafted entry, or one the index does not hold', () => {
    expect(style(nucleus, nucleus.owners, { kind: 'technique', techniqueId: 'QIF-T9004' })).toMatchObject({ mark: 'no_data', reason: 'technique_not_drafted' });
    expect(style(nucleus, nucleus.owners, { kind: 'technique', techniqueId: 'QIF-T0000' })).toMatchObject({ mark: 'no_data', reason: 'technique_not_drafted' });
  });

  it('steps NISS severity by the highest linked technique and never reads no link as low', () => {
    expect(style(nucleus, nucleus.owners, { kind: 'niss' })).toMatchObject({ mark: 'solid', step: 'high', step_known: true });
    expect(style(mixedBands, mixedBands.owners, { kind: 'niss' })).toMatchObject({ mark: 'no_data', step: null });
  });

  it('lights a DSM cluster only through a lit link from a technique that carries it', () => {
    expect(style(nucleus, nucleus.owners, { kind: 'dsm', cluster: 'mood_trauma' })).toMatchObject({ mark: 'solid', step: 'mood_trauma' });
    expect(style(nucleus, nucleus.owners, { kind: 'dsm', cluster: 'persistent_personality' })).toMatchObject({ mark: 'no_data' });
  });

  it('shows a device\'s stated target regions under the owner rules like any other mode', () => {
    const mode = { kind: 'stated_targets', deviceId: 'fixture-device' } as const;
    expect(style(nucleus, nucleus.owners, mode)).toMatchObject({ mark: 'solid', step: 'stated_target' });
    expect(style(sharedFold, sharedFold.owners, mode)).toMatchObject({ mark: 'inside_or_mixed', reason: 'partly_lit' });
    expect(style(nucleus, nucleus.owners, { kind: 'stated_targets', deviceId: 'unknown-device' })).toMatchObject({ mark: 'no_data' });
  });

  it('never colours a context shape in any mode', () => {
    const modes = [{ kind: 'band' }, { kind: 'niss' }, { kind: 'technique', techniqueId: 'QIF-T9001' }, { kind: 'dsm', cluster: 'mood_trauma' }, { kind: 'stated_targets', deviceId: 'fixture-device' }] as const;
    expect(modes.map((mode) => style(contextShape, contextShape.owners, mode))).toEqual(
      modes.map(() => ({ mark: 'context', step: null, step_known: true, reason: 'no_owner', words: 'No QIF record maps here' })),
    );
  });

  it('gives every style its reason in words', () => {
    const structures = [thalamus, sharedFold, mixedBands, nucleus, unknownBand, contextShape];
    const allWords = structures.map((structure) => style(structure, structure.owners, { kind: 'band' }).words);
    expect(allWords.length).toBeGreaterThan(0);
    expect(allWords.filter((words) => words.trim() === '')).toEqual([]);
  });
});
