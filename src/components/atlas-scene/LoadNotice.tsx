import type { LoadFailure, Loaded } from './explorer-data';

interface Props {
  /** What is being loaded, as the visitor would call it: "the quoted catalog text". */
  what: string;
  state: Loaded<unknown>;
  onRetry: () => void;
}

const FAILURE_SENTENCES: Readonly<Record<LoadFailure['kind'], string>> = {
  unavailable: 'Loading failed. Check your connection and try again.',
  invalid: 'The file arrived but failed its checks, so none of it is shown. Reloading the page may fetch a newer copy.',
  out_of_step: 'The page\'s data files are out of step with each other, so none of it is shown. Reload the page.',
};

/**
 * Says that something is loading, or why it is missing. A file that fails its
 * checks is reported differently from one that could not be fetched, and the
 * rest of the explorer keeps working either way.
 */
export default function LoadNotice({ what, state, onRetry }: Props) {
  if (state.status === 'loading') return <p className="atlas-loading" role="status">Loading {what}…</p>;
  if (state.status !== 'failed') return null;
  return (
    <div className="atlas-failure" role="alert" data-failure={state.failure.kind} data-failure-file={state.failure.file}>
      <p><strong>Not shown: {what}.</strong> {FAILURE_SENTENCES[state.failure.kind]}</p>
      <button type="button" className="atlas-button" onClick={onRetry}>Try again</button>
    </div>
  );
}
