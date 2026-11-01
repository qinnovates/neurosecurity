import { useEffect, useRef, useState, type RefObject } from 'react';
import { filterSearch, HIT_KINDS, type SearchHit } from './search-index';

function useSearchDialog(dialog: RefObject<HTMLDialogElement | null>) {
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (dialog.current?.open) dialog.current.close(); else dialog.current?.showModal();
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [dialog]);
}

function SearchResults({ hits, active, choose }: { hits: SearchHit[]; active: number; choose: (hit: SearchHit) => void }) {
  return <div className="tara-results" id="tara-results" role="listbox" aria-label="Public catalog results">
    {HIT_KINDS.map((kind) => <div key={kind} role="group" aria-label={kind}>
      {hits.some((hit) => hit.kind === kind) && <h3>{kind}</h3>}
      {hits.filter((hit) => hit.kind === kind).map((hit) => <button type="button" role="option" id={`tara-hit-${hits.indexOf(hit)}`} aria-selected={hits.indexOf(hit) === active} key={`${hit.kind}-${hit.id}`} onClick={() => choose(hit)}>
        <span>{hit.name}</span><small>{hit.id}</small>
      </button>)}
    </div>)}
    {hits.length === 0 && <p role="status">No public catalog matches.</p>}
  </div>;
}

export default function TaraSearch({ index, onSelectRegion }: { index: SearchHit[]; onSelectRegion: (id: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [active, setActive] = useState(0);
  useSearchDialog(dialog);
  useEffect(() => {
    const timer = window.setTimeout(() => { setDebounced(query); setActive(0); }, 160);
    return () => window.clearTimeout(timer);
  }, [query]);
  const hits = filterSearch(index, debounced);
  const choose = (hit: SearchHit) => {
    dialog.current?.close();
    if (hit.kind === 'region') onSelectRegion(hit.id); else if (hit.href) window.location.assign(hit.href);
  };
  return <><button ref={trigger} className="tara-pill" title="Search public TARA data (Cmd or Ctrl+K)" aria-keyshortcuts="Meta+k Control+k" onClick={() => dialog.current?.showModal()}><svg width="13" height="13" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8" cy="8" r="5" stroke="currentColor" fill="none" /><path d="m12 12 5 5" stroke="currentColor" /></svg>Search ⌘K</button>
    <dialog ref={dialog} className="tara-dialog" aria-labelledby="tara-search-title" onClose={() => trigger.current?.focus()}>
      <p className="tara-search-scope">Public TARA catalog only · techniques, regions and bands.</p>
      <SearchInput query={query} setQuery={setQuery} active={active} setActive={setActive} hits={hits} choose={choose} />
      <button className="tara-pill" onClick={() => dialog.current?.close()}>Close · Esc</button>
      <SearchResults hits={hits} active={active} choose={choose} />
    </dialog></>;
}

function SearchInput({ query, setQuery, active, setActive, hits, choose }: {
  query: string; setQuery: (value: string) => void; active: number; setActive: (value: number) => void;
  hits: SearchHit[]; choose: (hit: SearchHit) => void;
}) {
  useEffect(() => { document.getElementById(`tara-hit-${active}`)?.scrollIntoView?.({ block: 'nearest' }); }, [active]);
  return <><h2 id="tara-search-title">Search the public atlas</h2>
    <label htmlFor="tara-search-input">Technique, region or band</label>
    <input id="tara-search-input" autoFocus value={query} role="combobox" aria-expanded="true" aria-controls="tara-results" aria-autocomplete="list" aria-activedescendant={hits[active] ? `tara-hit-${active}` : undefined}
      onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
        if (['ArrowDown', 'ArrowUp'].includes(event.key) && hits.length) {
          event.preventDefault(); setActive((active + (event.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length);
        }
        if (event.key === 'Enter' && hits[active]) { event.preventDefault(); choose(hits[active]); }
      }} />
  </>;
}
