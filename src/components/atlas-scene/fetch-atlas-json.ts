/**
 * Fetches the atlas's own static JSON files from this site. Every failure is a
 * typed error that says which file and why, so the explorer can tell "could not
 * be fetched" from "fetched but wrong".
 */

import type { PinnedFile } from '@/lib/anatomy/anatomy-index-types';

export const ATLAS_FETCH_FAILURES = ['network', 'http_status', 'not_json', 'pin_mismatch'] as const;
export type AtlasFetchFailure = typeof ATLAS_FETCH_FAILURES[number];

/** A static atlas file could not be fetched, or what arrived is not the file the index pinned. */
export class AtlasFetchError extends Error {
  readonly path: string;
  readonly failure: AtlasFetchFailure;

  constructor(path: string, failure: AtlasFetchFailure, detail: string) {
    super(`Could not load ${path}: ${detail}. Check the connection and reload the page.`);
    this.name = 'AtlasFetchError';
    this.path = path;
    this.failure = failure;
  }
}

const SITE_PATH_PATTERN = /^\/atlas\/[a-z0-9-]+\.json$/;
const SHA256_ALGORITHM = 'SHA-256';
const HEX_RADIX = 16;
const HEX_BYTE_WIDTH = 2;

async function fetchBytes(path: string, cache: RequestCache, signal: AbortSignal): Promise<Uint8Array> {
  if (!SITE_PATH_PATTERN.test(path)) throw new AtlasFetchError(path, 'network', 'the address is not one of this site\'s atlas files');
  let response: Response;
  try {
    response = await fetch(path, { cache, signal, credentials: 'omit', redirect: 'error' });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new AtlasFetchError(path, 'network', 'the request did not complete');
  }
  if (!response.ok) throw new AtlasFetchError(path, 'http_status', `the server answered ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

function parseJsonBytes(path: string, bytes: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch (error) {
    throw new AtlasFetchError(path, 'not_json', `the file is not JSON (${error instanceof Error ? error.name : 'unknown error'})`);
  }
}

/** Fetches a site JSON file. What it returns is untrusted until a parser has read it. */
export async function fetchAtlasJson(path: string, signal: AbortSignal): Promise<unknown> {
  return parseJsonBytes(path, await fetchBytes(path, 'default', signal));
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest(SHA256_ALGORITHM, bytes as BufferSource));
  return [...digest].map((byte) => byte.toString(HEX_RADIX).padStart(HEX_BYTE_WIDTH, '0')).join('');
}

/**
 * Whether the bytes are the pinned file. Outside a secure context the browser
 * offers no digest, so only the length is compared; the caller's parser still
 * reads every field before anything is shown.
 */
async function matchesPin(bytes: Uint8Array, pin: PinnedFile): Promise<boolean> {
  if (bytes.byteLength !== pin.bytes) return false;
  if (globalThis.crypto?.subtle === undefined) return true;
  return (await sha256Hex(bytes)) === pin.sha256;
}

/**
 * Fetches a file the index pins and checks it is that file. A mismatch is
 * retried once past the cache, then reported; it is never used unchecked.
 */
export async function fetchPinnedJson(pin: PinnedFile, signal: AbortSignal): Promise<unknown> {
  const cached = await fetchBytes(pin.path, 'default', signal);
  if (await matchesPin(cached, pin)) return parseJsonBytes(pin.path, cached);
  const fresh = await fetchBytes(pin.path, 'reload', signal);
  if (await matchesPin(fresh, pin)) return parseJsonBytes(pin.path, fresh);
  throw new AtlasFetchError(pin.path, 'pin_mismatch', 'the file differs from the one this page\'s index was built with');
}
