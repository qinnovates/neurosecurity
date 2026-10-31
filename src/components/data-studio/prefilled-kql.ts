/**
 * The query another page asks the data studio to open with (`?kql=`). What
 * arrives in an address is untrusted: it only ever fills the editor, and the
 * engine runs it over the page's own read-only tables. A value that is too long
 * or holds control characters is refused rather than shown.
 */

import { KQL_QUERY_PARAM } from '@/lib/atlas-explorer/region-kql';

const MAX_QUERY_LENGTH = 1_000;
/** Control characters: a query is one line of text. */
const CONTROL_CHARACTERS = /\p{Cc}/u;

/** @returns the query to fill in, or null when the address asks for none or for one that is refused */
export function readPrefilledKql(search: string): string | null {
  const query = new URLSearchParams(search).get(KQL_QUERY_PARAM)?.trim() ?? '';
  if (query.length === 0 || query.length > MAX_QUERY_LENGTH || CONTROL_CHARACTERS.test(query)) return null;
  return query;
}

/** The editor's own event and attribute names, handed over by the caller so this file does not pull the lazy editor into the page. */
export interface KqlEditorContract {
  KQL_READY_EVENT: string;
  KQL_INJECT_EVENT: string;
  KQL_ROOT_ATTRIBUTE: string;
}

/**
 * Fills the editor with the address's query once it has its data, and takes the visitor to it: it sits below the catalog.
 * Does nothing when the address asks for no query. Call it before the editor mounts, or its ready event is missed.
 */
export function fillEditorWhenReady(search: string, editor: KqlEditorContract): void {
  const query = readPrefilledKql(search);
  if (query === null) return;
  window.addEventListener(editor.KQL_READY_EVENT, () => {
    window.dispatchEvent(new CustomEvent(editor.KQL_INJECT_EVENT, { detail: query }));
    document.querySelector(`[${editor.KQL_ROOT_ATTRIBUTE}]`)?.scrollIntoView?.({ block: 'start' });
  }, { once: true });
}
