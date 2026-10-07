/**
 * Reads one synthetic signal sample: a CSV with a timestamp, a packet number, one column
 * per channel in microvolts, and a marker column. The file comes over the network, so it
 * is validated before anything is drawn from it.
 */

const TIMESTAMP_COLUMN = 'timestamp';
const PACKET_COLUMN = 'package_num';
const MARKER_COLUMN = 'marker';
const MAX_ROWS = 200_000;
const MAX_CHANNELS = 64;

export class SampleFormatError extends Error {
  constructor(detail: string) {
    super(`The sample file could not be read: ${detail}. Choose another sample.`);
    this.name = 'SampleFormatError';
  }
}

export interface SampleMarker {
  /** Seconds from the start of the sample. */
  time: number;
  value: number;
}

export interface SignalSample {
  channelNames: string[];
  /** One array per channel, in microvolts, all the same length. */
  channels: Float32Array[];
  sampleRateHz: number;
  durationSeconds: number;
  /** Rows where the file's own marker column is not zero, for example stimulus onsets. */
  markers: SampleMarker[];
}

function parseHeader(headerLine: string): { channelNames: string[]; firstChannel: number; markerIndex: number } {
  const columns = headerLine.split(',').map((column) => column.trim());
  if (columns[0] !== TIMESTAMP_COLUMN) throw new SampleFormatError(`the first column is "${columns[0] ?? ''}", not "${TIMESTAMP_COLUMN}"`);
  const firstChannel = columns[1] === PACKET_COLUMN ? 2 : 1;
  const markerIndex = columns.lastIndexOf(MARKER_COLUMN);
  const channelNames = columns.slice(firstChannel, markerIndex === -1 ? undefined : markerIndex);
  if (channelNames.length === 0) throw new SampleFormatError('it has no channel columns');
  if (channelNames.length > MAX_CHANNELS) throw new SampleFormatError(`it has ${channelNames.length} channels; the most supported is ${MAX_CHANNELS}`);
  return { channelNames, firstChannel, markerIndex };
}

/** @throws SampleFormatError when the text is not a usable sample */
export function parseSampleCsv(text: string): SignalSample {
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  if (lines.length < 3) throw new SampleFormatError('it has fewer than two rows of data');
  if (lines.length - 1 > MAX_ROWS) throw new SampleFormatError(`it has more than ${MAX_ROWS} rows`);
  const { channelNames, firstChannel, markerIndex } = parseHeader(lines[0]);
  const rowCount = lines.length - 1;
  const channels = channelNames.map(() => new Float32Array(rowCount));
  const markers: SampleMarker[] = [];
  let firstTimestamp = 0;
  let lastTimestamp = 0;

  for (let row = 0; row < rowCount; row += 1) {
    const cells = lines[row + 1].split(',');
    const timestamp = Number(cells[0]);
    if (!Number.isFinite(timestamp)) throw new SampleFormatError(`row ${row + 1} has no usable timestamp`);
    if (row === 0) firstTimestamp = timestamp;
    lastTimestamp = timestamp;
    for (let channel = 0; channel < channels.length; channel += 1) {
      const value = Number(cells[firstChannel + channel]);
      if (!Number.isFinite(value)) throw new SampleFormatError(`row ${row + 1}, channel ${channelNames[channel]} is not a number`);
      channels[channel][row] = value;
    }
    const marker = markerIndex === -1 ? 0 : Number(cells[markerIndex]);
    if (Number.isFinite(marker) && marker !== 0) markers.push({ time: timestamp - firstTimestamp, value: marker });
  }

  const span = lastTimestamp - firstTimestamp;
  if (span <= 0) throw new SampleFormatError('its timestamps do not advance');
  const sampleRateHz = (rowCount - 1) / span;
  return { channelNames, channels, sampleRateHz, durationSeconds: rowCount / sampleRateHz, markers };
}
