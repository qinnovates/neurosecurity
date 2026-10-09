import { useEffect, useState } from 'react';
import { applyLabTablePolicy, type LabTables } from '@/lib/threat-model/lab-table-policy';
import { SiteDatabaseError, loadSiteDatabase } from './load-site-database';

const UNEXPECTED_ERROR = 'The TARA database could not be loaded. Device tables still work.';

export interface SiteDatabaseState {
  /** The site's tables as the Lab may show them; null while loading or after a failure. */
  tables: LabTables | null;
  /** Set when loading failed, in words safe to show. */
  error: string | null;
}

/** Fetched once per visit and shared by every screen that reads it. */
let sharedLoad: Promise<LabTables> | null = null;

function loadOnce(): Promise<LabTables> {
  sharedLoad ??= loadSiteDatabase(new AbortController().signal).then(applyLabTablePolicy).catch((error: unknown) => {
    sharedLoad = null;
    throw error;
  });
  return sharedLoad;
}

/** The site's query database, cut down to the tables and columns the Lab's allow-list names. */
export function useSiteDatabase(): SiteDatabaseState {
  const [state, setState] = useState<SiteDatabaseState>({ tables: null, error: null });

  useEffect(() => {
    let isCurrent = true;
    loadOnce().then(
      (tables) => { if (isCurrent) setState({ tables, error: null }); },
      (error: unknown) => { if (isCurrent) setState({ tables: null, error: error instanceof SiteDatabaseError ? error.message : UNEXPECTED_ERROR }); },
    );
    return () => { isCurrent = false; };
  }, []);

  return state;
}
