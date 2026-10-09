/**
 * The published specifications of named devices, as the Lab shows them. Only the columns
 * listed here are read. Nothing about techniques, scores or counts is shown for a named device.
 */

export type SpecRow = Record<string, unknown>;

export interface SpecColumn {
  key: string;
  header: string;
}

export const DEVICES_TABLE = 'devices';
const TYPE_KEY = 'type';
const CHANNELS_KEY = 'channels';
/** Printed as the file holds it, with no rewording. */
const STATUS_KEY = 'fda_status';

export const SPEC_COLUMNS: readonly SpecColumn[] = [
  { key: 'device', header: 'Device' },
  { key: 'company', header: 'Company' },
  { key: TYPE_KEY, header: 'Type' },
  { key: CHANNELS_KEY, header: 'Channels' },
  { key: 'electrode_type', header: 'Electrodes' },
  { key: STATUS_KEY, header: 'Regulatory status, as recorded' },
  { key: 'first_human', header: 'First human use' },
  { key: 'target_use', header: 'Use' },
];

/** What a cell says when the file holds nothing for it. The file writes a missing channel count as 0. */
export const NOT_RECORDED = 'Not recorded';

const SPELLING_SEPARATORS = /[\s_-]+/g;

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === '';
}

/** One label for every spelling of a device type: "non_invasive" and "non-invasive" are shown as one. Display only. */
export function deviceTypeLabel(value: unknown): string {
  return isBlank(value) ? NOT_RECORDED : String(value).trim().toLowerCase().replace(SPELLING_SEPARATORS, ' ');
}

function channelCountOf(row: SpecRow): number | null {
  const value = row[CHANNELS_KEY];
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

/** The text shown in one cell. */
export function readSpecText(row: SpecRow, key: string): string {
  if (key === TYPE_KEY) return deviceTypeLabel(row[key]);
  if (key === CHANNELS_KEY) return channelCountOf(row)?.toLocaleString('en-US') ?? NOT_RECORDED;
  if (isBlank(row[key])) return NOT_RECORDED;
  return key === STATUS_KEY ? String(row[key]) : String(row[key]).replaceAll('_', ' ');
}

/** Columns whose values are codes the file writes in lower case with underscores, not names. */
const CODE_COLUMNS: ReadonlySet<string> = new Set([TYPE_KEY, 'electrode_type', STATUS_KEY]);

/**
 * How a cell is displayed: a code column has its underscores shown as spaces and a capital
 * first letter ("breakthrough_device" as "Breakthrough device"). Display only: search, sort
 * and `readSpecText` keep the value as the file holds it, and names are never re-cased.
 */
export function formatSpecDisplay(row: SpecRow, key: string): string {
  const text = readSpecText(row, key);
  if (!CODE_COLUMNS.has(key) || text === NOT_RECORDED) return text;
  const spaced = text.replaceAll('_', ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Channels sort as numbers, with a count that is not recorded first; every other column sorts as its text. */
export function specSortValue(row: SpecRow, key: string): string | number {
  return key === CHANNELS_KEY ? channelCountOf(row) ?? 0 : readSpecText(row, key);
}

export function isChannelCount(row: SpecRow, key: string): boolean {
  return key === CHANNELS_KEY && channelCountOf(row) !== null;
}

export function specRowKey(row: SpecRow): string {
  return `${readSpecText(row, 'company')}::${readSpecText(row, 'device')}`;
}

export interface DeviceTypeCount {
  label: string;
  count: number;
}

/** One entry per device type after its spellings are merged, by label. */
export function countDeviceTypes(rows: readonly SpecRow[]): DeviceTypeCount[] {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(deviceTypeLabel(row[TYPE_KEY]), (counts.get(deviceTypeLabel(row[TYPE_KEY])) ?? 0) + 1);
  return [...counts].map(([label, count]) => ({ label, count })).sort((left, right) => left.label.localeCompare(right.label));
}

/** Rows of the chosen types whose text in any shown column holds the search text, ignoring case. */
export function filterSpecRows(rows: readonly SpecRow[], typeLabels: readonly string[], text: string): SpecRow[] {
  const needle = text.trim().toLowerCase();
  return rows.filter((row) => (typeLabels.length === 0 || typeLabels.includes(deviceTypeLabel(row[TYPE_KEY])))
    && (needle === '' || SPEC_COLUMNS.some((column) => readSpecText(row, column.key).toLowerCase().includes(needle))));
}
