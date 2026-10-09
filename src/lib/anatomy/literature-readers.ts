/** Readers for the fields a literature citation carries: identifiers, quotes and the addresses a record was read at. */

import { childOf, failAt, readString, type FieldLocation } from './field-readers';

const DOI_PATTERN = /^10\.\d{4,9}\/[^\s"<>]+$/;
const PMID_PATTERN = /^[1-9]\d{0,8}$/;
const HTTPS_PROTOCOL = 'https:';
const MAX_DOI_LENGTH = 120;
const MAX_PMID_LENGTH = 9;
const MAX_URL_LENGTH = 300;
const WORD_SEPARATOR_PATTERN = /\s+/;

/** The longest verbatim quote a row may carry, in words. A longer one is no longer a short quotation. */
export const MAX_QUOTE_WORDS = 40;
export const MAX_QUOTE_LENGTH = 400;

export const DOI_RESOLVER_ORIGIN = 'https://doi.org/';
export const PUBMED_ORIGIN = 'https://pubmed.ncbi.nlm.nih.gov/';

export function readDoi(record: Record<string, unknown>, key: string, location: FieldLocation): string {
  const doi = readString(record, key, location, MAX_DOI_LENGTH);
  if (!DOI_PATTERN.test(doi)) failAt(childOf(location, key), `"${doi}" is not a DOI`, 'Write the DOI alone, starting with "10.", with no resolver address.');
  return doi;
}

export function readPmid(record: Record<string, unknown>, key: string, location: FieldLocation): string {
  const pmid = readString(record, key, location, MAX_PMID_LENGTH);
  if (!PMID_PATTERN.test(pmid)) failAt(childOf(location, key), `"${pmid}" is not a PubMed id`, 'Write the PubMed id as digits only.');
  return pmid;
}

/** A verbatim quote of at most MAX_QUOTE_WORDS words. */
export function readQuote(record: Record<string, unknown>, key: string, location: FieldLocation): string {
  const quote = readString(record, key, location, MAX_QUOTE_LENGTH);
  if (quote.trim().split(WORD_SEPARATOR_PATTERN).length > MAX_QUOTE_WORDS) {
    failAt(childOf(location, key), `the quote is longer than ${MAX_QUOTE_WORDS} words`, 'Quote one contiguous passage of at most that length.');
  }
  return quote;
}

/** An HTTPS address on one of the hosts named, with no credentials in it. It records where something was read. */
export function readAddressOn(record: Record<string, unknown>, key: string, location: FieldLocation, allowedHosts: readonly string[]): string {
  const text = readString(record, key, location, MAX_URL_LENGTH);
  const url = URL.canParse(text) ? new URL(text) : null;
  const isAllowed = url !== null && url.protocol === HTTPS_PROTOCOL && url.username === '' && url.password === '' && allowedHosts.includes(url.hostname);
  if (!isAllowed) {
    failAt(childOf(location, key), `"${text}" is not an HTTPS address on an expected host`, `Use an https:// address on one of: ${allowedHosts.join(', ')}.`);
  }
  return text;
}

/** The address a reader is sent to for a DOI. Built here, never read from a data file. */
export function doiAddress(doi: string): string {
  return `${DOI_RESOLVER_ORIGIN}${encodeURI(doi)}`;
}

/** The address a reader is sent to for a PubMed record. Built here, never read from a data file. */
export function pubmedAddress(pmid: string): string {
  return `${PUBMED_ORIGIN}${encodeURIComponent(pmid)}/`;
}
