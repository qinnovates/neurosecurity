/**
 * Typed readers shared by every anatomy parser. Each one names the file and
 * the place of the first problem it finds and says how to fix it, so a parser
 * never has to build that message by hand.
 */

import { isRecord } from '@/lib/threat-model/guards';
import { AnatomyDataError } from './errors';

/** Where a value sits: the data file and a path such as `rows[3].evidence`. */
export interface FieldLocation {
  dataFile: string;
  path: string;
}

export interface RecordKeys {
  required: readonly string[];
  optional?: readonly string[];
}

const ROOT_PATH = '(top level)';
const MAX_SHOWN_LENGTH = 60;
/** The largest magnitude any number in an anatomy file may have. Nothing measured in a brain atlas comes near it. */
export const MAX_NUMBER = 1e9;
/** Control characters and the Unicode marks that reorder or hide text. None belongs in a one-line data field. */
const UNSAFE_CHARACTER_PATTERN = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u2069\uFEFF]/;

/** A short, safe rendering of any JSON value for an error message. Never throws, whatever the value holds. */
export function show(value: unknown): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value) ?? typeof value;
  const visible = text.replace(new RegExp(UNSAFE_CHARACTER_PATTERN, 'g'), '?');
  return visible.length > MAX_SHOWN_LENGTH ? `${visible.slice(0, MAX_SHOWN_LENGTH)}...` : visible;
}

export function rootOf(dataFile: string): FieldLocation {
  return { dataFile, path: ROOT_PATH };
}

export function childOf(parent: FieldLocation, segment: string): FieldLocation {
  return { dataFile: parent.dataFile, path: parent.path === ROOT_PATH ? segment : `${parent.path}.${segment}` };
}

export function itemOf(parent: FieldLocation, key: string, index: number): FieldLocation {
  return childOf(parent, `${key}[${index}]`);
}

export function failAt(location: FieldLocation, problem: string, remedy: string): never {
  throw new AnatomyDataError(location.dataFile, location.path, problem, remedy);
}

/** An object holding every required key and no key outside the two lists. */
export function readRecord(value: unknown, location: FieldLocation, keys: RecordKeys): Record<string, unknown> {
  if (!isRecord(value)) return failAt(location, 'expected an object', 'Write a JSON object here.');
  const allowedKeys = [...keys.required, ...(keys.optional ?? [])];
  const unexpectedKey = Object.keys(value).find((key) => !allowedKeys.includes(key));
  if (unexpectedKey !== undefined) {
    return failAt(location, `unexpected key "${unexpectedKey}"`, `Remove it; the keys allowed here are ${allowedKeys.join(', ')}.`);
  }
  const missingKey = keys.required.find((key) => !Object.hasOwn(value, key));
  if (missingKey !== undefined) return failAt(location, `missing key "${missingKey}"`, `Add "${missingKey}".`);
  return value;
}

/** Non-empty text of at most `maxLength` characters with no control character or hidden direction mark. */
export function requireText(value: unknown, location: FieldLocation, maxLength: number): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) {
    return failAt(location, 'expected a non-empty string', `Write text of at most ${maxLength} characters.`);
  }
  if (UNSAFE_CHARACTER_PATTERN.test(value)) {
    return failAt(location, 'the text holds a control character or a hidden direction mark', 'Remove it; write the text on one line in plain characters.');
  }
  return value;
}

export function readString(record: Record<string, unknown>, key: string, location: FieldLocation, maxLength: number): string {
  return requireText(record[key], childOf(location, key), maxLength);
}

export function requireEnum<T extends string>(value: unknown, location: FieldLocation, allowed: readonly T[]): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    return failAt(location, `"${show(value)}" is not an allowed value`, `Use one of: ${allowed.join(', ')}.`);
  }
  return value as T;
}

export function readEnum<T extends string>(
  record: Record<string, unknown>, key: string, location: FieldLocation, allowed: readonly T[],
): T {
  return requireEnum(record[key], childOf(location, key), allowed);
}

export function requireBoolean(value: unknown, location: FieldLocation): boolean {
  if (typeof value !== 'boolean') return failAt(location, 'expected true or false', 'Write a JSON boolean.');
  return value;
}

export function readBoolean(record: Record<string, unknown>, key: string, location: FieldLocation): boolean {
  return requireBoolean(record[key], childOf(location, key));
}

export function requireNumber(value: unknown, location: FieldLocation, minimum: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || Math.abs(value) > MAX_NUMBER) {
    return failAt(location, 'expected a finite number in range', `Write a number of at least ${minimum} and at most ${MAX_NUMBER}.`);
  }
  return value;
}

export function readNumber(record: Record<string, unknown>, key: string, location: FieldLocation, minimum: number): number {
  return requireNumber(record[key], childOf(location, key), minimum);
}

export function requireInteger(value: unknown, location: FieldLocation, minimum: number): number {
  const number = requireNumber(value, location, minimum);
  if (!Number.isInteger(number)) return failAt(location, 'expected a whole number', 'Remove the fraction.');
  return number;
}

export function readInteger(record: Record<string, unknown>, key: string, location: FieldLocation, minimum: number): number {
  return requireInteger(record[key], childOf(location, key), minimum);
}

export function requireList(value: unknown, location: FieldLocation): unknown[] {
  if (!Array.isArray(value)) return failAt(location, 'expected a list', 'Write a JSON array.');
  return value;
}

export function readList(record: Record<string, unknown>, key: string, location: FieldLocation): unknown[] {
  return requireList(record[key], childOf(location, key));
}

export function readStringList(
  record: Record<string, unknown>, key: string, location: FieldLocation, maxLength: number,
): string[] {
  return readList(record, key, location).map((item, index) => requireText(item, itemOf(location, key, index), maxLength));
}

/** Reads `key` with `read` unless it is null. A missing key is not null: the caller's readRecord lists it as required. */
export function readNullable<T>(record: Record<string, unknown>, key: string, read: () => T): T | null {
  return record[key] === null ? null : read();
}

export function rejectDuplicates(values: readonly string[], location: FieldLocation, what: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) failAt(location, `${what} "${value}" appears twice`, 'Keep one and remove the other.');
    seen.add(value);
  }
}
