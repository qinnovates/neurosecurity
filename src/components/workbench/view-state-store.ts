/**
 * Where each view keeps the reader's place: filters, sort, layout, the opened item, scroll.
 * It lives above the modes, so it survives a change of tab, mode or history entry, and it is
 * mirrored to this browser's session storage so a reload keeps it. Session storage stays on
 * the machine and ends with the tab. What is read back from it is treated as untrusted.
 */

const STORAGE_KEY = 'tara-lab:view-state:v1';
const MAX_STORED_CHARACTERS = 200_000;
const MAX_STORED_KEYS = 400;
const MAX_KEY_LENGTH = 120;
/** Lower-case words joined by "/", "-" or "_": "explore/catalog/filters". */
const KEY_PATTERN = /^[a-z0-9]+(?:[/_-][a-z0-9]+)*$/;
const MAX_TEXT_LENGTH = 2_000;
const MAX_LIST_LENGTH = 500;
const MAX_SHAPE_DEPTH = 6;

type Listener = () => void;

export interface ViewStateStore {
  /** The value under a key, or undefined when nothing is held. The same reference until it is written again. */
  read: (key: string) => unknown;
  /** Holds a value; undefined removes the key. */
  write: (key: string, value: unknown) => void;
  /** Removes every key that starts with the prefix. */
  clearPrefix: (prefix: string) => void;
  subscribe: (listener: Listener) => () => void;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBoundedPrimitive(value: unknown): boolean {
  if (typeof value === 'string') return value.length <= MAX_TEXT_LENGTH;
  if (typeof value === 'number') return Number.isFinite(value);
  return typeof value === 'boolean';
}

function isUsableKey(key: string): boolean {
  return key.length <= MAX_KEY_LENGTH && KEY_PATTERN.test(key);
}

/**
 * The validator for stored text. Anything that is not a bounded JSON object with well-formed
 * keys yields nothing, so a corrupt or tampered copy falls back to every view's defaults.
 */
export function parseStoredViewState(text: string | null): Map<string, unknown> {
  const entries = new Map<string, unknown>();
  if (text === null || text.length > MAX_STORED_CHARACTERS) return entries;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Not JSON: the stored copy is ignored and every view opens on its defaults.
    return entries;
  }
  if (!isPlainRecord(parsed)) return entries;
  const pairs = Object.entries(parsed);
  if (pairs.length > MAX_STORED_KEYS) return entries;
  for (const [key, value] of pairs) {
    if (isUsableKey(key) && value !== null) entries.set(key, value);
  }
  return entries;
}

/**
 * True when a value has the same shape as a sample: the same primitive type, a list of the
 * same kind of item, or an object with exactly the same fields. A null in the sample accepts
 * null or one bounded primitive. This is what `useViewState` checks when given no validator.
 */
export function matchesShape(value: unknown, sample: unknown, depth = 0): boolean {
  if (depth > MAX_SHAPE_DEPTH) return false;
  if (sample === null) return value === null || isBoundedPrimitive(value);
  if (Array.isArray(sample)) {
    if (!Array.isArray(value) || value.length > MAX_LIST_LENGTH) return false;
    return value.every((item) => (sample.length > 0 ? matchesShape(item, sample[0], depth + 1) : isBoundedPrimitive(item)));
  }
  if (isPlainRecord(sample)) {
    if (!isPlainRecord(value)) return false;
    const sampleKeys = Object.keys(sample);
    if (Object.keys(value).length !== sampleKeys.length) return false;
    return sampleKeys.every((key) => Object.hasOwn(value, key) && matchesShape(value[key], sample[key], depth + 1));
  }
  return typeof value === typeof sample && isBoundedPrimitive(value);
}

/** Session storage can be blocked by browser settings; without it the state lasts as long as the page. */
export function findSessionStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    // Access itself can throw when storage is disabled; the Lab then keeps view state in memory only.
    return null;
  }
}

function readStoredText(storage: Storage | null): string | null {
  try {
    return storage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    // A refused read is the same as an empty store.
    return null;
  }
}

function writeStoredText(storage: Storage | null, entries: ReadonlyMap<string, unknown>): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // A full or blocked store costs only the copy that survives a reload; the page keeps working from memory.
  }
}

export function createViewStateStore(storage: Storage | null = findSessionStorage()): ViewStateStore {
  const entries = parseStoredViewState(readStoredText(storage));
  const listeners = new Set<Listener>();
  const announce = (): void => {
    writeStoredText(storage, entries);
    for (const listener of listeners) listener();
  };

  return {
    read: (key) => entries.get(key),
    write: (key, value) => {
      if (!isUsableKey(key)) throw new Error(`View state key "${key}" is not valid. Use lower-case words joined by "/" or "-".`);
      if (Object.is(entries.get(key), value)) return;
      if (value === undefined) entries.delete(key);
      else entries.set(key, value);
      announce();
    },
    clearPrefix: (prefix) => {
      const doomedKeys = [...entries.keys()].filter((key) => key.startsWith(prefix));
      if (doomedKeys.length === 0) return;
      for (const key of doomedKeys) entries.delete(key);
      announce();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}
