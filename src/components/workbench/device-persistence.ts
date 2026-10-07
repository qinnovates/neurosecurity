/**
 * Optional saving of the device in focus to this browser's local storage. Off unless the
 * user turns it on. Nothing here sends anything anywhere: local storage stays on the machine.
 */

import { parseSavedState, serialiseState } from '@/components/threat-model/saved-state';
import type { StudioState } from '@/components/threat-model/studio-state';
import type { DeviceArchetype } from '@/lib/threat-model/reference-data-types';

const REMEMBER_KEY = 'tara-lab:remember';
const DEVICE_KEY = 'tara-lab:device:v1';
const REMEMBER_ON = 'on';

export interface RestoreResult {
  state: StudioState | null;
  /** True when a saved copy existed but could not be trusted and was removed. */
  wasDiscarded: boolean;
}

/** Storage can be blocked by browser settings; every access is guarded and falls back to "not saved". */
function readItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(key: string, value: string | null): boolean {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function isRememberEnabled(): boolean {
  return readItem(REMEMBER_KEY) === REMEMBER_ON;
}

/** Turning this off also deletes the saved device. Returns false when the browser refuses storage. */
export function setRememberEnabled(isEnabled: boolean): boolean {
  if (!isEnabled) writeItem(DEVICE_KEY, null);
  return writeItem(REMEMBER_KEY, isEnabled ? REMEMBER_ON : null);
}

export function saveDevice(state: StudioState): boolean {
  return writeItem(DEVICE_KEY, serialiseState(state));
}

export function restoreDevice(archetypes: readonly DeviceArchetype[], knownRegionIds: ReadonlySet<string>): RestoreResult {
  const saved = isRememberEnabled() ? readItem(DEVICE_KEY) : null;
  if (saved === null) return { state: null, wasDiscarded: false };
  try {
    return { state: parseSavedState(saved, archetypes, knownRegionIds), wasDiscarded: false };
  } catch {
    // A saved copy that fails validation is removed so it cannot fail again on every visit.
    writeItem(DEVICE_KEY, null);
    return { state: null, wasDiscarded: true };
  }
}
