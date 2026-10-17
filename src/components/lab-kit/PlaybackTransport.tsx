import type { SequencePlayback } from './motion/use-sequence-playback';

interface Props {
  playback: SequencePlayback;
  stepCount: number;
  /** Accessible name of the group, for example "Chain playback". */
  label: string;
}

/** The controls for anything that plays as a sequence of steps: the same buttons, in the same order, everywhere. */
export default function PlaybackTransport({ playback, stepCount, label }: Props) {
  return (
    <div className="lab-transport" role="group" aria-label={label}>
      <button type="button" className="lab-button lab-button--primary" onClick={playback.isPlaying ? playback.pause : playback.play}>{playback.isPlaying ? 'Pause' : 'Play'}</button>
      <button type="button" className="lab-button" onClick={playback.stepBack}>Back</button>
      <button type="button" className="lab-button" onClick={playback.stepForward}>Step</button>
      <button type="button" className="lab-button" onClick={playback.showAll}>Show all</button>
      <span className="lab-soft" role="status">Step {Math.min(playback.reached, stepCount)} of {stepCount}</span>
    </div>
  );
}
