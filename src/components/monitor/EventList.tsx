import type { SampleMarker } from '@/lib/signal/sample-csv';
import type { ThresholdEvent } from '@/lib/signal/threshold-events';

interface Props {
  events: readonly ThresholdEvent[];
  markers: readonly SampleMarker[];
  thresholdMicrovolts: number;
  thresholdOptions: readonly number[];
  onThresholdChange: (thresholdMicrovolts: number) => void;
  /** The playhead, so events still ahead are drawn quieter. */
  time: number;
  onSeek: (time: number) => void;
  formatTime: (seconds: number) => string;
}

/** How many events are listed before the rest are counted; a noisy sample can have hundreds. */
const MAX_LISTED = 40;

/**
 * Moments in the sample where one stated rule fired. They are demonstrations of a rule on
 * a synthetic signal, not detections, and an empty list says only that this rule did not fire.
 */
export default function EventList({ events, markers, thresholdMicrovolts, thresholdOptions, onThresholdChange, time, onSeek, formatTime }: Props) {
  return (
    <div className="monitor-events">
      <label className="monitor-rule">
        <span>Rule: any channel beyond</span>
        <select className="catalog-select" style={{ width: 'auto' }} value={thresholdMicrovolts} onChange={(event) => onThresholdChange(Number(event.target.value))}>
          {thresholdOptions.map((option) => <option key={option} value={option}>{option} µV</option>)}
        </select>
      </label>
      {events.length === 0 ? (
        <p className="lab-soft">This rule did not fire anywhere in this sample. That is not a clean bill: only this one rule is checked, on a synthetic signal.</p>
      ) : (
        <>
          <p className="lab-soft" role="status">{events.length} crossing{events.length === 1 ? '' : 's'} in this sample. Demonstrations of the rule, not detections.</p>
          <ol className="monitor-event-list">
            {events.slice(0, MAX_LISTED).map((event) => (
              <li key={event.time} data-ahead={event.time > time}>
                <button type="button" className="monitor-event" onClick={() => onSeek(event.time)}>
                  <span className="lab-figure">{formatTime(event.time)}</span>
                  <span>{event.channelNames.join(', ')}</span>
                  <span className="lab-soft">peak {Math.round(event.peakMicrovolts)} µV</span>
                </button>
              </li>
            ))}
          </ol>
          {events.length > MAX_LISTED && <p className="lab-soft">And {events.length - MAX_LISTED} more. Raise the threshold to see fewer.</p>}
        </>
      )}
      {markers.length > 0 && <p className="lab-soft">The sample file also carries {markers.length} marker{markers.length === 1 ? '' : 's'} of its own, such as stimulus onsets. They are the dotted lines on the plot.</p>}
    </div>
  );
}
