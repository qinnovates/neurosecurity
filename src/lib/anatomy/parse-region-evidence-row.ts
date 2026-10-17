/** Reads one row of the region evidence file: every key named, every value held to its type, nothing passed through. */

import { CHECK_STATUSES, CLAIM_BASES, EVIDENCE_METHODS } from './evidence';
import {
  childOf, failAt, itemOf, readBoolean, readEnum, readInteger, readList, readNullable, readRecord, readString, requireEnum, type FieldLocation,
} from './field-readers';
import { readDate, readId } from './format-readers';
import { readAddressOn, readDoi, readPmid, readQuote } from './literature-readers';
import {
  ANATOMY_MATCHES, DRAFTED_BY_AI, EVIDENCE_ACCESS, EVIDENCE_KINDS, EVIDENCE_SPECIES, PUBMED_NOTICES, QUOTE_LOCATION, VERIFIER_VERDICTS,
  type CrossrefNotice, type RegionEvidenceRow, type RelatedSource, type RequiredCitation,
} from './region-evidence-types';

const ROW_KEYS = [
  'region_id', 'kind', 'claim', 'quote', 'quote_location', 'citation', 'doi', 'pmid', 'url_opened', 'access', 'open_copy_not_read',
  'evidence_species', 'study_design', 'n', 'scope_note', 'filed_under', 'anatomy_as_stated', 'anatomy_match', 'anatomy_inferred',
  'anatomy_note', 'contested', 'rival_view_row', 'related_sources', 'requires_citations', 'pubmed_notices', 'crossref_notices',
  'verifier_verdict', 'evidence', 'drafted_by', 'human_review', 'date_checked',
] as const;
const RELATED_SOURCE_KEYS = ['pmid', 'doi', 'citation', 'relation', 'quote', 'quote_location', 'url_opened', 'access'] as const;
const CROSSREF_NOTICE_KEYS = ['type', 'doi', 'content_read', 'resolved_at'] as const;
const EVIDENCE_KEYS = ['claim_basis', 'evidence_method', 'check_status'] as const;

const PUBMED_API_HOSTS = ['eutils.ncbi.nlm.nih.gov'];
const OPEN_COPY_HOSTS = ['pmc.ncbi.nlm.nih.gov'];
const CROSSREF_HOSTS = ['api.crossref.org'];
const MAX_CLAIM_LENGTH = 400;
const MAX_CITATION_LENGTH = 300;
const MAX_NOTE_LENGTH = 1000;
const MAX_LABEL_LENGTH = 160;

function readRelatedSource(value: unknown, location: FieldLocation): RelatedSource {
  const record = readRecord(value, location, { required: RELATED_SOURCE_KEYS });
  return {
    pmid: readPmid(record, 'pmid', location),
    doi: readDoi(record, 'doi', location),
    citation: readString(record, 'citation', location, MAX_CITATION_LENGTH),
    relation: readString(record, 'relation', location, MAX_LABEL_LENGTH),
    quote: readQuote(record, 'quote', location),
    quote_location: readEnum(record, 'quote_location', location, [QUOTE_LOCATION]),
    url_opened: readAddressOn(record, 'url_opened', location, PUBMED_API_HOSTS),
    access: readEnum(record, 'access', location, [EVIDENCE_ACCESS]),
  };
}

function readRequiredCitation(value: unknown, location: FieldLocation): RequiredCitation {
  const record = readRecord(value, location, { required: ['pmid', 'role'] });
  return { pmid: readPmid(record, 'pmid', location), role: readString(record, 'role', location, MAX_LABEL_LENGTH) };
}

function readCrossrefNotice(value: unknown, location: FieldLocation): CrossrefNotice {
  const record = readRecord(value, location, { required: CROSSREF_NOTICE_KEYS });
  return {
    type: readId(record, 'type', location),
    doi: readDoi(record, 'doi', location),
    content_read: readBoolean(record, 'content_read', location),
    resolved_at: readAddressOn(record, 'resolved_at', location, CROSSREF_HOSTS),
  };
}

function readRowEvidence(value: unknown, location: FieldLocation): RegionEvidenceRow['evidence'] {
  const record = readRecord(value, location, { required: EVIDENCE_KEYS });
  return {
    claim_basis: readEnum(record, 'claim_basis', location, CLAIM_BASES),
    evidence_method: readEnum(record, 'evidence_method', location, EVIDENCE_METHODS),
    check_status: readEnum(record, 'check_status', location, CHECK_STATUSES),
  };
}

function readEach<T>(record: Record<string, unknown>, key: string, location: FieldLocation, read: (value: unknown, itemLocation: FieldLocation) => T): T[] {
  return readList(record, key, location).map((item, index) => read(item, itemOf(location, key, index)));
}

