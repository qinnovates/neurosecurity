/**
 * No anatomy data file may store a QIF band. A band is derived from the region
 * table at build time; a stored copy would drift from it. This scans keys only:
 * prose that mentions a band is allowed.
 */

import { isRecord } from '@/lib/threat-model/guards';
import { failAt, rootOf } from './field-readers';

const BAND_KEY_PATTERN = /^(qif_)?band(s|_id|_ids)?$/;

/** The path of the first band key anywhere in `value`, or null when there is none. */
export function findBandKey(value: unknown, path = ''): string | null {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const found = findBandKey(item, `${path}[${index}]`);
      if (found !== null) return found;
    }
    return null;
  }
  if (!isRecord(value)) return null;
  for (const [key, child] of Object.entries(value)) {
    const childPath = path === '' ? key : `${path}.${key}`;
    if (BAND_KEY_PATTERN.test(key)) return childPath;
    const found = findBandKey(child, childPath);
    if (found !== null) return found;
  }
  return null;
}

export function rejectBandKeys(raw: unknown, dataFile: string): void {
  const bandKeyPath = findBandKey(raw);
  if (bandKeyPath === null) return;
  failAt(
    { ...rootOf(dataFile), path: bandKeyPath },
    'this file must not store a QIF band',
    'Remove the key; a band is derived from brain_regions[].qif_band at build time.',
  );
}
