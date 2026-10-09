/**
 * Parser for the US requirements list. A requirement is only accepted with a source,
 * the date that source was read, and a quote from it, so an entry cannot ship on a
 * bare assertion.
 */

import { LINK_MEDIA, SUBMISSION_TYPES } from './device-model';
import { ThreatModelDataError } from './errors';
import { findDuplicate, isArrayOf, isBoundedString, isOneOf, isRecord } from './guards';
import {
  REQUIREMENT_AUDIENCES, REQUIREMENT_EVIDENCE_KINDS, REQUIREMENT_FORCES,
  type ComplianceData, type ComplianceRequirement, type ComplianceSource,
} from './reference-data-types';

const DATA_FILE = 'datalake/threat-model/compliance-us.json';
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const HTTPS_URL_PATTERN = /^https:\/\/[^\s]+$/;
const MIN_QUOTE_LENGTH = 20;
const MAX_TEXT_LENGTH = 600;

function findSourceProblem(value: unknown): string | null {
  if (!isRecord(value)) return 'must be an object';
  if (!isBoundedString(value.id, MAX_TEXT_LENGTH)) return 'needs an id';
  if (!isBoundedString(value.title, MAX_TEXT_LENGTH)) return 'needs a title';
  if (typeof value.url !== 'string' || !HTTPS_URL_PATTERN.test(value.url)) return 'needs an https URL';
  const hasDate = typeof value.dateRead === 'string' && ISO_DATE_PATTERN.test(value.dateRead);
  return hasDate ? null : 'needs a dateRead in YYYY-MM-DD form';
}

function findRequirementProblem(value: unknown, sourceIds: ReadonlySet<string>): string | null {
  if (!isRecord(value)) return 'must be an object';
  if (!isBoundedString(value.id, MAX_TEXT_LENGTH)) return 'needs an id';
  if (!isBoundedString(value.title, MAX_TEXT_LENGTH)) return 'needs a title';
  if (typeof value.sourceId !== 'string' || !sourceIds.has(value.sourceId)) return 'names a sourceId that is not in "sources"';
  if (!isOneOf(value.force, REQUIREMENT_FORCES)) return 'needs force "statutory" or "guidance"';
  if (!isOneOf(value.appliesTo, REQUIREMENT_AUDIENCES)) return 'needs appliesTo "marketing" or "ide"';
  if (!isOneOf(value.evidence, REQUIREMENT_EVIDENCE_KINDS)) return 'has an unknown evidence kind';
  if (!isBoundedString(value.suggestedFix, MAX_TEXT_LENGTH)) return 'needs a suggestedFix';
  const hasQuote = isBoundedString(value.quote, MAX_TEXT_LENGTH) && value.quote.length >= MIN_QUOTE_LENGTH;
  return hasQuote ? null : `needs a supporting quote of at least ${MIN_QUOTE_LENGTH} characters from its source`;
}

function parseList<T>(values: unknown, listName: string, findProblem: (value: unknown) => string | null): T[] {
  if (!Array.isArray(values) || values.length === 0) {
    throw new ThreatModelDataError(DATA_FILE, `"${listName}" must be a non-empty list`);
  }
  for (const [index, value] of values.entries()) {
    const problem = findProblem(value);
    if (problem !== null) throw new ThreatModelDataError(DATA_FILE, `${listName}[${index}] ${problem}`);
  }
  return values as T[];
}

export function parseComplianceUs(raw: unknown): ComplianceData {
  const fail = (message: string): never => { throw new ThreatModelDataError(DATA_FILE, message); };
  if (!isRecord(raw) || raw.jurisdiction !== 'US') return fail('the top level must be an object with jurisdiction "US"');
  if (!isArrayOf(raw.marketingSubmissionTypes, SUBMISSION_TYPES)) return fail('"marketingSubmissionTypes" must list known submission types');
  if (!isBoundedString(raw.version, MAX_TEXT_LENGTH)) return fail('"version" must be a string');
  if (!isBoundedString(raw.status, MAX_TEXT_LENGTH)) return fail('"status" must say how far the list has been reviewed');
  if (!isRecord(raw.internetCapableMedia) || !isArrayOf(raw.internetCapableMedia.media, LINK_MEDIA)) {
    return fail('"internetCapableMedia.media" must list known link types');
  }
  const mediaQuote = raw.internetCapableMedia.quote;
  if (!isBoundedString(mediaQuote, MAX_TEXT_LENGTH) || mediaQuote.length < MIN_QUOTE_LENGTH) {
    return fail(`"internetCapableMedia.quote" must quote its source in at least ${MIN_QUOTE_LENGTH} characters`);
  }

  const sources = parseList<ComplianceSource>(raw.sources, 'sources', findSourceProblem);
  const sourceIds = new Set(sources.map((source) => source.id));
  const requirements = parseList<ComplianceRequirement>(
    raw.requirements, 'requirements', (value) => findRequirementProblem(value, sourceIds),
  );
  const duplicateId = findDuplicate(requirements.map((requirement) => requirement.id));
  if (duplicateId !== null) return fail(`the requirement id "${duplicateId}" is used more than once`);

  return {
    jurisdiction: 'US',
    version: raw.version,
    status: raw.status,
    sources,
    marketingSubmissionTypes: raw.marketingSubmissionTypes,
    internetCapableMedia: raw.internetCapableMedia.media,
    internetCapableMediaQuote: mediaQuote,
    requirements,
  };
}
