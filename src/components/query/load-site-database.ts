/**
 * Loads the site's query database: the same generated file the catalog pages use.
 * It is a same-origin GET of a static file and carries nothing about the device in focus.
 */

import type { TableData } from '@/lib/kql-engine';

const SITE_DATABASE_PATH = '/data/kql-tables.json';

export class SiteDatabaseError extends Error {
  constructor(detail: string) {
    super(`The TARA database could not be loaded (${detail}). Device tables still work.`);
    this.name = 'SiteDatabaseError';
  }
}

function isTableData(value: unknown): value is TableData {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && Object.values(value).every((rows) => Array.isArray(rows));
}

/** @throws SiteDatabaseError when the file is missing or malformed */
export async function loadSiteDatabase(signal: AbortSignal): Promise<TableData> {
  let response: Response;
  try {
    response = await fetch(SITE_DATABASE_PATH, { signal, credentials: 'omit' });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new SiteDatabaseError('the request did not complete');
  }
  if (!response.ok) throw new SiteDatabaseError(`status ${response.status}`);
  const parsed: unknown = await response.json().catch(() => null);
  if (!isTableData(parsed)) throw new SiteDatabaseError('unexpected format');
  return parsed;
}
