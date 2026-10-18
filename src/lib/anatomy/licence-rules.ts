/**
 * What a licence permits, derived from its id, and the one rule that decides
 * whether a source may build. Share-alike, commercial use and the output
 * folder are never typed in a data file: they come from this table.
 *
 * The offline pipeline is to apply the same rule in Python (its sources.py);
 * this is the copy the build and the tests use.
 */

import type { AnatomySource, LicenceId, LicenceVerdict, Verdict } from './source-types';

/** Where a licence's outputs are written under atlas-assets/. Null: nothing under this licence is written at all. */
export type OutputFolder = 'open' | 'by-sa';

export interface LicenceFacts {
  commercial_use: boolean;
  share_alike: boolean;
  /** The licence binds whoever uses the material to obligations beyond attribution, so it needs a recorded acceptance. */
  requires_agreement: boolean;
  output_folder: OutputFolder | null;
}

const OPEN_FACTS: LicenceFacts = { commercial_use: true, share_alike: false, requires_agreement: false, output_folder: 'open' };
const NO_GRANT_FACTS: LicenceFacts = { commercial_use: false, share_alike: false, requires_agreement: false, output_folder: null };

export const LICENCE_FACTS: Readonly<Record<LicenceId, LicenceFacts>> = {
  'cc-by-4.0': OPEN_FACTS,
  'cc0-1.0': OPEN_FACTS,
  'mit': OPEN_FACTS,
  'mni-icbm-notice': OPEN_FACTS,
  'cc-by-sa-4.0': { commercial_use: true, share_alike: true, requires_agreement: false, output_folder: 'by-sa' },
  /** Its text grants use "without restriction" but never names commercial use, so none is derived. */
  'melbourne-subcortex': NO_GRANT_FACTS,
  /** Does not forbid commercial use, but binds by use. It has no folder: nothing under it is written into the served assets. */
  'freesurfer-sla-1.0': { commercial_use: true, share_alike: false, requires_agreement: true, output_folder: null },
  /** Silent on commercial use; redistribution only under the same terms, behind an access agreement. */
  'hcp-data-use-terms': { commercial_use: false, share_alike: true, requires_agreement: true, output_folder: null },
  'none-stated': NO_GRANT_FACTS,
};

export const UNBUILDABLE_REASONS = [
  'not_cleared', 'verdict_not_ship', 'grant_not_explicit', 'license_not_commercial',
  'not_redistributable', 'agreement_not_accepted', 'no_output_folder', 'route_not_settled',
] as const;
export type UnbuildableReason = typeof UNBUILDABLE_REASONS[number];

export interface Buildability {
  buildable: boolean;
  blockers: UnbuildableReason[];
}

export interface AgreementState {
  /** True only when the review ledger holds the owner's acceptance of this source's agreement text. */
  agreementAccepted: boolean;
}

/** What stops a source shipping but says nothing against computing with it: it ships nothing, so it needs no folder and no route. */
const SHIPPING_ONLY_BLOCKERS: readonly UnbuildableReason[] = ['not_redistributable', 'no_output_folder', 'route_not_settled'];

const SHIPPING_VERDICTS: readonly Verdict[] = ['ship', 'ship_separate_file'];

/** The licence a source is handled under: the verdict's stricter id when it sets one, else the stated id. */
export function effectiveLicenceId(source: AnatomySource, verdict: LicenceVerdict): LicenceId {
  return verdict.treat_as ?? source.license_id;
}

/**
 * Every licence id, least strict first. A verdict's treat_as may only move a
 * source later in this list. Nothing after cc-by-sa-4.0 can ship.
 */
export const LICENCE_STRICTNESS: readonly LicenceId[] = [
  'cc0-1.0', 'mit', 'mni-icbm-notice', 'cc-by-4.0', 'cc-by-sa-4.0',
  'freesurfer-sla-1.0', 'melbourne-subcortex', 'hcp-data-use-terms', 'none-stated',
];

/** True when `candidate` comes strictly later than `stated` in LICENCE_STRICTNESS. */
export function isStricter(candidate: LicenceId, stated: LicenceId): boolean {
  return LICENCE_STRICTNESS.indexOf(candidate) > LICENCE_STRICTNESS.indexOf(stated);
}

/**
 * Whether a source may build, with every reason it may not. An uncleared
 * source ships nothing; this is one generic rule, not a case per source.
 */
export function assessBuildability(source: AnatomySource, verdict: LicenceVerdict, agreement: AgreementState): Buildability {
  const facts = LICENCE_FACTS[effectiveLicenceId(source, verdict)];
  const needsAgreement = facts.requires_agreement || verdict.access_agreement !== null;
  const checks: Array<[UnbuildableReason, boolean]> = [
    ['not_cleared', verdict.clearance.cleared],
    ['verdict_not_ship', SHIPPING_VERDICTS.includes(verdict.verdict)],
    ['grant_not_explicit', verdict.grant === 'explicit'],
    ['license_not_commercial', facts.commercial_use],
    ['not_redistributable', source.redistribute],
    ['agreement_not_accepted', !needsAgreement || agreement.agreementAccepted],
    ['no_output_folder', facts.output_folder !== null],
    ['route_not_settled', source.route.kind !== 'unknown' && source.route.status === 'settled'],
  ];
  const blockers = checks.filter(([, holds]) => !holds).map(([reason]) => reason);
  return { buildable: blockers.length === 0, blockers };
}

/**
 * Whether the offline pipeline may compute with a source (a registration
 * template, a transform) without shipping any of its material.
 *
 * A source that ships must simply be buildable. A pipeline-only source
 * (`redistribute: false`) must pass every buildability check except the three
 * that concern shipping: it is cleared, its verdict is `ship` or
 * `ship_separate_file`, its grant is explicit, its licence grants commercial
 * use, and any agreement it sits behind is accepted. So a source that is
 * uncleared, `do_not_ship`, `needs_owner` or behind an unaccepted agreement is
 * never computed with.
 */
export function mayPipelineUse(source: AnatomySource, verdict: LicenceVerdict, agreement: AgreementState): boolean {
  const { buildable, blockers } = assessBuildability(source, verdict, agreement);
  if (source.redistribute) return buildable;
  return blockers.every((blocker) => SHIPPING_ONLY_BLOCKERS.includes(blocker));
}
