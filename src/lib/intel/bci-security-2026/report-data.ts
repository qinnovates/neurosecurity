/**
 * Loads the Qinnovate Global BCI Landscape Report, 2026 Edition dataset and resolves source ids.
 * The JSON is build-time input; a missing source id is a build failure, not a blank cell.
 */
import reportJson from '@/data/intel/state-of-bci-security-2026.json';
import type { ReportData, ReportSource } from './types';

export const REPORT: ReportData = reportJson as ReportData;

const SOURCE_INDEX: ReadonlyMap<string, ReportSource> = new Map(REPORT.sources.map((source) => [source.id, source]));

export class UnknownSourceError extends Error {
  constructor(sourceId: string) {
    super(`Qinnovate Global BCI Landscape Report, 2026 Edition: source id "${sourceId}" is cited but not listed in sources[]. Add it to src/data/intel/state-of-bci-security-2026.json and to the intake ledger.`);
    this.name = 'UnknownSourceError';
  }
}

export function resolveSource(sourceId: string): ReportSource {
  const source = SOURCE_INDEX.get(sourceId);
  if (!source) throw new UnknownSourceError(sourceId);
  return source;
}

export function resolveSources(sourceIds: readonly string[]): ReportSource[] {
  return sourceIds.map(resolveSource);
}

/** Every source id cited anywhere in the dataset, in first-seen order. */
export function collectCitedSourceIds(report: ReportData = REPORT): string[] {
  const seen = new Set<string>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (value === null || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (key === 'source_ids' && Array.isArray(child)) child.forEach((id) => typeof id === 'string' && seen.add(id));
      else visit(child);
    }
  };
  visit({ ...report, sources: [] });
  return [...seen];
}
