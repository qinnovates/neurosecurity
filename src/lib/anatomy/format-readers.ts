/** Readers for the string formats the anatomy files share: ids, dates, digests, URLs and the schema version. */

import { childOf, failAt, itemOf, readString, readStringList, type FieldLocation } from './field-readers';

const ID_PATTERN = /^[a-z0-9][a-z0-9_]*$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const HTTPS_PROTOCOL = 'https:';
const WEB_PROTOCOLS: readonly string[] = [HTTPS_PROTOCOL, 'http:'];
const MAX_ID_LENGTH = 80;
const MAX_URL_LENGTH = 500;
const SHA256_HEX_LENGTH = 64;
const DATE_LENGTH = 10;

/** Rejects any schema version but the one this build was written for, so a newer file never half-parses. */
export function readSchemaVersion(record: Record<string, unknown>, location: FieldLocation, expected: number): number {
  if (record.schema_version !== expected) {
    failAt(childOf(location, 'schema_version'), `version ${String(record.schema_version)} is not one this build understands`,
      `Use schema_version ${expected}, or update the parser in the same change.`);
  }
  return expected;
}

/** A lower-case snake_case id. */
export function readId(record: Record<string, unknown>, key: string, location: FieldLocation): string {
  const id = readString(record, key, location, MAX_ID_LENGTH);
  if (!ID_PATTERN.test(id)) failAt(childOf(location, key), `"${id}" is not a valid id`, 'Use lower-case letters, digits and underscores.');
  return id;
}

export function readSha256(record: Record<string, unknown>, key: string, location: FieldLocation): string {
  const digest = readString(record, key, location, SHA256_HEX_LENGTH);
  if (!SHA256_PATTERN.test(digest)) failAt(childOf(location, key), 'expected a sha256 digest', 'Write 64 lower-case hexadecimal characters.');
  return digest;
}

/** A calendar date written YYYY-MM-DD that names a real day. */
export function readDate(record: Record<string, unknown>, key: string, location: FieldLocation): string {
  const date = readString(record, key, location, DATE_LENGTH);
  const isRealDay = DATE_PATTERN.test(date) && new Date(`${date}T00:00:00Z`).toISOString().startsWith(date);
  if (!isRealDay) failAt(childOf(location, key), `"${date}" is not a date`, 'Write the date as YYYY-MM-DD.');
  return date;
}

function parseUrl(text: string): URL | null {
  return URL.canParse(text) ? new URL(text) : null;
}

/** A URL the pipeline may download from: HTTPS only. */
export function readHttpsUrl(record: Record<string, unknown>, key: string, location: FieldLocation): string {
  const text = readString(record, key, location, MAX_URL_LENGTH);
  if (parseUrl(text)?.protocol !== HTTPS_PROTOCOL) {
    failAt(childOf(location, key), `"${text}" is not an HTTPS URL`, 'Downloads are HTTPS only; write the https:// address.');
  }
  return text;
}

/** A URL cited for reading, kept as it was read. */
export function readWebUrl(record: Record<string, unknown>, key: string, location: FieldLocation): string {
  const text = readString(record, key, location, MAX_URL_LENGTH);
  const protocol = parseUrl(text)?.protocol;
  if (protocol === undefined || !WEB_PROTOCOLS.includes(protocol)) {
    failAt(childOf(location, key), `"${text}" is not a web address`, 'Write the full http:// or https:// address.');
  }
  return text;
}

export function readWebUrlList(record: Record<string, unknown>, key: string, location: FieldLocation): string[] {
  const urls = readStringList(record, key, location, MAX_URL_LENGTH);
  urls.forEach((url, index) => readWebUrl({ url }, 'url', itemOf(location, key, index)));
  return urls;
}
