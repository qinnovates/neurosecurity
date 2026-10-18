/**
 * The shape of datalake/qif-anatomy-region-evidence.json: statements from the
 * literature, each one verbatim quote from one paper, filed under a QIF region.
 * An AI drafted them and a second AI checked the quotes; no person has reviewed
 * any of them.
 *
 * A row is filed under a region, which is not the same as being about it. The
 * paper's own anatomy is `anatomy_as_stated`, and `anatomy_match` says how that
 * relates to the region. A display shows both, always.
 */

import type { CheckStatus, ClaimBasis, EvidenceMethod } from './evidence';

export const REGION_EVIDENCE_FILE = 'datalake/qif-anatomy-region-evidence.json';
export const REGION_EVIDENCE_PATH = '/atlas/anatomy-region-evidence.json';

export const REGION_EVIDENCE_STATUS = 'AI-drafted, then checked by a second AI verifier and corrected. No neuroscientist or clinician has reviewed these rows. Research summaries, not medical advice.';
export const REGION_EVIDENCE_DISPLAY_RULE = 'Show every row as: filed under <filed_under>; the paper says <anatomy_as_stated>. Where anatomy_match is not \'equal\' or anatomy_inferred is true, never show the row under the bare region name.';

export const EVIDENCE_KINDS = ['function_association', 'lesion_association', 'postmortem_association', 'stimulation_association'] as const;
export type EvidenceKind = typeof EVIDENCE_KINDS[number];

/** How the anatomy the paper states relates to the QIF region the row is filed under. */
export const ANATOMY_MATCHES = ['equal', 'part', 'larger_structure', 'adjacent_or_overlapping', 'uncertain', 'outside_region'] as const;
export type AnatomyMatch = typeof ANATOMY_MATCHES[number];

export const VERIFIER_VERDICTS = ['keep', 'keep_with_corrected_claim', 'downgrade', 'added_in_round_2_not_seen_by_verifier'] as const;
export type VerifierVerdict = typeof VERIFIER_VERDICTS[number];

export const PUBMED_NOTICES = ['CommentIn', 'ErratumIn'] as const;
export type PubmedNotice = typeof PUBMED_NOTICES[number];

/** Every quote was read in an abstract; no full text was read for any row. */
export const EVIDENCE_ACCESS = 'abstract only';
export const QUOTE_LOCATION = 'abstract';
export const EVIDENCE_SPECIES = 'human';
export const DRAFTED_BY_AI = 'ai';

/** Another paper a row's scope note leans on, with its own verbatim quote. */
export interface RelatedSource {
  pmid: string;
  doi: string;
  citation: string;
  relation: string;
  quote: string;
  quote_location: typeof QUOTE_LOCATION;
  url_opened: string;
  access: typeof EVIDENCE_ACCESS;
}

/** A paper that must be cited whenever the row is shown. */
export interface RequiredCitation {
  pmid: string;
  role: string;
}

export interface CrossrefNotice {
  type: string;
  doi: string;
  content_read: boolean;
  resolved_at: string;
}

export interface RegionEvidenceRow {
  region_id: string;
  kind: EvidenceKind;
  claim: string;
  quote: string;
  quote_location: typeof QUOTE_LOCATION;
  citation: string;
  /** Null for the one paper PubMed lists without a DOI. */
  doi: string | null;
  pmid: string;
  url_opened: string;
  access: typeof EVIDENCE_ACCESS;
  open_copy_not_read: string | null;
  evidence_species: typeof EVIDENCE_SPECIES;
  study_design: string;
  /** Null when the abstract gives no number. */
  n: number | null;
  scope_note: string;
  filed_under: string;
  anatomy_as_stated: string;
  anatomy_match: AnatomyMatch;
  /** True where the link from the paper's anatomy to the region is the drafter's reading. */
  anatomy_inferred: boolean;
  anatomy_note: string;
  contested: boolean;
  rival_view_row: boolean;
  related_sources: RelatedSource[];
  requires_citations: RequiredCitation[];
  pubmed_notices: PubmedNotice[];
  crossref_notices: CrossrefNotice[];
  verifier_verdict: VerifierVerdict;
  evidence: { claim_basis: ClaimBasis; evidence_method: EvidenceMethod; check_status: CheckStatus };
  drafted_by: typeof DRAFTED_BY_AI;
  /** Always null today: no person has reviewed a row. */
  human_review: null;
  date_checked: string;
}

/** Why a region has no statement, as a closed code a visitor sentence is chosen by. */
export const EMPTY_REGION_REASONS = ['no_abstract_found', 'animal_evidence_only'] as const;
export type EmptyRegionReason = typeof EMPTY_REGION_REASONS[number];

export interface EmptyRegion {
  region_id: string;
  /** The drafter's own note. Never shown to a visitor. */
  reason: string;
  reason_code: EmptyRegionReason;
  name: string;
}

export interface RegionEvidence {
  schema_note: string;
  status: string;
  display_rule: string;
  rows_by_kind: Record<EvidenceKind, number>;
  rows_by_verifier_verdict: Record<VerifierVerdict, number>;
  date_checked: string;
  regions_total: number;
  regions_with_rows: number;
  rows_attempted: number;
  rows_surviving: number;
  rows: RegionEvidenceRow[];
  empty_regions: EmptyRegion[];
}

/**
 * Whether a row may stand as a statement about its region with no qualifier.
 * Only when the paper names the same structure and the link is not inferred.
 */
export function isAboutRegionItself(row: Pick<RegionEvidenceRow, 'anatomy_match' | 'anatomy_inferred'>): boolean {
  return row.anatomy_match === 'equal' && !row.anatomy_inferred;
}
