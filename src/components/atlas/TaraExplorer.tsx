/**
 * TaraExplorer — unified search + faceted filtering for TARA techniques.
 * Compact, theme-compatible, no external dependencies beyond React.
 */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { ThreatVector, Severity, Status, CategoryId } from '../../lib/threat-data';
import { SEVERITY_COLORS, STATUS_COLORS, THREAT_CATEGORIES } from '../../lib/threat-data';

// ═══ Band groupings ═══

const BAND_GROUPS = [
  { zone: 'Neural', color: '#22c55e', bands: ['N7', 'N6', 'N5', 'N4', 'N3', 'N2', 'N1'] },
  { zone: 'Interface', color: '#f59e0b', bands: ['I0'] },
  { zone: 'Silicon', color: '#3b82f6', bands: ['S1', 'S2', 'S3'] },
] as const;

const ALL_BANDS = BAND_GROUPS.flatMap(g => g.bands);
const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];
const STATUSES: Status[] = ['CONFIRMED', 'DEMONSTRATED', 'EMERGING', 'THEORETICAL'];

// ═══ Styles ═══

const S = {
  wrap: { fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: 'var(--color-text-primary, #e2e8f0)' } as React.CSSProperties,
  search: {
    width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.875rem',
    fontFamily: 'var(--font-mono, monospace)', background: 'rgba(0,0,0,0.03)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem',
    color: 'inherit', outline: 'none', marginBottom: '1rem',
  } as React.CSSProperties,
  filterGroup: { marginBottom: '0.75rem' } as React.CSSProperties,
  filterLabel: {
    fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.05em', color: 'var(--color-text-muted, #94a3b8)',
    marginBottom: '0.375rem', display: 'block',
  } as React.CSSProperties,
  chipRow: { display: 'flex', flexWrap: 'wrap' as const, gap: '0.3rem' } as React.CSSProperties,
  chip: {
    padding: '0.2rem 0.5rem', fontSize: '0.6875rem', borderRadius: '9999px',
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
    color: 'var(--color-text-muted, #94a3b8)', cursor: 'pointer', transition: 'all 0.12s',
    fontFamily: 'var(--font-mono, monospace)',
  } as React.CSSProperties,
  resultBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.5rem 0', fontSize: '0.8125rem', color: 'var(--color-text-muted, #94a3b8)',
    borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.25rem',
  } as React.CSSProperties,
  clearBtn: {
    fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none',
    cursor: 'pointer', textDecoration: 'underline',
  } as React.CSSProperties,
  tableWrap: { overflowX: 'auto' as const, borderRadius: '0.5rem' } as React.CSSProperties,
  table: {
    width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.8125rem',
  } as React.CSSProperties,
  th: {
    padding: '0.5rem 0.625rem', textAlign: 'left' as const, fontWeight: 700,
    fontSize: '0.625rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em',
    color: 'var(--color-accent-primary, #60a5fa)', background: 'rgba(0,0,0,0.04)',
    borderBottom: '2px solid rgba(59,130,246,0.25)', whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  td: {
    padding: '0.375rem 0.625rem', borderBottom: '1px solid rgba(255,255,255,0.04)',
    whiteSpace: 'nowrap' as const, maxWidth: '14rem', overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as React.CSSProperties,
  row: { cursor: 'pointer', transition: 'background 0.1s' } as React.CSSProperties,
  badge: {
    display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '9999px',
    fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.02em',
  } as React.CSSProperties,
  mono: { fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem' } as React.CSSProperties,
  bandTag: {
    display: 'inline-block', padding: '0.05rem 0.3rem', borderRadius: '0.25rem',
    fontSize: '0.625rem', marginRight: '0.2rem', fontFamily: 'var(--font-mono, monospace)',
  } as React.CSSProperties,
};

// ═══ Helpers ═══

function toggle<T>(set: Set<T>, val: T): Set<T> {
  const next = new Set(set);
  next.has(val) ? next.delete(val) : next.add(val);
  return next;
}

function bandColor(band: string) {
  if (band.startsWith('N')) return '#22c55e';
  if (band === 'I0') return '#f59e0b';
  return '#3b82f6';
}

// ═══ Component ═══

interface Props { techniques: ThreatVector[] }

export default function TaraExplorer({ techniques }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selSeverity, setSelSeverity] = useState<Set<Severity>>(new Set());
  const [selStatus, setSelStatus] = useState<Set<Status>>(new Set());
  const [selBands, setSelBands] = useState<Set<string>>(new Set());
  const [selCategory, setSelCategory] = useState<Set<CategoryId>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounced search
  const handleSearch = useCallback((val: string) => {
    setSearchTerm(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 150);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // Derive unique categories from data
  const categories = useMemo(() => {
    const seen = new Set<CategoryId>();
    for (const t of techniques) seen.add(t.category);
    return THREAT_CATEGORIES.filter(c => seen.has(c.id));
  }, [techniques]);

  const hasFilters = selSeverity.size > 0 || selStatus.size > 0 || selBands.size > 0 || selCategory.size > 0 || debouncedSearch.length > 0;

  const clearAll = useCallback(() => {
    setSelSeverity(new Set()); setSelStatus(new Set());
    setSelBands(new Set()); setSelCategory(new Set());
    setSearchTerm(''); setDebouncedSearch('');
  }, []);

  // Filter
  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return techniques.filter(t => {
      if (q && !t.name.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)
        && !t.tactic.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      if (selSeverity.size > 0 && !selSeverity.has(t.severity)) return false;
      if (selStatus.size > 0 && !selStatus.has(t.status)) return false;
      if (selBands.size > 0 && !t.bands.some(b => selBands.has(b))) return false;
      if (selCategory.size > 0 && !selCategory.has(t.category)) return false;
      return true;
    });
  }, [techniques, debouncedSearch, selSeverity, selStatus, selBands, selCategory]);

  return (
    <div style={S.wrap}>
      {/* Search */}
      <input
        type="text"
        value={searchTerm}
        onChange={e => handleSearch(e.target.value)}
        placeholder="Search by name, ID, tactic, or description..."
        style={S.search}
      />

      {/* Filter chips */}
      <div style={S.filterGroup}>
        <span style={S.filterLabel}>Severity</span>
        <div style={S.chipRow}>
          {SEVERITIES.map(s => (
            <button key={s} onClick={() => setSelSeverity(toggle(selSeverity, s))} style={{
              ...S.chip,
              ...(selSeverity.has(s) ? { background: SEVERITY_COLORS[s]?.bg, borderColor: SEVERITY_COLORS[s]?.border, color: SEVERITY_COLORS[s]?.text } : {}),
            }}>{s}</button>
          ))}
        </div>
      </div>

      <div style={S.filterGroup}>
        <span style={S.filterLabel}>Status</span>
        <div style={S.chipRow}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setSelStatus(toggle(selStatus, s))} style={{
              ...S.chip,
              ...(selStatus.has(s) ? { background: STATUS_COLORS[s]?.bg, borderColor: 'rgba(255,255,255,0.2)', color: STATUS_COLORS[s]?.text } : {}),
            }}>{s}</button>
          ))}
        </div>
      </div>

      <div style={S.filterGroup}>
        <span style={S.filterLabel}>Bands</span>
        <div style={S.chipRow}>
          {BAND_GROUPS.map(g => (
            <span key={g.zone} style={{ display: 'contents' }}>
              {g.bands.map(b => (
                <button key={b} onClick={() => setSelBands(toggle(selBands, b))} style={{
                  ...S.chip,
                  ...(selBands.has(b) ? { background: `${g.color}22`, borderColor: `${g.color}55`, color: g.color } : {}),
                }}>{b}</button>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div style={S.filterGroup}>
        <span style={S.filterLabel}>Category</span>
        <div style={S.chipRow}>
          {categories.map(c => (
            <button key={c.id} onClick={() => setSelCategory(toggle(selCategory, c.id))} style={{
              ...S.chip,
              ...(selCategory.has(c.id) ? { background: 'rgba(59,130,246,0.2)', borderColor: 'rgba(59,130,246,0.4)', color: '#60a5fa' } : {}),
            }}>{c.id}</button>
          ))}
        </div>
      </div>

      {/* Results bar */}
      <div style={S.resultBar}>
        <span>Showing <strong>{filtered.length}</strong> of <strong>{techniques.length}</strong> techniques</span>
        {hasFilters && <button onClick={clearAll} style={S.clearBtn}>Clear all filters</button>}
      </div>

      {/* Table */}
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>ID</th>
              <th style={S.th}>Name</th>
              <th style={S.th}>Severity</th>
              <th style={S.th}>Status</th>
              <th style={S.th}>NISS</th>
              <th style={S.th}>Bands</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => (
              <tr
                key={t.id}
                style={{ ...S.row, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                onClick={() => { window.location.href = `/atlas/tara/${t.id}/`; }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'; }}
              >
                <td style={{ ...S.td, ...S.mono }}>{t.id}</td>
                <td style={{ ...S.td, fontWeight: 500 }}>{t.name}</td>
                <td style={S.td}>
                  <span style={{ ...S.badge, background: SEVERITY_COLORS[t.severity]?.bg ?? '#333', color: SEVERITY_COLORS[t.severity]?.text ?? '#aaa' }}>
                    {t.severity}
                  </span>
                </td>
                <td style={S.td}>
                  <span style={{ ...S.badge, background: STATUS_COLORS[t.status]?.bg ?? '#333', color: STATUS_COLORS[t.status]?.text ?? '#aaa' }}>
                    {t.status}
                  </span>
                </td>
                <td style={{ ...S.td, ...S.mono }}>{t.niss.score.toFixed(1)}</td>
                <td style={S.td}>
                  {t.bands.map(b => (
                    <span key={b} style={{ ...S.bandTag, background: `${bandColor(b)}18`, color: bandColor(b) }}>{b}</span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.875rem' }}>
            No techniques match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
