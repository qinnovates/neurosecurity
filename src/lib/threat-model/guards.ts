/** Small type guards shared by every parser in this folder. */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

export function isArrayOf<T extends string>(value: unknown, allowed: readonly T[]): value is T[] {
  return Array.isArray(value) && value.every((item) => isOneOf(item, allowed));
}

/**
 * Names the first key that is not allowed, or null when every key is expected.
 * JSON.parse keeps "__proto__" and "constructor" as ordinary own keys, so this
 * also rejects prototype-pollution attempts in imported files.
 */
export function findUnexpectedKey(record: Record<string, unknown>, allowedKeys: readonly string[]): string | null {
  return Object.keys(record).find((key) => !allowedKeys.includes(key)) ?? null;
}

export function findDuplicate(values: readonly string[]): string | null {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return null;
}
