import { describe, expect, it } from 'vitest';
import { LICENCE_FACTS, LICENCE_STRICTNESS, assessBuildability, effectiveLicenceId, isStricter } from '../licence-rules';
import { GRANTS, VERDICTS, type LicenceId } from '../source-types';
import { LICENCE_IDS } from '../source-types';
import { FIXTURE_SHA256, buildSource, buildVerdict } from './anatomy-fixtures';

const NOT_ACCEPTED = { agreementAccepted: false };

describe('licence facts', () => {
  it('derives a fact set for every licence id in the closed list', () => {
    expect(Object.keys(LICENCE_FACTS).sort()).toEqual([...LICENCE_IDS].sort());
  });

  it('puts share-alike material in its own folder and gives an unusable licence no folder', () => {
    expect(LICENCE_FACTS['cc-by-sa-4.0']).toEqual({ commercial_use: true, share_alike: true, requires_agreement: false, output_folder: 'by-sa' });
    expect(LICENCE_FACTS['cc-by-4.0'].output_folder).toBe('open');
    expect(LICENCE_FACTS['none-stated']).toEqual({ commercial_use: false, share_alike: false, requires_agreement: false, output_folder: null });
    expect([LICENCE_FACTS['freesurfer-sla-1.0'].requires_agreement, LICENCE_FACTS['hcp-data-use-terms'].requires_agreement]).toEqual([true, true]);
  });

  it('uses the stricter id when a verdict sets one', () => {
    expect(effectiveLicenceId(buildSource(), buildVerdict({ treat_as: 'cc-by-sa-4.0' }))).toBe('cc-by-sa-4.0');
    expect(effectiveLicenceId(buildSource(), buildVerdict())).toBe('cc-by-4.0');
  });

  it('orders every licence id by strictness, and never lets a stricter id ship where a looser one cannot', () => {
    expect([...LICENCE_STRICTNESS].sort()).toEqual([...LICENCE_IDS].sort());
    const mayShip = LICENCE_STRICTNESS.map((id) => LICENCE_FACTS[id].commercial_use && LICENCE_FACTS[id].output_folder !== null);
    expect(mayShip).toEqual([...mayShip].sort().reverse());
    expect(isStricter('cc-by-sa-4.0', 'cc-by-4.0')).toBe(true);
    expect(isStricter('cc-by-4.0', 'cc-by-sa-4.0')).toBe(false);
    expect(isStricter('cc-by-4.0', 'cc-by-4.0')).toBe(false);
    expect(isStricter('cc-by-4.0', 'none-stated')).toBe(false);
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

  it.each(['needs_owner', 'do_not_ship'] as const)('is false for the verdict %s', (verdict) => {
    expect(assessBuildability(buildSource(), buildVerdict({ verdict }), NOT_ACCEPTED).blockers).toEqual(['verdict_not_ship']);
  });

  it('is false when the effective licence does not grant commercial use', () => {
    const result = assessBuildability(buildSource({ license_id: 'melbourne-subcortex' }), buildVerdict(), NOT_ACCEPTED);
    expect(result.blockers).toEqual(['license_not_commercial', 'no_output_folder']);
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

  it('never builds under a licence that binds by agreement unless the agreement is recorded and accepted, and never without an output folder', () => {
    const source = buildSource({ license_id: 'freesurfer-sla-1.0' });
    expect(assessBuildability(source, buildVerdict(), NOT_ACCEPTED).blockers).toEqual(['agreement_not_accepted', 'no_output_folder']);
    expect(assessBuildability(source, buildVerdict(), { agreementAccepted: true }).blockers).toEqual(['no_output_folder']);
    expect(assessBuildability(buildSource(), buildVerdict({ treat_as: 'freesurfer-sla-1.0' }), NOT_ACCEPTED).buildable).toBe(false);
  });

  it('builds exactly the combinations the rule allows, over every licence, treat_as, verdict, grant, clearance, agreement, redistribution and route state', () => {
    const shippable: readonly LicenceId[] = ['cc-by-4.0', 'cc0-1.0', 'cc-by-sa-4.0', 'mit', 'mni-icbm-notice'];
    const flags = [true, false];
    const agreement = { name: 'Fixture terms', terms_url: 'https://example.org/terms', text_sha256: FIXTURE_SHA256 };
    const routes = [
      { kind: 'header_resample', status: 'settled', note: 'n' }, { kind: 'header_resample', status: 'open', note: 'n' }, { kind: 'unknown', status: 'open', note: 'n' },
    ] as const;
    let checked = 0;
    const wrong: string[] = [];
    for (const licenceId of LICENCE_IDS) for (const treatAs of [null, ...LICENCE_IDS]) for (const verdictValue of VERDICTS) for (const grant of GRANTS)
      for (const cleared of flags) for (const hasAgreement of flags) for (const agreementAccepted of flags) for (const redistribute of flags) for (const route of routes) {
        const source = buildSource({ redistribute, route, license_id: licenceId });
        const verdict = buildVerdict({
          verdict: verdictValue, grant, treat_as: treatAs, access_agreement: hasAgreement ? agreement : null,
          clearance: { cleared, reason: 'r', unlocks_when: ['u'], drafted_by: 'ai' },
        });
        const expected = shippable.includes(treatAs ?? licenceId) && cleared && grant === 'explicit' && ['ship', 'ship_separate_file'].includes(verdictValue)
          && redistribute && route.status === 'settled' && (!hasAgreement || agreementAccepted);
        if (assessBuildability(source, verdict, { agreementAccepted }).buildable !== expected) wrong.push(`${licenceId}/${String(treatAs)}/${verdictValue}/${grant}`);
        checked += 1;
      }
    expect(checked).toBeGreaterThan(50000);
    expect(wrong).toEqual([]);
  });

  it('lists every blocker, not only the first', () => {
    const verdict = buildVerdict({ verdict: 'do_not_ship', grant: 'none' });
    expect(assessBuildability(buildSource({ redistribute: false }), verdict, NOT_ACCEPTED).blockers)
      .toEqual(['verdict_not_ship', 'grant_not_explicit', 'not_redistributable']);
  });
});
