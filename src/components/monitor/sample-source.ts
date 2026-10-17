/**
 * Where the Monitor's synthetic samples come from: static files under the Lab's own route on
 * this site. The requests carry nothing about the device in focus, and what comes back is
 * validated before anything is drawn from it.
 */

import { parseSampleCsv, type SignalSample } from '@/lib/signal/sample-csv';

export const SAMPLE_DIRECTORY = '/atlas/model/samples/';
export const SAMPLE_LIST_FILE = 'index.json';
/** A sample's file name may only be one of the Lab's own neutral names, never a path. */
const SAFE_FILE_NAME = /^sample-\d{2}\.csv$/;

export class SampleLoadError extends Error {
  constructor(what: 'list' | 'sample', detail: string) {
    super(what === 'list'
      ? `The list of samples could not be loaded (${detail}). Reload the page to try again.`
      : `That sample could not be loaded (${detail}). Choose another, or reload the page.`);
    this.name = 'SampleLoadError';
  }
}

async function fetchText(file: string, what: 'list' | 'sample', signal: AbortSignal): Promise<string> {
  let response: Response;
  try {
    response = await fetch(SAMPLE_DIRECTORY + file, { signal, credentials: 'omit' });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new SampleLoadError(what, 'the request did not complete');
  }
  if (!response.ok) throw new SampleLoadError(what, `status ${response.status}`);
  return response.text();
}

function readFileName(entry: unknown): string | null {
  const file = typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>).file : undefined;
  return typeof file === 'string' && SAFE_FILE_NAME.test(file) ? file : null;
}

/** The sample file names the list names, in its order. Entries that are not one of the Lab's own names are dropped. @throws SampleLoadError */
export async function fetchSampleFiles(signal: AbortSignal): Promise<string[]> {
  const text = await fetchText(SAMPLE_LIST_FILE, 'list', signal);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new SampleLoadError('list', 'unexpected format');
  }
  const samples = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>).samples : undefined;
  if (!Array.isArray(samples)) throw new SampleLoadError('list', 'unexpected format');
  return samples.map(readFileName).filter((file): file is string => file !== null);
}

/** One sample, fetched and validated. @throws SampleLoadError, or SampleFormatError when the file is not a usable sample */
export async function fetchSample(file: string, signal: AbortSignal): Promise<SignalSample> {
  if (!SAFE_FILE_NAME.test(file)) throw new SampleLoadError('sample', 'the name is not a sample of this site');
  return parseSampleCsv(await fetchText(file, 'sample', signal));
}
