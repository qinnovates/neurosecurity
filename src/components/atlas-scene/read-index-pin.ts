import { ANATOMY_INDEX_PATH, type PinnedFile } from '@/lib/anatomy/anatomy-index-types';

/** The attribute AtlasIndexPin.astro writes: the index's path, length and digest as the page was built with them. */
export const INDEX_PIN_ATTRIBUTE = 'data-atlas-index-pin';
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The pin, if the text holds exactly one for this site's index. Anything else is no pin, and the view then draws nothing. */
export function parseIndexPin(text: string): PinnedFile | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    // Text that is not JSON is not a pin. The caller treats a page without a pin as unpinned and says so.
    return null;
  }
  if (!isRecord(value)) return null;
  const { path, bytes, sha256 } = value;
  if (path !== ANATOMY_INDEX_PATH || typeof bytes !== 'number' || !Number.isSafeInteger(bytes) || bytes <= 0) return null;
  return typeof sha256 === 'string' && SHA256_PATTERN.test(sha256) ? { path, bytes, sha256 } : null;
}

/** The index pin this page was built with, read from the page itself, or null when the page carries none. */
export function readIndexPin(root: ParentNode = document): PinnedFile | null {
  const text = root.querySelector(`[${INDEX_PIN_ATTRIBUTE}]`)?.getAttribute(INDEX_PIN_ATTRIBUTE);
  return text === null || text === undefined ? null : parseIndexPin(text);
}
