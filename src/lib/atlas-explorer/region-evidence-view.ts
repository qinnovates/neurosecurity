/**
 * Literature statements as the inspector shows them. Every statement carries
 * the line "filed under X; the paper says Y" and the sentence that says how the
 * paper's anatomy relates to the region, so a paper about a part, a larger
 * structure or somewhere else never reads as a plain finding about the region.
 */

import { limitSentence, type LimitSentence } from '@/lib/anatomy/limits-copy';
import { doiAddress, pubmedAddress } from '@/lib/anatomy/literature-readers';
import { isAboutRegionItself, type EvidenceKind, type PubmedNotice, type RegionEvidence, type RegionEvidenceRow } from '@/lib/anatomy/region-evidence-types';
import { limitsForEvidenceAnatomy } from './limit-selection';

export interface CitationView {
  citation: string;
  /** Null for the one paper PubMed lists without a DOI. */
  doiAddress: string | null;
  pubmedAddress: string;
}

export interface RelatedSourceView extends CitationView {
  relation: string;
  quote: string;
  /** True when the statement may not be shown without this paper. */
  required: boolean;
}

export interface EvidenceStatement {
  key: string;
  /** "Filed under <region name>; the paper says <its own anatomy>." Shown on every statement. */
  filedUnderLine: string;
  anatomyLimits: LimitSentence[];
  /** False when the paper is about a part, a larger structure, somewhere else, or the link is the drafter's reading. */
  isAboutRegionItself: boolean;
  /** What the second AI's check of this statement came to, in a sentence. */
  checkLimit: LimitSentence;
  /** Set when the statement is filed as arguing against another one here. */
  rivalLimit: LimitSentence | null;
  /** The kind of finding, in plain words. */
  kindLabel: string;
  claim: string;
  quote: string;
  citation: CitationView;
  studyDesign: string;
  sampleSize: number | null;
  scopeNote: string;
  contestedLimit: LimitSentence | null;
  requiredCitationLimit: LimitSentence | null;
  related: RelatedSourceView[];
  notices: string[];
}

export interface RegionEvidenceView {
  intro: LimitSentence;
  statements: EvidenceStatement[];
  /** Shown instead of statements when none is filed under the region. */
  emptyLimit: LimitSentence | null;
}

const PUBMED_NOTICE_WORDS: Readonly<Record<PubmedNotice, string>> = {
  CommentIn: 'PubMed lists a published comment on this paper.',
  ErratumIn: 'PubMed lists a published correction to this paper.',
};
export const EVIDENCE_KIND_LABELS: Readonly<Record<EvidenceKind, string>> = {
  function_association: 'Finding from measuring activity',
  lesion_association: 'Finding from damage to the brain (a lesion study)',
  postmortem_association: 'Finding from examining tissue after death',
  stimulation_association: 'Finding from stimulating the brain',
};
const CROSSREF_NOTICE_WORDS = 'Crossref lists a published correction to this paper; it was not read.';
const NO_REASON_RECORDED = 'none is recorded.';

function toCitation(source: { citation: string; doi: string | null; pmid: string }): CitationView {
  return { citation: source.citation, doiAddress: source.doi === null ? null : doiAddress(source.doi), pubmedAddress: pubmedAddress(source.pmid) };
}

function listNotices(row: RegionEvidenceRow): string[] {
  return [...row.pubmed_notices.map((notice) => PUBMED_NOTICE_WORDS[notice]), ...(row.crossref_notices.length > 0 ? [CROSSREF_NOTICE_WORDS] : [])];
}

/** @param ordinal the row's place among the region's statements; one paper can back two of them, so it is part of the key */
export function toEvidenceStatement(row: RegionEvidenceRow, regionName: string, ordinal: number): EvidenceStatement {
  const requiredPmids = new Set(row.requires_citations.map((citation) => citation.pmid).filter((pmid) => pmid !== row.pmid));
  return {
    key: `${row.region_id}:${row.pmid}:${ordinal}`,
    filedUnderLine: `Filed under ${regionName}; the paper says "${row.anatomy_as_stated}".`,
    anatomyLimits: limitsForEvidenceAnatomy(row),
    isAboutRegionItself: isAboutRegionItself(row),
    checkLimit: limitSentence(`evidence_check_${row.verifier_verdict}`),
    rivalLimit: row.rival_view_row ? limitSentence('evidence_rival_view') : null,
    kindLabel: EVIDENCE_KIND_LABELS[row.kind],
    claim: row.claim,
    quote: row.quote,
    citation: toCitation(row),
    studyDesign: row.study_design,
    sampleSize: row.n,
    scopeNote: row.scope_note,
    contestedLimit: row.contested ? limitSentence('evidence_contested') : null,
    requiredCitationLimit: requiredPmids.size > 0 ? limitSentence('evidence_required_citation') : null,
    related: row.related_sources.map((source) => ({ ...toCitation(source), relation: source.relation, quote: source.quote, required: requiredPmids.has(source.pmid) })),
    notices: listNotices(row),
  };
}

export function buildRegionEvidenceView(evidence: RegionEvidence, regionId: string, regionName: string): RegionEvidenceView {
  const statements = evidence.rows.filter((row) => row.filed_under === regionId).map((row, ordinal) => toEvidenceStatement(row, regionName, ordinal));
  const reason = evidence.empty_regions.find((region) => region.region_id === regionId)?.reason ?? NO_REASON_RECORDED;
  return { intro: limitSentence('evidence_intro'), statements, emptyLimit: statements.length === 0 ? limitSentence('evidence_none', { reason }) : null };
}
