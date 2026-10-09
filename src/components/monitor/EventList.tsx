import DataTable, { type DataTableColumn } from '@/components/lab-kit/DataTable';
import type { SampleMarker } from '@/lib/signal/sample-csv';
import type { ThresholdEvent } from '@/lib/signal/threshold-events';
import { formatMicrovolts, formatSeconds, formatTime } from './monitor-format';

interface Props {
  events: readonly ThresholdEvent[];
  markers: readonly SampleMarker[];
  onSeek: (time: number) => void;
}

/** How many events are listed before the rest are counted; a noisy sample can have hundreds. */
const MAX_LISTED = 40;
const EMPTY_MESSAGE = 'This rule did not fire anywhere in this sample. That is not a clean bill: only this one rule is checked, on a synthetic signal.';

const COLUMNS: readonly DataTableColumn<ThresholdEvent>[] = [
  { id: 'start', header: 'Start', render: (event) => <span className="lab-figure">{formatTime(event.time)}</span>, sortValue: (event) => event.time },
  { id: 'duration', header: 'Duration', render: (event) => formatSeconds(event.endTime - event.time), sortValue: (event) => event.endTime - event.time },
  { id: 'channels', header: 'Channels', render: (event) => event.channelNames.join(', '), sortValue: (event) => event.channelNames.length },
  { id: 'peak', header: 'Peak', render: (event) => formatMicrovolts(event.peakMicrovolts), sortValue: (event) => event.peakMicrovolts },
];

function describeCount(count: number): string {
  return `${count} crossing${count === 1 ? '' : 's'} in this sample. Demonstrations of the rule, not detections.`;
}

/**
 * Stretches of the sample where one stated rule held. They are demonstrations of a rule on a
 * synthetic signal, not detections, and an empty list says only that this rule did not fire.
 * Opening a row moves the playhead to its start.
 */
export default function EventList({ events, markers, onSeek }: Props) {
  return (
    <div className="monitor-events">
      <div className="monitor-events-table">
        <DataTable
          caption={events.length === 0 ? 'Crossings in this sample' : describeCount(events.length)} columns={COLUMNS} rows={events.slice(0, MAX_LISTED)}
          rowKey={(event) => String(event.time)} emptyMessage={EMPTY_MESSAGE} onOpenRow={(event) => onSeek(event.time)}
        />
      </div>
      {events.length > MAX_LISTED && <p className="lab-soft">And {events.length - MAX_LISTED} more. Raise the threshold to see fewer.</p>}
      {markers.length > 0 && <p className="lab-soft">The sample file also carries {markers.length} marker{markers.length === 1 ? '' : 's'} of its own, such as stimulus onsets. They are the dotted lines on the plot.</p>}
    </div>
  );
}
