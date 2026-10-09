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

export function readString(record: Record<string, unknown>, key: string, location: FieldLocation, maxLength: number): string {
  const value = record[key];
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) {
    return failAt(childOf(location, key), 'expected a non-empty string', `Write text of at most ${maxLength} characters.`);
  }
  return value;
}

export function readEnum<T extends string>(
  record: Record<string, unknown>, key: string, location: FieldLocation, allowed: readonly T[],
): T {
  const value = record[key];
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    return failAt(childOf(location, key), `"${String(value)}" is not an allowed value`, `Use one of: ${allowed.join(', ')}.`);
  }
  return value as T;
}

export function readBoolean(record: Record<string, unknown>, key: string, location: FieldLocation): boolean {
  const value = record[key];
  if (typeof value !== 'boolean') return failAt(childOf(location, key), 'expected true or false', 'Write a JSON boolean.');
  return value;
}

export function readNumber(record: Record<string, unknown>, key: string, location: FieldLocation, minimum: number): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) {
    return failAt(childOf(location, key), 'expected a finite number', `Write a number of at least ${minimum}.`);
  }
  return value;
}

export function readInteger(record: Record<string, unknown>, key: string, location: FieldLocation, minimum: number): number {
  const value = readNumber(record, key, location, minimum);
  if (!Number.isInteger(value)) return failAt(childOf(location, key), 'expected a whole number', 'Remove the fraction.');
  return value;
}

export function readList(record: Record<string, unknown>, key: string, location: FieldLocation): unknown[] {
  const value = record[key];
  if (!Array.isArray(value)) return failAt(childOf(location, key), 'expected a list', 'Write a JSON array.');
  return value;
}

export function readStringList(
  record: Record<string, unknown>, key: string, location: FieldLocation, maxLength: number,
): string[] {
  const list = readList(record, key, location);
  const badIndex = list.findIndex((item) => typeof item !== 'string' || item.trim().length === 0 || item.length > maxLength);
  if (badIndex !== -1) {
    return failAt(itemOf(location, key, badIndex), 'expected a non-empty string', `Write text of at most ${maxLength} characters.`);
  }
  return list as string[];
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
