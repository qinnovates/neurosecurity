/**
 * A stand-in for the site's static files in component tests: `fetch` answers
 * from the files the build would serve, or from whatever a test puts in their
 * place. No test reaches a network.
 */

import { vi } from 'vitest';
import { ANATOMY_EVIDENCE_PATH, ANATOMY_INDEX_PATH } from '@/lib/anatomy/anatomy-index-types';
import { loadAnatomyBundle } from '../load-anatomy-data';

const NOT_FOUND = 404;

/** A body to serve, or a status to fail with. */
export type ServedFile = string | { status: number };

export function buildServedFiles(): Record<string, ServedFile> {
  const bundle = loadAnatomyBundle();
  return { [ANATOMY_INDEX_PATH]: bundle.indexJson, [ANATOMY_EVIDENCE_PATH]: bundle.evidenceJson, ...bundle.companionJsonByPath };
}

/** Replaces `fetch` with one that serves `files`. Returns the mock, so a test can read which paths were asked for. */
export function serveFiles(files: Record<string, ServedFile>): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const served = files[String(input)] ?? { status: NOT_FOUND };
    return typeof served === 'string' ? new Response(served) : new Response('', { status: served.status });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function requestedPaths(fetchMock: ReturnType<typeof vi.fn>): string[] {
  return fetchMock.mock.calls.map(([input]) => String(input));
}
