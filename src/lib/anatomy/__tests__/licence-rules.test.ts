import { describe, expect, it } from 'vitest';
import { LICENCE_FACTS, assessBuildability, effectiveLicenceId, isAtLeastAsStrict } from '../licence-rules';
import { LICENCE_IDS } from '../source-types';
import { FIXTURE_SHA256, buildSource, buildVerdict } from './anatomy-fixtures';

const NOT_ACCEPTED = { agreementAccepted: false };

describe('licence facts', () => {
  it('derives a fact set for every licence id in the closed list', () => {
    expect(Object.keys(LICENCE_FACTS).sort()).toEqual([...LICENCE_IDS].sort());
  });

  it('puts share-alike material in its own folder and gives an unusable licence no folder', () => {
    expect(LICENCE_FACTS['cc-by-sa-4.0']).toEqual({ commercial_use: true, share_alike: true, output_folder: 'by-sa' });
    expect(LICENCE_FACTS['cc-by-4.0'].output_folder).toBe('open');
    expect(LICENCE_FACTS['none-stated']).toEqual({ commercial_use: false, share_alike: false, output_folder: null });
  });

  it('uses the stricter id when a verdict sets one', () => {
    expect(effectiveLicenceId(buildSource(), buildVerdict({ treat_as: 'cc-by-sa-4.0' }))).toBe('cc-by-sa-4.0');
    expect(effectiveLicenceId(buildSource(), buildVerdict())).toBe('cc-by-4.0');
  });

  it('knows which id is at least as strict as another', () => {
    expect(isAtLeastAsStrict('cc-by-sa-4.0', 'cc-by-4.0')).toBe(true);
    expect(isAtLeastAsStrict('cc-by-4.0', 'cc-by-sa-4.0')).toBe(false);
    expect(isAtLeastAsStrict('cc-by-4.0', 'none-stated')).toBe(false);
  });
});

describe('assessBuildability', () => {
  it('lets a cleared, explicitly granted, commercial, redistributable source with a settled route build', () => {
    expect(assessBuildability(buildSource(), buildVerdict(), NOT_ACCEPTED)).toEqual({ buildable: true, blockers: [] });
  });

  it('is false for a grant that rests on interpretation', () => {
    const result = assessBuildability(buildSource(), buildVerdict({ grant: 'interpretation' }), NOT_ACCEPTED);
    expect(result).toEqual({ buildable: false, blockers: ['grant_not_explicit'] });
  });

  it('is false for an uncleared source', () => {
    const clearance = { cleared: false, reason: 'Not settled.', unlocks_when: ['A written confirmation.'], drafted_by: 'ai' as const };
    expect(assessBuildability(buildSource(), buildVerdict({ clearance }), NOT_ACCEPTED).blockers).toEqual(['not_cleared']);
  });

  it.each(['NEEDS-KEVIN', 'DO-NOT-SHIP'] as const)('is false for the verdict %s', (verdict) => {
    expect(assessBuildability(buildSource(), buildVerdict({ verdict }), NOT_ACCEPTED).blockers).toEqual(['verdict_not_ship']);
  });

  it('is false when the effective licence does not grant commercial use', () => {
    const result = assessBuildability(buildSource({ licence_id: 'melbourne-subcortex' }), buildVerdict(), NOT_ACCEPTED);
    expect(result.blockers).toEqual(['licence_not_commercial']);
  });

  it('is false for a pipeline-only source that must not be redistributed', () => {
    expect(assessBuildability(buildSource({ redistribute: false }), buildVerdict(), NOT_ACCEPTED).blockers).toEqual(['not_redistributable']);
  });

  it('is false behind an access agreement until the owner\'s acceptance is recorded', () => {
    const verdict = buildVerdict({ access_agreement: { name: 'Fixture terms', terms_url: 'https://example.org/terms', text_sha256: FIXTURE_SHA256 } });
    expect(assessBuildability(buildSource(), verdict, NOT_ACCEPTED).blockers).toEqual(['agreement_not_accepted']);
    expect(assessBuildability(buildSource(), verdict, { agreementAccepted: true }).buildable).toBe(true);
  });

  it.each([
    ['an unknown route', { kind: 'unknown', status: 'open', note: 'Space not established.' }],
    ['a route that is still open', { kind: 'header_resample', status: 'open', note: 'Header unread.' }],
  ] as const)('is false for %s', (_label, route) => {
    expect(assessBuildability(buildSource({ route }), buildVerdict(), NOT_ACCEPTED).blockers).toEqual(['route_not_settled']);
  });

  it('lists every blocker, not only the first', () => {
    const verdict = buildVerdict({ verdict: 'DO-NOT-SHIP', grant: 'none' });
    expect(assessBuildability(buildSource({ redistribute: false }), verdict, NOT_ACCEPTED).blockers)
      .toEqual(['verdict_not_ship', 'grant_not_explicit', 'not_redistributable']);
  });
});
