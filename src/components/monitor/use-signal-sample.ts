import { useEffect, useState } from 'react';
import { SampleFormatError, parseSampleCsv, type SignalSample } from '@/lib/signal/sample-csv';

/** The synthetic samples are static files on this site; nothing about the device in focus is sent to fetch them. */
const SAMPLE_DIRECTORY = '/brain-siem/data/';
const MANIFEST_FILE = 'manifest.json';
/** A sample's file name may only be a plain name in the sample folder, never a path. */
const SAFE_FILE_NAME = /^[a-z0-9_]+\.csv$/;
const MANIFEST_ERROR = 'The list of samples could not be loaded. Reload the page to try again.';
const SAMPLE_ERROR = 'That sample could not be loaded. Choose another, or reload the page.';

export interface SampleListing {
  file: string;
  name: string;
  description: string;
}

function isListing(value: unknown): value is SampleListing {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.file === 'string' && SAFE_FILE_NAME.test(record.file) && typeof record.name === 'string' && typeof record.description === 'string';
}

async function fetchText(file: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(SAMPLE_DIRECTORY + file, { signal, credentials: 'omit' });
  if (!response.ok) throw new Error(`status ${response.status}`);
  return response.text();
}

export interface SampleListState {
  listings: SampleListing[] | null;
  error: string | null;
}

/** The samples the manifest lists. Entries that are not a plain file name in the sample folder are dropped. */
export function useSampleList(): SampleListState {
  const [state, setState] = useState<SampleListState>({ listings: null, error: null });
  useEffect(() => {
    const controller = new AbortController();
    fetchText(MANIFEST_FILE, controller.signal)
      .then((text) => {
        const parsed: unknown = JSON.parse(text);
        const datasets = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>).datasets : undefined;
        if (!Array.isArray(datasets)) throw new Error('unexpected format');
        setState({ listings: datasets.filter(isListing), error: null });
      })
      .catch(() => { if (!controller.signal.aborted) setState({ listings: null, error: MANIFEST_ERROR }); });
    return () => controller.abort();
  }, []);
  return state;
}

export interface SampleState {
  sample: SignalSample | null;
  error: string | null;
}

/** One sample, fetched and validated when its file name changes. */
export function useSignalSample(file: string | null): SampleState {
  const [state, setState] = useState<SampleState>({ sample: null, error: null });
  useEffect(() => {
    setState({ sample: null, error: null });
    if (file === null) return undefined;
    const controller = new AbortController();
    fetchText(file, controller.signal)
      .then((text) => setState({ sample: parseSampleCsv(text), error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ sample: null, error: error instanceof SampleFormatError ? error.message : SAMPLE_ERROR });
      });
    return () => controller.abort();
  }, [file]);
  return state;
}
