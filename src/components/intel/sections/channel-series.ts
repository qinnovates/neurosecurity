/** Series definitions for every disclosure-channel chart, so the three statuses keep one color each. */
import type { LegendEntry, StackSeries } from '../chart-types';

export const CHANNEL_SERIES: StackSeries[] = [
  { key: 'found', label: 'Disclosure channel found', colorVar: '--viz-found', labelColorVar: '--viz-on-found' },
  { key: 'none_found', label: 'None found', colorVar: '--viz-none', labelColorVar: '--viz-on-none' },
  { key: 'not_checked', label: 'Could not be checked', colorVar: '--viz-unchecked', labelColorVar: '--viz-on-unchecked' },
];

export const CHANNEL_LEGEND: LegendEntry[] = CHANNEL_SERIES.map((series) => ({ label: series.label, colorVar: series.colorVar }));
