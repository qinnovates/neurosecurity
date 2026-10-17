/**
 * A structured reference to the words a claim rests on: a file, a pointer into
 * it, and the quoted words. The quote is checked against the file at build
 * time, so a claim cannot keep citing text that has since been edited.
 *
 * Pointer syntax: JSON Pointer (RFC 6901: tokens after "/", with ~1 for "/"
 * and ~0 for "~"), with one difference. A token applied to a list selects the
 * item whose `id` equals the token, never a position, because positions shift
 * when a list grows. `/techniques/QIF-T0127/tara/dsm5/pathway` therefore
 * addresses a technique by its id.
 */

import { isRecord } from '@/lib/threat-model/guards';
import { childOf, failAt, readRecord, readString, type FieldLocation } from './field-readers';

export interface SourceRef {
  file: string;
  pointer: string;
  quote: string;
}

export const SOURCE_REF_STATES = {
  QUOTE_FOUND: 'quote_found',
  QUOTE_MISSING: 'quote_missing',
  POINTER_UNRESOLVED: 'pointer_unresolved',
  FILE_NOT_LOADED: 'file_not_loaded',
} as const;
export type SourceRefState = typeof SOURCE_REF_STATES[keyof typeof SOURCE_REF_STATES];

/** Repo-relative JSON files a claim may cite: datalake files and the generated label tables. */
const CITEABLE_FILE_PATTERN = /^(datalake|src\/site\/atlas-assets)\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*\.json$/;
const PARENT_SEGMENT = '..';
const POINTER_SEPARATOR = '/';
const MAX_FILE_LENGTH = 200;
const MAX_POINTER_LENGTH = 300;
const MAX_QUOTE_LENGTH = 500;

export function parseSourceRef(value: unknown, location: FieldLocation): SourceRef {
  const record = readRecord(value, location, { required: ['file', 'pointer', 'quote'] });
  const file = readString(record, 'file', location, MAX_FILE_LENGTH);
  if (!CITEABLE_FILE_PATTERN.test(file) || file.split('/').includes(PARENT_SEGMENT)) {
    failAt(childOf(location, 'file'), `"${file}" is not a file a claim may cite`,
      'Cite a JSON file under datalake/ or src/site/atlas-assets/ by its path from the repository root.');
  }
  const pointer = readString(record, 'pointer', location, MAX_POINTER_LENGTH);
  if (!pointer.startsWith(POINTER_SEPARATOR)) {
    failAt(childOf(location, 'pointer'), `"${pointer}" does not start at the root`,
      'Start the pointer with "/", for example /techniques/QIF-T0127/tara/dsm5/pathway.');
  }
  return { file, pointer, quote: readString(record, 'quote', location, MAX_QUOTE_LENGTH) };
}

function unescapeToken(token: string): string {
  return token.replaceAll('~1', '/').replaceAll('~0', '~');
}

function stepInto(current: unknown, token: string): unknown {
  if (Array.isArray(current)) return current.find((item) => isRecord(item) && item.id === token);
  if (isRecord(current) && Object.hasOwn(current, token)) return current[token];
  return undefined;
}

/** The value at `pointer` in `document`, or undefined when the pointer leads nowhere. */
export function resolvePointer(document: unknown, pointer: string): unknown {
  return pointer
    .split(POINTER_SEPARATOR)
    .slice(1)
    .map(unescapeToken)
    .reduce<unknown>((current, token) => stepInto(current, token), document);
}

/** Whether the quoted words still appear in the text the reference points at. */
export function checkSourceRef(sourceRef: SourceRef, documentsByFile: ReadonlyMap<string, unknown>): SourceRefState {
  if (!documentsByFile.has(sourceRef.file)) return SOURCE_REF_STATES.FILE_NOT_LOADED;
  const text = resolvePointer(documentsByFile.get(sourceRef.file), sourceRef.pointer);
  if (typeof text !== 'string') return SOURCE_REF_STATES.POINTER_UNRESOLVED;
  return text.includes(sourceRef.quote) ? SOURCE_REF_STATES.QUOTE_FOUND : SOURCE_REF_STATES.QUOTE_MISSING;
}
