/**
 * Parses datalake/qif-anatomy-h01-card.json: a five-sentence card about the H01
 * sample of human cortex, the sourced facts each sentence rests on, the figures
 * that differ between sources, and what the card must not imply. AI-drafted and
 * AI-checked; no person has reviewed it.
 *
 * A card sentence may only cite facts the file holds, so no sentence can be
 * shown without a quote behind it.
 */

import {
  childOf, failAt, itemOf, readBoolean, readEnum, readInteger, readList, readRecord, readString, readStringList, rejectDuplicates, rootOf, type FieldLocation,
} from './field-readers';
import { readDate, readId } from './format-readers';
import { readAddressOn, readDoi, MAX_QUOTE_LENGTH } from './literature-readers';

export const H01_CARD_FILE = 'datalake/qif-anatomy-h01-card.json';
export const H01_CARD_PATH = '/atlas/anatomy-h01-card.json';
export const H01_CARD_STATUS = 'AI-drafted, then checked by a second AI verifier and corrected. Not reviewed by a person. Every fact carries its own source URL and verbatim quote.';

export const H01_SOURCE_VERSIONS = ['accepted_manuscript_pmc', 'release_page', 'version_of_record_abstract'] as const;
export type H01SourceVersion = typeof H01_SOURCE_VERSIONS[number];

const SOURCE_HOSTS = ['api.crossref.org', 'eutils.ncbi.nlm.nih.gov', 'h01-release.storage.googleapis.com'];
const RELEASE_HOSTS = ['h01-release.storage.googleapis.com'];
const FILE_KEYS = [
  'status', 'date_checked', 'paper', 'release_page', 'data_page', 'source_version_note', 'facts_by_source_version', 'facts',
  'numbers_that_differ_by_source', 'must_not_imply', 'card',
] as const;
const PAPER_KEYS = ['doi', 'url', 'title', 'journal', 'volume', 'issue', 'first_author', 'year', 'author_count', 'doi_matches', 'first_author_matches', 'year_matches'] as const;
const FACT_KEYS = ['id', 'fact', 'quote', 'quote_location', 'source_url', 'source_description', 'source_version', 'drafted_by', 'human_review', 'date_checked'] as const;
const CARD_KEYS = ['title', 'sentences', 'attribution_line', 'drafting_notes'] as const;
const DRAFTED_BY_AI = 'ai';
const MAX_SHORT_LENGTH = 120;
const MAX_TEXT_LENGTH = 500;
const FIRST_PRINTED_YEAR = 1900;

export interface H01Paper {
  doi: string;
  url: string;
  title: string;
  journal: string;
  volume: string;
  issue: string;
  first_author: string;
  year: number;
  author_count: number;
  doi_matches: boolean;
  first_author_matches: boolean;
  year_matches: boolean;
}

export interface H01Fact {
  id: string;
  fact: string;
  quote: string;
  quote_location: string;
  source_url: string;
  source_description: string;
  source_version: H01SourceVersion;
  drafted_by: typeof DRAFTED_BY_AI;
  human_review: null;
  date_checked: string;
}

export interface H01DifferingNumber {
  quantity: string;
  values: Array<{ value: string; fact_id: string }>;
  note: string;
}

export interface H01CardSentence {
  text: string;
  fact_ids: string[];
}

export interface H01Card {
  status: string;
  date_checked: string;
  paper: H01Paper;
  release_page: string;
  data_page: string;
  source_version_note: string;
  facts_by_source_version: Record<H01SourceVersion, number>;
  facts: H01Fact[];
  numbers_that_differ_by_source: H01DifferingNumber[];
  must_not_imply: string[];
  card: { title: string; sentences: H01CardSentence[]; attribution_line: string; drafting_notes: string };
}

function readPaper(value: unknown, location: FieldLocation): H01Paper {
  const record = readRecord(value, location, { required: PAPER_KEYS });
  return {
    doi: readDoi(record, 'doi', location),
    url: readAddressOn(record, 'url', location, SOURCE_HOSTS),
    title: readString(record, 'title', location, MAX_TEXT_LENGTH),
    journal: readString(record, 'journal', location, MAX_SHORT_LENGTH),
    volume: readString(record, 'volume', location, MAX_SHORT_LENGTH),
    issue: readString(record, 'issue', location, MAX_SHORT_LENGTH),
    first_author: readString(record, 'first_author', location, MAX_SHORT_LENGTH),
    year: readInteger(record, 'year', location, FIRST_PRINTED_YEAR),
    author_count: readInteger(record, 'author_count', location, 1),
    doi_matches: readBoolean(record, 'doi_matches', location),
    first_author_matches: readBoolean(record, 'first_author_matches', location),
    year_matches: readBoolean(record, 'year_matches', location),
  };
}

function readFact(value: unknown, location: FieldLocation): H01Fact {
  const record = readRecord(value, location, { required: FACT_KEYS });
  if (record.human_review !== null) failAt(childOf(location, 'human_review'), 'no person has reviewed a fact', 'Leave human_review null.');
  return {
    id: readId(record, 'id', location),
    fact: readString(record, 'fact', location, MAX_TEXT_LENGTH),
    quote: readString(record, 'quote', location, MAX_QUOTE_LENGTH),
    quote_location: readString(record, 'quote_location', location, MAX_SHORT_LENGTH),
    source_url: readAddressOn(record, 'source_url', location, SOURCE_HOSTS),
    source_description: readString(record, 'source_description', location, MAX_TEXT_LENGTH),
    source_version: readEnum(record, 'source_version', location, H01_SOURCE_VERSIONS),
    drafted_by: readEnum(record, 'drafted_by', location, [DRAFTED_BY_AI]),
    human_review: null,
    date_checked: readDate(record, 'date_checked', location),
  };
}