/** A paper that must be shown with the row has to be one the row can show: its own, or one of its related sources. */
function rejectUnshowableCitations(row: Pick<RegionEvidenceRow, 'pmid' | 'related_sources' | 'requires_citations'>, location: FieldLocation): void {
  const showable = new Set([row.pmid, ...row.related_sources.map((source) => source.pmid)]);
  const missing = row.requires_citations.find((citation) => !showable.has(citation.pmid));
  if (missing === undefined) return;
  failAt(childOf(location, 'requires_citations'), `PubMed id ${missing.pmid} must be shown with this row but the row does not carry it`,
    'Add the paper to related_sources with its citation and quote.');
}

type AnatomyFields = Pick<RegionEvidenceRow, 'region_id' | 'filed_under' | 'anatomy_as_stated' | 'anatomy_match' | 'anatomy_inferred' | 'anatomy_note'>;
type SourceFields = Pick<RegionEvidenceRow, 'citation' | 'doi' | 'pmid' | 'url_opened' | 'access' | 'open_copy_not_read' | 'quote' | 'quote_location'>;

function readAnatomyFields(record: Record<string, unknown>, location: FieldLocation): AnatomyFields {
  const regionId = readId(record, 'region_id', location);
  const filedUnder = readId(record, 'filed_under', location);
  if (filedUnder !== regionId) failAt(childOf(location, 'filed_under'), 'a row is filed under its own region', 'Make filed_under equal region_id.');
  return {
    region_id: regionId,
    filed_under: filedUnder,
    anatomy_as_stated: readString(record, 'anatomy_as_stated', location, MAX_LABEL_LENGTH),
    anatomy_match: readEnum(record, 'anatomy_match', location, ANATOMY_MATCHES),
    anatomy_inferred: readBoolean(record, 'anatomy_inferred', location),
    anatomy_note: readString(record, 'anatomy_note', location, MAX_NOTE_LENGTH),
  };
}

function readSourceFields(record: Record<string, unknown>, location: FieldLocation): SourceFields {
  return {
    citation: readString(record, 'citation', location, MAX_CITATION_LENGTH),
    doi: readNullable(record, 'doi', () => readDoi(record, 'doi', location)),
    pmid: readPmid(record, 'pmid', location),
    url_opened: readAddressOn(record, 'url_opened', location, PUBMED_API_HOSTS),
    access: readEnum(record, 'access', location, [EVIDENCE_ACCESS]),
    open_copy_not_read: readNullable(record, 'open_copy_not_read', () => readAddressOn(record, 'open_copy_not_read', location, OPEN_COPY_HOSTS)),
    quote: readQuote(record, 'quote', location),
    quote_location: readEnum(record, 'quote_location', location, [QUOTE_LOCATION]),
  };
}

function rejectRecordedReview(record: Record<string, unknown>, location: FieldLocation): void {
  if (record.human_review === null) return;
  failAt(childOf(location, 'human_review'), 'no person has reviewed a row', 'Leave human_review null; a review is recorded in the review ledger by the repository owner.');
}

export function readRegionEvidenceRow(value: unknown, location: FieldLocation): RegionEvidenceRow {
  const record = readRecord(value, location, { required: ROW_KEYS });
  rejectRecordedReview(record, location);
  const row: RegionEvidenceRow = {
    ...readAnatomyFields(record, location),
    ...readSourceFields(record, location),
    kind: readEnum(record, 'kind', location, EVIDENCE_KINDS),
    claim: readString(record, 'claim', location, MAX_CLAIM_LENGTH),
    evidence_species: readEnum(record, 'evidence_species', location, [EVIDENCE_SPECIES]),
    study_design: readString(record, 'study_design', location, MAX_LABEL_LENGTH),
    n: readNullable(record, 'n', () => readInteger(record, 'n', location, 1)),
    scope_note: readString(record, 'scope_note', location, MAX_NOTE_LENGTH),
    contested: readBoolean(record, 'contested', location),
    rival_view_row: readBoolean(record, 'rival_view_row', location),
    related_sources: readEach(record, 'related_sources', location, readRelatedSource),
    requires_citations: readEach(record, 'requires_citations', location, readRequiredCitation),
    pubmed_notices: readEach(record, 'pubmed_notices', location, (item, itemLocation) => requireEnum(item, itemLocation, PUBMED_NOTICES)),
    crossref_notices: readEach(record, 'crossref_notices', location, readCrossrefNotice),
    verifier_verdict: readEnum(record, 'verifier_verdict', location, VERIFIER_VERDICTS),
    evidence: readRowEvidence(record.evidence, childOf(location, 'evidence')),
    drafted_by: readEnum(record, 'drafted_by', location, [DRAFTED_BY_AI]),
    human_review: null,
    date_checked: readDate(record, 'date_checked', location),
  };
  rejectUnshowableCitations(row, location);
  return row;
}
