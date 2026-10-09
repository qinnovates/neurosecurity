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
  output_folder: OutputFolder | null;
}

const OPEN_FACTS: LicenceFacts = { commercial_use: true, share_alike: false, output_folder: 'open' };
const NO_GRANT_FACTS: LicenceFacts = { commercial_use: false, share_alike: false, output_folder: null };

export const LICENCE_FACTS: Readonly<Record<LicenceId, LicenceFacts>> = {
  'cc-by-4.0': OPEN_FACTS,
  'cc0-1.0': OPEN_FACTS,
  'mit': OPEN_FACTS,
  'mni-icbm-notice': OPEN_FACTS,
  'cc-by-sa-4.0': { commercial_use: true, share_alike: true, output_folder: 'by-sa' },
  /** Its text grants use "without restriction" but never names commercial use, so none is derived. */
  'melbourne-subcortex': NO_GRANT_FACTS,
  /** Does not forbid commercial use; it binds by use, so it builds only behind a recorded acceptance. */
  'freesurfer-sla-1.0': { commercial_use: true, share_alike: false, output_folder: null },
  /** Silent on commercial use; redistribution only under the same terms. */
  'hcp-data-use-terms': { commercial_use: false, share_alike: true, output_folder: null },
  'none-stated': NO_GRANT_FACTS,
};

export const UNBUILDABLE_REASONS = [
  'not_cleared', 'verdict_not_ship', 'grant_not_explicit', 'licence_not_commercial',
  'not_redistributable', 'agreement_not_accepted', 'route_not_settled',
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

const SHIPPING_VERDICTS: readonly Verdict[] = ['SHIP', 'SHIP-SEPARATE-FILE'];

/** The licence a source is handled under: the verdict's stricter id when it sets one, else the stated id. */
export function effectiveLicenceId(source: AnatomySource, verdict: LicenceVerdict): LicenceId {
  return verdict.treat_as ?? source.licence_id;
}

/** True when `candidate` permits nothing that `stated` withholds. */
export function isAtLeastAsStrict(candidate: LicenceId, stated: LicenceId): boolean {
  const candidateFacts = LICENCE_FACTS[candidate];
  const statedFacts = LICENCE_FACTS[stated];
  const gainsCommercialUse = candidateFacts.commercial_use && !statedFacts.commercial_use;
  const dropsShareAlike = statedFacts.share_alike && !candidateFacts.share_alike;
  const gainsOutputFolder = candidateFacts.output_folder !== null && statedFacts.output_folder === null;
  return !gainsCommercialUse && !dropsShareAlike && !gainsOutputFolder;
}

/**
 * Whether a source may build, with every reason it may not. An uncleared
 * source ships nothing; this is one generic rule, not a case per source.
 */
export function assessBuildability(source: AnatomySource, verdict: LicenceVerdict, agreement: AgreementState): Buildability {
  const checks: Array<[UnbuildableReason, boolean]> = [
    ['not_cleared', verdict.clearance.cleared],
    ['verdict_not_ship', SHIPPING_VERDICTS.includes(verdict.verdict)],
    ['grant_not_explicit', verdict.grant === 'explicit'],
    ['licence_not_commercial', LICENCE_FACTS[effectiveLicenceId(source, verdict)].commercial_use],
    ['not_redistributable', source.redistribute],
    ['agreement_not_accepted', verdict.access_agreement === null || agreement.agreementAccepted],
    ['route_not_settled', source.route.kind !== 'unknown' && source.route.status === 'settled'],
  ];
  const blockers = checks.filter(([, holds]) => !holds).map(([reason]) => reason);
  return { buildable: blockers.length === 0, blockers };
}
