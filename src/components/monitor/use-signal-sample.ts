import { useEffect, useState } from 'react';
import { SampleFormatError, type SignalSample } from '@/lib/signal/sample-csv';
import { SampleLoadError, fetchSample, fetchSampleFiles } from './sample-source';

const UNEXPECTED_LIST_ERROR = 'The list of samples could not be loaded. Reload the page to try again.';
const UNEXPECTED_SAMPLE_ERROR = 'That sample could not be loaded. Choose another, or reload the page.';

function toMessage(error: unknown, fallback: string): string {
  return error instanceof SampleLoadError || error instanceof SampleFormatError ? error.message : fallback;
}

export interface SampleFilesState {
  files: string[] | null;
  error: string | null;
}

/** The sample files this site serves, read once when the Monitor opens. */
export function useSampleFiles(): SampleFilesState {
  const [state, setState] = useState<SampleFilesState>({ files: null, error: null });
  useEffect(() => {
    const controller = new AbortController();
    fetchSampleFiles(controller.signal).then(
      (files) => setState({ files, error: null }),
      (error: unknown) => { if (!controller.signal.aborted) setState({ files: null, error: toMessage(error, UNEXPECTED_LIST_ERROR) }); },
    );
    return () => controller.abort();
  }, []);
  return state;
}

export interface SampleState {
  /** The file the sample was read from; null while nothing is loaded. */
  file: string | null;
  sample: SignalSample | null;
  error: string | null;
}

const NOTHING_LOADED: SampleState = { file: null, sample: null, error: null };

/** One sample, fetched and validated when its file name changes. */
export function useSignalSample(file: string | null): SampleState {
  const [state, setState] = useState<SampleState>(NOTHING_LOADED);
  useEffect(() => {
    setState(NOTHING_LOADED);
    if (file === null) return undefined;
    const controller = new AbortController();
    fetchSample(file, controller.signal).then(
      (sample) => setState({ file, sample, error: null }),
      (error: unknown) => { if (!controller.signal.aborted) setState({ file, sample: null, error: toMessage(error, UNEXPECTED_SAMPLE_ERROR) }); },
    );
    return () => controller.abort();
  }, [file]);
  return state;
}
