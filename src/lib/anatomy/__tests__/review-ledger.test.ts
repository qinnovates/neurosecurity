import { describe, expect, it } from 'vitest';
import type { CrosswalkRow, TechniqueLink } from '../anatomy-types';
import { AnatomyDataError } from '../errors';
import { parseReviewLedger, type LedgerEntry } from '../parse-review-ledger';
import {
  REVIEWED_ENTRY_COUNTS, UNREVIEWED, assertLedgerRatchet, countEntriesByKind, describeReviewState, findReview, worstCheckStatus, worstReviewState,
} from '../review-state';
import { canonicalJson, crosswalkRowKey, digestCrosswalkRow, digestTechniqueLink, sha256Hex, techniqueLinkKey } from '../row-digest';
import { REVIEW_LEDGER_STATUS } from '../status-sentences';
import { FIXTURE_ATLAS_ID, FIXTURE_SHA256, OTHER_SHA256, buildEvidence } from './anatomy-fixtures';

const ROW: CrosswalkRow = {
  subject_kind: 'region', subject_id: 'stn', subject_name_at_draft: 'Subthalamic Nucleus', valid_for_addressing: [1], part: null,
  atlas: FIXTURE_ATLAS_ID, atlas_ids: ['7'], name_match: 'same', extent_match: 'same', definition_contested: false, draws: true,
  delineation_basis: 'manual_mri', evidence: buildEvidence(), drafted_by: 'ai',
};
const LABELS = [{ id: '7', name: 'Fixture Nucleus', hemisphere: 'both' as const }];
const DEPENDENCIES = { labels: LABELS, meshSha256s: [FIXTURE_SHA256], containment: [] };
const ROW_DIGEST = digestCrosswalkRow(ROW, DEPENDENCIES);

function buildEntry(overrides: Partial<LedgerEntry> = {}): LedgerEntry {
  return { kind: 'row_review', key: crosswalkRowKey(ROW), digest: ROW_DIGEST, reviewer_id: 'owner-1', reviewed_on: '2026-10-09', ...overrides };
}

function buildLedgerFile(entries: LedgerEntry[] = [], reviewers: unknown[] = [{ id: 'owner-1', role: 'owner' }]): Record<string, unknown> {
  return { schema_version: 1, status: REVIEW_LEDGER_STATUS, reviewers, entries };
}

