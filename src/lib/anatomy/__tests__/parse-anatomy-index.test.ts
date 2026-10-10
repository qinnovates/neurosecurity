import { describe, expect, it } from 'vitest';
import { AnatomyDataError } from '../errors';
import { parseAnatomyIndex } from '../parse-anatomy-index';
import { buildIndex, buildIndexLink, buildOwner, buildStructure, buildSubject, buildTechnique } from './index-fixtures';

const FULL_INDEX = buildIndex({
  structures: [buildStructure('7', [buildOwner('stn', 'row', 'same')])],
  subjects: [buildSubject('stn', ['N5'])],
  techniques: [buildTechnique('QIF-T9001', { links: [buildIndexLink('stn', true)] })],
});

function without(value: object, key: string): Record<string, unknown> {
  const { [key]: _omitted, ...rest } = value as Record<string, unknown>;
  return rest;
}

describe('parseAnatomyIndex', () => {
  it('accepts a complete index', () => {
    expect(parseAnatomyIndex(JSON.parse(JSON.stringify(FULL_INDEX))).structures).toHaveLength(1);
  });

  it.each(['status', 'evidence', 'layers', 'tracts', 'devices', 'structures', 'subjects', 'techniques', 'addressing_version', 'stale_evidence_keys'])(
    'rejects an index with no "%s"', (key) => {
      expect(() => parseAnatomyIndex(without(FULL_INDEX, key))).toThrow(new RegExp(`missing key "${key}"`));
    });

  it('rejects a softened status sentence and an unknown schema version', () => {
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, status: 'Reviewed.' })).toThrow(/status: the status sentence differs/);
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, schema_version: 2 })).toThrow(/schema_version/);
  });

  it('rejects an owner, a structure, a subject or a link that has lost its review state or check status', () => {
    const owner = buildOwner('stn', 'row', 'same');
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, structures: [buildStructure('7', [without(owner, 'review_state') as never])] }))
      .toThrow(/structures\[0\]\.owners\[0\]: missing key "review_state"/);
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, structures: [without(FULL_INDEX.structures[0], 'check_status')] }))
      .toThrow(/structures\[0\]: missing key "check_status"/);
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, subjects: [without(FULL_INDEX.subjects[0], 'review_state')] })).toThrow(/subjects\[0\]: missing key "review_state"/);
    const link = without(buildIndexLink('stn', true), 'check_status');
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, techniques: [buildTechnique('QIF-T9001', { links: [link as never] })] }))
      .toThrow(/techniques\[0\]\.links\[0\]: missing key "check_status"/);
  });

  it('rejects a review state whose mark is empty, or is not the mark its state must show', () => {
    const blank = { ...buildOwner('stn'), review_state: { state: 'ai_drafted_unreviewed', mark: '' } };
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, structures: [buildStructure('7', [blank as never])] })).toThrow(/review_state\.mark/);
    const overclaimed = { ...buildOwner('stn'), review_state: { state: 'ai_drafted_unreviewed', mark: 'Reviewed by neuroanatomist, 2026-10-09' } };
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, structures: [buildStructure('7', [overclaimed as never])] }))
      .toThrow(/review_state\.mark: the mark must read "AI-drafted, unreviewed"/);
    const noRole = { ...buildOwner('stn'), review_state: { state: 'reviewed', reviewed_on: '2026-10-09', mark: 'Reviewed' } };
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, structures: [buildStructure('7', [noRole as never])] })).toThrow(/review_state/);
  });

  it('rejects a layer with no availability or, when unavailable, no reason', () => {
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, layers: [without(FULL_INDEX.layers[0], 'available')] })).toThrow(/layers\[0\]: missing key "available"/);
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, layers: [{ ...FULL_INDEX.layers[0], reason: null }] }))
      .toThrow(/layers\[0\]\.reason: an unavailable layer must say why/);
  });

  it('rejects an index with no tract fields, no device fields, or a structure with no node list', () => {
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, tracts: without(FULL_INDEX.tracts, 'proximity_asset_id') })).toThrow(/tracts: missing key "proximity_asset_id"/);
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, devices: without(FULL_INDEX.devices, 'leads') })).toThrow(/devices: missing key "leads"/);
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, structures: [without(FULL_INDEX.structures[0], 'nodes')] })).toThrow(/structures\[0\]: missing key "nodes"/);
  });

  it('rejects an evidence pin with no length or a malformed digest', () => {
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, evidence: without(FULL_INDEX.evidence, 'bytes') })).toThrow(/evidence: missing key "bytes"/);
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, evidence: { ...FULL_INDEX.evidence, sha256: 'abc' } })).toThrow(/evidence\.sha256/);
  });

  it('rejects a link marked lit that its own fields say may not light a region', () => {
    const litLink = buildIndexLink('stn', true);
    const parseLink = (link: object): unknown => parseAnatomyIndex({ ...FULL_INDEX, techniques: [buildTechnique('QIF-T9001', { links: [link as never] })] });
    expect(() => parseLink(litLink)).not.toThrow();
    for (const override of [
      { resolution: 'whole_to_part' }, { resolution: 'part_to_whole' }, { resolution: 'unclassified' }, { band_agrees: false },
      { valid_for_current_addressing: false }, { quote_state: 'quote_missing' }, { resolved_region_id: null },
    ]) {
      expect(() => parseLink({ ...litLink, ...override })).toThrow(/links\[0\]\.lit: a link may be lit only when/);
    }
  });

  it('rejects an owner graded "none", a row owner with no grade and a containment owner that carries one', () => {
    const parseOwner = (owner: object): unknown => parseAnatomyIndex({ ...FULL_INDEX, structures: [buildStructure('7', [owner as never])] });
    expect(() => parseOwner({ ...buildOwner('stn'), extent_match: 'none' })).toThrow(/owners\[0\]\.extent_match: an owner graded "none" owns nothing/);
    expect(() => parseOwner({ ...buildOwner('stn'), extent_match: null })).toThrow(/owners\[0\]\.extent_match/);
    expect(() => parseOwner({ ...buildOwner('vim', 'row_subject_contains_owner'), extent_match: 'same' })).toThrow(/owners\[0\]\.extent_match/);
  });

  it('rejects an unreviewed owner or link that carries a check status other than unchecked', () => {
    const owner = { ...buildOwner('stn', 'row', 'same'), check_status: 'supports' };
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, structures: [buildStructure('7', [owner as never])] }))
      .toThrow(/owners\[0\]\.check_status: an entry no review covers can only read "unchecked"/);
    const link = { ...buildIndexLink('stn', true), check_status: 'partial' };
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, techniques: [buildTechnique('QIF-T9001', { links: [link as never] })] }))
      .toThrow(/links\[0\]\.check_status: an entry no review covers can only read "unchecked"/);
    const reviewed = { state: 'reviewed', reviewer_role: 'owner', reviewed_on: '2026-10-09', mark: 'Reviewed by owner, 2026-10-09' };
    const reviewedOwner = { ...owner, review_state: reviewed };
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, structures: [{ ...buildStructure('7', [reviewedOwner as never]), review_state: reviewed, check_status: 'supports' }] })).not.toThrow();
  });

  it('rejects a structure that reads reviewed over an unreviewed owner', () => {
    const reviewed = { state: 'reviewed', reviewer_role: 'owner', reviewed_on: '2026-10-09', mark: 'Reviewed by owner, 2026-10-09' };
    const structure = { ...buildStructure('7', [buildOwner('stn', 'row', 'same')]), review_state: reviewed };
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, structures: [structure] }))
      .toThrow(/structures\[0\]\.review_state: a structure cannot read reviewed while one of its owners is unreviewed/);
  });

  it('rejects a lit link whose region is not a region in the index', () => {
    const link = { ...buildIndexLink('claustrum', true) };
    expect(() => parseAnatomyIndex({ ...FULL_INDEX, techniques: [buildTechnique('QIF-T9001', { links: [link] })] }))
      .toThrow(/links\[0\]\.resolved_region_id: a lit link must resolve to a region in the index; "claustrum" is not one/);
  });

  it('throws the typed error', () => {
    expect(() => parseAnatomyIndex(null)).toThrow(AnatomyDataError);
  });
});