function readDifferingNumber(value: unknown, location: FieldLocation): H01DifferingNumber {
  const record = readRecord(value, location, { required: ['quantity', 'values', 'note'] });
  return {
    quantity: readString(record, 'quantity', location, MAX_SHORT_LENGTH),
    values: readList(record, 'values', location).map((item, index) => {
      const itemLocation = itemOf(location, 'values', index);
      const entry = readRecord(item, itemLocation, { required: ['value', 'fact_id'] });
      return { value: readString(entry, 'value', itemLocation, MAX_SHORT_LENGTH), fact_id: readId(entry, 'fact_id', itemLocation) };
    }),
    note: readString(record, 'note', location, MAX_TEXT_LENGTH),
  };
}

function readCard(value: unknown, location: FieldLocation): H01Card['card'] {
  const record = readRecord(value, location, { required: CARD_KEYS });
  return {
    title: readString(record, 'title', location, MAX_SHORT_LENGTH),
    sentences: readList(record, 'sentences', location).map((item, index) => {
      const itemLocation = itemOf(location, 'sentences', index);
      const sentence = readRecord(item, itemLocation, { required: ['text', 'fact_ids'] });
      return { text: readString(sentence, 'text', itemLocation, MAX_TEXT_LENGTH), fact_ids: readStringList(sentence, 'fact_ids', itemLocation, MAX_SHORT_LENGTH) };
    }),
    attribution_line: readString(record, 'attribution_line', location, MAX_TEXT_LENGTH),
    drafting_notes: readString(record, 'drafting_notes', location, MAX_TEXT_LENGTH),
  };
}

function readVersionTally(value: unknown, location: FieldLocation): Record<H01SourceVersion, number> {
  const record = readRecord(value, location, { required: H01_SOURCE_VERSIONS });
  return Object.fromEntries(H01_SOURCE_VERSIONS.map((version) => [version, readInteger(record, version, location, 0)])) as Record<H01SourceVersion, number>;
}

/** Every sentence and every differing figure cites facts the file holds, and the tally by source matches the facts. */
function checkReferences(card: H01Card, root: FieldLocation): void {
  const factIds = new Set(card.facts.map((fact) => fact.id));
  rejectDuplicates(card.facts.map((fact) => fact.id), childOf(root, 'facts'), 'fact id');
  const uncited = card.card.sentences.find((sentence) => sentence.fact_ids.length === 0);
  if (uncited !== undefined) failAt(childOf(root, 'card.sentences'), 'a card sentence cites no fact', 'Name the facts the sentence rests on in fact_ids.');
  const cited = [...card.card.sentences.flatMap((sentence) => sentence.fact_ids), ...card.numbers_that_differ_by_source.flatMap((number) => number.values.map((entry) => entry.fact_id))];
  const unknownId = cited.find((factId) => !factIds.has(factId));
  if (unknownId !== undefined) failAt(root, `"${unknownId}" is cited but is not a fact in this file`, 'Add the fact with its source and quote, or remove the citation.');
  const mistallied = H01_SOURCE_VERSIONS.find((version) => card.facts.filter((fact) => fact.source_version === version).length !== card.facts_by_source_version[version]);
  if (mistallied !== undefined) failAt(childOf(root, `facts_by_source_version.${mistallied}`), 'the tally differs from the facts', 'Regenerate the file so its tallies match its facts.');
  if (card.must_not_imply.length === 0) failAt(childOf(root, 'must_not_imply'), 'the card must say what it must not imply', 'Restore the list.');
}

/** @throws AnatomyDataError naming the first field that is wrong */
export function parseH01Card(raw: unknown): H01Card {
  const root = rootOf(H01_CARD_FILE);
  const record = readRecord(raw, root, { required: FILE_KEYS });
  if (record.status !== H01_CARD_STATUS) failAt(childOf(root, 'status'), 'the status sentence differs from the one this file must carry', `Restore it to: "${H01_CARD_STATUS}"`);
  const card: H01Card = {
    status: H01_CARD_STATUS,
    date_checked: readDate(record, 'date_checked', root),
    paper: readPaper(record.paper, childOf(root, 'paper')),
    release_page: readAddressOn(record, 'release_page', root, RELEASE_HOSTS),
    data_page: readAddressOn(record, 'data_page', root, RELEASE_HOSTS),
    source_version_note: readString(record, 'source_version_note', root, MAX_TEXT_LENGTH),
    facts_by_source_version: readVersionTally(record.facts_by_source_version, childOf(root, 'facts_by_source_version')),
    facts: readList(record, 'facts', root).map((fact, index) => readFact(fact, itemOf(root, 'facts', index))),
    numbers_that_differ_by_source: readList(record, 'numbers_that_differ_by_source', root).map((number, index) => readDifferingNumber(number, itemOf(root, 'numbers_that_differ_by_source', index))),
    must_not_imply: readStringList(record, 'must_not_imply', root, MAX_TEXT_LENGTH),
    card: readCard(record.card, childOf(root, 'card')),
  };
  checkReferences(card, root);
  return card;
}