describe('canonicalJson and digests', () => {
  it('is the same for objects whose keys are in a different order', () => {
    expect(canonicalJson({ b: 1, a: { d: [2, 1], c: null } })).toBe('{"a":{"c":null,"d":[2,1]},"b":1}');
    expect(canonicalJson({ a: { c: null, d: [2, 1] }, b: 1 })).toBe(canonicalJson({ b: 1, a: { d: [2, 1], c: null } }));
  });

  it('hashes text to 64 hexadecimal characters', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('keys a crosswalk row by subject, atlas and part, and a link by technique and term', () => {
    expect(crosswalkRowKey(ROW)).toBe(`region:stn:${FIXTURE_ATLAS_ID}:`);
    expect(crosswalkRowKey({ ...ROW, part: 'retrosplenial' })).toBe(`region:stn:${FIXTURE_ATLAS_ID}:retrosplenial`);
    expect(techniqueLinkKey('QIF-T0127', 'amygdala')).toBe('QIF-T0127:amygdala');
  });

  it.each([
    ['one field of the row', digestCrosswalkRow({ ...ROW, extent_match: 'approximate' }, DEPENDENCIES)],
    ['the rationale', digestCrosswalkRow({ ...ROW, evidence: buildEvidence({ rationale: 'Changed.' }) }, DEPENDENCIES)],
    ['the label it points at', digestCrosswalkRow(ROW, { ...DEPENDENCIES, labels: [{ ...LABELS[0], name: 'Another Nucleus' }] })],
    ['the mesh that draws it', digestCrosswalkRow(ROW, { ...DEPENDENCIES, meshSha256s: [OTHER_SHA256] })],
    ['a containment its subject takes part in', digestCrosswalkRow(ROW, { ...DEPENDENCIES, containment: [{ parent: 'thalamus', child: 'stn' }] })],
  ])('changes the row digest when %s changes', (_what, changedDigest) => {
    expect(changedDigest).not.toBe(ROW_DIGEST);
  });

  it('changes a link digest when the link, or what its term resolves to, changes', () => {
    const link: TechniqueLink = { term: 'amygdala', valid_for_addressing: [1], evidence: buildEvidence({ claim_basis: 'catalog_text' }), drafted_by: 'ai' };
    const unlit = { resolved_region_id: 'bla', resolution: 'whole_to_part' as const };
    const digest = digestTechniqueLink('QIF-T0127', link, unlit);
    expect(digestTechniqueLink('QIF-T0127', link, unlit)).toBe(digest);
    expect(digestTechniqueLink('QIF-T0127', { ...link, valid_for_addressing: [1, 2] }, unlit)).not.toBe(digest);
    expect(digestTechniqueLink('QIF-T0127', link, { resolved_region_id: 'bla', resolution: 'synonym' })).not.toBe(digest);
    expect(digestTechniqueLink('QIF-T0128', link, unlit)).not.toBe(digest);
  });
});

describe('parseReviewLedger', () => {
  it('accepts an empty ledger and a ledger with one entry', () => {
    expect(parseReviewLedger(buildLedgerFile()).entries).toEqual([]);
    expect(parseReviewLedger(buildLedgerFile([buildEntry()])).entries).toHaveLength(1);
  });

  it('rejects two entries of one kind with the same key', () => {
    expect(() => parseReviewLedger(buildLedgerFile([buildEntry(), buildEntry({ reviewed_on: '2026-10-10' })])))
      .toThrow(/entries: row_review entry "region:stn:fixture_atlas:" appears twice/);
  });

  it('lets two kinds share a key', () => {
    const entries = [buildEntry({ kind: 'visual_check', key: 'deep_fixture' }), buildEntry({ kind: 'agreement', key: 'deep_fixture' })];
    expect(parseReviewLedger(buildLedgerFile(entries)).entries).toHaveLength(2);
  });

  it('rejects a reviewer the file does not list', () => {
    expect(() => parseReviewLedger(buildLedgerFile([buildEntry({ reviewer_id: 'neuroanatomist-1' })])))
      .toThrow(/entries\[0\]\.reviewer_id: "neuroanatomist-1" is not in this file's reviewers list/);
  });

  it('rejects a reviewer id that is a name or that claims another role', () => {
    expect(() => parseReviewLedger(buildLedgerFile([], [{ id: 'Jane Doe', role: 'neuroanatomist' }]))).toThrow(/reviewers\[0\]\.id/);
    expect(() => parseReviewLedger(buildLedgerFile([], [{ id: 'owner-1', role: 'neuroanatomist' }])))
      .toThrow(/reviewers\[0\]\.id: "owner-1" does not match the role "neuroanatomist"/);
  });

  it('rejects an unknown kind, a malformed digest, a key of the wrong form and an unknown schema version', () => {
    expect(() => parseReviewLedger(buildLedgerFile([buildEntry({ kind: 'sign_off' as never })]))).toThrow(AnatomyDataError);
    expect(() => parseReviewLedger(buildLedgerFile([buildEntry({ digest: 'reviewed' })]))).toThrow(/entries\[0\]\.digest/);
    expect(() => parseReviewLedger(buildLedgerFile([buildEntry({ key: 'stn' })]))).toThrow(/entries\[0\]\.key: "stn" is not a row_review key/);
    expect(() => parseReviewLedger({ ...buildLedgerFile(), schema_version: 2 })).toThrow(/schema_version/);
  });
});

describe('review state', () => {
  const ledger = parseReviewLedger(buildLedgerFile([buildEntry()]));

  it('reads a row as reviewed, by role and date, when the digest matches', () => {
    expect(findReview(ledger, 'row_review', crosswalkRowKey(ROW), ROW_DIGEST)).toEqual({ state: 'reviewed', reviewer_role: 'owner', reviewed_on: '2026-10-09' });
  });

  it('reads a row as unreviewed, with no error, when its digest no longer matches the entry', () => {
    const editedDigest = digestCrosswalkRow({ ...ROW, atlas_ids: ['8'] }, DEPENDENCIES);
    expect(findReview(ledger, 'row_review', crosswalkRowKey(ROW), editedDigest)).toEqual(UNREVIEWED);
  });

  it('reads a row with no entry, or an entry of another kind, as unreviewed', () => {
    expect(findReview(ledger, 'row_review', 'region:gpi:fixture_atlas:', ROW_DIGEST)).toEqual(UNREVIEWED);
    expect(findReview(ledger, 'visual_check', crosswalkRowKey(ROW), ROW_DIGEST)).toEqual(UNREVIEWED);
  });

  it('never yields an empty mark, and shows an owner\'s review as the owner\'s', () => {
    expect(describeReviewState(UNREVIEWED)).toBe('AI-drafted, unreviewed');
    expect(describeReviewState({ state: 'reviewed', reviewer_role: 'owner', reviewed_on: '2026-10-09' })).toBe('Reviewed by owner, 2026-10-09');
  });

  it('takes the worst state among mixed owners, and unreviewed when there is nothing to go on', () => {
    const byOwner = { state: 'reviewed', reviewer_role: 'owner', reviewed_on: '2026-10-09' } as const;
    const byAnatomist = { state: 'reviewed', reviewer_role: 'neuroanatomist', reviewed_on: '2026-10-08' } as const;
    expect(worstReviewState([byAnatomist, UNREVIEWED, byOwner])).toEqual(UNREVIEWED);
    expect(worstReviewState([byAnatomist, byOwner])).toEqual(byOwner);
    expect(worstReviewState([])).toEqual(UNREVIEWED);
  });

  it('takes the worst check status, and unchecked when there is nothing to go on', () => {
    expect(worstCheckStatus(['supports', 'partial'])).toBe('partial');
    expect(worstCheckStatus(['supports', 'unchecked', 'partial'])).toBe('unchecked');
    expect(worstCheckStatus(['supports', 'contradicts', 'unchecked'])).toBe('contradicts');
    expect(worstCheckStatus([])).toBe('unchecked');
  });
});

describe('ledger ratchet', () => {
  it('starts at zero entries of every kind', () => {
    expect(REVIEWED_ENTRY_COUNTS).toEqual({ row_review: 0, visual_check: 0, agreement: 0 });
  });

  it('counts entries by kind', () => {
    const ledger = parseReviewLedger(buildLedgerFile([buildEntry(), buildEntry({ kind: 'visual_check', key: 'deep_fixture' })]));
    expect(countEntriesByKind(ledger)).toEqual({ row_review: 1, visual_check: 1, agreement: 0 });
  });

  it('stops the build when the ledger holds an entry the ratchet does not expect', () => {
    const ledger = parseReviewLedger(buildLedgerFile([buildEntry()]));
    expect(() => assertLedgerRatchet(ledger)).toThrow(/holds 1 row_review entries but REVIEWED_ENTRY_COUNTS expects 0/);
    expect(() => assertLedgerRatchet(parseReviewLedger(buildLedgerFile()))).not.toThrow();
  });
});
